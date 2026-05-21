import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function DealerTrade() {
  const { user } = useRole();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOperations() {
      if (!user?.uid) return;
      try {
        const opRef = collection(db, "dealer_operations");
        const qOp = query(opRef, where("dealerId", "==", user.uid));
        const opSnap = await getDocs(qOp);

        let ops = [];
        opSnap.forEach(doc => {
          ops.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Ordenar por fecha descendente
        ops.sort((a, b) => {
          const timeA = a.creadoEn?.toDate ? a.creadoEn.toDate().getTime() : 0;
          const timeB = b.creadoEn?.toDate ? b.creadoEn.toDate().getTime() : 0;
          return timeB - timeA;
        });

        setOperations(ops);
      } catch (err) {
        console.error("Error fetching dealer operations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOperations();
  }, [user]);

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◱</div>
          <h1>Operar</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>
          Seguimiento de las operaciones del mercado tabacalero en las que ha decidido participar.
        </p>
      </div>

      <div className="tabar-section">
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#8B949E" }}>Cargando operaciones...</div>
        ) : operations.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #30363D", borderRadius: "12px", color: "#8B949E" }}>
            Aún no has marcado ninguna operación.<br/>
            Ve a <strong>Mercado Tabacalero</strong> y utiliza el botón amarillo "Operar" para guardar publicaciones aquí.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {operations.map(op => {
              const raw = op.rawDoc || {};
              // Determinar usuario
              const emisor = raw.creadoPor || raw.userId || op.roleOrigin || "Usuario Desconocido";
              
              // Determinar monto
              let monto = raw.usdTotal || raw.montoSolicitado || raw.monto || raw.montoC;
              let montoStr = monto ? `$${Number(monto).toLocaleString("es-AR")}` : "No especificado";

              // Plazo de devolución
              let plazo = raw.plazo ? `${raw.plazo} Días` : null;

              // Tipo de tabaco / Posición arancelaria
              let tipoTabaco = raw.posicionArancelaria || raw.tipoTabaco || null;

              return (
                <div key={op.id} className="tabar-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: op.color || C.dim, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                      {op.icon || "◉"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0", color: "#F0F6FC", fontSize: "16px", fontWeight: 600 }}>
                        {op.title}
                      </h3>
                      <p style={{ margin: 0, color: "#C9D1D9", fontSize: "14px", lineHeight: 1.5 }}>
                        {op.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(22, 27, 34, 0.5)", borderRadius: "8px", border: "1px solid #30363D", padding: "16px" }}>
                    <InfoRow label="Usuario Emisor" value={emisor} />
                    <InfoRow label="Monto" value={montoStr} valueColor={C.accent} />
                    
                    {plazo && (
                      <InfoRow label="Plazo de devolución estipulado" value={plazo} />
                    )}
                    
                    {tipoTabaco && (
                      <InfoRow label="Tipo de Tabaco / Posición Arancelaria" value={tipoTabaco} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      flexWrap: "wrap",
      gap: "8px",
      alignItems: "center"
    }}>
      <span style={{ fontSize: "13px", color: "#8B949E" }}>{label}:</span>
      <span style={{
        fontSize: "13px",
        color: valueColor || "#F0F6FC",
        fontWeight: 500,
        wordBreak: "break-word",
        textAlign: "right"
      }}>{value}</span>
    </div>
  );
}
