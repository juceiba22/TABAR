import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext.jsx";

const C = { accent: "#BC8CFF", dim: "rgba(188,140,255,0.10)" };

export default function DealerMarkets() {
  const { contractAddress } = useRole();
  const [tab, setTab] = useState("overview");

  const marketData = [
    { par: "TABAR/USD", last: "93.20", chg: "+1.8%", vol: "12,450", up: true },
    { par: "TABAR/ARS", last: "111,840", chg: "+2.1%", vol: "8,320", up: true },
    { par: "TABAR/FET", last: "1.085", chg: "-0.3%", vol: "3,200", up: false },
    { par: "TABAR/ETH", last: "0.0289", chg: "+0.5%", vol: "1,800", up: true },
  ];

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
          <h1>Mercados</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Precios, spreads y oportunidades de arbitraje</p>
      </div>

      <div className="tabar-tabs">
        <button className="tabar-tab" style={tab === "overview" ? { borderColor: C.accent, color: C.accent } : {}} onClick={() => setTab("overview")}>Resumen</button>
        <button className="tabar-tab" style={tab === "depth" ? { borderColor: C.accent, color: C.accent } : {}} onClick={() => setTab("depth")}>Profundidad</button>
        <button className="tabar-tab" style={tab === "history" ? { borderColor: C.accent, color: C.accent } : {}} onClick={() => setTab("history")}>Historial</button>
      </div>

      {tab === "overview" && (
        <>
          <div className="tabar-grid-4" style={{ marginBottom: "20px" }}>
            <div className="tabar-metric-card">
              <div className="tabar-metric-label">Precio spot</div>
              <div className="tabar-metric-value" style={{ color: "#E3B64F" }}>USD 93.20</div>
              <div style={{ fontSize: "11px", color: "#3FB950", marginTop: "4px" }}>+1.8% 24h</div>
            </div>
            <div className="tabar-metric-card">
              <div className="tabar-metric-label">Volumen 24h</div>
              <div className="tabar-metric-value" style={{ color: "#58A6FF" }}>12.4k</div>
              <div className="tabar-metric-unit">TABAR operados</div>
            </div>
            <div className="tabar-metric-card">
              <div className="tabar-metric-label">Spread promedio</div>
              <div className="tabar-metric-value" style={{ color: C.accent }}>2.7%</div>
              <div className="tabar-metric-unit">bid/ask</div>
            </div>
            <div className="tabar-metric-card">
              <div className="tabar-metric-label">Operaciones hoy</div>
              <div className="tabar-metric-value" style={{ color: "#F0F6FC" }}>47</div>
              <div className="tabar-metric-unit">trades cerrados</div>
            </div>
          </div>

          <div className="tabar-card">
            <h3 className="tabar-card-title">Pares de mercado</h3>
            <div className="tabar-table-wrap">
              <table className="tabar-table">
                <thead><tr>
                  <th>Par</th><th>Último</th><th>Cambio 24h</th><th>Volumen</th>
                </tr></thead>
                <tbody>
                  {marketData.map((m) => (
                    <tr key={m.par}>
                      <td style={{ color: "#F0F6FC", fontWeight: 500 }}>{m.par}</td>
                      <td className="mono">{m.last}</td>
                      <td style={{ color: m.up ? "#3FB950" : "#F85149", fontFamily: "var(--tb-mono)", fontSize: "12px" }}>{m.chg}</td>
                      <td className="mono">{m.vol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "depth" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Profundidad de mercado</h3>
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ color: "#3FB950", fontSize: "11px", margin: "0 0 8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Demanda (Bids)</h4>
            <DepthBar price="92.0" qty="350" pct={85} color="#3FB950" bg="rgba(63,185,80,0.08)" />
            <DepthBar price="91.5" qty="200" pct={49} color="#3FB950" bg="rgba(63,185,80,0.08)" />
            <DepthBar price="91.0" qty="180" pct={44} color="#3FB950" bg="rgba(63,185,80,0.08)" />
            <DepthBar price="90.5" qty="120" pct={29} color="#3FB950" bg="rgba(63,185,80,0.08)" />
          </div>
          <div>
            <h4 style={{ color: "#F85149", fontSize: "11px", margin: "0 0 8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>Oferta (Asks)</h4>
            <DepthBar price="94.5" qty="420" pct={100} color="#F85149" bg="rgba(248,81,73,0.08)" />
            <DepthBar price="95.0" qty="280" pct={67} color="#F85149" bg="rgba(248,81,73,0.08)" />
            <DepthBar price="95.5" qty="150" pct={36} color="#F85149" bg="rgba(248,81,73,0.08)" />
            <DepthBar price="96.0" qty="90" pct={21} color="#F85149" bg="rgba(248,81,73,0.08)" />
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Últimas operaciones</h3>
          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead><tr>
                <th>Hora</th><th>Tipo</th><th>Cantidad</th><th>Precio</th>
              </tr></thead>
              <tbody>
                <HistoryRow time="23:14" type="Compra" qty="85" price="92.5" />
                <HistoryRow time="23:08" type="Venta" qty="200" price="94.0" />
                <HistoryRow time="22:55" type="Compra" qty="50" price="91.8" />
                <HistoryRow time="22:41" type="Compra" qty="120" price="92.0" />
                <HistoryRow time="22:30" type="Venta" qty="75" price="93.5" />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DepthBar({ price, qty, pct, color, bg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", fontSize: "12px", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: bg, borderRadius: "3px", zIndex: 0 }} />
      <span style={{ zIndex: 1, minWidth: "60px", fontFamily: "var(--tb-mono)", color }}>{price}</span>
      <span style={{ zIndex: 1, flex: 1, textAlign: "right", fontFamily: "var(--tb-mono)", color: "#8B949E" }}>{qty}</span>
    </div>
  );
}

function HistoryRow({ time, type, qty, price }) {
  const isBuy = type === "Compra";
  return (
    <tr>
      <td className="mono">{time}</td>
      <td><span className="tabar-badge" style={{ background: isBuy ? "rgba(63,185,80,0.10)" : "rgba(248,81,73,0.10)", color: isBuy ? "#3FB950" : "#F85149" }}>{type}</span></td>
      <td className="mono">{qty}</td>
      <td className="mono">USD {price}</td>
    </tr>
  );
}
