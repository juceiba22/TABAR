import { useEffect, useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar, CUENTAS, ROL_A_CUENTA } from "../../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#BC8CFF", dim: "rgba(188,140,255,0.10)" };

export default function DealerDashboard() {
  const { contractAddress } = useRole();
  const { leerBalance } = useTabar(contractAddress);
  const [myBalance, setMyBalance] = useState(0);

  const myPK = CUENTAS[ROL_A_CUENTA["dealer"]];
  const myAccount = privateKeyToAccount(myPK);

  useEffect(() => {
    if (!contractAddress) return;
    leerBalance(contractAddress, myAccount.address).then((b) => {
      if (b !== null) setMyBalance(b);
    });
  }, [contractAddress]);

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◇</div>
          <h1>Mi Dashboard — Dealer</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Mercado secundario y oportunidades de posición TABAR</p>
      </div>

      <div className="tabar-grid-4">
        <MetricCard label="Mi Tenencia" value={myBalance.toLocaleString("es-AR")} unit="TABAR" color={C.accent} bg={C.dim} glyph="◇" />
        <MetricCard label="P&L estimado" value={myBalance > 0 ? `+${(myBalance * 2.3).toFixed(0)}` : "0"} unit="USD (spread)" color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="△" />
        <MetricCard label="Operaciones hoy" value="0" unit="trades ejecutados" color="#58A6FF" bg="rgba(88,166,255,0.10)" glyph="▣" />
        <MetricCard label="Estado" value={myBalance > 0 ? "Posicionado" : "Sin posición"} unit="" color={myBalance > 0 ? "#3FB950" : "#484F58"} bg={myBalance > 0 ? "rgba(63,185,80,0.10)" : "rgba(255,255,255,0.04)"} glyph="◉" />
      </div>

      <div className="tabar-section">
        <CampaignStats contractAddress={contractAddress} />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Acciones rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/dealer/trade" glyph="▣" title="Operar TABAR" desc="Comprar y vender fardos digitales en el mercado secundario" color={C.accent} bg={C.dim} />
          <ActionCard to="/dealer/markets" glyph="◈" title="Mercados" desc="Precios, spreads y oportunidades de arbitraje" color={C.accent} bg={C.dim} />
          <ActionCard to="/campaign" glyph="◉" title="Estado de campaña" desc="Progreso del financiamiento y disponibilidad" color={C.accent} bg={C.dim} />
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
