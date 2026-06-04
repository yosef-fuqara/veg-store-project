import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../../i18n";
import SignInToAddToCartModal from "../../components/SignInToAddToCartModal";
import * as cartService from "../../services/cartService";
import * as orderService from "../../services/orderService";
import { getAccessToken } from "../../services/authStorage";
import {
  isCartAuthError,
  isTechnicalCustomerCartMessage,
  translateCartBusinessError
} from "../../utils/cartErrorHandling";
import {
  cartFromGuestCheckoutPreview,
  guestLinesFromCartItems,
  mergeGuestAddLine,
  mergeGuestUpdateLine,
  removeGuestLine
} from "../../utils/guestCart";
import {
  loadPersistedCartLines,
  persistCartFromServerCart,
  clearPersistedCart
} from "../../utils/vegstorePersistence";

const CartContext = createContext(null);

const emptyCart = () => ({ items: [], subtotal: 0, wrapTotal: 0, payableTotal: 0 });

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signInForCartOpen, setSignInForCartOpen] = useState(false);

  const isAuthenticated = () => Boolean(getAccessToken());

  const syncGuestCartFromLines = useCallback(async (lines) => {
    if (!lines.length) {
      setCart(emptyCart());
      clearPersistedCart();
      return;
    }
    const preview = await orderService.guestCheckoutPreview(lines);
    const next = cartFromGuestCheckoutPreview(preview);
    setCart(next);
    persistCartFromServerCart(next);
  }, []);

  const withLoading = useCallback(async (handler) => {
    setLoading(true);
    setError("");
    try {
      await handler();
    } catch (err) {
      if (isCartAuthError(err)) {
        setSignInForCartOpen(true);
        setError("");
        return;
      }
      const biz = translateCartBusinessError(err);
      if (biz) {
        setError(biz);
        return;
      }
      const raw = String(err.userMessage || err.response?.data?.message || "").trim();
      if (!raw || isTechnicalCustomerCartMessage(raw)) {
        setError(i18n.t("cart:genericError"));
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated()) {
      const lines = loadPersistedCartLines();
      if (!lines.length) {
        setCart(emptyCart());
        return;
      }
      setError("");
      try {
        await syncGuestCartFromLines(lines);
      } catch (err) {
        const biz = translateCartBusinessError(err);
        if (biz) {
          setError(biz);
          return;
        }
        const raw = String(err.userMessage || err.response?.data?.message || "").trim();
        setError(raw || i18n.t("cart:genericError"));
      }
      return;
    }

    await withLoading(async () => {
      let next = await cartService.fetchCart();
      const serverEmpty = !next?.items?.length;
      if (serverEmpty) {
        const lines = loadPersistedCartLines();
        if (lines.length) {
          for (const line of lines) {
            const payload = { wrap: line.wrap };
            if (typeof line.purchaseAmountIls === "number") {
              next = await cartService.addCartItem(line.product, 1, {
                purchaseAmountIls: line.purchaseAmountIls,
                wrap: line.wrap
              });
            } else {
              next = await cartService.addCartItem(line.product, line.quantity, payload);
            }
          }
        }
      }
      setCart(next);
      persistCartFromServerCart(next);
    });
  }, [withLoading, syncGuestCartFromLines]);

  useEffect(() => {
    if (!isAuthenticated()) {
      const lines = loadPersistedCartLines();
      if (lines.length) {
        void syncGuestCartFromLines(lines);
      }
    }
  }, [syncGuestCartFromLines]);

  /** Home / product grid: no global `loading` so other cards stay interactive. Returns true on success. */
  const addItem = useCallback(
    async (productId, quantity = 1, options = {}) => {
      if (!isAuthenticated()) {
        setError("");
        try {
          const lines = mergeGuestAddLine(loadPersistedCartLines(), productId, quantity, options);
          await syncGuestCartFromLines(lines);
          return true;
        } catch (err) {
          const biz = translateCartBusinessError(err);
          if (biz) {
            setError(biz);
            return false;
          }
          const raw = String(err.userMessage || err.response?.data?.message || "").trim();
          setError(raw || i18n.t("cart:genericError"));
          return false;
        }
      }

      setError("");
      try {
        const next = await cartService.addCartItem(productId, quantity, options);
        setCart(next);
        persistCartFromServerCart(next);
        return true;
      } catch (err) {
        if (isCartAuthError(err)) {
          setSignInForCartOpen(true);
          setError("");
          return false;
        }
        const biz = translateCartBusinessError(err);
        if (biz) {
          setError(biz);
          return false;
        }
        const raw = String(err.userMessage || err.response?.data?.message || "").trim();
        if (!raw || isTechnicalCustomerCartMessage(raw)) {
          setError(i18n.t("cart:genericError"));
        } else {
          setError(raw);
        }
        return false;
      }
    },
    [syncGuestCartFromLines]
  );

  const updateItem = useCallback(
    async (productId, updates) => {
      if (!isAuthenticated()) {
        await withLoading(async () => {
          const lines = mergeGuestUpdateLine(guestLinesFromCartItems(cart.items), productId, updates);
          await syncGuestCartFromLines(lines);
        });
        return;
      }
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, updates);
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading, cart.items, syncGuestCartFromLines]
  );

  const setWrap = useCallback(
    async (productId, wrap) => {
      if (!isAuthenticated()) {
        await withLoading(async () => {
          const lines = mergeGuestUpdateLine(guestLinesFromCartItems(cart.items), productId, { wrap });
          await syncGuestCartFromLines(lines);
        });
        return;
      }
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, { wrap });
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading, cart.items, syncGuestCartFromLines]
  );

  const removeItem = useCallback(
    async (productId) => {
      if (!isAuthenticated()) {
        await withLoading(async () => {
          const lines = removeGuestLine(guestLinesFromCartItems(cart.items), productId);
          await syncGuestCartFromLines(lines);
        });
        return;
      }
      await withLoading(async () => {
        const next = await cartService.removeCartItem(productId);
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading, cart.items, syncGuestCartFromLines]
  );

  const clear = useCallback(async () => {
    if (!isAuthenticated()) {
      await withLoading(async () => {
        setCart(emptyCart());
        clearPersistedCart();
      });
      return;
    }
    await withLoading(async () => {
      const next = await cartService.clearCart();
      setCart(next);
      clearPersistedCart();
    });
  }, [withLoading]);

  const revalidateCheckout = useCallback(async () => {
    if (!isAuthenticated()) {
      const lines = loadPersistedCartLines();
      if (!lines.length) return null;
      let checkout = null;
      await withLoading(async () => {
        checkout = await orderService.guestCheckoutPreview(lines);
      });
      return checkout;
    }
    let checkout = null;
    await withLoading(async () => {
      checkout = await cartService.prepareCheckout();
    });
    return checkout;
  }, [withLoading]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      refreshCart,
      addItem,
      updateItem,
      setWrap,
      removeItem,
      clear,
      revalidateCheckout
    }),
    [
      cart,
      loading,
      error,
      refreshCart,
      addItem,
      updateItem,
      setWrap,
      removeItem,
      clear,
      revalidateCheckout
    ]
  );

  return (
    <>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
      <SignInToAddToCartModal open={signInForCartOpen} onClose={() => setSignInForCartOpen(false)} />
    </>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
