import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./modules/roles/RoleContext";
import { DataProvider } from "./modules/roles/DataContext";
import AppLayout from "./modules/layout/AppLayout";

import LandingRole      from "./pages/LandingRole";
import CampaignPage     from "./pages/campaign/index";
import AdminDashboard   from "./pages/admin/dashboard";
import AdminControl     from "./pages/admin/control";
import IndustryDashboard from "./pages/industry/dashboard";
import IndustryBuy      from "./pages/industry/buy";
import IndustryPosition from "./pages/industry/position";
import StateDashboard   from "./pages/state/dashboard";
import StateInvest      from "./pages/state/invest";
import StateReturns     from "./pages/state/returns";
import DealerDashboard  from "./pages/dealer/dashboard";
import DealerTrade      from "./pages/dealer/trade";
import DealerMarkets    from "./pages/dealer/markets";

function ProtectedRoute({ children, allowedRoles }) {
  const { role, loading } = useRole();

  if (loading) return null;
  if (!role) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }
  return children;
}

function AppRoutes() {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080c10", color: "#E3B64F" }}>
        Cargando sistema...
      </div>
    );
  }

  if (!role) {
    return (
      <Routes>
        <Route path="/*" element={<LandingRole />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/campaign"          element={<CampaignPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin"             element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/control"     element={<ProtectedRoute allowedRoles={["admin"]}><AdminControl /></ProtectedRoute>} />
        
        {/* Industry Routes */}
        <Route path="/industry"          element={<ProtectedRoute allowedRoles={["industry", "admin"]}><IndustryDashboard /></ProtectedRoute>} />
        <Route path="/industry/buy"      element={<ProtectedRoute allowedRoles={["industry"]}><IndustryBuy /></ProtectedRoute>} />
        <Route path="/industry/position" element={<ProtectedRoute allowedRoles={["industry"]}><IndustryPosition /></ProtectedRoute>} />
        
        {/* State Routes */}
        <Route path="/state"             element={<ProtectedRoute allowedRoles={["state", "admin"]}><StateDashboard /></ProtectedRoute>} />
        <Route path="/state/invest"      element={<ProtectedRoute allowedRoles={["state"]}><StateInvest /></ProtectedRoute>} />
        <Route path="/state/returns"     element={<ProtectedRoute allowedRoles={["state"]}><StateReturns /></ProtectedRoute>} />
        
        {/* Dealer Routes */}
        <Route path="/dealer"            element={<ProtectedRoute allowedRoles={["dealer", "admin"]}><DealerDashboard /></ProtectedRoute>} />
        <Route path="/dealer/trade"      element={<ProtectedRoute allowedRoles={["dealer"]}><DealerTrade /></ProtectedRoute>} />
        <Route path="/dealer/markets"    element={<ProtectedRoute allowedRoles={["dealer"]}><DealerMarkets /></ProtectedRoute>} />
        
        <Route path="/"                  element={<Navigate to={`/${role}`} replace />} />
        <Route path="/*"                 element={<Navigate to={`/${role}`} replace />} />
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
    </BrowserRouter>
  );
}
