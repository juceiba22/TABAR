import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";

const KG_POR_FARDO = 200;

export default function CampaignPage() {
  const { user } = useRole();
  const { campana } = useData();

  const pct = campana && campana.fardosTotales > 0
    ? Math.round((campana.fardosVendidos / campana.fardosTotales) * 100)
    : 0;

  const disponibles = campana?.fardosDisponibles || 0;
  const kgTotal     = (campana?.fardosTotales || 0) * KG_POR_FARDO;
  const kgDist      = (campana?.fardosVendidos || 0) * KG_POR_FARDO;

  const formatDate = (isoString) =>
    isoString ? new Date(isoString).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  // Días restantes
  const diasTotales = campana?.diasTotales || 180;
  let diasRestantes = 0;
  let finIso = null;
  if (campana?.inicio) {
    const inicioDate = new Date(campana.inicio);
    const finDate = new Date(inicioDate.getTime() + diasTotales * 24 * 60 * 60 * 1000);
    finIso = finDate.toISOString();
    const msDiff = finDate.getTime() - Date.now();
    diasRestantes = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  }

  return (
    <div>
      <PageHeader title="Estado de Campaña TABAR" desc="Progreso del financiamiento agroindustrial tabacalero" icon="🌿" color="#ccff66" />

      {/* Hero de progreso */}
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div>
            <div style={styles.heroLabel}>Progreso de financiamiento</div>
            <div style={styles.heroPct}>{pct}<span style={{ fontSize: "28px", color: "#88aa44" }}>%</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={styles.campanaStatus}>
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: campana?.activa ? "#44ff88" : "#ff6644",
                display: "inline-block", marginRight: "6px"
              }} />
              <span style={{ color: campana?.activa ? "#44ff88" : "#ff6644" }}>
                {campana?.activa ? "Campaña activa" : "Campaña no activa"}
              </span>
            </div>
            {campana?.activa && diasRestantes > 0 && (
              <div style={{ color: "#ff9944", fontSize: "14px", marginTop: "4px" }}>
                {diasRestantes} días restantes
              </div>
            )}
          </div>
        </div>

        {/* Barra grande */}
        <div style={styles.bigBarWrap}>
          <div style={{ ...styles.bigBar, width: `${pct}%` }} />
          {/* Marcas */}
          {[25, 50, 75].map(mark => (
            <div key={mark} style={{ ...styles.barMark, left: `${mark}%` }}>
              <div style={styles.barMarkLine} />
              <div style={styles.barMarkLabel}>{mark}%</div>
            </div>
          ))}
        </div>

        <div style={styles.bigBarLabels}>
          <span>{campana?.fardosVendidos || 0} TABAR distribuidos</span>
          <span>{campana?.fardosTotales || 0} TABAR totales</span>
        </div>
      </div>

      {/* Métricas */}
      <div style={styles.metricsGrid}>
        <MetricCard label="Total emitidos" value={(campana?.fardosTotales || 0).toLocaleString("es-AR")} unit="TABAR / fardos" color="#ccff66" icon="📦" />
        <MetricCard label="Distribuidos" value={(campana?.fardosVendidos || 0).toLocaleString("es-AR")} unit="TABAR" color="#44ff88" icon="✅" />
        <MetricCard label="Disponibles" value={disponibles.toLocaleString("es-AR")} unit="TABAR" color="#44aaff" icon="🔓" />
        <MetricCard label="Toneladas de tabaco" value={((kgTotal / 1000) || 0).toFixed(1)} unit="toneladas" color="#ff9944" icon="🌿" />
      </div>

      {/* Detalle campaña */}
      <div style={styles.detailGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Detalle de la campaña</h3>
          <DetailRow label="Estado" value={campana?.activa ? "🟢 Activa" : "🔴 Cerrada"} />
          <DetailRow label="Inicio" value={formatDate(campana?.inicio)} />
          <DetailRow label="Vencimiento" value={formatDate(finIso)} />
          <DetailRow label="Duración" value={`${diasTotales} días`} />
          <DetailRow label="Tokens emitidos" value={`${(campana?.fardosTotales || 0).toLocaleString("es-AR")} TABAR`} />
          <DetailRow label="Kg totales campaña" value={`${kgTotal.toLocaleString("es-AR")} kg`} />
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Distribución por tipo de participante</h3>
          <ParticipantRow label="Industria / Exportador" pct={45} color="#44aaff" />
          <ParticipantRow label="Estado Nacional (FET)" pct={30} color="#ff9944" />
          <ParticipantRow label="Dealers" pct={15} color="#cc44ff" />
          <ParticipantRow label="Disponible" pct={10} color="#2a4a2a" />
          <p style={{ fontSize: "11px", color: "#2a4a2a", margin: "12px 0 0" }}>
            * Distribución estimada — datos actualizados al cierre de campaña
          </p>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, desc, icon, color }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
        <h1 style={{ margin: 0, fontSize: "22px", color }}>{title}</h1>
      </div>
      <p style={{ margin: 0, color: "#88aa44", fontSize: "13px" }}>{desc}</p>
    </div>
  );
}

function MetricCard({ label, value, unit, color, icon }) {
  return (
    <div style={styles.metricCard}>
      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "10px", color: "#4a6a2a", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: "700", lineHeight: 1.1, color }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#88aa44" }}>{unit}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0f2a0f" }}>
      <span style={{ fontSize: "12px", color: "#4a6a2a" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#ccff66" }}>{value}</span>
    </div>
  );
}

function ParticipantRow({ label, pct, color }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "#88aa44" }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontWeight: "600" }}>{pct}%</span>
      </div>
      <div style={{ height: "4px", background: "#0a1a0a", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

const styles = {
  notice: { background: "rgba(255,153,68,0.08)", border: "1px solid rgba(255,153,68,0.3)", borderRadius: "8px", padding: "14px 18px", fontSize: "13px", color: "#ff9944", marginBottom: "20px" },
  heroCard: { background: "#0f1f0f", border: "1px solid #2a4a2a", borderRadius: "12px", padding: "28px", marginBottom: "20px" },
  heroTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  heroLabel: { fontSize: "12px", color: "#4a6a2a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" },
  heroPct: { fontSize: "56px", fontWeight: "800", color: "#ccff66", lineHeight: 1 },
  campanaStatus: { display: "flex", alignItems: "center", fontSize: "13px" },
  bigBarWrap: { position: "relative", height: "14px", background: "#0a1a0a", borderRadius: "7px", overflow: "visible", marginBottom: "6px" },
  bigBar: { height: "100%", background: "linear-gradient(90deg, #44ff88, #ccff66)", borderRadius: "7px", transition: "width 0.8s ease", position: "relative", zIndex: 1 },
  barMark: { position: "absolute", top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 },
  barMarkLine: { width: "1px", height: "14px", background: "rgba(204,255,102,0.3)" },
  barMarkLabel: { fontSize: "9px", color: "#2a4a2a", marginTop: "2px" },
  bigBarLabels: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#4a6a2a", marginTop: "6px" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" },
  metricCard: { background: "#0f1f0f", border: "1px solid #2a4a2a", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  card: { background: "#0f1f0f", border: "1px solid #2a4a2a", borderRadius: "10px", padding: "20px" },
  cardTitle: { margin: "0 0 16px", fontSize: "14px", color: "#ccff66", borderBottom: "1px solid #1a3a1a", paddingBottom: "10px" },
  refreshBtn: { background: "transparent", border: "1px solid #2a4a2a", color: "#44aaff", padding: "8px 18px", fontSize: "12px", cursor: "pointer", borderRadius: "4px", fontFamily: "'Inter', sans-serif" },
};
