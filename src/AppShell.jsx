import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./modules/roles/RoleContext.jsx";
import AppLayout from "./modules/layout/AppLayout.jsx";

// Pages
import LandingRole      from "./pages/LandingRole.jsx";
import CampaignPage     from "./pages/campaign/index.jsx";
import AdminDashboard   from "./pages/admin/dashboard.jsx";
import AdminControl     from "./pages/admin/control.jsx";
import IndustryDashboard from "./pages/industry/dashboard.jsx";
import IndustryBuy      from "./pages/industry/buy.jsx";
import IndustryPosition from "./pages/industry/position.jsx";
import StateDashboard   from "./pages/state/dashboard.jsx";
import StateInvest      from "./pages/state/invest.jsx";
import StateReturns     from "./pages/state/returns.jsx";
import DealerDashboard  from "./pages/dealer/dashboard.jsx";
import DealerTrade      from "./pages/dealer/trade.jsx";
import DealerMarkets    from "./pages/dealer/markets.jsx";

function AppRoutes() {
  const { role } = useRole();

  // Sin rol → landing
  if (!role) {
    return (
      <Routes>
        <Route path="/*" element={<LandingRole />} />
      </Routes>
    );
  }

  // Con rol → layout + rutas protegidas
  return (
    <AppLayout>
      <Routes>
        {/* Campaña — accesible por todos los roles */}
        <Route path="/campaign" element={<CampaignPage />} />

        {/* Admin */}
        <Route path="/admin"         element={<AdminDashboard />} />
        <Route path="/admin/control" element={<AdminControl />} />

        {/* Industry */}
        <Route path="/industry"          element={<IndustryDashboard />} />
        <Route path="/industry/buy"      element={<IndustryBuy />} />
        <Route path="/industry/position" element={<IndustryPosition />} />

        {/* State */}
        <Route path="/state"         element={<StateDashboard />} />
        <Route path="/state/invest"  element={<StateInvest />} />
        <Route path="/state/returns" element={<StateReturns />} />

        {/* Dealer */}
        <Route path="/dealer"         element={<DealerDashboard />} />
        <Route path="/dealer/trade"   element={<DealerTrade />} />
        <Route path="/dealer/markets" element={<DealerMarkets />} />

        {/* Redirect raíz según rol */}
        <Route path="/"  element={<Navigate to={`/${role}`} replace />} />
        <Route path="/*" element={<Navigate to={`/${role}`} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function AppShell() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <AppRoutes />
      </RoleProvider>
    </BrowserRouter>
  );
}
