import { useEffect, useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar, CUENTAS, ROL_A_CUENTA } from "../../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";
import { useRequests } from "../../modules/requests/RequestContext";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)" };

export default function IndustryDashboard() {
  const { contractAddress } = useRole();
  const { leerCampana, leerBalance } = useTabar(contractAddress);
  const [myBalance, setMyBalance] = useState(0);
  const { requests, addRequest } = useRequests();

  const handleCreateRequest = () => {
    addRequest("industry", "admin", "Financiamiento", { fardos: 5000, desc: "Solicitud de liquidez" });
    alert("Solicitud enviada a Fideicomiso");
  };

  const myPK = CUENTAS[ROL_A_CUENTA["industry"]];
  const myAccount = privateKeyToAccount(myPK);

  useEffect(() => {
    if (!contractAddress) return;
    leerCampana(contractAddress);
    leerBalance(contractAddress, myAccount.address).then((b) => {
      if (b !== null) setMyBalance(b);
    });
  }, [contractAddress]);

  const kgEquivalente = myBalance * 200;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>⬡</div>
          <h1>Mi Dashboard — Industria</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Resumen de tu posición en la campaña TABAR</p>
      </div>

      <div className="tabar-grid-4">
        <MetricCard label="Mi Tenencia TABAR" value={myBalance.toLocaleString("es-AR")} unit="fardos digitales" color={C.accent} bg={C.dim} glyph="◇" />
        <MetricCard label="Equivalente en producción" value={(kgEquivalente / 1000).toFixed(1) + "k"} unit="kg tabaco" color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="◈" />
        <MetricCard label="Descuento aplicado" value="12" unit="% sobre precio spot" color="#E3B64F" bg="rgba(227,182,79,0.10)" glyph="▽" />
        <MetricCard label="Estado" value={myBalance > 0 ? "Posicionado" : "Sin posición"} unit="" color={myBalance > 0 ? "#3FB950" : "#F0883E"} bg={myBalance > 0 ? "rgba(63,185,80,0.10)" : "rgba(240,136,62,0.10)"} glyph="◉" />
      </div>

      <div className="tabar-section">
        <CampaignStats contractAddress={contractAddress} />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Flujo de Trabajo (Workflow)</h3>
        <div className="tabar-card" style={{ marginBottom: "20px", background: "#0D1117", border: "1px solid #30363D" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ margin: 0, color: "#F0F6FC" }}>Bandeja Industria</h4>
            <button onClick={handleCreateRequest} className="tabar-btn tabar-btn-primary">
              Crear Solicitud Financiamiento
            </button>
          </div>
          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead><tr><th>ID</th><th>De</th><th>Tipo</th><th>Estado</th></tr></thead>
              <tbody>
                {requests.filter(r => r.to_role === "industry").length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: "center", color: "#8B949E" }}>No hay requests entrantes</td></tr>
                )}
                {requests.filter(r => r.to_role === "industry").map(r => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.from_role}</td>
                    <td>{r.type}</td>
                    <td><span style={{ color: r.status === 'pending' ? '#E3B64F' : '#3FB950' }}>{r.status.toUpperCase()}</span></td>
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
          <ActionCard to="/industry/buy" glyph="▣" title="Comprar producción anticipada" desc="Adquirí fardos digitales TABAR con descuento sobre precio de mercado" color={C.accent} bg={C.dim} />
          <ActionCard to="/industry/position" glyph="◇" title="Ver mi posición completa" desc="Detalle de adquisiciones, fechas y equivalentes en producción" color={C.accent} bg={C.dim} />
          <ActionCard to="/campaign" glyph="◈" title="Estado de la campaña" desc="Progreso general del financiamiento y disponibilidad de fardos" color={C.accent} bg={C.dim} />
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
