import { useEffect, useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar, CUENTAS, ROL_A_CUENTA } from "../../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)" };

export default function IndustryPosition() {
  const { contractAddress } = useRole();
  const { leerBalance } = useTabar(contractAddress);
  const [myBalance, setMyBalance] = useState(0);

  const myPK = CUENTAS[ROL_A_CUENTA["industry"]];
  const myAccount = privateKeyToAccount(myPK);

  useEffect(() => {
    if (!contractAddress) return;
    leerBalance(contractAddress, myAccount.address).then((b) => {
      if (b !== null) setMyBalance(b);
    });
  }, [contractAddress]);

  const KG_POR_FARDO = 200;
  const PRECIO_SPOT = 96.5;
  const DESCUENTO = 0.12;
  const PRECIO_TABAR = PRECIO_SPOT * (1 - DESCUENTO);
  const kgTotal = myBalance * KG_POR_FARDO;
  const valorSpot = myBalance * PRECIO_SPOT;
  const valorTABAR = myBalance * PRECIO_TABAR;
  const gananciaDesc = valorSpot - valorTABAR;

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◇</div>
          <h1>Mi Posición TABAR</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Detalle de tu tenencia y equivalentes de producción</p>
      </div>

      {!contractAddress && <div className="tabar-notice">Conectate a un contrato para ver tu posición real en tiempo real.</div>}

      <div className="tabar-grid-4">
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Fardos digitales</div>
          <div className="tabar-metric-value" style={{ color: C.accent }}>{myBalance.toLocaleString("es-AR")}</div>
          <div className="tabar-metric-unit">TABAR</div>
          <div style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>1 TABAR = 1 fardo</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Producción equivalente</div>
          <div className="tabar-metric-value" style={{ color: "#3FB950" }}>{(kgTotal / 1000).toFixed(2)}</div>
          <div className="tabar-metric-unit">toneladas</div>
          <div style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>{kgTotal.toLocaleString("es-AR")} kg tabaco</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Valor a precio TABAR</div>
          <div className="tabar-metric-value" style={{ color: "#E3B64F" }}>USD {valorTABAR.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>@ USD {PRECIO_TABAR.toFixed(1)}/fardo</div>
        </div>
        <div className="tabar-metric-card">
          <div className="tabar-metric-label">Ahorro vs. precio spot</div>
          <div className="tabar-metric-value" style={{ color: "#F0883E" }}>USD {gananciaDesc.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>12% de descuento garantizado</div>
        </div>
      </div>

      <div className="tabar-card" style={{ marginTop: "20px" }}>
        <h3 className="tabar-card-title">Detalle de posición</h3>
        <div className="tabar-table-wrap">
          <table className="tabar-table">
            <thead><tr>
              <th>Concepto</th><th>Cantidad</th><th>Valor (USD)</th>
            </tr></thead>
            <tbody>
              <TableRow label="TABAR en cartera" qty={`${myBalance} fardos`} val={`USD ${valorTABAR.toFixed(0)}`} />
              <TableRow label="Equivalente tabaco" qty={`${kgTotal.toLocaleString("es-AR")} kg`} val="—" />
              <TableRow label="Precio spot de referencia" qty={`USD ${PRECIO_SPOT}/fardo`} val={`USD ${valorSpot.toFixed(0)}`} />
              <TableRow label="Descuento obtenido" qty="12%" val={`USD ${gananciaDesc.toFixed(0)}`} highlight />
            </tbody>
          </table>
        </div>
      </div>

      <div className="tabar-wallet-box" style={{ marginTop: "16px" }}>
        <span style={{ color: "#484F58", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Wallet asociada</span>
        <span>{myAccount.address}</span>
      </div>
    </div>
  );
}

function TableRow({ label, qty, val, highlight }) {
  return (
    <tr>
      <td style={{ color: highlight ? "#E3B64F" : "#8B949E" }}>{label}</td>
      <td style={{ color: "#F0F6FC", fontFamily: "var(--tb-mono)", fontSize: "12px" }}>{qty}</td>
      <td style={{ color: highlight ? "#3FB950" : "#8B949E", fontWeight: highlight ? 600 : 400 }}>{val}</td>
    </tr>
  );
}
