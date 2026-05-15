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
  const { user, role, loading } = useRole();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role || ''}`} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, role, loading } = useRole();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/*" element={<LandingRole />} />
      </Routes>
    );
  }

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

        {/* Catch-all to send to role root */}
        <Route path="/" element={<Navigate to={`/${role || ''}`} replace />} />
        <Route path="/*" element={<Navigate to={`/${role || ''}`} replace />} />
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
