import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enAuth from "./locales/en/auth.json";
import enProducts from "./locales/en/products.json";
import enCategories from "./locales/en/categories.json";
import enOrders from "./locales/en/orders.json";
import enSales from "./locales/en/sales.json";
import enPromotions from "./locales/en/promotions.json";
import enStoreStatus from "./locales/en/storeStatus.json";

import heCommon from "./locales/he/common.json";
import heNav from "./locales/he/nav.json";
import heAuth from "./locales/he/auth.json";
import heProducts from "./locales/he/products.json";
import heCategories from "./locales/he/categories.json";
import heOrders from "./locales/he/orders.json";
import heSales from "./locales/he/sales.json";
import hePromotions from "./locales/he/promotions.json";
import heStoreStatus from "./locales/he/storeStatus.json";

/** localStorage key — independent from the storefront so admin/customer language don't collide. */
export const ADMIN_LANG_STORAGE_KEY = "admin.lang";

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    products: enProducts,
    categories: enCategories,
    orders: enOrders,
    sales: enSales,
    promotions: enPromotions,
    storeStatus: enStoreStatus
  },
  he: {
    common: heCommon,
    nav: heNav,
    auth: heAuth,
    products: heProducts,
    categories: heCategories,
    orders: heOrders,
    sales: heSales,
    promotions: hePromotions,
    storeStatus: heStoreStatus
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["en", "he"],
    fallbackLng: "en",
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    ns: [
      "common",
      "nav",
      "auth",
      "products",
      "categories",
      "orders",
      "sales",
      "promotions",
      "storeStatus"
    ],
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: ADMIN_LANG_STORAGE_KEY
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
