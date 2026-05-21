import { useData } from "../../modules/roles/DataContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

export default function ProducerDashboard() {
  const { balances } = useData();
  const myBalance = balances?.producer || 0;

  const kgEquivalente = myBalance * 200;
  const financiamientoEstimado = myBalance * 85;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>🌿</div>
          <h1>Mi Dashboard Finca — Productor</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Gestión de activos tabacaleros certificados</p>
      </div>

      <div className="tabar-grid-4">
        <MetricCard label="Mi Tenencia TABAR" value={myBalance.toLocaleString("es-AR")} unit="fardos digitales" color={C.accent} bg={C.dim} glyph="🌿" />
        <MetricCard label="Equivalente en tabaco" value={kgEquivalente.toLocaleString("es-AR")} unit="kg certificados" color="#ccff66" bg="rgba(204,255,102,0.10)" glyph="◈" />
        <MetricCard label="Adelanto Estimado" value={financiamientoEstimado.toLocaleString("es-AR")} unit="USD fiduciario" color="#58A6FF" bg="rgba(88,166,255,0.10)" glyph="$" />
        <MetricCard label="Estado de Registro" value={myBalance > 0 ? "Activo" : "Sin fardos"} unit="" color={myBalance > 0 ? "#3FB950" : "#F0883E"} bg={myBalance > 0 ? "rgba(63,185,80,0.10)" : "rgba(240,136,62,0.10)"} glyph="◉" />
      </div>

      <div className="tabar-section">
        <CampaignStats />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Acciones rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/producer/tokenizar" glyph="▣" title="Certificar Tabaco" desc="Certificá tu producción física para recibir financiamiento digital" color={C.accent} bg={C.dim} />
          <ActionCard to="/producer/asociaciones" glyph="👥" title="Mis Asociaciones" desc="Formá parte de grupos de venta para consolidar stock y vender en bloque" color={C.accent} bg={C.dim} />

        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color, bg, glyph }) {
  return (
    <div className="tabar-metric-card">
      <div className="tabar-metric-icon" style={{ background: bg, color }}>{glyph}</div>
      <div className="tabar-metric-label">{label}</div>
      <div className="tabar-metric-value" style={{ color }}>{value}</div>
      <div className="tabar-metric-unit">{unit}</div>
    </div>
  );
}

function ActionCard({ to, glyph, title, desc, color, bg }) {
  return (
    <Link to={to} className="tabar-action-card">
      <div className="tabar-action-icon" style={{ background: bg, color }}>{glyph}</div>
      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#F0F6FC" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: "12px", color: "#484F58", lineHeight: 1.5 }}>{desc}</p>
    </Link>
  );
}
