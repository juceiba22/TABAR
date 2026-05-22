import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)" };

// Formateador de moneda en pesos.
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Lee el monto de una orden de compra.
// buy.jsx lo guarda como `montoTotal` (string, por .toFixed(2)).
// Se mantiene compatibilidad con `usdTotal` por si quedó algún documento viejo.
const getMontoOrden = (d) => parseFloat(d?.montoTotal ?? d?.usdTotal ?? 0) || 0;

// Lee el monto de una solicitud de financiamiento.
// financing.jsx lo guarda como `montoFinanciamiento` (number).
// Se mantiene compatibilidad con `montoSolicitado` por si quedó algún documento viejo.
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

        // 1. Órdenes de compra
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
            title: `Orden de compra`,
            description: `Orden de compra emitida por ${(d.cantidadKgs || 0).toLocaleString("es-AR")} kgs y a un monto total de $${fmtMoney(monto)}`,
            icon: "▣"
          });
        });

        // 2. Solicitudes de financiamiento
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
            description: `Solicitud de financiamiento para ${d.motivoFinanciamiento?.toLowerCase() || "fines generales"} por un monto total de $${fmtMoney(monto)}`,
            icon: "◇"
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
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>⬡</div>
          <h1>Mi Dashboard — Acopiador</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Resumen financiero y comercial en la campaña TABAR</p>
      </div>

      {!loading && (
        <div style={{ background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "32px", backdropFilter: "blur(10px)" }}>
          <p style={{ margin: 0, color: "#C9D1D9", fontSize: "16px", lineHeight: 1.6 }}>
            Usted ha emitido hasta el momento <strong style={{ color: C.accent }}>{stats.ordenesCount}</strong> de órdenes de compra por un monto total de <strong style={{ color: "#F0F6FC" }}>${fmtMoney(stats.ordenesMontoTotal)}</strong>. Asimismo ha solicitado financiamiento <strong style={{ color: C.accent }}>{stats.financiamientoCount}</strong> veces por un total de <strong style={{ color: "#F0F6FC" }}>${fmtMoney(stats.financiamientoMontoTotal)}</strong>. El motivo del financiamiento han sido: <strong style={{ color: "#F0F6FC" }}>{motivosStr}</strong>.
          </p>
        </div>
      )}

      <div className="tabar-grid-4">
        <MetricCard
          label="Financiamiento solicitado"
          value={`$${(stats.financiamientoMontoTotal / 1000).toFixed(1)}k`}
          unit="monto total"
          color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="$"
        />
        <MetricCard
          label="Motivos"
          value={stats.motivos.length > 0 ? stats.motivos.length : "0"}
          unit="tipos de financiamiento"
          color="#BC8CFF" bg="rgba(188,140,255,0.10)" glyph="◱"
        />
        <MetricCard
          label="Órdenes de compra"
          value={stats.ordenesCount}
          unit="emitidas"
          color={C.accent} bg={C.dim} glyph="▣"
        />
        <MetricCard
          label="Monto de compras"
          value={`$${(stats.ordenesMontoTotal / 1000).toFixed(1)}k`}
          unit="total acumulado"
          color="#E3B64F" bg="rgba(227,182,79,0.10)" glyph="◈"
        />
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
          <ActionCard to="/industry/buy" glyph="▣" title="Comprar producción anticipada" desc="Adquirí fardos digitales TABAR con descuento sobre precio de mercado" color={C.accent} bg={C.dim} />
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
