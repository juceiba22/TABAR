/**
 * AppShell.jsx — v3
 *
 * Cambios vs v2:
 *  ① Ruta "/" ahora apunta a PublicPresentation (landing pública).
 *  ② LandingRole (login/registro) se movió a "/login".
 *  ③ Usuarios autenticados con rol son redirigidos desde "/" a su dashboard.
 *  ④ ProtectedRoute redirige a "/login" en vez de "/" para no-autenticados.
 *  ⑤ Catch-all para usuarios sin auth redirige a "/" (landing pública).
 *  ⑥ Se preserva SplashScreen, DataProvider y RoleProvider intactos.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole, ROLE_HOME } from "./modules/roles/RoleContext";
import { DataProvider } from "./modules/roles/DataContext";
import AppLayout from "./modules/layout/AppLayout";
import PublicPresentation from "./pages/PublicPresentation";
import LandingRole from "./pages/LandingRole";
import CampaignPage from "./pages/campaign/index";
import AdminDashboard from "./pages/admin/dashboard";
import AdminControl from "./pages/admin/control";
import IndustryDashboard from "./pages/industry/dashboard";
import IndustryBuy from "./pages/industry/buy";
import IndustryPosition from "./pages/industry/position";
import StateDashboard from "./pages/state/dashboard";
import StateInvest from "./pages/state/invest";
import StateReturns from "./pages/state/returns";
import DealerDashboard from "./pages/dealer/dashboard";
import DealerTrade from "./pages/dealer/trade";
import DealerMarkets from "./pages/dealer/markets";
import ProducerDashboard from "./pages/producer/dashboard";
import ProducerTokenizar from "./pages/producer/tokenizar";

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
/**
 * Guarda una ruta según autenticación y rol.
 *
 * Estados posibles:
 *   loading  → SplashScreen (sin flash)
 *   !user    → redirect a "/login"  (④ formulario de auth)
 *   role no permitido → redirect al home del rol actual
 *   ok       → renderiza children
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  // ④ No autenticado → formulario de login
  if (!user) return <Navigate to="/login" replace />;

  // Rol no permitido → home del rol actual, con fallback seguro
  if (allowedRoles && !allowedRoles.includes(role)) {
    const destination = ROLE_HOME[role] ?? "/login";
    return <Navigate to={destination} replace />;
  }

  return children;
}

/* ─── SmartRoot: redirige auth con rol, o muestra landing ────────────────── */
function SmartRoot() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  // ③ Usuario con sesión activa y rol → directo a su dashboard
  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/login";
    return <Navigate to={dest} replace />;
  }

  // ① Sin sesión o sin rol → landing pública
  return <PublicPresentation />;
}

/* ─── SmartLogin: redirige auth con rol, o muestra login ─────────────────── */
function SmartLogin() {
  const { user, role, loading } = useRole();

  if (loading) return <SplashScreen />;

  // Ya autenticado con rol → no tiene sentido ver el login
  if (user && role) {
    const dest = ROLE_HOME[role] ?? "/";
    return <Navigate to={dest} replace />;
  }

  // ② Mostrar formulario de login/registro
  return <LandingRole />;
}

/* ─── AppRoutes ──────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user, role, loading } = useRole();

  // Bloquear render hasta que loading termine — evita flash
  if (loading) return <SplashScreen />;

  // ⑤ Sin sesión o sin rol: mostrar rutas públicas + login
  if (!user || !role) {
    return (
      <Routes>
        <Route path="/" element={<SmartRoot />} />
        <Route path="/login" element={<SmartLogin />} />
        {/* Cualquier otra ruta sin auth → landing pública */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Destino raíz del rol actual
  const roleHome = ROLE_HOME[role] ?? "/";

  return (
    <Routes>
      {/* ── Rutas públicas accesibles también estando auth ── */}
      <Route path="/" element={<Navigate to={roleHome} replace />} />
      <Route path="/login" element={<Navigate to={roleHome} replace />} />

      {/* ── Rutas protegidas dentro del AppLayout ── */}
      <Route element={<AppLayout />}>
        {/* Ruta compartida */}
        <Route path="/campaign" element={<CampaignPage />} />

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
        <Route
          path="/dealer/markets"
          element={
            <ProtectedRoute allowedRoles={["dealer"]}>
              <DealerMarkets />
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
      </Route>

      {/* Catch-all — redirige al home del rol actual */}
      <Route path="*" element={<Navigate to={roleHome} replace />} />
    </Routes>
  );
}

/* ─── AppShell ───────────────────────────────────────────────────────────── */
export default function AppShell() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
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
