import { createContext, useCallback, useContext, useMemo, useState } from "react";
import * as cartService from "../../services/cartService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, wrapTotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const withLoading = useCallback(async (handler) => {
    setLoading(true);
    setError("");
    try {
      await handler();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || "Cart operation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    await withLoading(async () => {
      const next = await cartService.fetchCart();
      setCart(next);
    });
  }, [withLoading]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      await withLoading(async () => {
        const next = await cartService.addCartItem(productId, quantity);
        setCart(next);
      });
    },
    [withLoading]
  );

  const updateItem = useCallback(
    async (productId, updates) => {
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, updates);
        setCart(next);
      });
    },
    [withLoading]
  );

  const setWrap = useCallback(
    async (productId, wrap) => {
      await withLoading(async () => {
        const next = await cartService.updateCartItem(productId, { wrap });
        setCart(next);
      });
    },
    [withLoading]
  );

  const removeItem = useCallback(
    async (productId) => {
      await withLoading(async () => {
        const next = await cartService.removeCartItem(productId);
        setCart(next);
      });
    },
    [withLoading]
  );

  const clear = useCallback(async () => {
    await withLoading(async () => {
      const next = await cartService.clearCart();
      setCart(next);
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
};
