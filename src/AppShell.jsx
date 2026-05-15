/**
 * AppShell.jsx — v2
 *
 * Fixes vs versión anterior:
 *  ① Eliminada redirección a /undefined: catch-all usa ROLE_HOME[role]
 *    con fallback explícito. Si role es null, va a "/" (LandingRole),
 *    nunca a una ruta vacía o inválida.
 *  ② Un único catch-all al final del árbol de rutas — los dos catch-all
 *    anteriores competían y causaban renders dobles.
 *  ③ ProtectedRoute distingue tres estados: loading, sin auth, sin rol
 *    para ese recurso. Cada uno tiene un destino claro.
 *  ④ AppRoutes no renderiza nada hasta que loading === false,
 *    cortando el flash de LandingRole en recargas con sesión activa.
 *  ⑤ Usuario autenticado sin rol (role === null) ve LandingRole donde
 *    el modo "no-role" ya está manejado — no queda atrapado en limbo.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole, ROLE_HOME } from "./modules/roles/RoleContext";
import { DataProvider } from "./modules/roles/DataContext";
import AppLayout from "./modules/layout/AppLayout";
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
 *   loading  → SplashScreen (④ no hay flash)
 *   !user    → redirect a "/"  (LandingRole)
 *   role no permitido → redirect al home del rol actual (① sin /undefined)
 *   ok       → renderiza children
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useRole();

  // ④ Esperar a que RoleContext termine de resolver antes de decidir
  if (loading) return <SplashScreen />;

  // No autenticado
  if (!user) return <Navigate to="/" replace />;

  // ① Rol no permitido → home del rol actual, con fallback seguro
  if (allowedRoles && !allowedRoles.includes(role)) {
    const destination = ROLE_HOME[role] ?? "/";
    return <Navigate to={destination} replace />;
  }

  return children;
}

/* ─── AppRoutes ──────────────────────────────────────────────────────────── */
function AppRoutes() {
  const { user, role, loading } = useRole();

  // ④ Bloquear render hasta que loading termine — evita flash de LandingRole
  if (loading) return <SplashScreen />;

  // ⑤ Sin sesión (o usuario verificado sin rol → LandingRole maneja modo "no-role")
  if (!user || !role) {
    return (
      <Routes>
        <Route path="/*" element={<LandingRole />} />
      </Routes>
    );
  }

  // ① Destino raíz del rol actual
  const roleHome = ROLE_HOME[role] ?? "/";

  return (
    <AppLayout>
      <Routes>
        {/* ── Ruta compartida ── */}
        <Route path="/campaign" element={<CampaignPage />} />

        {/* ── Admin ── */}
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

        {/* ── Industry ── */}
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

        {/* ── State ── */}
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

        {/* ── Dealer ── */}
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

        {/* ② Un único catch-all — redirige al home del rol actual */}
        <Route path="*" element={<Navigate to={roleHome} replace />} />
      </Routes>
    </AppLayout>
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
