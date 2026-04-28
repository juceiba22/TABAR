import { useDemo } from "../roles/DemoContext";

export default function CampaignStats() {
  const { campana } = useDemo();

  const { activa, fardosTotales, fardosVendidos, fardosDisponibles } = campana;
  const pct = fardosTotales > 0 ? ((fardosVendidos / fardosTotales) * 100).toFixed(1) : "0";

  if (!activa && fardosTotales === 0) {
    return (
      <div className="tabar-card" style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ fontSize: "20px", color: "#484F58", marginBottom: "10px" }}>◈</div>
        <h3 style={{ margin: "0 0 6px", fontSize: "14px", color: "#8B949E" }}>Sin campaña activa</h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#484F58" }}>
          El Admin debe iniciar una campaña desde Panel → Control del Sistema
        </p>
      </div>
    );
  }

  return (
    <div className="tabar-campaign-hero">
      <div className="tabar-campaign-hero-top">
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", color: "#8B949E", fontWeight: 500 }}>
            Progreso de Campaña
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activa ? "#3FB950" : "#F85149" }} />
            <span style={{ fontSize: "12px", color: activa ? "#3FB950" : "#F85149" }}>
              {activa ? "Activa" : "Cerrada"}
            </span>
          </div>
        </div>
        <div className="tabar-hero-pct">{pct}%</div>
      </div>

      <div style={{ background: "#1C2330", borderRadius: "4px", height: "6px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ background: "#E3B64F", height: "100%", borderRadius: "4px", width: `${pct}%`, transition: "width 0.5s" }} />
      </div>

      <div className="tabar-stat-grid">
        <StatItem label="Fardos totales"  value={fardosTotales.toLocaleString("es-AR")}   color="#F0F6FC" />
        <StatItem label="Vendidos"        value={fardosVendidos.toLocaleString("es-AR")}  color="#E3B64F" />
        <StatItem label="Disponibles"     value={fardosDisponibles.toLocaleString("es-AR")} color="#3FB950" />
      </div>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#484F58", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 600, color, fontFamily: "var(--tb-mono)", letterSpacing: "-0.5px" }}>
        {value}
      </div>
    </div>
  );
}
