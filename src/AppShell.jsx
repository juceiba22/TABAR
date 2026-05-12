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
        <Route path="/admin"             element={<AdminDashboard />} />
        <Route path="/admin/control"     element={<AdminControl />} />
        <Route path="/industry"          element={<IndustryDashboard />} />
        <Route path="/industry/buy"      element={<IndustryBuy />} />
        <Route path="/industry/position" element={<IndustryPosition />} />
        <Route path="/state"             element={<StateDashboard />} />
        <Route path="/state/invest"      element={<StateInvest />} />
        <Route path="/state/returns"     element={<StateReturns />} />
        <Route path="/dealer"            element={<DealerDashboard />} />
        <Route path="/dealer/trade"      element={<DealerTrade />} />
        <Route path="/dealer/markets"    element={<DealerMarkets />} />
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
