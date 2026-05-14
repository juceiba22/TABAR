import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./modules/roles/RoleContext";
import { DataProvider } from "./modules/roles/DataContext";
import AppLayout from "./modules/layout/AppLayout";
import { auth } from "./config/firebase";
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

function ProtectedRoute({ children, allowedRoles }) {
  const { role, authInitialized, profileLoading } = useRole();

  if (!authInitialized || profileLoading) return null;
  if (!role) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }
  return children;
}

function AppRoutes() {
  const {
    user,
    role,
    profile,
    authInitialized,
    profileLoading,
    contextError,
    logout,
    retryProfile,
  } = useRole();

  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // 1. Initial Auth Check (Firebase Auth handshake)
  if (!authInitialized) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Sincronizando sesión...</p>
      </div>
    );
  }

  // 2. User is NOT logged in -> Show Landing
  if (!user) {
    return (
      <Routes>
        <Route path="/*" element={<LandingRole />} />
      </Routes>
    );
  }

  /**
   * 3. Email Verification Check (PRIORITY)
   * We check this BEFORE profileLoading so the user isn't stuck 
   * in a spinner if Firestore is slow but they haven't verified yet.
   */
  if (!user.emailVerified) {
    const handleVerifyCheck = async () => {
      setVerifyChecking(true);
      setVerifyError("");
      try {
        // Force refresh the user token from Firebase
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;

        if (refreshedUser?.emailVerified) {
          // Success! Reload the app to trigger RoleContext update
          window.location.reload();
        } else {
          setVerifyError("Todavía no detectamos la verificación. Revisá tu casilla (también SPAM).");
          setVerifyChecking(false);
        }
      } catch (err) {
        console.error("Verify check error:", err);
        setVerifyError("Ocurrió un error. Intentá de nuevo en unos segundos.");
        setVerifyChecking(false);
      }
    };

    return (
      <div className="status-screen">
        <div className="status-icon warning">✉</div>
        <h2>Verificación Requerida</h2>
        <p>
          Hemos enviado un correo a <strong>{user.email}</strong>.{" "}
          Por favor, verificá tu cuenta para acceder al protocolo TABAR.
          <br />
          <span style={{ fontSize: "13px", color: "#484F58", marginTop: "8px", display: "block" }}>
            Si no lo encontrás, revisá la carpeta de SPAM.
          </span>
        </p>
        {verifyError && (
          <p style={{ color: "#F85149", fontSize: "13px", marginBottom: "16px", marginTop: "-16px" }}>
            {verifyError}
          </p>
        )}
        <div className="status-actions">
          <button
            onClick={handleVerifyCheck}
            disabled={verifyChecking}
            className="tabar-btn tabar-btn-primary"
            style={{ opacity: verifyChecking ? 0.6 : 1 }}
          >
            {verifyChecking ? "Sincronizando..." : "Ya verifiqué mi correo"}
          </button>
          <button onClick={logout} className="tabar-btn tabar-btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // 4. Critical Error (Firestore Timeout or Connection Error)
  // Only show this if we are NOT loading and we don't have a role yet.
  if (contextError && !role && !profileLoading) {
    return (
      <div className="status-screen">
        <div className="status-icon error">⚠</div>
        <h2>Error de Conexión</h2>
        <p>{contextError}</p>
        <div className="status-actions">
          <button
            onClick={retryProfile}
            className="tabar-btn tabar-btn-primary"
          >
            Reintentar Conexión
          </button>
          <button onClick={logout} className="tabar-btn tabar-btn-secondary">
            Salir
          </button>
        </div>
      </div>
    );
  }

  // 5. Loading Profile State (Firestore)
  if (profileLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Cargando perfil institucional...</p>
      </div>
    );
  }

  // 6. User is logged in but has no profile document (Deadlock prevention)
  if (!role && user) {
    return (
      <div className="status-screen">
        <div className="status-icon warning">?</div>
        <h2>Perfil No Encontrado</h2>
        <p>
          Tu cuenta existe pero no encontramos tu perfil institucional. 
          Contactá al soporte técnico.
        </p>
        <div className="status-actions">
          <button onClick={logout} className="tabar-btn tabar-btn-primary">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // 7. Pending Approval State
  if (profile?.status === "pending_approval" && role !== "admin") {
    return (
      <div className="status-screen">
        <div className="status-icon clock">⌛</div>
        <h2>Solicitud en Proceso</h2>
        <p>
          Tu registro ha sido recibido. Un administrador verificará
          tus credenciales para habilitar tu acceso.
        </p>
        <div className="status-actions">
          <button
            onClick={retryProfile}
            className="tabar-btn tabar-btn-primary"
          >
            Verificar Estado
          </button>
          <button onClick={logout} className="tabar-btn tabar-btn-secondary">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // 8. Normal Flow
  return (
    <AppLayout>
      <Routes>
        <Route path="/campaign" element={<CampaignPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/control" element={<ProtectedRoute allowedRoles={["admin"]}><AdminControl /></ProtectedRoute>} />

        {/* Industry Routes */}
        <Route path="/industry" element={<ProtectedRoute allowedRoles={["industry", "admin"]}><IndustryDashboard /></ProtectedRoute>} />
        <Route path="/industry/buy" element={<ProtectedRoute allowedRoles={["industry"]}><IndustryBuy /></ProtectedRoute>} />
        <Route path="/industry/position" element={<ProtectedRoute allowedRoles={["industry"]}><IndustryPosition /></ProtectedRoute>} />

        {/* State Routes */}
        <Route path="/state" element={<ProtectedRoute allowedRoles={["state", "admin"]}><StateDashboard /></ProtectedRoute>} />
        <Route path="/state/invest" element={<ProtectedRoute allowedRoles={["state"]}><StateInvest /></ProtectedRoute>} />
        <Route path="/state/returns" element={<ProtectedRoute allowedRoles={["state"]}><StateReturns /></ProtectedRoute>} />

        {/* Dealer Routes */}
        <Route path="/dealer" element={<ProtectedRoute allowedRoles={["dealer", "admin"]}><DealerDashboard /></ProtectedRoute>} />
        <Route path="/dealer/trade" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerTrade /></ProtectedRoute>} />
        <Route path="/dealer/markets" element={<ProtectedRoute allowedRoles={["dealer"]}><DealerMarkets /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to={`/${role}`} replace />} />
        <Route path="/*" element={<Navigate to={`/${role}`} replace />} />
      </Routes>
    </AppLayout>
  );
}

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
          background: #080c10;
          color: #E3B64F;
          font-family: var(--tb-font);
          gap: 20px;
        }
        .status-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #080c10;
          color: #fff;
          text-align: center;
          padding: 40px;
          font-family: var(--tb-font);
        }
        .status-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin-bottom: 24px;
        }
        .status-icon.warning { background: rgba(227,182,79,0.1); color: #E3B64F; }
        .status-icon.error { background: rgba(248,81,73,0.1); color: #F85149; }
        .status-icon.clock { background: rgba(88,166,255,0.1); color: #58A6FF; }

        .status-screen h2 { font-size: 28px; margin-bottom: 12px; font-weight: 600; }
        .status-screen p { color: #8B949E; max-width: 460px; line-height: 1.6; margin-bottom: 32px; font-size: 16px; }

        .status-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(227,182,79,0.2);
          border-top-color: #E3B64F;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </BrowserRouter>
  );
}
