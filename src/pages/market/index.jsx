import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";
import "./market.css";

// Formateadores
const fmtKgs = (n) => Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helpers tolerantes a nombres distintos de campo (compatibilidad con docs viejos).
// buy.jsx guarda el monto como `montoTotal` (string por .toFixed(2)).
const getMontoOrden = (d) => parseFloat(d?.montoTotal ?? d?.usdTotal ?? 0) || 0;
// financing.jsx guarda el monto como `montoFinanciamiento` (number).
const getMontoFinanciamiento = (d) => Number(d?.montoFinanciamiento ?? d?.montoSolicitado ?? 0) || 0;
// tokenizar.jsx guarda los kgs como `totalKgs` (number).
const getKgs = (d) => Number(d?.totalKgs ?? d?.kgs ?? 0);

export default function MarketPage() {
  const { role, user } = useRole();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOperar = async (item) => {
    if (!user?.uid) return;
    try {
      const operationRef = doc(db, "dealer_operations", `${Date.now()}_${user.uid}`);
      await setDoc(operationRef, {
        dealerId: user.uid,
        targetId: item.rawId || item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        roleOrigin: item.roleLabel,
        color: item.color,
        icon: item.icon,
        rawDoc: item.rawDoc || {},
        creadoEn: serverTimestamp()
      });
      alert("Operación marcada exitosamente. Puedes verla en la pestaña 'Operar'.");
    } catch (err) {
      console.error("Error al marcar operación:", err);
      alert("Error al marcar operación.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          poSnap, frSnap, ptSnap, paSnap, puSnap, nfSnap
        ] = await Promise.all([
          getDocs(collection(db, "purchase_orders")),
          getDocs(collection(db, "financing_requests")),
          getDocs(collection(db, "producer_tokenizations")),
          getDocs(collection(db, "producer_associations")),
          getDocs(collection(db, "poa_uploads")),
          getDocs(collection(db, "novedades_fet")),
        ]);

        const allItems = [];

        // Función auxiliar para extraer de forma segura el Timestamp o Date de un documento.
        // Cubre todos los nombres de campo de fecha usados en la app:
        //   - creadoEn / createdAt / timestamp: Firestore Timestamp (tienen .toDate())
        //   - fecha / fechaTransferencia / fechaCreacion: strings/dates planos
        const parseDate = (doc) => {
          const data = doc.data();
          if (data.creadoEn?.toDate) return data.creadoEn.toDate();
          if (data.createdAt?.toDate) return data.createdAt.toDate();
          if (data.timestamp?.toDate) return data.timestamp.toDate();
          if (data.fecha) return new Date(data.fecha);
          if (data.fechaTransferencia) return new Date(data.fechaTransferencia);
          if (data.fechaCreacion) return new Date(data.fechaCreacion);
          // Fallback al ID del documento si es numérico (Date.now())
          const idNum = Number(doc.id);
          if (!isNaN(idNum) && idNum > 1000000000000) return new Date(idNum);
          return new Date(); // fallback extremo
        };

        // 1. Órdenes de compra (Industry)
        // buy.jsx guarda: cantidadKgs (int), montoTotal (string vía .toFixed(2)).
        poSnap.forEach(doc => {
          const d = doc.data();
          const monto = getMontoOrden(d);
          allItems.push({
            id: `po-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "industry",
            roleLabel: "Acopiador",
            type: "Orden de Compra",
            title: `Orden emitida: ${fmtKgs(d.cantidadKgs)} Kgs`,
            description: `Tipo de Tabaco: ${d.tipoTabaco} | Calidad: ${d.calidadSolicitada || d.calidad || "—"} | Inversión: $${fmtMoney(monto)}`,
            icon: "▣",
            color: "#58A6FF"
          });
        });

        // 2. Financiamiento (Industry)
        // financing.jsx guarda: montoFinanciamiento (number), motivoFinanciamiento, plazo (int días).
        // NO se guarda ningún campo `tasaAceptada`, por eso se mostraba 0% siempre.
        // Se reemplaza por `plazo` que sí existe en el documento.
        frSnap.forEach(doc => {
          const d = doc.data();
          const monto = getMontoFinanciamiento(d);
          const plazo = d.plazo ? `${d.plazo} días` : "—";
          allItems.push({
            id: `fr-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "industry",
            roleLabel: "Acopiador",
            type: "Solicitud Financiamiento",
            title: `Financiamiento solicitado: $${fmtMoney(monto)}`,
            description: `Motivo: ${d.motivoFinanciamiento || "—"} | Plazo: ${plazo}`,
            icon: "◇",
            color: "#58A6FF"
          });
        });

        // 3. Certificaciones (Producer) - Orden de Venta
        // tokenizar.jsx guarda los kgs como `totalKgs` (no `kgs`).
        ptSnap.forEach(doc => {
          const d = doc.data();
          const isAsociada = d.tipoVenta === "asociada";
          
          let precio = parseFloat(d.precioVenta) || 0;
          const totalVal = parseFloat(d.usdTotal) || 0;
          
          if (isAsociada && d.associationId) {
            const assocDoc = paSnap.docs.find(a => a.id === d.associationId);
            if (assocDoc) {
              const assocData = assocDoc.data();
              const totalKgsAssoc = parseFloat(assocData.inventario?.totalKgs) || 0;
              const totalUsdAssoc = parseFloat(assocData.inventario?.usdFinanciamientoTotal) || 0;
              if (totalKgsAssoc > 0) {
                precio = totalUsdAssoc / totalKgsAssoc;
              }
            }
          }

          allItems.push({
            id: `pt-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "producer",
            roleLabel: "Productor",
            type: isAsociada ? "Orden de Venta Asociada" : "Orden de Venta Individual",
            title: `Certificados ${fmtFardos(d.cantidadFardos)} Fardos (TABAR)`,
            description: `Tabaco ${d.tipoTabaco} | Calidad: ${d.calidad} | Kgs Totales: ${fmtKgs(getKgs(d))} | Precio/Kg: $${fmtMoney(precio)}${isAsociada ? " (Promedio)" : ""} | Valor Total: $${fmtMoney(totalVal)}`,
            icon: isAsociada ? "👥" : "🌿",
            color: isAsociada ? "#1f883d" : "#3FB950"
          });
        });

        // 4. Asociaciones (Producer)
        paSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `pa-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "producer",
            roleLabel: "Productor",
            type: "Nueva Asociación",
            title: `Formación de Asociación: "${d.nombre}"`,
            description: `Productores unidos: ${d.productores?.length || 1} | Inventario Total: ${fmtFardos(d.inventario?.totalFardos)} Fardos`,
            icon: "👥",
            color: "#3FB950"
          });
        });

        // 5. POAs (State)
        puSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `poa-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "state",
            roleLabel: "Estado Nacional",
            type: "Carga POA",
            title: `Presentación POA: ${d.entidad}`,
            description: `Monto solicitado: $${fmtMoney(d.monto)} | Proyecto: ${d.nombreProyecto || 'N/A'}`,
            icon: "△",
            color: "#F0883E"
          });
        });

        // 6. Novedades FET (State)
        // state/returns.jsx guarda el discriminador como `tipo` (no `tipoA`) con valores "A", "B" o "C":
        //   - "A" Precio FET:        { precioFet, monto, fecha, comentarios }
        //   - "B" Novedades Campaña: { informacion, fileUrl }
        //   - "C" Transferencia:     { provincia, nroResolucion, anio, monto, informacionAdicional }
        // Se mantiene compatibilidad con docs viejos (tipoA, comentariosA, comentariosB, montoC).
        nfSnap.forEach(doc => {
          const d = doc.data();
          const tipo = d.tipo ?? d.tipoA;
          // Monto: en tipo C el escritor usa `monto`; docs viejos pueden tener `montoC`.
          const montoTransferencia = Number(d.monto ?? d.montoC ?? 0);
          // Comentarios A
          const comentariosTipoA = d.comentarios ?? d.comentariosA ?? "";
          // Texto del cuerpo en tipo B
          const textoTipoB = d.informacion ?? d.comentariosB ?? "Novedad sin detalle";

          const tipoNovedad =
            tipo === "A" ? "Precio FET Actualizado" :
            tipo === "B" ? "Novedades Campaña FET" :
            tipo === "C" ? "Transferencia a Provincia" :
            "Novedad FET";

          let desc;
          if (tipo === "A") {
            const precio = d.precioFet ? `Precio FET: ${d.precioFet}` : "Precio FET";
            desc = `${precio} | Monto equivalente: $${fmtMoney(d.monto)}${comentariosTipoA ? ` | Comentarios: ${comentariosTipoA}` : ""}`;
          } else if (tipo === "B") {
            desc = textoTipoB;
          } else if (tipo === "C") {
            desc = `Resolución: ${d.nroResolucion ?? "—"} | Año: ${d.anio ?? "—"} | Provincia: ${d.provincia ?? "—"} | Monto: $${fmtMoney(montoTransferencia)}`;
          } else {
            desc = "Novedad sin tipo identificado";
          }

          allItems.push({
            id: `fet-${doc.id}`,
            rawId: doc.id,
            rawDoc: d,
            date: parseDate(doc),
            role: "state",
            roleLabel: "Estado Nacional (FET)",
            type: "Novedad FET",
            title: tipoNovedad,
            description: desc,
            icon: "◉",
            color: "#F0883E"
          });
        });

        // Ordenar del más reciente al más antiguo
        allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
        setItems(allItems);

      } catch (err) {
        console.error("Error fetching market data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="tabar-page">
        <div className="market-loading">
          <div className="spinner-large" style={{ margin: "0 auto 16px auto", borderColor: "rgba(227,182,79,0.2)", borderTopColor: "#E3B64F" }} />
          Sincronizando transacciones de la red...
        </div>
      </div>
    );
  }

  return (
    <div className="tabar-page">
      <div className="tabar-page-header">
        <h1 className="tabar-page-title">Mercado Tabacalero</h1>
        <p className="tabar-page-subtitle">Pizarrón público de actividades, transacciones y novedades de la comunidad. (Solo lectura)</p>
      </div>

      <div className="market-feed">
        {items.length === 0 ? (
          <div className="market-empty">No hay actividades recientes publicadas en el mercado.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="market-card" style={{ '--card-color': item.color }}>
              <div className="market-card-icon" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {item.icon}
              </div>
              <div className="market-card-content">
                <div className="market-card-header">
                  <span className="market-card-type" style={{ color: item.color }}>{item.type}</span>
                  <span className="market-card-date">
                    {item.date.toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="market-card-title">{item.title}</h3>
                <p className="market-card-desc">{item.description}</p>
                {item.rawDoc?.fotoUrl && (
                  <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                    <img 
                      src={item.rawDoc.fotoUrl} 
                      alt="Muestra de tabaco" 
                      style={{ 
                        maxWidth: "100%", 
                        maxHeight: "160px", 
                        borderRadius: "8px", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        objectFit: "cover",
                        display: "block"
                      }} 
                    />
                  </div>
                )}
                <div className="market-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="market-card-role">{item.roleLabel}</span>
                  {role === "dealer" && item.type !== "Novedad FET" && (
                    <button
                      onClick={() => handleOperar(item)}
                      style={{
                        background: "#E3B64F",
                        color: "#000",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.2s"
                      }}
                    >
                      Operar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
