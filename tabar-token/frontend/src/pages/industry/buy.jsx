import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)", border: "rgba(88,166,255,0.25)" };

export default function IndustryBuy() {
  const { contractAddress } = useRole();
  const [cantidad, setCantidad] = useState("");
  const [step, setStep] = useState("form");

  const kgEquivalente = cantidad ? parseInt(cantidad) * 200 : 0;
  const precioUnitario = 85;
  const totalUSD = cantidad ? parseInt(cantidad) * precioUnitario : 0;

  const handleConfirm = () => setStep("confirm");
  const handleSubmit = () => setStep("done");

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Comprar producción anticipada</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Adquirí fardos digitales TABAR con descuento garantizado</p>
      </div>

      {step === "form" && (
        <div className="tabar-layout-sidebar">
          <div>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Solicitud de adquisición</h3>
              <InfoRow label="Tipo de participante" value="Exportador / Industrial" />
              <InfoRow label="Descuento aplicado" value="12% sobre precio spot" valueColor="#3FB950" />
              <InfoRow label="Precio por fardo" value="USD 85 (precio con descuento)" />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "16px 0" }} />
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Cantidad de fardos digitales (TABAR)</label>
              <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 500" className="tabar-input" />
              {cantidad && parseInt(cantidad) > 0 && (
                <div className="tabar-calc-box">
                  <CalcRow label="Fardos solicitados" value={`${parseInt(cantidad).toLocaleString("es-AR")} TABAR`} />
                  <CalcRow label="Equivalente tabaco" value={`${(kgEquivalente / 1000).toFixed(1)}t (${kgEquivalente.toLocaleString("es-AR")} kg)`} />
                  <CalcRow label="Total aproximado" value={`USD ${totalUSD.toLocaleString("es-AR")}`} highlight />
                </div>
              )}
              <button onClick={handleConfirm} disabled={!cantidad || parseInt(cantidad) <= 0}
                className="tabar-btn tabar-btn-primary tabar-btn-full"
                style={{ marginTop: "16px", background: C.accent, borderColor: C.accent, color: "#080C10" }}>
                Solicitar compra anticipada
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Cómo funciona</h3>
              <StepInfo n="1" text="Ingresás la cantidad de fardos que querés adquirir" color={C.accent} bg={C.dim} />
              <StepInfo n="2" text="El fideicomiso TABAR revisa y autoriza tu solicitud" color={C.accent} bg={C.dim} />
              <StepInfo n="3" text="Los TABAR son transferidos a tu wallet autorizada" color={C.accent} bg={C.dim} />
              <StepInfo n="4" text="Al cierre de campaña, canjeás por tabaco físico o rendimiento" color={C.accent} bg={C.dim} />
            </div>
            <div className="tabar-notice">
              Esta es una solicitud sujeta a autorización del fideicomiso TABAR. El descuento del 12% está garantizado contractualmente sobre el precio FOB al cierre de campaña.
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Confirmá tu solicitud</h3>
          <div style={{ marginBottom: "20px" }}>
            <InfoRow label="Cantidad" value={`${parseInt(cantidad).toLocaleString("es-AR")} TABAR`} />
            <InfoRow label="Equivalente" value={`${(kgEquivalente/1000).toFixed(1)} toneladas de tabaco`} />
            <InfoRow label="Total estimado" value={`USD ${totalUSD.toLocaleString("es-AR")}`} valueColor="#E3B64F" />
          </div>
          <div className="tabar-btn-row">
            <button onClick={handleSubmit} className="tabar-btn tabar-btn-primary tabar-btn-full" style={{ background: C.accent, borderColor: C.accent, color: "#080C10" }}>Confirmar solicitud</button>
            <button onClick={() => setStep("form")} className="tabar-btn tabar-btn-ghost">Volver</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="tabar-done-box">
          <div className="tabar-done-icon" style={{ color: "#3FB950" }}>✓</div>
          <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>Solicitud enviada</h2>
          <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
            Tu solicitud de {parseInt(cantidad).toLocaleString("es-AR")} TABAR fue enviada al fideicomiso para autorización.
          </p>
          <button onClick={() => { setStep("form"); setCantidad(""); }} className="tabar-btn tabar-btn-secondary">
            Nueva solicitud
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: "4px" }}>
      <span style={{ fontSize: "12px", color: "#484F58" }}>{label}</span>
      <span style={{ fontSize: "12px", color: valueColor || "#8B949E", fontWeight: 500 }}>{value}</span>
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

function StepInfo({ n, text, color, bg }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
      <div style={{ minWidth: "24px", height: "24px", borderRadius: "6px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color, fontWeight: 600 }}>{n}</div>
      <span style={{ fontSize: "13px", color: "#8B949E", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
