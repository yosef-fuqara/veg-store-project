import "./i18n";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import ScrollToTop from "./components/common/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./features/auth/AuthContext";
import { CartProvider } from "./features/cart/CartContext";
import { CartVisualFeedbackProvider } from "./features/cart/CartVisualFeedbackContext";
import { CartDrawerProvider } from "./features/cart/CartDrawerContext";
import { StoreSettingsProvider } from "./features/store/StoreSettingsContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <CartVisualFeedbackProvider>
                <CartDrawerProvider>
                  <App />
                </CartDrawerProvider>
              </CartVisualFeedbackProvider>
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
