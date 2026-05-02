import { useRole } from "../../modules/roles/RoleContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";
import { useRequests } from "../../modules/requests/RequestContext";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function AdminDashboard() {
  const { contractAddress, walletAddress } = useRole();
  const { requests, updateRequestStatus, addRequest } = useRequests();
  const myRequests = requests.filter(r => r.to_role === "admin");

  const handleAprobar = (id) => {
    updateRequestStatus(id, "approved");
    addRequest("admin", "dealer", "AsignacionDealer", { desc: "Tokens aprobados para mercado" });
  };

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
          <h1>Panel de Administración — Fideicomiso</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Acceso completo al sistema. Las acciones tienen efecto directo en el contrato TABAR.</p>
      </div>

      {!contractAddress && (
        <div className="tabar-notice">
          No hay contrato conectado. Ingresá la dirección del contrato desde la pantalla inicial para operar con datos reales.
        </div>
      )}

      <div className="tabar-grid-4" style={{ marginBottom: "20px" }}>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
          <div className="tabar-metric-label">Contrato</div>
          <div style={{ fontSize: "13px", color: contractAddress ? "#3FB950" : "#484F58" }}>{contractAddress ? "Conectado" : "Sin deployar"}</div>
          {contractAddress && <div style={{ fontSize: "11px", color: "#484F58", fontFamily: "var(--tb-mono)", marginTop: "4px", wordBreak: "break-all" }}>{contractAddress.slice(0, 14)}...</div>}
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(63,185,80,0.10)", color: "#3FB950" }}>◉</div>
          <div className="tabar-metric-label">Mi Wallet</div>
          <div style={{ fontSize: "12px", color: "#8B949E", fontFamily: "var(--tb-mono)", wordBreak: "break-all" }}>{walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}` : "—"}</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(88,166,255,0.10)", color: "#58A6FF" }}>▣</div>
          <div className="tabar-metric-label">Red</div>
          <div style={{ fontSize: "13px", color: "#58A6FF" }}>Hardhat Local</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-icon" style={{ background: "rgba(188,140,255,0.10)", color: "#BC8CFF" }}>△</div>
          <div className="tabar-metric-label">Rol activo</div>
          <div style={{ fontSize: "13px", color: C.accent }}>Fideicomiso / Admin</div>
        </div>
      </div>

      <div className="tabar-section">
        <CampaignStats contractAddress={contractAddress} />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Flujo de Trabajo (Workflow)</h3>
        <div className="tabar-card" style={{ marginBottom: "20px", background: "#0D1117", border: "1px solid #30363D" }}>
          <h4 style={{ margin: "0 0 16px", color: "#F0F6FC" }}>Bandeja Fideicomiso</h4>
          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead><tr><th>ID</th><th>De</th><th>Tipo</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {myRequests.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "#8B949E" }}>No hay requests pendientes</td></tr>
                )}
                {myRequests.map(r => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.from_role}</td>
                    <td>{r.type}</td>
                    <td><span style={{ color: r.status === 'pending' ? '#E3B64F' : '#3FB950' }}>{r.status.toUpperCase()}</span></td>
                    <td>
                      {r.status === 'pending' && (
                        <button onClick={() => handleAprobar(r.id)} className="tabar-btn tabar-btn-primary" style={{ padding: "4px 8px", fontSize: "11px" }}>Aprobar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
