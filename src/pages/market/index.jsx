import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import "./market.css";

export default function MarketPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

        // Función auxiliar para extraer de forma segura el Timestamp o Date de un documento
        const parseDate = (doc) => {
          const data = doc.data();
          if (data.creadoEn?.toDate) return data.creadoEn.toDate();
          if (data.timestamp?.toDate) return data.timestamp.toDate();
          if (data.fecha) return new Date(data.fecha);
          if (data.fechaTransferencia) return new Date(data.fechaTransferencia);
          // Fallback al ID del documento si es numérico (Date.now())
          const idNum = Number(doc.id);
          if (!isNaN(idNum) && idNum > 1000000000000) return new Date(idNum);
          return new Date(); // fallback extremo
        };

        // 1. Órdenes de compra (Industry)
        poSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `po-${doc.id}`,
            date: parseDate(doc),
            role: "industry",
            roleLabel: "Acopiador",
            type: "Orden de Compra",
            title: `Orden emitida: ${d.cantidadKgs?.toLocaleString() || 0} Kgs`,
            description: `Tipo de Tabaco: ${d.tipoTabaco} | Calidad: ${d.calidad} | Inversión: $${d.usdTotal?.toLocaleString() || 0}`,
            icon: "▣",
            color: "#58A6FF"
          });
        });

        // 2. Financiamiento (Industry)
        frSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `fr-${doc.id}`,
            date: parseDate(doc),
            role: "industry",
            roleLabel: "Acopiador",
            type: "Solicitud Financiamiento",
            title: `Financiamiento solicitado: $${d.montoSolicitado?.toLocaleString() || 0}`,
            description: `Motivo: ${d.motivoFinanciamiento} | Tasa aceptada: ${d.tasaAceptada || 0}%`,
            icon: "◇",
            color: "#58A6FF"
          });
        });

        // 3. Certificaciones (Producer)
        ptSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `pt-${doc.id}`,
            date: parseDate(doc),
            role: "producer",
            roleLabel: "Productor",
            type: "Certificación de Fardos",
            title: `Certificados ${d.cantidadFardos || 0} Fardos (TABAR)`,
            description: `Tabaco ${d.tipoTabaco} | Calidad: ${d.calidad} | Kgs Totales: ${d.kgs?.toLocaleString() || 0}`,
            icon: "🌿",
            color: "#3FB950"
          });
        });

        // 4. Asociaciones (Producer)
        paSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `pa-${doc.id}`,
            date: parseDate(doc),
            role: "producer",
            roleLabel: "Productor",
            type: "Nueva Asociación",
            title: `Formación de Asociación: "${d.nombre}"`,
            description: `Productores unidos: ${d.productores?.length || 1} | Inventario Total: ${d.inventario?.totalFardos || 0} Fardos`,
            icon: "👥",
            color: "#3FB950"
          });
        });

        // 5. POAs (State)
        puSnap.forEach(doc => {
          const d = doc.data();
          allItems.push({
            id: `poa-${doc.id}`,
            date: parseDate(doc),
            role: "state",
            roleLabel: "Estado Nacional",
            type: "Carga POA",
            title: `Presentación POA: ${d.entidad}`,
            description: `Monto solicitado: $${d.monto?.toLocaleString() || 0} | Proyecto: ${d.nombreProyecto || 'N/A'}`,
            icon: "△",
            color: "#F0883E"
          });
        });

        // 6. Novedades FET (State)
        nfSnap.forEach(doc => {
          const d = doc.data();
          const tipoNovedad = d.tipoA === "A" ? `Precio FET Actualizado` : d.tipoA === "B" ? `Novedades Campaña FET` : `Transferencia a Provincia`;
          const desc = d.tipoA === "A" 
            ? `${d.tipoTabaco}: $${d.monto} | Comentarios: ${d.comentariosA}` 
            : d.tipoA === "B" 
            ? d.comentariosB 
            : `Resolución: ${d.nroResolucion} | Año: ${d.anio} | Provincia: ${d.provincia} | Monto: $${d.montoC?.toLocaleString()}`;
            
          allItems.push({
            id: `fet-${doc.id}`,
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
                <div className="market-card-footer">
                  <span className="market-card-role">{item.roleLabel}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
