import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";

const C = { accent: "#BC8CFF", dim: "rgba(188,140,255,0.10)" };

export default function DealerTrade() {
  const { user } = useRole();
  const { operarDealer } = useData();
  const [tab, setTab] = useState("buy");
  const [cantidad, setCantidad] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const precioCompra = 92;
  const precioVenta = 94.5;
  const spread = precioVenta - precioCompra;
  const total = cantidad ? parseInt(cantidad) * (tab === "buy" ? precioCompra : precioVenta) : 0;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const res = await operarDealer(tab === "buy" ? "buy" : "sell", parseInt(cantidad));
    setLoading(false);
    if (res.ok) {
      setStep("done");
    } else {
      setError(res.error);
    }
  };

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Operar TABAR</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Mercado secundario de fardos digitales</p>
      </div>

      <div className="tabar-price-banner">
        <PriceItem label="Precio compra" value={`USD ${precioCompra}`} color="#3FB950" />
        <PriceItem label="Precio venta" value={`USD ${precioVenta}`} color="#F85149" />
        <PriceItem label="Spread" value={`USD ${spread.toFixed(1)}`} color="#E3B64F" />
        <PriceItem label="Volumen 24h" value="1,240" color="#58A6FF" />
      </div>

      {step === "form" && (
        <div className="tabar-layout-sidebar">
          <div>
            <div className="tabar-card">
              <div className="tabar-tabs">
                <button className="tabar-tab" style={tab === "buy" ? { borderColor: "#3FB950", color: "#3FB950" } : {}} onClick={() => setTab("buy")}>Comprar</button>
                <button className="tabar-tab" style={tab === "sell" ? { borderColor: "#F85149", color: "#F85149" } : {}} onClick={() => setTab("sell")}>Vender</button>
              </div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>
                Cantidad de TABAR a {tab === "buy" ? "comprar" : "vender"}
              </label>
              <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 100" className="tabar-input" />
              {cantidad && parseInt(cantidad) > 0 && (
                <div className="tabar-calc-box">
                  <CalcRow label="Cantidad" value={`${parseInt(cantidad).toLocaleString("es-AR")} TABAR`} />
                  <CalcRow label={tab === "buy" ? "Precio compra" : "Precio venta"} value={`USD ${tab === "buy" ? precioCompra : precioVenta}/u`} />
                  <CalcRow label="Total" value={`USD ${total.toLocaleString("es-AR")}`} highlight />
                </div>
              )}
              {error && <div className="tabar-notice" style={{ color: "#F85149", borderColor: "rgba(248,81,73,0.3)", marginTop: "16px" }}>{error}</div>}
              <button onClick={handleSubmit} disabled={!cantidad || parseInt(cantidad) <= 0 || loading}
                className="tabar-btn tabar-btn-primary tabar-btn-full"
                style={{ marginTop: "16px", background: tab === "buy" ? "#3FB950" : "#F85149", borderColor: tab === "buy" ? "#3FB950" : "#F85149", color: "#080C10" }}>
                {loading ? "Procesando..." : (tab === "buy" ? "Confirmar compra" : "Confirmar venta")}
              </button>
            </div>
          </div>
          <div>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Libro de órdenes</h3>
              <OrderRow side="bid" price="92.0" qty="350" pct={80} />
              <OrderRow side="bid" price="91.5" qty="200" pct={46} />
              <OrderRow side="bid" price="91.0" qty="180" pct={41} />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "8px 0" }} />
              <OrderRow side="ask" price="94.5" qty="420" pct={96} />
              <OrderRow side="ask" price="95.0" qty="280" pct={64} />
              <OrderRow side="ask" price="95.5" qty="150" pct={34} />
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="tabar-done-box">
          <div className="tabar-done-icon" style={{ color: "#3FB950" }}>✓</div>
          <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>
            {tab === "buy" ? "Compra ejecutada" : "Venta ejecutada"}
          </h2>
          <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
            {tab === "buy" ? "Compraste" : "Vendiste"} {parseInt(cantidad).toLocaleString("es-AR")} TABAR por USD {total.toLocaleString("es-AR")}
          </p>
          <button onClick={() => { setStep("form"); setCantidad(""); }} className="tabar-btn tabar-btn-secondary">
            Nueva operación
          </button>
        </div>
      )}
    </div>
  );
}

function PriceItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#484F58", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 600, color, fontFamily: "var(--tb-mono)" }}>{value}</div>
    </div>
  );
}

function CalcRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", flexWrap: "wrap", gap: "4px" }}>
      <span style={{ fontSize: "12px", color: "#484F58" }}>{label}</span>
      <span style={{ fontSize: "13px", color: highlight ? "#E3B64F" : "#8B949E", fontWeight: highlight ? 600 : 400, fontFamily: highlight ? "var(--tb-mono)" : undefined }}>{value}</span>
    </div>
  );
}

function OrderRow({ side, price, qty, pct }) {
  const isBid = side === "bid";
  const color = isBid ? "#3FB950" : "#F85149";
  const bg = isBid ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.08)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", fontSize: "12px", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: bg, borderRadius: "3px", zIndex: 0 }} />
      <span style={{ zIndex: 1, minWidth: "60px", fontFamily: "var(--tb-mono)", color }}>{price}</span>
      <span style={{ zIndex: 1, flex: 1, textAlign: "right", fontFamily: "var(--tb-mono)", color: "#8B949E" }}>{qty}</span>
    </div>
  );
}
