import { useData } from "../roles/DataContext";

export default function CampaignStats() {
  const { campana } = useData();

  const { activa, fardosTotales, fardosVendidos, fardosDisponibles } = campana;
  const pct = fardosTotales > 0 ? ((fardosVendidos / fardosTotales) * 100).toFixed(1) : "0";

  if (!activa && fardosTotales === 0) {
    return (
      <div className="tabar-card" style={{ textAlign: "center", padding: "28px 20px" }}>
        <div style={{ fontSize: "24px", color: "var(--tb-text-3)", marginBottom: "8px" }}>🌾</div>
        <h3 style={{ margin: "0 0 4px", fontFamily: "var(--tb-serif)", fontSize: "16px", color: "var(--tb-accent)" }}>Sin Campaña Activa</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--tb-text-2)" }}>
          El Administrador / Fideicomiso debe iniciar una nueva campaña desde Panel → Control del Sistema
        </p>
      </div>
    );
  }

  return (
    <div className="tabar-card" style={{ background: "#ffffff", border: "1px solid var(--tb-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontFamily: "var(--tb-serif)", fontSize: "17px", color: "var(--tb-accent)", fontWeight: 700 }}>
            Evolución de Campaña Agrícola
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activa ? "var(--tb-green)" : "var(--tb-red)" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: activa ? "var(--tb-green)" : "var(--tb-red)", fontFamily: "var(--tb-mono)" }}>
              {activa ? "CAMPAÑA EN CURSO · LEY 9.643" : "CAMPAÑA CERRADA"}
            </span>
          </div>
        </div>
        <div style={{ fontFamily: "var(--tb-serif)", fontSize: "26px", fontWeight: 700, color: "var(--tb-accent)" }}>
          {pct}%
        </div>
      </div>

      <div style={{ background: "var(--tb-surface-2)", borderRadius: "4px", height: "8px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ background: "var(--tb-secondary)", height: "100%", borderRadius: "4px", width: `${pct}%`, transition: "width 0.5s ease" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", borderTop: "1px solid var(--tb-border)", paddingTop: "16px" }}>
        <StatItem label="Fardos Totales" value={fardosTotales.toLocaleString("es-AR")} color="var(--tb-accent)" />
        <StatItem label="Colateralizados / Vendidos" value={fardosVendidos.toLocaleString("es-AR")} color="var(--tb-secondary)" />
        <StatItem label="Disponibles en Silo" value={fardosDisponibles.toLocaleString("es-AR")} color="var(--tb-green)" />
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--tb-text-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "var(--tb-serif)" }}>
        {value}
      </div>
    </div>
  );
}
