import { useEffect, useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar, CUENTAS, ROL_A_CUENTA } from "../../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";
import { useRequests } from "../../modules/requests/RequestContext";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

export default function StateDashboard() {
  const { contractAddress } = useRole();
  const { leerBalance } = useTabar(contractAddress);
  const [myBalance, setMyBalance] = useState(0);
  const { requests, updateRequestStatus } = useRequests();
  const myRequests = requests.filter(r => r.to_role === "state");

  const handleAprobarCierre = (id) => {
    updateRequestStatus(id, "approved");
  };

  const myPK = CUENTAS[ROL_A_CUENTA["state"]];
  const myAccount = privateKeyToAccount(myPK);

  useEffect(() => {
    if (!contractAddress) return;
    leerBalance(contractAddress, myAccount.address).then((b) => {
      if (b !== null) setMyBalance(b);
    });
  }, [contractAddress]);

  const tasa = 8.5;
  const rendimiento = myBalance * 0.085;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◉</div>
          <h1>Mi Dashboard — Estado Nacional</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Resumen de tu participación institucional vía Fondo Especial del Tabaco</p>
      </div>

      <div className="tabar-grid-4">
        <MetricCard label="Inversión FET" value={myBalance.toLocaleString("es-AR")} unit="TABAR adquiridos" color={C.accent} bg={C.dim} glyph="◉" />
        <MetricCard label="Rendimiento estimado" value={rendimiento.toFixed(1)} unit={`TABAR (${tasa}% anual)`} color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="△" />
        <MetricCard label="Tasa garantizada" value={`${tasa}%`} unit="rendimiento anual" color="#E3B64F" bg="rgba(227,182,79,0.10)" glyph="▽" />
        <MetricCard label="Estado participación" value={myBalance > 0 ? "Activa" : "Sin inversión"} unit="" color={myBalance > 0 ? "#3FB950" : "#484F58"} bg={myBalance > 0 ? "rgba(63,185,80,0.10)" : "rgba(255,255,255,0.04)"} glyph="◈" />
      </div>

      <div className="tabar-section">
        <CampaignStats contractAddress={contractAddress} />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Flujo de Trabajo (Workflow)</h3>
        <div className="tabar-card" style={{ marginBottom: "20px", background: "#0D1117", border: "1px solid #30363D" }}>
          <h4 style={{ margin: "0 0 16px", color: "#F0F6FC" }}>Bandeja Estado Nacional</h4>
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
                        <button onClick={() => handleAprobarCierre(r.id)} className="tabar-btn tabar-btn-primary" style={{ padding: "4px 8px", fontSize: "11px" }}>Aprobar Cierre</button>
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
        <h3 className="tabar-section-label">Acciones rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/state/invest" glyph="▣" title="Invertir vía FET" desc="Participar en la campaña TABAR con fondos del Fondo Especial del Tabaco" color={C.accent} bg={C.dim} />
          <ActionCard to="/state/returns" glyph="△" title="Mis rendimientos" desc="Detalle de rendimiento acumulado y proyección de retorno" color={C.accent} bg={C.dim} />
          <ActionCard to="/campaign" glyph="◈" title="Estado de campaña" desc="Progreso general del financiamiento tabacalero" color={C.accent} bg={C.dim} />
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
