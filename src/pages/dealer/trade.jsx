import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function DealerTrade() {
  const { user, profile } = useRole();
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

  const handleAction = async (op, actionBtn) => {
    if (!user?.uid) return;
    try {
      const recipientId = op.rawDoc?.userId || op.rawDoc?.productorOwner || op.rawDoc?.creadoPor;
      if (!recipientId) {
        alert("No se pudo determinar el destinatario para esta acción.");
        return;
      }

      const isVenta = op.type === "Orden de Venta Individual" || op.type === "Orden de Venta Asociada" || op.type === "Certificación de Fardos" || op.type === "Orden de Venta";
      const isFinanciacion = op.type === "Solicitud Financiamiento" || op.type === "Solicitud de Financiamiento" || op.type === "Solicitud de financiamiento" || op.type === "Solicitud financiamiento";
      const isPoa = op.type === "Carga POA" || op.type === "Presentación POA" || op.type === "Presentación de POA";

      let messageText = "";
      const dealerName = profile?.displayName || user.email || "Un dealer";

      if (isVenta) {
        if (actionBtn === "btn1") {
          messageText = `El usuario ${dealerName} quiere comprar tu tabaco`;
        } else {
          messageText = `El usuario ${dealerName} puede conseguir compradores para tu tabaco`;
        }
      } else if (isFinanciacion) {
        if (actionBtn === "btn1") {
          messageText = `El usuario ${dealerName} puede financiar tu solicitud`;
        } else {
          messageText = `El usuario ${dealerName} puede conseguir financistas para tu solicitud`;
        }
      } else if (isPoa) {
        if (actionBtn === "btn1") {
          messageText = `El usuario ${dealerName} puede adelantar dinero para tu POA`;
        } else {
          messageText = `El usuario ${dealerName} puede conseguir financistas para tu POA`;
        }
      }

      if (!messageText) return;

      const notifId = `${Date.now()}_notif_${user.uid}_${actionBtn}`;
      const notificationRef = doc(db, "notifications", notifId);
      await setDoc(notificationRef, {
        recipientId,
        senderId: user.uid,
        senderName: dealerName,
        type: actionBtn,
        message: messageText,
        itemId: op.targetId || op.id,
        itemType: op.type,
        read: false,
        creadoEn: serverTimestamp()
      });

      alert(`Propuesta enviada con éxito:\n"${messageText}"`);
    } catch (err) {
      console.error("Error al procesar la acción:", err);
      alert("Error al procesar la acción.");
    }
  };

  const renderActionButtons = (op) => {
    const isVenta = op.type === "Orden de Venta Individual" || op.type === "Orden de Venta Asociada" || op.type === "Certificación de Fardos" || op.type === "Orden de Venta";
    const isFinanciacion = op.type === "Solicitud Financiamiento" || op.type === "Solicitud de Financiamiento" || op.type === "Solicitud de financiamiento" || op.type === "Solicitud financiamiento";
    const isPoa = op.type === "Carga POA" || op.type === "Presentación POA" || op.type === "Presentación de POA";

    if (!isVenta && !isFinanciacion && !isPoa) return null;

    let btn1Text = "";
    let btn2Text = "";

    if (isVenta) {
      btn1Text = "Quiero comprar";
      btn2Text = "Puedo conseguir compradores";
    } else if (isFinanciacion) {
      btn1Text = "Puedo Financiar";
      btn2Text = "Puedo conseguir financistas";
    } else if (isPoa) {
      btn1Text = "Puedo Adelantar $";
      btn2Text = "Puedo conseguir financista";
    }

    const btnStyle = {
      flex: 1,
      padding: "10px 16px",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px"
    };

    return (
      <div style={{ display: "flex", gap: "12px", marginTop: "8px", width: "100%" }}>
        <button
          onClick={() => handleAction(op, "btn1")}
          style={{
            ...btnStyle,
            background: "#E3B64F",
            color: "#000000",
            border: "none",
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {btn1Text}
        </button>
        <button
          onClick={() => handleAction(op, "btn2")}
          style={{
            ...btnStyle,
            background: "rgba(255,255,255,0.05)",
            color: "#F0F6FC",
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          {btn2Text}
        </button>
      </div>
    );
  };

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
                  {renderActionButtons(op)}
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
