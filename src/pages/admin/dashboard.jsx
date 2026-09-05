import { useRole } from "../../modules/roles/RoleContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#132a1e", dim: "#edf6ef", gold: "#c59b27" };

export default function AdminDashboard() {
  const { user } = useRole();

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>
            <span className="material-symbols-outlined">shield_lock</span>
          </div>
          <h1>Panel de Fideicomiso & Gobernanza TABAR</h1>
        </div>
        <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13.5px" }}>
          Monitoreo integral del protocolo, autorización de entidades, emisión de warrants y control de custodia
        </p>
      </div>

      <div className="tabar-grid-4" style={{ marginBottom: "28px" }}>
        <MetricCard label="Servidor & Base de Datos" value="Operativo" unit="Firebase Cloud" glyph="cloud_done" />
        <MetricCard label="Sesión de Fideicomiso" value={user?.email ? user.email.split("@")[0] : "Admin"} unit={user?.email || "fideicomiso@tabar.agro"} glyph="admin_panel_settings" />
        <MetricCard label="Marco Regulatorio" value="Ley 9.643" unit="SAGyP Homologado" glyph="verified" />
        <MetricCard label="Rol Activo" value="Fideicomiso / Admin" unit="Control Total" glyph="shield" />
      </div>

      <div style={{ marginBottom: "28px" }}>
        <CampaignStats />
      </div>

      <div>
        <h3 className="tabar-card-title" style={{ border: "none", marginBottom: "14px" }}>Acciones Administrativas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/admin/control" icon="tune" title="Control del Sistema" desc="Deploy, gestión de participantes autorizados, emisión de warrants y balances" />
          <ActionCard to="/campaign" icon="calendar_month" title="Estado de Campaña" desc="Progreso del financiamiento, métricas de acopio y distribución provincial" />
          <ActionCard to="/market" icon="storefront" title="Mercado Tabacalero" desc="Supervisión de cotizaciones, precios de referencia y operaciones secundarias" />
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
      <div className="tabar-metric-value" style={{ fontSize: "18px" }}>{value}</div>
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
