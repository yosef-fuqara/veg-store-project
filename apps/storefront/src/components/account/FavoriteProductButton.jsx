import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import * as accountService from "../../services/accountService";
import { accountColors } from "../../features/account/accountTheme";

const FavoriteProductButton = ({ productId, className, style }) => {
  const { t } = useTranslation("account");
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user || !productId) return null;

  const favorites = user.favoriteProductIds || [];
  const isFavorite = favorites.some((id) => String(id) === String(productId));

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const next = isFavorite
        ? await accountService.removeFavorite(productId)
        : await accountService.addFavorite(productId);
      updateUser(next);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("favoriteButton.remove") : t("favoriteButton.add")}
      title={isFavorite ? t("favoriteButton.remove") : t("favoriteButton.add")}
      style={{
        position: "absolute",
        top: "10px",
        insetInlineEnd: "10px",
        zIndex: 2,
        width: "36px",
        height: "36px",
        borderRadius: "9999px",
        border: `1px solid ${accountColors.border}`,
        background: "rgba(255,255,255,0.92)",
        color: isFavorite ? "#dc2626" : accountColors.textMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: busy ? "wait" : "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        ...style
      }}
    >
      <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2} aria-hidden />
    </button>
  );
};

export default FavoriteProductButton;
