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
import enMarketing from "./locales/en/marketing.json";

import heCommon from "./locales/he/common.json";
import heNav from "./locales/he/nav.json";
import heAuth from "./locales/he/auth.json";
import heProducts from "./locales/he/products.json";
import heCategories from "./locales/he/categories.json";
import heOrders from "./locales/he/orders.json";
import heSales from "./locales/he/sales.json";
import hePromotions from "./locales/he/promotions.json";
import heStoreStatus from "./locales/he/storeStatus.json";
import heMarketing from "./locales/he/marketing.json";

import arCommon from "./locales/ar/common.json";
import arNav from "./locales/ar/nav.json";
import arAuth from "./locales/ar/auth.json";
import arProducts from "./locales/ar/products.json";
import arCategories from "./locales/ar/categories.json";
import arOrders from "./locales/ar/orders.json";
import arSales from "./locales/ar/sales.json";
import arPromotions from "./locales/ar/promotions.json";
import arStoreStatus from "./locales/ar/storeStatus.json";
import arMarketing from "./locales/ar/marketing.json";

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
    storeStatus: enStoreStatus,
    marketing: enMarketing
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
    storeStatus: heStoreStatus,
    marketing: heMarketing
  },
  ar: {
    common: arCommon,
    nav: arNav,
    auth: arAuth,
    products: arProducts,
    categories: arCategories,
    orders: arOrders,
    sales: arSales,
    promotions: arPromotions,
    storeStatus: arStoreStatus,
    marketing: arMarketing
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["en", "he", "ar"],
    fallbackLng: {
      ar: ["he", "en"],
      he: ["en"],
      default: ["en"]
    },
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
      "storeStatus",
      "marketing"
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
    },
    parseMissingKeyHandler: (key) => {
      if (import.meta.env.DEV) {
        console.warn(`[admin i18n] Missing translation key: ${key}`);
      }
      return key;
    }
  });

export default i18n;
