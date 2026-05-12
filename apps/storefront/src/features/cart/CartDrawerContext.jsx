import { createContext, useCallback, useContext, useMemo, useState } from "react";

const CartDrawerContext = createContext(null);

export function CartDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCartDrawer = useCallback(() => setOpen(true), []);
  const closeCartDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openCartDrawer, closeCartDrawer }),
    [open, openCartDrawer, closeCartDrawer]
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider");
  }
  return ctx;
}
