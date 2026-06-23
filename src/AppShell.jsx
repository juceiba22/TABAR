/**
 * AppShell.jsx — v3.1 (Web2.5 Privy Bypass Integrado)
 *
 * Cambios vs v3 original:
 * ✔ Incorporación del PrivyProvider global para Embedded Wallets institucionales.
 * ✔ Bypass activo de Privy si la URL contiene parámetros de verificación de Firebase Auth (?mode=verifyEmail),
 * eliminando definitivamente la pantalla en negro al validar nuevos usuarios por correo.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole, ROLE_HOME } from "./modules/roles/RoleContext";
import { DataProvider } from "./modules/roles/DataContext";
import { ToastProvider } from "./modules/layout/ToastContext";
import { ChatProvider } from "./modules/chat/ChatContext";
import AppLayout from "./modules/layout/AppLayout";
import PublicPresentation from "./pages/PublicPresentation";
import LandingRole from "./pages/LandingRole";
import CampaignPage from "./pages/campaign/index";
import MarketPage from "./pages/market/index";
import AdminDashboard from "./pages/admin/dashboard";
import AdminControl from "./pages/admin/control";
import AdminLogin from "./pages/admin/AdminLogin";
import IndustryDashboard from "./pages/industry/dashboard";
import IndustryBuy from "./pages/industry/buy";
import IndustryPosition from "./pages/industry/position";
import StateDashboard from "./pages/state/dashboard";
import StateInvest from "./pages/state/invest";
import StateReturns from "./pages/state/returns";
import DealerDashboard from "./pages/dealer/dashboard";
import DealerTrade from "./pages/dealer/trade";
import ProducerDashboard from "./pages/producer/dashboard";
import IndustryFinancing from "./pages/industry/financing";
import ProducerTokenizar from "./pages/producer/tokenizar";
import ProducerAssociations from "./pages/producer/asociaciones";
import MiPerfil from "./pages/miPerfil";

// ① IMPORTAR EL PROVEEDOR DE PRIVY
import { PrivyProvider } from '@privy-io/react-auth';

/* ─── Spinner de splash ──────────────────────────────────────────────────── */
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

/* ─── ProtectedRoute ─────────────────────────────────────────────────────── */
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

/* ─── SmartRoot ──────────────────────────────────────────────────────────── */
function SmartRoot() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/login";
    return <Navigate to={dest} replace />;
  }

  return <PublicPresentation />;
}

/* ─── SmartLogin ─────────────────────────────────────────────────────────── */
function SmartLogin() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/";
    return <Navigate to={dest} replace />;
  }

  return <LandingRole />;
}

/* ─── AppRoutes ──────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  if (!user || !role) {
    return (
      <Routes>
        <Route path="/" element={<SmartRoot />} />
        <Route path="/login" element={<SmartLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
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

      <Route element={<AppLayout />}>
        <Route path="/campaign" element={<CampaignPage />} />
        <Route 
          path="/miPerfil" 
          element={
            <ProtectedRoute allowedRoles={["admin", "industry", "state", "dealer", "producer"]}>
              <MiPerfil />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/market" 
          element={
            <ProtectedRoute allowedRoles={["admin", "industry", "state", "dealer", "producer"]}>
              <MarketPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/control"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminControl />
            </ProtectedRoute>
          }
        />

        {/* Industry */}
        <Route
          path="/industry"
          element={
            <ProtectedRoute allowedRoles={["industry", "admin"]}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/buy"
          element={
            <ProtectedRoute allowedRoles={["industry"]}>
              <IndustryBuy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industry/position"
          element={
            <ProtectedRoute allowedRoles={["industry"]}>
              <IndustryPosition />
            </ProtectedRoute>
          }
        />
        <Route path="/industry/financing" element={<IndustryFinancing />} />

        {/* State */}
        <Route
          path="/state"
          element={
            <ProtectedRoute allowedRoles={["state", "admin"]}>
              <StateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/state/invest"
          element={
            <ProtectedRoute allowedRoles={["state"]}>
              <StateInvest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/state/returns"
          element={
            <ProtectedRoute allowedRoles={["state"]}>
              <StateReturns />
            </ProtectedRoute>
          }
        />

        {/* Dealer */}
        <Route
          path="/dealer"
          element={
            <ProtectedRoute allowedRoles={["dealer", "admin"]}>
              <DealerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealer/trade"
          element={
            <ProtectedRoute allowedRoles={["dealer"]}>
              <DealerTrade />
            </ProtectedRoute>
          }
        />

        {/* Producer */}
        <Route
          path="/producer"
          element={
            <ProtectedRoute allowedRoles={["producer", "admin"]}>
              <ProducerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/producer/tokenizar"
          element={
            <ProtectedRoute allowedRoles={["producer"]}>
              <ProducerTokenizar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/producer/asociaciones"
          element={
            <ProtectedRoute allowedRoles={["producer"]}>
              <ProducerAssociations />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={roleHome} replace />} />
    </Routes>
  );
}

/* ─── Envolvedor Criptográfico Condicional (Bypass de Verificación) ──────── */
/**
 * Si el usuario viene desde un enlace de confirmación de email institucional,
 * evitamos inicializar Privy para que Firebase Auth procese la sesión sin bloqueos.
 */
function ConditionalWeb3Provider({ children }) {
  const params = new URLSearchParams(window.location.search);
  const isVerifyEmailMode = params.get("mode") === "verifyEmail" || params.has("oobCode");

  if (isVerifyEmailMode) {
    // Si es un link de verificación, hacemos bypass directo para que Firebase actúe libremente
    return <>{children}</>;
  }

  // De lo contrario, cargamos la suite completa Web2.5 de Privy
  return (
    <PrivyProvider
      appId="cmqqzase9000d0cjyq9ahukwg" // Aquí pegas el ID obtenido de dashboard.privy.io
      config={{
        loginMethods: ['email'],  
        appearance: {
          theme: 'dark',
          accentColor: '#E3B64F',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

/* ─── AppShell Principal ─────────────────────────────────────────────────── */
export default function AppShell() {
  return (
    <BrowserRouter>
      <ConditionalWeb3Provider>
        <RoleProvider>
          <DataProvider>
            <ToastProvider>
              <ChatProvider>
                <AppRoutes />
              </ChatProvider>
            </ToastProvider>
          </DataProvider>
        </RoleProvider>
      </ConditionalWeb3Provider>

      <style dangerouslySetInnerHTML={{
        __html: `
        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #080C10;
          gap: 24px;
        }
        .loading-screen__logo {
          width: 52px;
          height: 52px;
          background: #E3B64F;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spinner-large {
          width: 28px;
          height: 28px;
          border: 2px solid rgba(227,182,79,0.2);
          border-top-color: #E3B64F;
          border-radius: 50%;
          animation: shell-spin 0.9s linear infinite;
        }
        @keyframes shell-spin { to { transform: rotate(360deg); } }
        `
      }} />
    </BrowserRouter>
  );
}