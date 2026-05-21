import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import { Link } from "react-router-dom";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

export default function StateDashboard() {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    poasCount: 0,
    poasMonto: 0,
    informesPrecio: 0,
    novedades: 0,
    transferenciasCount: 0,
    transferenciasMonto: 0,
    interacciones: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const poasRef = collection(db, "poa_uploads");
        const poasSnap = await getDocs(poasRef);

        let poasCount = 0;
        let poasMonto = 0;
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

        poasSnap.forEach(doc => {
          const d = doc.data();
          poasCount++;
          poasMonto += d.monto || 0;
          
          interaccionesList.push({
            id: `poa-${doc.id}`,
            date: parseDate(doc),
            title: `POAS Disponibles para adelantos: Resolución ${d.numeroResolucion || "N/A"}/${d.anioResolucion || "N/A"}`,
            description: `Monto : $${(d.monto || 0).toLocaleString("es-AR")}`,
            icon: "▣"
          });
        });

        const novRef = collection(db, "novedades_fet");
        const novSnap = await getDocs(novRef);

        let informesPrecio = 0;
        let novedades = 0;
        let transferenciasCount = 0;
        let transferenciasMonto = 0;

        novSnap.forEach(doc => {
          const d = doc.data();
          
          if (d.tipoA === "A") {
            informesPrecio++;
            interaccionesList.push({
              id: `nov-${doc.id}`,
              date: parseDate(doc),
              title: `Informes sobre el precio FET`,
              description: `El precio FET equivalente a $${(d.monto || 0).toLocaleString("es-AR")} ha sido informado para ${d.tipoTabaco}. ${d.comentariosA || ""}`,
              icon: "△"
            });
          } else if (d.tipoA === "B") {
            novedades++;
            interaccionesList.push({
              id: `nov-${doc.id}`,
              date: parseDate(doc),
              title: `Novedades`,
              description: d.comentariosB || "Novedad sin detalle",
              icon: "◉"
            });
          } else if (d.tipoA === "C") {
            transferenciasCount++;
            transferenciasMonto += d.montoC || 0;
            interaccionesList.push({
              id: `nov-${doc.id}`,
              date: parseDate(doc),
              title: `Transferencias`,
              description: `La transferencia ha sido enviada a la provincia de ${d.provincia}. Monto: $${(d.montoC || 0).toLocaleString("es-AR")}`,
              icon: "◈"
            });
          }
        });

        interaccionesList.sort((a, b) => b.date.getTime() - a.date.getTime());

        setStats({
          poasCount,
          poasMonto,
          informesPrecio,
          novedades,
          transferenciasCount,
          transferenciasMonto,
          interacciones: interaccionesList
        });

      } catch (err) {
        console.error("Error fetching state stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>🏛</div>
          <h1>Mi Dashboard — Estado Nacional</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Gestión e información del Fondo Especial del Tabaco</p>
      </div>

      {!loading && (
        <div style={{ background: "rgba(240,136,62,0.05)", border: "1px solid rgba(240,136,62,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "32px", backdropFilter: "blur(10px)" }}>
          <p style={{ margin: 0, color: "#C9D1D9", fontSize: "16px", lineHeight: 1.6 }}>
            El Estado Nacional ha puesto a disposición <strong style={{ color: "#F0F6FC" }}>{stats.poasCount}</strong> POAS hasta el momento los cuales ascienden a un total de <strong style={{ color: C.accent }}>${stats.poasMonto.toLocaleString("es-AR")}</strong>. Asimismo ha informado <strong style={{ color: "#F0F6FC" }}>{stats.informesPrecio}</strong> veces sobre el precio FET, ha publicado <strong style={{ color: "#F0F6FC" }}>{stats.novedades}</strong> novedades y comunicado <strong style={{ color: "#F0F6FC" }}>{stats.transferenciasCount}</strong> transferencias a provincias.
          </p>
        </div>
      )}

      <div className="tabar-grid-4">
        <MetricCard 
          label="POAs Disponibles" 
          value={stats.poasCount} 
          unit={`$${stats.poasMonto.toLocaleString("es-AR")}`} 
          color={C.accent} bg={C.dim} glyph="▣" 
        />
        <MetricCard 
          label="Informes Precio FET" 
          value={stats.informesPrecio} 
          unit="informes" 
          color="#58A6FF" bg="rgba(88,166,255,0.10)" glyph="△" 
        />
        <MetricCard 
          label="Novedades" 
          value={stats.novedades} 
          unit="novedades publicadas" 
          color="#3FB950" bg="rgba(63,185,80,0.10)" glyph="◉" 
        />
        <MetricCard 
          label="Transferencias" 
          value={stats.transferenciasCount} 
          unit={`$${stats.transferenciasMonto.toLocaleString("es-AR")}`} 
          color="#BC8CFF" bg="rgba(188,140,255,0.10)" glyph="◈" 
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
          <ActionCard to="/state/invest" glyph="▣" title="Cargar nuevo POA" desc="Participar en la campaña TABAR con fondos del Fondo Especial del Tabaco" color={C.accent} bg={C.dim} />
          <ActionCard to="/state/returns" glyph="△" title="Información del FET" desc="Novedades del Fondo Especial del Tabaco" color={C.accent} bg={C.dim} />
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
