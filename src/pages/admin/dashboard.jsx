import { useRole } from "../../modules/roles/RoleContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function AdminDashboard() {
  const { user, profile } = useRole();

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
          <h1>Panel de Administración — Fideicomiso</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Acceso completo al sistema. Las acciones tienen efecto directo en la plataforma.</p>
      </div>

      <div className="tabar-grid-4" style={{ marginBottom: "20px" }}>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
          <div className="tabar-metric-label">Conexión</div>
          <div style={{ fontSize: "13px", color: "#3FB950" }}>Firebase Activo</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(63,185,80,0.10)", color: "#3FB950" }}>◉</div>
          <div className="tabar-metric-label">Mi Cuenta</div>
          <div style={{ fontSize: "12px", color: "#8B949E", fontFamily: "var(--tb-mono)", wordBreak: "break-all", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || "—"}</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(88,166,255,0.10)", color: "#58A6FF" }}>▣</div>
          <div className="tabar-metric-label">Red</div>
          <div style={{ fontSize: "13px", color: "#58A6FF" }}>Firestore</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(188,140,255,0.10)", color: "#BC8CFF" }}>△</div>
          <div className="tabar-metric-label">Rol activo</div>
          <div style={{ fontSize: "13px", color: C.accent }}>Fideicomiso / Admin</div>
        </div>
      </div>

      <div className="tabar-section">
        <CampaignStats />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Acciones administrativas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/admin/control" glyph="▣" title="Control del sistema" desc="Deploy, gestión de wallets autorizadas, emisión de producción" color={C.accent} bg={C.dim} />
          <ActionCard to="/campaign" glyph="◉" title="Estado de campaña" desc="Progreso del financiamiento, métricas y distribución" color={C.accent} bg={C.dim} />
          <div className="tabar-action-card" style={{ opacity: 0.5, cursor: "default" }}>
            <div className="tabar-action-icon" style={{ background: "rgba(255,255,255,0.04)", color: "#484F58" }}>◇</div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#484F58" }}>Auditoría</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#484F58", lineHeight: 1.5 }}>Próximamente: historial de transacciones y logs del contrato</p>
          </div>
        </div>
      </div>
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
