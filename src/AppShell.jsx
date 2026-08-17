/**
 * AppShell.jsx
 * Enrutamiento limpio y consolidado sin componentes duplicados.
 */

import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole, ROLE_HOME } from "./modules/roles/RoleContext";
import RequireFullProfile from "./modules/roles/RequireFullProfile";
import { DataProvider } from "./modules/roles/DataContext";
import { ToastProvider } from "./modules/layout/ToastContext";
import AppLayout from "./modules/layout/AppLayout";

// Páginas Públicas y Autenticación
import LandingRole from "./pages/LandingRole";
import AdminLogin from "./pages/admin/AdminLogin";
import ProtocoloPage from "./pages/protocolo";

// Páginas Compartidas
import CampaignPage from "./pages/campaign/index";
import MarketPage from "./pages/market/index";
import MiPerfil from "./pages/miPerfil";
import WarrantsPage from "./pages/warrants/index";


// Páginas por Rol (Única fuente de verdad)
import AdminDashboard from "./pages/admin/dashboard";
import AdminControl from "./pages/admin/control";

import AcopiadorDashboard from "./pages/acopiador/dashboard";
import AcopiadorTokenizar from "./pages/acopiador/tokenizar";
import AcopiadorAsociaciones from "./pages/acopiador/asociaciones";
import AcopiadorFinancing from "./pages/acopiador/financing";

import DealerDashboard from "./pages/dealer/dashboard";
import DealerTrade from "./pages/dealer/trade";
import DealerBuy from "./pages/dealer/buy";
import DealerPosition from "./pages/dealer/position";
import DealerInvest from "./pages/dealer/invest";

import { Web3Provider as CustomWeb3Provider } from "./context/Web3Context";
import { PrivyProvider } from '@privy-io/react-auth';

/* ─── Pantalla de Carga ─────────────────────────────────────────────────── */
function SplashScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__logo">
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
          <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
        </svg>
      </div>
      <div className="spinner-large" />
    </div>
  );
}

/* ─── Control de Rutas Protegidas ────────────────────────────────────────── */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    const destination = ROLE_HOME[role] ?? "/login";
    return <Navigate to={destination} replace />;
  }

  return children;
}

function SmartRoot() {
  const { user, role, loading } = useRole();
  if (loading) return <SplashScreen />;
  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/login";
    return <Navigate to={dest} replace />;
  }
  return <ProtocoloPage />;
}

function SmartLogin() {
  const { user, role, loading } = useRole();
  if (loading) return <SplashScreen />;
  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/";
    return <Navigate to={dest} replace />;
  }
  return <LandingRole />;
}

/* ─── Arbol de Rutas Unificado ──────────────────────────────────────────── */
function AppRoutes() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  if (!user || !role) {
    return (
      <Routes>
        <Route path="/" element={<SmartRoot />} />
        <Route path="/login" element={<SmartLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/protocolo" element={<ProtocoloPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const roleHome = ROLE_HOME[role] ?? "/";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={roleHome} replace />} />
      <Route path="/login" element={<Navigate to={roleHome} replace />} />
      <Route path="/admin/login" element={<Navigate to={roleHome} replace />} />
      <Route path="/protocolo" element={<ProtocoloPage />} />

      <Route element={<AppLayout />}>
        {/* Rutas Comunes Autenticadas */}
        <Route path="/campaign" element={<CampaignPage />} />
        <Route
          path="/miPerfil"
          element={
            <ProtectedRoute allowedRoles={["admin", "acopiador", "dealer"]}>
              <MiPerfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute allowedRoles={["admin", "acopiador", "dealer"]}>
              <MarketPage />
            </ProtectedRoute>
          }
        />

        {/* Módulo Admin / Fideicomiso (panel ops interno, no es un rol público) */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/control" element={<ProtectedRoute allowedRoles={["admin"]}><AdminControl /></ProtectedRoute>} />

        {/* Módulo Acopiador */}
        <Route path="/acopiador" element={<ProtectedRoute allowedRoles={["acopiador", "admin"]}><AcopiadorDashboard /></ProtectedRoute>} />
        <Route path="/acopiador/tokenizar" element={<ProtectedRoute allowedRoles={["acopiador"]}><RequireFullProfile><AcopiadorTokenizar /></RequireFullProfile></ProtectedRoute>} />
        <Route path="/acopiador/asociaciones" element={<ProtectedRoute allowedRoles={["acopiador"]}><AcopiadorAsociaciones /></ProtectedRoute>} />
        <Route path="/acopiador/financing" element={<ProtectedRoute allowedRoles={["acopiador"]}><AcopiadorFinancing /></ProtectedRoute>} />

        {/* Módulo Dealer */}
        <Route path="/dealer" element={<ProtectedRoute allowedRoles={["dealer", "admin"]}><DealerDashboard /></ProtectedRoute>} />
        <Route path="/dealer/trade" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerTrade /></ProtectedRoute>} />
        <Route path="/dealer/buy" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerBuy /></ProtectedRoute>} />
        <Route path="/dealer/position" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerPosition /></ProtectedRoute>} />
        <Route path="/dealer/invest" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerInvest /></ProtectedRoute>} />

        {/* Warrants Digitales */}
        <Route path="/warrants" element={<ProtectedRoute allowedRoles={["acopiador", "dealer", "admin"]}><RequireFullProfile><WarrantsPage /></RequireFullProfile></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={roleHome} replace />} />
    </Routes>
  );
}

/* ─── Error Boundary ─────────────────────────────────────────────────────── */
class Web3ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[Web3ErrorBoundary] Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080C10", color: "#E3B64F", gap: "16px", padding: "24px", textAlign: "center" }}>
          <p>No se pudo inicializar la infraestructura segura (Privy).</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", border: "1px solid #E3B64F", background: "transparent", color: "#E3B64F", borderRadius: "8px", cursor: "pointer" }}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Web3Provider({ children }) {
  return (
    <Web3ErrorBoundary>
      <PrivyProvider
        appId="cmqqzase9000d0cjyq9ahukwg"
        config={{
          loginMethods: ['email'],
          appearance: { theme: 'dark', accentColor: '#E3B64F', showWalletLoginFirst: false },
          embeddedWallets: { createOnLogin: 'users-without-wallets' },
        }}
      >
        <CustomWeb3Provider>{children}</CustomWeb3Provider>
      </PrivyProvider>
    </Web3ErrorBoundary>
  );
}

export default function AppShell() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Web3Provider>
          <DataProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </DataProvider>
        </Web3Provider>
      </RoleProvider>
    </BrowserRouter>
  );
}