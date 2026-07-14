/**
 * AppShell.jsx — v3.2 (Privy fuera del camino crítico de Firebase Auth)
 *
 * Cambios vs v3.1:
 * ✔ RoleProvider (Firebase Auth) ahora vive POR FUERA del PrivyProvider.
 *   La verificación de email y el ciclo de sesión de Firebase ya no
 *   dependen de que el SDK de Privy haya inicializado correctamente.
 * ✔ Se elimina el bypass condicional por ?mode=verifyEmail: ya no es
 *   necesario, porque Privy nunca puede bloquear el render de RoleProvider.
 * ✔ Web3ErrorBoundary: si Privy falla al inicializar (origen no permitido,
 *   error de red, etc.), solo se ve afectada la infraestructura de wallet,
 *   no toda la aplicación (pantalla negra).
 */

import { Component } from "react";
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
import { Web3Provider as CustomWeb3Provider } from "./context/Web3Context";

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

/* ─── Error Boundary para fallos de Privy/Web3 ───────────────────────────
 * Si el SDK de Privy lanza una excepción durante el render (por ejemplo,
 * por un origen no permitido, fallo de red al inicializar, o un hook leído
 * antes de tiempo), esto evita que TODA la app quede en pantalla negra.
 * Solo afecta al árbol que envuelve, dejando el resto de rutas operables. */
class Web3ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[Web3ErrorBoundary] Error en infraestructura Privy/Web3:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080C10",
          color: "#E3B64F",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
        }}>
          <p>No se pudo inicializar la infraestructura segura (Privy).</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              border: "1px solid #E3B64F",
              background: "transparent",
              color: "#E3B64F",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Web3Provider ────────────────────────────────────────────────────────
 * Privy se monta siempre (ya no condicionalmente), porque varios componentes
 * (miPerfil, tokenizar, industry/buy) usan usePrivy()/useWallets() y esos
 * hooks REQUIEREN que el PrivyProvider esté presente en el árbol, sin
 * importar la ruta o los parámetros de la URL. El flujo de verificación de
 * email de Firebase (?mode=verifyEmail) ocurre en RoleContext, que ahora
 * vive AFUERA de este provider (ver AppShell), por lo que ya no depende de
 * que Privy haya terminado de inicializar.
 */
function Web3Provider({ children }) {
  return (
    <Web3ErrorBoundary>
      <PrivyProvider
        appId="cmqqzase9000d0cjyq9ahukwg" // ID de dashboard.privy.io
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
        {/* Agregamos el proveedor personalizado para heredar el contrato y la wallet */}
        <CustomWeb3Provider>
          {children}
        </CustomWeb3Provider>
      </PrivyProvider>
    </Web3ErrorBoundary>
  );
}

/* ─── AppShell Principal ─────────────────────────────────────────────────
 * Orden de providers, de afuera hacia adentro:
 *  1. BrowserRouter — necesario para todo lo demás.
 *  2. RoleProvider — Firebase Auth. Va PRIMERO y por fuera de Privy para que
 *     la validación de sesión / verificación de email nunca dependa de que
 *     el SDK de Privy haya inicializado correctamente.
 *  3. Web3Provider — Privy, envuelto en su propio Error Boundary. Si falla,
 *     solo rompe las features de wallet, no el resto de la app.
 *  4. DataProvider / ToastProvider / ChatProvider — el resto de la app.
 */
export default function AppShell() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <Web3Provider>
          <DataProvider>
            <ToastProvider>
              <ChatProvider>
                <AppRoutes />
              </ChatProvider>
            </ToastProvider>
          </DataProvider>
        </Web3Provider>
      </RoleProvider>

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
