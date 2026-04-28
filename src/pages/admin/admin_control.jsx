import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useDemo } from "../../modules/roles/DemoContext";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function AdminControl() {
  const { contractAddress, setContractAddress } = useRole();
  const { campana, balances, historial, iniciarCampana, cerrarCampana, resetDemo } = useDemo();

  const [tab, setTab] = useState("campana");
  const [fardosTotales, setFardosTotales] = useState("10000");
  const [duracionDias, setDuracionDias] = useState("180");
  const [campanaStatus, setCampanaStatus] = useState("");

  const handleIniciarCampana = () => {
    const f = parseInt(fardosTotales);
    const d = parseInt(duracionDias);
    if (!f || !d) { setCampanaStatus("Ingresá valores válidos."); return; }
    iniciarCampana(f, d);
    setCampanaStatus("✅ Campaña iniciada");
  };

  const handleCerrarCampana = () => {
    cerrarCampana();
    setCampanaStatus("🔒 Campaña cerrada");
  };

  const TABS = [
    { id: "campana", label: "Campaña" },
    { id: "estado",  label: "Estado" },
    { id: "log",     label: "Log" },
  ];

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Control del Sistema</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>
          Gestión de la campaña TABAR
        </p>
      </div>

      <div className="tabar-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tabar-tab"
            style={tab === t.id ? { borderColor: C.accent, color: C.accent } : {}}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "campana" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Gestión de campaña</h3>

          {campana.activa && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", padding: "10px 14px", background: "rgba(63,185,80,0.08)", borderRadius: "6px", border: "1px solid rgba(63,185,80,0.2)" }}>
              <span style={{ color: "#3FB950", fontSize: "10px" }}>●</span>
              <span style={{ color: "#3FB950", fontSize: "13px" }}>
                Campaña activa — {campana.fardosDisponibles.toLocaleString("es-AR")} TABAR disponibles de {campana.fardosTotales.toLocaleString("es-AR")}
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>
                Fardos totales
              </label>
              <input
                type="number"
                value={fardosTotales}
                onChange={(e) => setFardosTotales(e.target.value)}
                disabled={campana.activa}
                className="tabar-input"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>
                Duración (días)
              </label>
              <input
                type="number"
                value={duracionDias}
                onChange={(e) => setDuracionDias(e.target.value)}
                disabled={campana.activa}
                className="tabar-input"
              />
            </div>
            <div className="tabar-btn-row">
              <button
                onClick={handleIniciarCampana}
                disabled={campana.activa}
                className="tabar-btn tabar-btn-primary"
              >
                Iniciar campaña
              </button>
              <button
                onClick={handleCerrarCampana}
                disabled={!campana.activa}
                className="tabar-btn tabar-btn-ghost"
                style={{ borderColor: "rgba(248,81,73,0.3)", color: "#F85149" }}
              >
                Cerrar campaña
              </button>
            </div>
            {campanaStatus && (
              <p style={{ fontSize: "12px", color: "#8B949E", margin: 0 }}>{campanaStatus}</p>
            )}
          </div>
        </div>
      )}

      {tab === "estado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="tabar-card">
            <h3 className="tabar-card-title">Estado de campaña</h3>
            <InfoRow label="Activa"           value={campana.activa ? "Sí" : "No"} valueColor={campana.activa ? "#3FB950" : "#F85149"} />
            <InfoRow label="Fardos totales"   value={campana.fardosTotales.toLocaleString("es-AR")} />
            <InfoRow label="Vendidos"         value={campana.fardosVendidos.toLocaleString("es-AR")} />
            <InfoRow label="Disponibles"      value={campana.fardosDisponibles.toLocaleString("es-AR")} />
          </div>

          <div className="tabar-card">
            <h3 className="tabar-card-title">Balances por participante</h3>
            <InfoRow label="Industria / Exportador" value={`${balances.industry.toLocaleString("es-AR")} TABAR`} />
            <InfoRow label="Estado Nacional (FET)"  value={`${balances.state.toLocaleString("es-AR")} TABAR`} />
            <InfoRow label="Dealer"                 value={`${balances.dealer.toLocaleString("es-AR")} TABAR`} />
          </div>

          <button onClick={resetDemo} className="tabar-btn tabar-btn-ghost" style={{ borderColor: "rgba(248,81,73,0.3)", color: "#F85149", alignSelf: "flex-start" }}>
            Resetear demo
          </button>
        </div>
      )}

      {tab === "log" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Log de actividad</h3>
          {historial.length === 0 ? (
            <p style={{ color: "#484F58", fontSize: "13px" }}>Sin actividad aún</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {historial.map((h) => (
                <div key={h.id} style={{ fontSize: "12px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#484F58", minWidth: "70px" }}>{h.hora}</span>
                  <span style={{ color: h.tipo === "success" ? "#3FB950" : h.tipo === "warning" ? "#E3B64F" : "#8B949E" }}>
                    {h.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
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
