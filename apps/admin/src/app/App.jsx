import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import RequireAuth from "../components/RequireAuth";
import RequireAdmin from "../components/RequireAdmin";
import { useAuth } from "../features/auth/AuthContext";
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import ProductFormPage from "../pages/ProductFormPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminOrderDetailsPage from "../pages/AdminOrderDetailsPage";
import AbuAlAnasLogo from "../components/common/Logo";

const colors = {
  primary:    '#1e6b3c',
  bg:         '#faf8f5',
  surface:    '#ffffff',
  border:     '#e8e3dc',
  activeNavBg:'#f0f7f2',
  textPrimary:'#1c1917',
  textMuted:  '#a8a29e',
  error:      '#991b1b',
};

const NAV_ITEMS = [
  {
    to: '/products',
    label: 'Products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [hovered, setHovered] = useState('');

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: colors.surface,
      borderInlineStart: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AbuAlAnasLogo size={42} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
              Abu Al-Anas
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted, textTransform: 'uppercase', marginTop: '2px' }}>
              Admin Panel
            </div>
          </div>
        </div>
        {user && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name || user.email}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? colors.primary : colors.textPrimary,
              background: isActive ? colors.activeNavBg : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? colors.primary : colors.textMuted, display: 'flex', alignItems: 'center' }}>
                  {icon}
                </span>
                {label}
                {isActive && (
                  <span style={{ marginInlineStart: 'auto', fontSize: '12px', color: colors.primary }}>›</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      {user && (
        <div style={{ padding: '14px 12px', borderTop: `1px solid ${colors.border}` }}>
          <button
            type="button"
            onClick={() => logout()}
            onMouseEnter={() => setHovered('logout')}
            onMouseLeave={() => setHovered('')}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '9px',
              border: `1px solid ${colors.border}`,
              background: hovered === 'logout' ? colors.bg : 'transparent',
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background 0.12s',
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};

const SIDEBAR_ROUTES = ['/products', '/orders'];

const App = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/unauthorized';
  const showSidebar = user?.role === 'admin' && !isAuthPage;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row-reverse',
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {showSidebar && <Sidebar />}
      <main style={{ flex: 1, padding: isAuthPage ? '0' : '36px 40px', overflow: 'auto', minWidth: 0 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/products" element={<RequireAuth><RequireAdmin><AdminProductsPage /></RequireAdmin></RequireAuth>} />
          <Route path="/products/new" element={<RequireAuth><RequireAdmin><ProductFormPage /></RequireAdmin></RequireAuth>} />
          <Route path="/products/:id/edit" element={<RequireAuth><RequireAdmin><ProductFormPage /></RequireAdmin></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><RequireAdmin><AdminOrdersPage /></RequireAdmin></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><RequireAdmin><AdminOrderDetailsPage /></RequireAdmin></RequireAuth>} />
          <Route path="/" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
