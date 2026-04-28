import { useEffect, useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar, CUENTAS, ROL_A_CUENTA } from "../../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

export default function StateReturns() {
  const { contractAddress } = useRole();
  const { leerBalance } = useTabar(contractAddress);
  const [myBalance, setMyBalance] = useState(0);

  const myPK = CUENTAS[ROL_A_CUENTA["state"]];
  const myAccount = privateKeyToAccount(myPK);

  useEffect(() => {
    if (!contractAddress) return;
    leerBalance(contractAddress, myAccount.address).then((b) => {
      if (b !== null) setMyBalance(b);
    });
  }, [contractAddress]);

  const TASA = 8.5;
  const rendimiento = (myBalance * TASA) / 100;
  const totalConRendimiento = myBalance + rendimiento;
  const kgEquivOriginal = myBalance * 200;
  const kgEquivTotal = totalConRendimiento * 200;
  const diasTranscurridos = 47;
  const diasTotales = 180;
  const rendDevengado = (rendimiento * diasTranscurridos) / diasTotales;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>△</div>
          <h1>Mis Rendimientos</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Proyección y detalle de rendimiento sobre tu inversión FET</p>
      </div>

      {!contractAddress && <div className="tabar-notice">Conectate a un contrato para ver rendimientos reales.</div>}

      <div className="tabar-summary-grid">
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Inversión original</div>
          <div className="tabar-metric-value" style={{ color: C.accent }}>{myBalance.toLocaleString("es-AR")}</div>
          <div className="tabar-metric-unit">TABAR</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Rendimiento estimado</div>
          <div className="tabar-metric-value" style={{ color: "#3FB950" }}>+{rendimiento.toFixed(1)}</div>
          <div className="tabar-metric-unit">TABAR ({TASA}% anual)</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Total al cierre</div>
          <div className="tabar-metric-value" style={{ color: "#E3B64F" }}>{totalConRendimiento.toFixed(1)}</div>
          <div className="tabar-metric-unit">TABAR proyectado</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Devengado a hoy</div>
          <div className="tabar-metric-value" style={{ color: "#58A6FF" }}>+{rendDevengado.toFixed(2)}</div>
          <div className="tabar-metric-unit">TABAR ({diasTranscurridos}/{diasTotales} días)</div>
        </div>
      </div>

      <div className="tabar-card" style={{ marginBottom: "16px" }}>
        <h3 className="tabar-card-title">Progreso de campaña</h3>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
          <span style={{ color: "#484F58" }}>Día {diasTranscurridos} de {diasTotales}</span>
          <span style={{ color: C.accent }}>{((diasTranscurridos / diasTotales) * 100).toFixed(1)}%</span>
        </div>
        <div style={{ background: "#1C2330", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
          <div style={{ background: C.accent, height: "100%", borderRadius: "4px", width: `${(diasTranscurridos / diasTotales) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <div className="tabar-card">
        <h3 className="tabar-card-title">Desglose de rendimiento</h3>
        <div className="tabar-table-wrap">
          <table className="tabar-table">
            <thead><tr>
              <th>Concepto</th><th>TABAR</th><th>Equivalente</th>
            </tr></thead>
            <tbody>
              <tr>
                <td>Inversión original</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#F0F6FC" }}>{myBalance.toLocaleString("es-AR")}</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#8B949E" }}>{(kgEquivOriginal / 1000).toFixed(1)} ton</td>
              </tr>
              <tr>
                <td>Rendimiento ({TASA}%)</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#3FB950" }}>+{rendimiento.toFixed(1)}</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#3FB950" }}>+{((rendimiento * 200) / 1000).toFixed(2)} ton</td>
              </tr>
              <tr>
                <td style={{ color: "#E3B64F", fontWeight: 500 }}>Total proyectado</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#E3B64F", fontWeight: 600 }}>{totalConRendimiento.toFixed(1)}</td>
                <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: "#E3B64F" }}>{(kgEquivTotal / 1000).toFixed(2)} ton</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
