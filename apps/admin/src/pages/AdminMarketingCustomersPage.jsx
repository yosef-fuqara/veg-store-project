import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, Users } from "lucide-react";
import { getMarketingCustomers } from "../services/marketingCustomerService";

const colors = {
  primary: "#1e6b3c",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  borderLight: "#f0ece6",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca"
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const toCsv = (rows) => {
  const header = ["Name", "Phone", "WhatsApp Consent Date", "Consent Source"];
  const lines = rows.map((row) => [
    row.name || "",
    row.phone || "",
    row.marketingConsentWhatsAppAt ? new Date(row.marketingConsentWhatsAppAt).toISOString() : "",
    row.marketingConsentSource || ""
  ]);
  return [header, ...lines].map((line) => line.map(csvEscape).join(",")).join("\n");
};

const downloadCsv = (rows) => {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marketing-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const iconButtonBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "8px 12px",
  borderRadius: "9px",
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.textPrimary,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit"
};

const AdminMarketingCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMarketingCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load marketing customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasData = customers.length > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "22px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.3px" }}>
            Marketing Customers
          </h1>
          <p style={{ margin: "6px 0 0", color: colors.textSecondary, fontSize: "14px" }}>
            Customers who opted in to receive promotions and offers by WhatsApp.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={load} disabled={loading} style={{ ...iconButtonBase, opacity: loading ? 0.75 : 1 }}>
            <RefreshCw size={14} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(customers)}
            disabled={!hasData}
            style={{
              ...iconButtonBase,
              border: "none",
              background: hasData ? colors.primary : colors.border,
              color: hasData ? colors.textInverse : colors.textMuted,
              cursor: hasData ? "pointer" : "not-allowed"
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div role="alert" style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "10px", background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: "13px" }}>
          {error}
        </div>
      ) : null}

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "14px", overflow: "hidden" }}>
        {!hasData && !loading ? (
          <div style={{ padding: "26px 18px", color: colors.textMuted, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={16} />
            No customers have opted in yet.
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead>
                <tr>
                  {["Name", "Phone", "WhatsApp Consent Date", "Consent Source"].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: "start",
                        padding: "12px 14px",
                        fontSize: "12px",
                        color: colors.textSecondary,
                        background: colors.bg,
                        borderBottom: `1px solid ${colors.border}`,
                        fontWeight: 700
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                    <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary }}>{customer.name || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary }}>{customer.phone || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: colors.textSecondary }}>{formatDate(customer.marketingConsentWhatsAppAt)}</td>
                    <td style={{ padding: "12px 14px", fontSize: "13px", color: colors.textSecondary }}>{customer.marketingConsentSource || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarketingCustomersPage;
