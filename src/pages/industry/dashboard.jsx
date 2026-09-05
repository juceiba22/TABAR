import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#1a4329", dim: "#edf6ef", gold: "#c59b27" };

const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getMontoOrden = (d) => parseFloat(d?.montoTotal ?? d?.usdTotal ?? 0) || 0;
const getMontoFinanciamiento = (d) => Number(d?.montoFinanciamiento ?? d?.montoSolicitado ?? 0) || 0;

export default function IndustryDashboard() {
  const { user } = useRole();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    ordenesCount: 0,
    ordenesMontoTotal: 0,
    financiamientoCount: 0,
    financiamientoMontoTotal: 0,
    motivos: [],
    interacciones: []
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      try {
        let ordenesCount = 0;
        let ordenesMontoTotal = 0;
        let financiamientoCount = 0;
        let financiamientoMontoTotal = 0;
        const motivosSet = new Set();
        let interaccionesList = [];

        const parseDate = (doc) => {
          const d = doc.data();
          if (d.fechaCreacion) return new Date(d.fechaCreacion);
          if (d.creadoEn?.toDate) return d.creadoEn.toDate();
          if (d.timestamp?.toDate) return d.timestamp.toDate();
          const idNum = Number(doc.id);
          if (!isNaN(idNum) && idNum > 1000000000000) return new Date(idNum);
          return new Date();
        };

        const poRef = collection(db, "purchase_orders");
        const qPo = query(poRef, where("userId", "==", user.uid));
        const poSnap = await getDocs(qPo);

        poSnap.forEach(doc => {
          const d = doc.data();
          const monto = getMontoOrden(d);

          ordenesCount++;
          ordenesMontoTotal += monto;

          interaccionesList.push({
            id: `po-${doc.id}`,
            date: parseDate(doc),
            title: `Orden de compra de tabaco`,
            description: `Orden emitida por ${(d.cantidadKgs || 0).toLocaleString("es-AR")} kgs y a un monto total de $${fmtMoney(monto)} USD.`,
            icon: "shopping_cart"
          });
        });

        const frRef = collection(db, "financing_requests");
        const qFr = query(frRef, where("userId", "==", user.uid));
        const frSnap = await getDocs(qFr);

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
            description: `Financiamiento para ${d.motivoFinanciamiento?.toLowerCase() || "fines generales"} por $${fmtMoney(monto)} USD colateralizado.`,
            icon: "account_balance"
          });
        });

        interaccionesList.sort((a, b) => b.date.getTime() - a.date.getTime());

        setStats({
          ordenesCount,
          ordenesMontoTotal,
          financiamientoCount,
          financiamientoMontoTotal,
          motivos: Array.from(motivosSet),
          interacciones: interaccionesList
        });

      } catch (err) {
        console.error("Error fetching industry stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const motivosStr = stats.motivos.length > 0
    ? stats.motivos.join(", ")
    : "fines generales";

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>
            <span className="material-symbols-outlined">warehouse</span>
          </div>
          <h1>Mi Dashboard — Acopiador / Industria</h1>
        </div>
        <p style={{ margin: 0, color: "var(--tb-text-2)", fontSize: "13.5px" }}>
          Resumen financiero, órdenes de compra y warrants colateralizados en la campaña
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
            Has emitido hasta el momento <strong style={{ color: "var(--tb-accent)" }}>{stats.ordenesCount}</strong> órdenes de compra por un monto acumulado de <strong style={{ color: "var(--tb-secondary)" }}>${fmtMoney(stats.ordenesMontoTotal)} USD</strong>. Has solicitado financiamiento en <strong style={{ color: "var(--tb-accent)" }}>{stats.financiamientoCount}</strong> ocasiones por un total de <strong style={{ color: "var(--tb-secondary)" }}>${fmtMoney(stats.financiamientoMontoTotal)} USD</strong> destinado a: <strong style={{ color: "var(--tb-accent)" }}>{motivosStr}</strong>.
          </p>
        </div>
      )}

      <div className="tabar-grid-4" style={{ marginBottom: "28px" }}>
        <MetricCard label="Financiamiento Solicitado" value={`$${(stats.financiamientoMontoTotal / 1000).toFixed(1)}k`} unit="USD colateralizado" glyph="account_balance" />
        <MetricCard label="Destinos Operativos" value={stats.motivos.length > 0 ? stats.motivos.length : "1"} unit="tipos de financiamiento" glyph="category" />
        <MetricCard label="Órdenes de Compra" value={stats.ordenesCount} unit="emitidas a productores" glyph="shopping_cart" />
        <MetricCard label="Monto Acumulado" value={`$${(stats.ordenesMontoTotal / 1000).toFixed(1)}k`} unit="USD en tabaco" glyph="payments" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "28px" }}>
        <div className="tabar-card">
          <div className="tabar-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Historial de Órdenes & Financiamiento</span>
            <span className="tabar-badge tabar-badge-gold">AUDITORÍA ON-CHAIN</span>
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
          <ActionCard to="/industry/buy" icon="shopping_cart" title="Orden de Compra" desc="Adquirí fardos y lotes de tabaco de productores certificados con liquidación asegurada" />
          <ActionCard to="/industry/financing" icon="account_balance" title="Solicitar Financiamiento" desc="Obtené liquidez de campaña y adelantos contra warrants de tabaco en custodia" />
          <ActionCard to="/warrants" icon="token" title="Warrants Digitales" desc="Emisión, consulta y endoso de certificados de depósito y warrants de acopio" />
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
