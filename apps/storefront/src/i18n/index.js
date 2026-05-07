import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import heCommon from "./locales/he/common.json";
import heNav from "./locales/he/nav.json";
import heHome from "./locales/he/home.json";
import heCart from "./locales/he/cart.json";
import heAuth from "./locales/he/auth.json";
import heCheckout from "./locales/he/checkout.json";
import heOrder from "./locales/he/order.json";
import arCommon from "./locales/ar/common.json";
import arNav from "./locales/ar/nav.json";
import arHome from "./locales/ar/home.json";
import arCart from "./locales/ar/cart.json";
import arAuth from "./locales/ar/auth.json";
import arCheckout from "./locales/ar/checkout.json";
import arOrder from "./locales/ar/order.json";
import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enHome from "./locales/en/home.json";
import enCart from "./locales/en/cart.json";
import enAuth from "./locales/en/auth.json";
import enCheckout from "./locales/en/checkout.json";
import enOrder from "./locales/en/order.json";

const STORAGE_KEY = "app.lang";

const resources = {
  he: {
    common: heCommon,
    nav: heNav,
    home: heHome,
    cart: heCart,
    auth: heAuth,
    checkout: heCheckout,
    order: heOrder
  },
  ar: {
    common: arCommon,
    nav: arNav,
    home: arHome,
    cart: arCart,
    auth: arAuth,
    checkout: arCheckout,
    order: arOrder
  },
  en: {
    common: enCommon,
    nav: enNav,
    home: enHome,
    cart: enCart,
    auth: enAuth,
    checkout: enCheckout,
    order: enOrder
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["he", "ar", "en"],
    fallbackLng: "en",
    lng: "he",
    ns: ["common", "nav", "home", "cart", "auth", "checkout", "order"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY
    },
    react: {
      useSuspense: false
    }
  });

export { STORAGE_KEY };
export default i18n;
