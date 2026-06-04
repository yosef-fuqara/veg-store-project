import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  MessageCircle,
  ShieldCheck,
  User,
  Settings
} from "lucide-react";
import { ACCOUNT_NAV } from "../features/account/accountNav";
import { accountColors } from "../features/account/accountTheme";

const ICONS = {
  dashboard: LayoutDashboard,
  orders: Package,
  addresses: MapPin,
  favorites: Heart,
  whatsapp: MessageCircle,
  privacy: ShieldCheck,
  profile: User,
  settings: Settings
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const navLinkStyle = (isActive) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 14px",
  borderRadius: "10px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: isActive ? 600 : 500,
  color: isActive ? accountColors.primary : accountColors.textSecondary,
  background: isActive ? accountColors.primarySurface : "transparent",
  border: isActive ? `1px solid ${accountColors.primaryBorder}` : "1px solid transparent",
  whiteSpace: "nowrap",
  transition: "background 0.15s, color 0.15s"
});

const AccountLayout = () => {
  const { t } = useTranslation("account");
  const location = useLocation();
  const isMobile = useIsMobile();

  const activeItem = ACCOUNT_NAV.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <section
      style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: isMobile ? "24px 16px 48px" : "40px 24px 56px"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <header style={{ marginBottom: isMobile ? "20px" : "28px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: isMobile ? "26px" : "30px", fontWeight: 700, color: accountColors.textPrimary }}>
            {t("title")}
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
            {t("subtitle")}
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "240px 1fr",
            gap: isMobile ? "16px" : "28px",
            alignItems: "start"
          }}
        >
          <nav
            aria-label={t("navLabel")}
            style={
              isMobile
                ? {
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                    WebkitOverflowScrolling: "touch"
                  }
                : {
                    position: "sticky",
                    top: "88px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "12px",
                    background: accountColors.surface,
                    border: `1px solid ${accountColors.border}`,
                    borderRadius: "14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
                  }
            }
          >
            {ACCOUNT_NAV.map((item) => {
              const Icon = ICONS[item.icon] || LayoutDashboard;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => navLinkStyle(isActive)}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden />
                  {t(`nav.${item.key}`)}
                </NavLink>
              );
            })}
          </nav>

          <main>
            {isMobile && activeItem ? (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: accountColors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}
              >
                {t(`nav.${activeItem.key}`)}
              </p>
            ) : null}
            <Outlet />
          </main>
        </div>
      </motion.div>
    </section>
  );
};

export default AccountLayout;
