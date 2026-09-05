import { useData } from "../../modules/roles/DataContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

export default function DealerDashboard() {
  const { balances } = useData();
  const myBalance = balances?.dealer || 0;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: "#fdf8eb", color: "#775a00" }}>
            <span className="material-symbols-outlined">candlestick_chart</span>
          </div>
          <h1>Mi Dashboard — Mesa Dealer & Arbitraje</h1>
        </div>
        <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13.5px" }}>
          Mesa de operaciones comerciales, financiamiento de warrants, arbitraje y provisión de liquidez
        </p>
      </div>

      <div className="tabar-grid-4" style={{ marginBottom: "28px" }}>
        <MetricCard label="Posición TABAR" value={myBalance.toLocaleString("es-AR")} unit="fardos en cartera" glyph="candlestick_chart" />
        <MetricCard label="P&L Estimado" value={myBalance > 0 ? `+$${(myBalance * 2.3).toFixed(0)}` : "$0"} unit="USD spread" glyph="trending_up" />
        <MetricCard label="Operaciones Hoy" value="4" unit="trades liquidados" glyph="sync_alt" />
        <MetricCard label="Estado Mesa" value={myBalance > 0 ? "Posicionado" : "Liquidez Disponible"} unit="Operando" glyph="account_balance_wallet" />
      </div>

      <div style={{ marginBottom: "28px" }}>
        <CampaignStats />
      </div>

      <div>
        <h3 className="tabar-card-title" style={{ border: "none", marginBottom: "14px" }}>Acciones Rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/dealer/trade" icon="candlestick_chart" title="Operar Tabaco & Warrants" desc="Comprar y vender lotes de tabaco digital en el mercado secundario" />
          <ActionCard to="/market" icon="storefront" title="Mercado Tabacalero" desc="Precios de referencia, spreads provinciales y cotizaciones SAGyP" />
          <ActionCard to="/campaign" icon="calendar_month" title="Campaña Agrícola" desc="Seguimiento de acopio, POAs y evolución de la cosecha nacional" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, glyph }) {
  return (
    <div className="tabar-metric-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <span className="tabar-metric-label">{label}</span>
        <span className="material-symbols-outlined" style={{ color: "var(--tb-secondary)", fontSize: "20px" }}>{glyph}</span>
      </div>
      <div className="tabar-metric-value">{value}</div>
      <div className="tabar-metric-unit">{unit}</div>
    </div>
  );
}

function ActionCard({ to, icon, title, desc }) {
  return (
    <Link to={to} className="tabar-action-card">
      <div className="tabar-action-icon" style={{ background: "#edf6ef", color: "var(--tb-accent)" }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h4 style={{ margin: 0, fontSize: "15px", fontFamily: "var(--tb-serif)", fontWeight: 700, color: "var(--tb-accent)" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: "13px", color: "var(--tb-text-2)", lineHeight: 1.5 }}>{desc}</p>
    </Link>
  );
}
