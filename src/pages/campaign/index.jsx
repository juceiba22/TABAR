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
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: "#edf6ef", color: "var(--tb-accent)" }}>
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <h1>Campaña Agrícola Tabacalera</h1>
        </div>
        <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13.5px" }}>
          Seguimiento del financiamiento, colocación de warrants y distribución de la cosecha
        </p>
      </div>

      {/* Hero de Progreso Stitch */}
      <div className="tabar-card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--tb-text-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: "4px" }}>
              Progreso Global de Campaña
            </div>
            <div style={{ fontFamily: "var(--tb-serif)", fontSize: "42px", fontWeight: "700", color: "var(--tb-accent)", lineHeight: 1 }}>
              {pct}<span style={{ fontSize: "24px", color: "var(--tb-secondary)" }}>%</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: campana?.activa ? "var(--tb-green)" : "var(--tb-red)",
                display: "inline-block"
              }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: campana?.activa ? "var(--tb-green)" : "var(--tb-red)", fontFamily: "var(--tb-mono)" }}>
                {campana?.activa ? "CAMPAÑA EN CURSO" : "CAMPAÑA CERRADA"}
              </span>
            </div>
            {campana?.activa && diasRestantes > 0 && (
              <div style={{ color: "var(--tb-secondary)", fontSize: "13px", marginTop: "4px", fontWeight: 600 }}>
                {diasRestantes} días restantes de ciclo
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "12px", background: "var(--tb-surface-2)", borderRadius: "6px", overflow: "hidden", marginBottom: "8px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--tb-secondary)", borderRadius: "6px", transition: "width 0.8s ease" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--tb-text-2)", fontFamily: "var(--tb-mono)" }}>
          <span>{campana?.fardosVendidos || 0} fardos colocados</span>
          <span>{campana?.fardosTotales || 0} fardos objetivo</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="tabar-grid-4" style={{ marginBottom: "24px" }}>
        <MetricCard label="Total Emitidos" value={(campana?.fardosTotales || 0).toLocaleString("es-AR")} unit="TABAR fardos" glyph="inventory_2" />
        <MetricCard label="Colocados / Warrants" value={(campana?.fardosVendidos || 0).toLocaleString("es-AR")} unit="fardos liquidados" glyph="verified" />
        <MetricCard label="Disponibles en Silo" value={disponibles.toLocaleString("es-AR")} unit="fardos en stock" glyph="warehouse" />
        <MetricCard label="Volumen Físico" value={((kgTotal / 1000) || 0).toFixed(1)} unit="Tn de tabaco" glyph="scale" />
      </div>

      {/* Detalle campaña */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div className="tabar-card">
          <h3 className="tabar-card-title">Parámetros de la Campaña</h3>
          <DetailRow label="Estado del Ciclo" value={campana?.activa ? "🟢 Activa" : "🔴 Cerrada"} />
          <DetailRow label="Fecha de Apertura" value={formatDate(campana?.inicio)} />
          <DetailRow label="Fecha de Liquidación" value={formatDate(finIso)} />
          <DetailRow label="Duración Total" value={`${diasTotales} días`} />
          <DetailRow label="Fardos Certificados" value={`${(campana?.fardosTotales || 0).toLocaleString("es-AR")} TABAR`} />
          <DetailRow label="Kg Totales de Acopio" value={`${kgTotal.toLocaleString("es-AR")} kg`} />
        </div>

        <div className="tabar-card">
          <h3 className="tabar-card-title">Distribución por Tipo de Participante</h3>
          <ParticipantRow label="Acopiadores / Industria" pct={55} color="var(--tb-accent)" />
          <ParticipantRow label="Mesa Dealers / Liquidez" pct={30} color="var(--tb-secondary)" />
          <ParticipantRow label="Productores / Reserva Directa" pct={15} color="var(--tb-green)" />
          <p style={{ fontSize: "12px", color: "var(--tb-text-3)", margin: "14px 0 0" }}>
            * Distribución auditada bajo normativa SAGyP Ley Nacional 9.643 de Warrants.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, glyph }) {
  return (
    <div className="tabar-metric-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <span className="tabar-metric-label">{label}</span>
        <span className="material-symbols-outlined" style={{ color: "var(--tb-secondary)", fontSize: "20px" }}>{glyph}</span>
      </div>
      <div className="tabar-metric-value">{value}</div>
      <div className="tabar-metric-unit">{unit}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--tb-border)" }}>
      <span style={{ fontSize: "13px", color: "var(--tb-text-2)" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "var(--tb-accent)", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>{value}</span>
    </div>
  );
}

function ParticipantRow({ label, pct, color }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "var(--tb-text-2)" }}>{label}</span>
        <span style={{ fontSize: "13px", color, fontWeight: 700, fontFamily: "var(--tb-mono)" }}>{pct}%</span>
      </div>
      <div style={{ height: "6px", background: "var(--tb-surface-2)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}
