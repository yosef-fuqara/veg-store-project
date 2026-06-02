import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import {
  accountCardStyle,
  accountColors,
  accountGhostButtonStyle,
  accountInputStyle,
  accountPrimaryButtonStyle
} from "../../features/account/accountTheme";
import * as accountService from "../../services/accountService";
import * as orderService from "../../services/orderService";
import { deliveryAreaOptionLabel } from "../../utils/deliveryAreaDisplay";

const emptyForm = { label: "", city: "", street: "", building: "", apartment: "", notes: "" };

const formatAddressLine = (addr) =>
  [addr.label, addr.city, addr.street, addr.building, addr.apartment, addr.notes].filter(Boolean).join(", ");

const AccountAddressesPage = () => {
  const { t, i18n } = useTranslation(["account", "checkout"]);
  const { user, updateUser } = useAuth();
  const lang = (i18n.language || "he").split("-")[0];
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    orderService
      .getDeliveryAreas()
      .then((data) => setAreas(data?.areas ?? []))
      .catch(() => setAreas([]));
  }, []);

  const addresses = user?.addresses || [];

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || "",
      city: addr.city || "",
      street: addr.street || "",
      building: addr.building || "",
      apartment: addr.apartment || "",
      notes: addr.notes || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.city?.trim() || !form.street?.trim()) return;
    setBusy(true);
    try {
      const payload = {
        label: form.label.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim(),
        apartment: form.apartment.trim(),
        notes: form.notes.trim()
      };
      const next = editingId
        ? await accountService.updateAddress(editingId, payload)
        : await accountService.createAddress(payload);
      updateUser(next);
      setMessage(t("account:addresses.saved"));
      resetForm();
    } catch (err) {
      setError(err.userMessage || t("account:profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("account:addresses.confirmDelete"))) return;
    setBusy(true);
    setError("");
    try {
      const next = await accountService.deleteAddress(id);
      updateUser(next);
      setMessage(t("account:addresses.deleted"));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.userMessage || t("account:profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (id) => {
    setBusy(true);
    try {
      const next = await accountService.setDefaultAddress(id);
      updateUser(next);
      setMessage(t("account:addresses.saved"));
    } catch (err) {
      setError(err.userMessage || t("account:profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>
          {t("account:addresses.title")}
        </h2>
        <p style={{ margin: 0, fontSize: "15px", color: accountColors.textSecondary }}>{t("account:addresses.subtitle")}</p>
      </div>

      {message ? (
        <div role="status" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.successSurface, border: `1px solid ${accountColors.successBorder}`, color: accountColors.success, fontSize: "14px" }}>
          {message}
        </div>
      ) : null}
      {error ? (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.errorSurface, border: `1px solid ${accountColors.errorBorder}`, color: accountColors.error, fontSize: "14px" }}>
          {error}
        </div>
      ) : null}

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} style={accountPrimaryButtonStyle}>
          {t("account:addresses.add")}
        </button>
      ) : (
        <form onSubmit={handleSave} style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
            {t("account:addresses.label")}
            <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} style={accountInputStyle} maxLength={50} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
            {t("account:addresses.city")}
            <select value={form.city} required onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={accountInputStyle}>
              <option value="">{t("account:addresses.cityPlaceholder")}</option>
              {areas.map((area) => (
                <option key={area.key} value={area.key}>
                  {deliveryAreaOptionLabel(area, lang, t)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
            {t("account:addresses.street")}
            <input value={form.street} required onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} style={accountInputStyle} maxLength={120} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
              {t("account:addresses.building")}
              <input value={form.building} onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))} style={accountInputStyle} maxLength={50} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
              {t("account:addresses.apartment")}
              <input value={form.apartment} onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))} style={accountInputStyle} maxLength={50} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
            {t("account:addresses.notes")}
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...accountInputStyle, resize: "vertical" }} rows={2} maxLength={500} />
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" disabled={busy} style={{ ...accountPrimaryButtonStyle, opacity: busy ? 0.7 : 1 }}>
              {t("account:addresses.save")}
            </button>
            <button type="button" onClick={resetForm} style={accountGhostButtonStyle}>
              {t("account:addresses.cancel")}
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div style={{ ...accountCardStyle, color: accountColors.textSecondary }}>{t("account:addresses.empty")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {addresses.map((addr) => {
            const isDefault = user?.defaultAddressId === addr.id;
            return (
              <article key={addr.id} style={accountCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    {isDefault ? (
                      <span style={{ display: "inline-block", marginBottom: "6px", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, background: accountColors.primarySurface, color: accountColors.primary, border: `1px solid ${accountColors.primaryBorder}` }}>
                        {t("account:addresses.default")}
                      </span>
                    ) : null}
                    <p style={{ margin: 0, fontSize: "15px", color: accountColors.textPrimary, lineHeight: 1.5 }}>{formatAddressLine(addr)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {!isDefault ? (
                    <button type="button" disabled={busy} onClick={() => handleSetDefault(addr.id)} style={{ ...accountGhostButtonStyle, padding: "6px 12px", fontSize: "13px" }}>
                      {t("account:addresses.setDefault")}
                    </button>
                  ) : null}
                  <button type="button" disabled={busy} onClick={() => startEdit(addr)} style={{ ...accountGhostButtonStyle, padding: "6px 12px", fontSize: "13px" }}>
                    {t("account:addresses.edit")}
                  </button>
                  <button type="button" disabled={busy} onClick={() => handleDelete(addr.id)} style={{ ...accountGhostButtonStyle, padding: "6px 12px", fontSize: "13px", color: accountColors.error, borderColor: accountColors.errorBorder }}>
                    {t("account:addresses.delete")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccountAddressesPage;
