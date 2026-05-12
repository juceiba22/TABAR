import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

export default function StateInvest() {
  const { user } = useRole();
  const { invertirState } = useData();
  const [monto, setMonto] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tokensEstimados = monto ? parseInt(monto) : 0;
  const rendimientoAnual = (tokensEstimados * 0.085).toFixed(1);
  const kgEquivalente = tokensEstimados * 200;

  const handleConfirm = () => setStep("confirm");
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const res = await invertirState(parseInt(monto));
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
          <h1>Invertir vía FET</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Participación institucional en la campaña TABAR</p>
      </div>

      {step === "form" && (
        <div className="tabar-layout-sidebar">
          <div>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Nueva inversión FET</h3>
              <InfoRow label="Entidad" value="Fondo Especial del Tabaco" />
              <InfoRow label="Tasa de rendimiento" value="8.5% anual garantizado" valueColor="#3FB950" />
              <InfoRow label="Plazo" value="Duración de campaña" />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "16px 0" }} />
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Monto en TABAR</label>
              <input type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 1000" className="tabar-input" />
              {tokensEstimados > 0 && (
                <div className="tabar-calc-box">
                  <CalcRow label="TABAR a adquirir" value={`${tokensEstimados.toLocaleString("es-AR")}`} />
                  <CalcRow label="Producción equivalente" value={`${(kgEquivalente / 1000).toFixed(1)} ton`} />
                  <CalcRow label="Rendimiento estimado (anual)" value={`${rendimientoAnual} TABAR`} highlight />
                </div>
              )}
              <button onClick={handleConfirm} disabled={!monto || parseInt(monto) <= 0}
                className="tabar-btn tabar-btn-primary tabar-btn-full"
                style={{ marginTop: "16px", background: C.accent, borderColor: C.accent, color: "#080C10" }}>
                Solicitar inversión
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Beneficios FET</h3>
              <StepInfo n="1" text="Rendimiento anual del 8.5% garantizado por contrato" color={C.accent} bg={C.dim} />
              <StepInfo n="2" text="Respaldo directo en producción tabacalera real" color={C.accent} bg={C.dim} />
              <StepInfo n="3" text="Trazabilidad completa vía blockchain" color={C.accent} bg={C.dim} />
              <StepInfo n="4" text="Liquidez al cierre de campaña" color={C.accent} bg={C.dim} />
            </div>
            <div className="tabar-notice">
              Inversión sujeta a aprobación del fideicomiso TABAR. El rendimiento del 8.5% es anualizado y se aplica sobre la duración efectiva de la campaña.
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Confirmá tu inversión</h3>
          <InfoRow label="TABAR a adquirir" value={`${tokensEstimados.toLocaleString("es-AR")}`} />
          <InfoRow label="Producción equivalente" value={`${(kgEquivalente / 1000).toFixed(1)} ton`} />
          <InfoRow label="Rendimiento anual estimado" value={`${rendimientoAnual} TABAR`} valueColor="#3FB950" />
          {error && <div className="tabar-notice" style={{ color: "#F85149", borderColor: "rgba(248,81,73,0.3)", marginTop: "16px" }}>{error}</div>}
          <div className="tabar-btn-row" style={{ marginTop: "20px" }}>
            <button onClick={handleSubmit} disabled={loading} className="tabar-btn tabar-btn-primary tabar-btn-full" style={{ background: C.accent, borderColor: C.accent, color: "#080C10" }}>
              {loading ? "Procesando..." : "Confirmar inversión"}
            </button>
            <button onClick={() => setStep("form")} disabled={loading} className="tabar-btn tabar-btn-ghost">Volver</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="tabar-done-box">
          <div className="tabar-done-icon" style={{ color: "#3FB950" }}>✓</div>
          <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>Inversión registrada</h2>
          <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
            Se registró tu inversión FET de {tokensEstimados.toLocaleString("es-AR")} TABAR. Pendiente de aprobación.
          </p>
          <button onClick={() => { setStep("form"); setMonto(""); }} className="tabar-btn tabar-btn-secondary">
            Nueva inversión
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
