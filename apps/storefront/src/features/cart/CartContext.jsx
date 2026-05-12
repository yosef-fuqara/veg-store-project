import { createContext, useCallback, useContext, useMemo, useState } from "react";
import i18n from "../../i18n";
import SignInToAddToCartModal from "../../components/SignInToAddToCartModal";
import * as cartService from "../../services/cartService";
import { getAccessToken } from "../../services/authStorage";
import {
  isCartAuthError,
  isTechnicalCustomerCartMessage,
  translateCartBusinessError
} from "../../utils/cartErrorHandling";
import {
  loadPersistedCartLines,
  persistCartFromServerCart,
  clearPersistedCart
} from "../../utils/vegstorePersistence";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, wrapTotal: 0, payableTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signInForCartOpen, setSignInForCartOpen] = useState(false);

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
    await withLoading(async () => {
      let next = await cartService.fetchCart();
      const serverEmpty = !next?.items?.length;
      if (serverEmpty) {
        const lines = loadPersistedCartLines();
        if (lines.length) {
          for (const line of lines) {
            next = await cartService.addCartItem(line.product, line.quantity, { wrap: line.wrap });
          }
        }
      }
      setCart(next);
      persistCartFromServerCart(next);
    });
  }, [withLoading]);

  /** Home / product grid: no global `loading` so other cards stay interactive. Returns true on success. */
  const addItem = useCallback(async (productId, quantity = 1, options = {}) => {
    if (!getAccessToken()) {
      setSignInForCartOpen(true);
      return false;
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
  }, []);

  const updateItem = useCallback(
    async (productId, updates) => {
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, updates);
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading]
  );

  const setWrap = useCallback(
    async (productId, wrap) => {
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, { wrap });
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading]
  );

  const removeItem = useCallback(
    async (productId) => {
      await withLoading(async () => {
        const next = await cartService.removeCartItem(productId);
        setCart(next);
        persistCartFromServerCart(next);
      });
    },
    [withLoading]
  );

  const clear = useCallback(async () => {
    await withLoading(async () => {
      const next = await cartService.clearCart();
      setCart(next);
      clearPersistedCart();
    });
  }, [withLoading]);

  const revalidateCheckout = useCallback(async () => {
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
