import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#132a1e", dim: "#edf6ef", gold: "#c59b27" };

const fmtKgs = (n) => Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getKgs = (d) => Number(d?.totalKgs ?? d?.kgs ?? 0);

export default function ProducerDashboard() {
  const { user } = useRole();
  const { balances } = useData();
  const myBalance = balances?.producer || 0;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKgs: 0,
    totalFardos: 0,
    totalUsd: 0,
    tiposTabaco: [],
    asociacionesCount: 0,
    interacciones: []
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      try {
        const tokenizationsRef = collection(db, "producer_tokenizations");
        const qTok = query(tokenizationsRef, where("productorOwner", "==", user.uid));
        const tokSnap = await getDocs(qTok);

        let totalKgs = 0;
        let totalFardos = 0;
        let totalUsd = 0;
        let tiposTabacoSet = new Set();
        let interaccionesList = [];

        const parseDate = (doc) => {
          const d = doc.data();
          if (d.creadoEn?.toDate) return d.creadoEn.toDate();
          if (d.timestamp?.toDate) return d.timestamp.toDate();
          const idNum = Number(doc.id);
          if (!isNaN(idNum) && idNum > 1000000000000) return new Date(idNum);
          return new Date();
        };

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
            title: `Certificación de Tabaco`,
            description: `Se certificaron ${fmtFardos(d.cantidadFardos)} fardos (${fmtKgs(kgs)} Kgs) de ${d.tipoTabaco}.`,
            icon: "verified",
            type: 'tok'
          });
        });

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
            icon: "groups",
            type: 'assoc'
          });
        });

        const sortedAsc = [...interaccionesList].sort((a, b) => a.date.getTime() - b.date.getTime());
        let tokCounter = 1;
        sortedAsc.forEach(item => {
          if (item.type === 'tok') {
            item.title = `Certificación #${tokCounter++}`;
          }
        });

        sortedAsc.sort((a, b) => b.date.getTime() - a.date.getTime());

        setStats({
          totalKgs,
          totalFardos,
          totalUsd,
          tiposTabaco: Array.from(tiposTabacoSet),
          asociacionesCount,
          interacciones: sortedAsc
        });

      } catch (err) {
        console.error("Error fetching producer stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const kgEquivalente = myBalance * 200;
  const financiamientoEstimado = myBalance * 85;

  const tiposStr = stats.tiposTabaco.length > 0
    ? stats.tiposTabaco.join(", ")
    : "Tabaco Virginia";

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>
            <span className="material-symbols-outlined">psychiatry</span>
          </div>
          <h1>Mi Tabaco & Producción</h1>
        </div>
        <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13.5px" }}>
          Gestión de activos tabacaleros certificados, fardos físicos y warrants de campaña
        </p>
      </div>

      {!loading && (
        <div style={{
          background: "#edf6ef",
          border: "1px solid #d8e5dc",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "28px",
          boxShadow: "var(--tb-shadow-sm)"
        }}>
          <p style={{ margin: 0, color: "var(--tb-text)", fontSize: "15px", lineHeight: 1.6 }}>
            Has certificado hasta el momento <strong style={{ color: "var(--tb-accent)" }}>{fmtKgs(stats.totalKgs)}</strong> kgs de tabaco del tipo <strong style={{ color: "var(--tb-accent)" }}>{tiposStr}</strong> en <strong style={{ color: "var(--tb-accent)" }}>{fmtFardos(stats.totalFardos)}</strong> fardos. El valor de tus órdenes de venta asciende a <strong style={{ color: "var(--tb-secondary)" }}>${fmtMoney(stats.totalUsd)} USD</strong>. Participas en <strong style={{ color: "var(--tb-accent)" }}>{stats.asociacionesCount}</strong> asociaciones activas.
          </p>
        </div>
      )}

      <div className="tabar-grid-4" style={{ marginBottom: "28px" }}>
        <MetricCard label="Mi Tenencia TABAR" value={myBalance.toLocaleString("es-AR")} unit="fardos certificados" glyph="inventory_2" />
        <MetricCard label="Equivalente en Tabaco" value={kgEquivalente.toLocaleString("es-AR")} unit="kg en acopio" glyph="scale" />
        <MetricCard label="Adelanto Estimado" value={`$${financiamientoEstimado.toLocaleString("es-AR")}`} unit="USD colateral" glyph="account_balance" />
        <MetricCard label="Estado de Registro" value={myBalance > 0 ? "Activo" : "Sin Fardos"} unit="SAGyP 9.643" glyph="verified" isStatus />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "28px" }}>
        <div className="tabar-card">
          <div className="tabar-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Historial de Certificaciones & Interacciones</span>
            <span className="tabar-badge tabar-badge-gold">TELEMETRÍA EN VIVO</span>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--tb-text-2)" }}>Cargando historial...</div>
            ) : stats.interacciones.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--tb-text-2)" }}>No hay interacciones registradas aún.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stats.interacciones.map((item, index) => (
                  <div key={item.id} style={{
                    padding: "16px 0",
                    borderBottom: index !== stats.interacciones.length - 1 ? "1px solid var(--tb-border)" : "none",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center"
                  }}>
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "6px",
                      background: "#edf6ef",
                      color: "var(--tb-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <h4 style={{ margin: 0, color: "var(--tb-accent)", fontSize: "14.5px", fontWeight: 600 }}>
                          {item.title}
                        </h4>
                        <span style={{ color: "var(--tb-text-3)", fontSize: "11px", fontFamily: "var(--tb-mono)" }}>
                          {item.date.toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13px" }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <CampaignStats />
      </div>

      <div>
        <h3 className="tabar-card-title" style={{ border: "none", marginBottom: "14px" }}>Acciones Rápidas</h3>
        <div className="tabar-grid-3">
          <ActionCard to="/producer/tokenizar" icon="verified" title="Certificar Tabaco" desc="Certificá tu producción física para recibir financiamiento digital y warrants" />
          <ActionCard to="/producer/asociaciones" icon="groups" title="Mis Asociaciones" desc="Formá parte de grupos de venta para consolidar stock y vender en bloque" />
          <ActionCard to="/warrants" icon="token" title="Warrants Digitales" desc="Gestioná tus certificados de depósito y warrants de garantía para financiamiento" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, glyph, isStatus }) {
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

function ActionCard({ to, icon, title, desc }) {
  return (
    <Link to={to} className="tabar-action-card">
      <div className="tabar-action-icon" style={{ background: "#edf6ef", color: "var(--tb-accent)" }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h4 style={{ margin: 0, fontSize: "15px", fontFamily: "var(--tb-serif)", fontWeight: 700, color: "var(--tb-accent)" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: "13px", color: "var(--tb-text-2)", lineHeight: 1.5 }}>{desc}</p>
    </Link>
  );
}
