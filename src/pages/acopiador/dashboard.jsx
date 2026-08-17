import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)" };

// Formateadores
const fmtKgs = (n) => Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Lee los kgs de un documento de producer_tokenizations.
// Soporta el nombre nuevo (`totalKgs`, como lo guarda tokenizar.jsx) y el
// viejo (`kgs`) por compatibilidad con documentos antiguos.
const getKgs = (d) => Number(d?.totalKgs ?? d?.kgs ?? 0);

// Lee el monto de una solicitud de financiamiento.
// financing.jsx lo guarda como `montoFinanciamiento` (number).
// Se mantiene compatibilidad con `montoSolicitado` por si quedó algún documento viejo.
const getMontoFinanciamiento = (d) => Number(d?.montoFinanciamiento ?? d?.montoSolicitado ?? 0) || 0;

export default function AcopiadorDashboard() {
  const { user } = useRole();
  const { balances } = useData();
  const myBalance = balances?.acopiador || 0;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKgs: 0,
    totalFardos: 0,
    totalUsd: 0,
    tiposTabaco: [],
    asociacionesCount: 0,
    financiamientoCount: 0,
    financiamientoMontoTotal: 0,
    motivos: [],
    interacciones: []
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      try {
        const parseDate = (doc) => {
          const d = doc.data();
          if (d.fechaCreacion) return new Date(d.fechaCreacion);
          if (d.creadoEn?.toDate) return d.creadoEn.toDate();
          if (d.timestamp?.toDate) return d.timestamp.toDate();
          const idNum = Number(doc.id);
          if (!isNaN(idNum) && idNum > 1000000000000) return new Date(idNum);
          return new Date();
        };

        let totalKgs = 0;
        let totalFardos = 0;
        let totalUsd = 0;
        const tiposTabacoSet = new Set();
        let interaccionesList = [];

        // 1. Tokenizaciones (certificación de tabaco propio)
        const tokenizationsRef = collection(db, "producer_tokenizations");
        const qTok = query(tokenizationsRef, where("productorOwner", "==", user.uid));
        const tokSnap = await getDocs(qTok);

        tokSnap.forEach(doc => {
          const d = doc.data();
          const kgs = getKgs(d);

          totalKgs += kgs;
          totalFardos += d.cantidadFardos || 0;
          totalUsd += d.usdTotal || 0;

          if (d.tipoTabaco) {
            const tipoDesc = d.calidad ? `${d.tipoTabaco} ${d.calidad}` : d.tipoTabaco;
            tiposTabacoSet.add(tipoDesc);
          }

          interaccionesList.push({
            id: `tok-${doc.id}`,
            date: parseDate(doc),
            title: `Certificación`,
            description: `Se certificaron ${fmtFardos(d.cantidadFardos)} fardos (${fmtKgs(kgs)} Kgs) de ${d.tipoTabaco}.`,
            icon: "🌿"
          });
        });

        // 2. Asociaciones
        const assocRef = collection(db, "producer_associations");
        const qAssoc = query(assocRef, where("productoresUIDs", "array-contains", user.uid));
        const assocSnap = await getDocs(qAssoc);

        let asociacionesCount = 0;
        assocSnap.forEach(doc => {
          const d = doc.data();
          asociacionesCount++;

          interaccionesList.push({
            id: `assoc-${doc.id}`,
            date: parseDate(doc),
            title: `Asociación exitosa "${d.nombre}"`,
            description: `Te uniste a la asociación de ${d.productores?.length || 1} miembros.`,
            icon: "👥"
          });
        });

        // 3. Solicitudes de financiamiento
        const frRef = collection(db, "financing_requests");
        const qFr = query(frRef, where("userId", "==", user.uid));
        const frSnap = await getDocs(qFr);

        let financiamientoCount = 0;
        let financiamientoMontoTotal = 0;
        const motivosSet = new Set();

        frSnap.forEach(doc => {
          const d = doc.data();
          const monto = getMontoFinanciamiento(d);

          financiamientoCount++;
          financiamientoMontoTotal += monto;

          if (d.motivoFinanciamiento) {
            motivosSet.add(d.motivoFinanciamiento);
          }

          interaccionesList.push({
            id: `fr-${doc.id}`,
            date: parseDate(doc),
            title: `Solicitud de financiamiento`,
            description: `Solicitud de financiamiento para ${d.motivoFinanciamiento?.toLowerCase() || "fines generales"} por un monto total de $${fmtMoney(monto)}`,
            icon: "◇"
          });
        });

        interaccionesList.sort((a, b) => b.date.getTime() - a.date.getTime());

        setStats({
          totalKgs,
          totalFardos,
          totalUsd,
          tiposTabaco: Array.from(tiposTabacoSet),
          asociacionesCount,
          financiamientoCount,
          financiamientoMontoTotal,
          motivos: Array.from(motivosSet),
          interacciones: interaccionesList
        });

      } catch (err) {
        console.error("Error fetching acopiador stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const kgEquivalente = myBalance * 200;

  const tiposStr = stats.tiposTabaco.length > 0 ? stats.tiposTabaco.join(", ") : "Tabaco";
  const motivosStr = stats.motivos.length > 0 ? stats.motivos.join(", ") : "fines generales";

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>🌿</div>
          <h1>Mi Dashboard — Acopiador</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Producción certificada, asociaciones y financiamiento en la campaña TABAR</p>
      </div>

      {!loading && (
        <div style={{ background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "32px", backdropFilter: "blur(10px)" }}>
          <p style={{ margin: 0, color: "#C9D1D9", fontSize: "16px", lineHeight: 1.6 }}>
            Ud. ha certificado hasta el momento <strong style={{ color: C.accent }}>{fmtKgs(stats.totalKgs)}</strong> kgs de tabaco del tipo <strong style={{ color: "#F0F6FC" }}>{tiposStr}</strong> en <strong style={{ color: "#F0F6FC" }}>{fmtFardos(stats.totalFardos)}</strong> fardos, y se unió a <strong style={{ color: "#F0F6FC" }}>{stats.asociacionesCount}</strong> asociaciones. Asimismo ha solicitado financiamiento <strong style={{ color: C.accent }}>{stats.financiamientoCount}</strong> veces por un total de <strong style={{ color: "#F0F6FC" }}>${fmtMoney(stats.financiamientoMontoTotal)}</strong>, con motivo: <strong style={{ color: "#F0F6FC" }}>{motivosStr}</strong>.
          </p>
        </div>
      )}

      <div className="tabar-grid-4">
        <MetricCard label="Mi Tenencia TABAR" value={myBalance.toLocaleString("es-AR")} unit="fardos digitales" color={C.accent} bg={C.dim} glyph="🌿" />
        <MetricCard label="Equivalente en tabaco" value={kgEquivalente.toLocaleString("es-AR")} unit="kg certificados" color="#ccff66" bg="rgba(204,255,102,0.10)" glyph="◈" />
        <MetricCard label="Financiamiento solicitado" value={`$${(stats.financiamientoMontoTotal / 1000).toFixed(1)}k`} unit="monto total" color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="$" />
        <MetricCard label="Estado de Registro" value={myBalance > 0 ? "Activo" : "Sin fardos"} unit="" color={myBalance > 0 ? "#3FB950" : "#F0883E"} bg={myBalance > 0 ? "rgba(63,185,80,0.10)" : "rgba(240,136,62,0.10)"} glyph="◉" />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Listado de interacciones</h3>
        <div style={{ background: "rgba(22, 27, 34, 0.5)", border: "1px solid #30363D", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#8B949E" }}>Cargando historial...</div>
          ) : stats.interacciones.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#8B949E" }}>No hay interacciones registradas aún.</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {stats.interacciones.map((item, index) => (
                <li key={item.id} style={{
                  padding: "20px",
                  borderBottom: index !== stats.interacciones.length - 1 ? "1px solid #30363D" : "none",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center"
                }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: C.dim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#F0F6FC", fontSize: "15px", fontWeight: 500 }}>
                      {item.title}
                    </h4>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ color: "#8B949E", fontSize: "12px" }}>
                        {item.date.toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{ color: "#484F58", fontSize: "12px" }}>•</span>
                      <span style={{ color: "#C9D1D9", fontSize: "13px" }}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="tabar-section">
        <CampaignStats />
      </div>

      <div className="tabar-section">
        <h3 className="tabar-section-label">Acciones rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/acopiador/tokenizar" glyph="▣" title="Certificar Tabaco" desc="Certificá tu producción física para recibir financiamiento digital" color={C.accent} bg={C.dim} />
          <ActionCard to="/acopiador/asociaciones" glyph="👥" title="Mis Asociaciones" desc="Formá parte de grupos de venta para consolidar stock y vender en bloque" color={C.accent} bg={C.dim} />
          <ActionCard to="/acopiador/financing" glyph="◇" title="Solicitar Financiamiento" desc="Pedí capital de trabajo, anticipo de exportación u otros motivos" color={C.accent} bg={C.dim} />
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
