import { useState, useEffect } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

export default function ProducerAsociaciones() {
  const { user } = useRole();
  const [asociaciones, setAsociaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAsociaciones = async () => {
      try {
        if (!user?.uid) return;

        const q = query(
          collection(db, "producer_associations"),
          where("productores", "array-contains", { uid: user.uid })
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAsociaciones(data);
      } catch (err) {
        console.error("Error fetching asociaciones:", err);
        setError("Error al cargar asociaciones");
      }
      setLoading(false);
    };

    fetchAsociaciones();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Cargando...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "#F85149", textAlign: "center", padding: "40px" }}>
        {error}
      </div>
    );
  }

  if (asociaciones.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>📭</div>
        <h2 style={{ color: "#8B949E" }}>Sin asociaciones aún</h2>
        <p style={{ color: "#8B949E", marginBottom: "30px" }}>
          Cuando certifiques tabaco con "Venta Asociada", aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>👥</div>
          <h1>Mis Asociaciones de Venta</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>
          Visualiza y gestiona tus asociaciones de productores
        </p>
      </div>

      {asociaciones.map((asoc) => (
        <div key={asoc.id} className="tabar-card" style={{ marginBottom: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{asoc.nombre}</h3>
            <span style={{
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              background: asoc.estado === "activa" ? "rgba(63,185,80,0.2)" : "rgba(248,81,73,0.2)",
              color: asoc.estado === "activa" ? "#3FB950" : "#F85149"
            }}>
              {asoc.estado.toUpperCase()}
            </span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#8B949E", margin: "0 0 8px 0" }}>
              Coordinador: <strong>{asoc.productores.find(p => p.rol === "coordinador")?.nombre}</strong>
            </p>
            <p style={{ fontSize: "12px", color: "#8B949E", margin: 0 }}>
              Miembros: {asoc.productores.map(p => p.nombre).join(", ")}
            </p>
          </div>

          <div style={{
            background: "rgba(63,185,80,0.05)",
            border: "1px solid rgba(63,185,80,0.2)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: C.accent }}>
              INVENTARIO CONSOLIDADO
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "#8B949E" }}>Total Kgs:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.totalKgs.toLocaleString("es-AR")} kg</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Total Fardos:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.totalFardos}</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Tipo de Tabaco:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.tipoTabaco}</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Financiamiento USD:</span>
                <p style={{ margin: 0, fontWeight: 600, color: C.accent }}>USD ${asoc.inventario.usdFinanciamientoTotal.toLocaleString("es-AR")}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#8B949E" }}>MIS APORTES</h4>
            <AportesDetalle asociacionId={asoc.id} productorUID={user.uid} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="tabar-btn tabar-btn-ghost" style={{ fontSize: "12px" }}>
              Ver detalles completos
            </button>
            {asoc.estado === "vendida" && (
              <button className="tabar-btn tabar-btn-ghost" style={{ fontSize: "12px" }}>
                Ver comprobante de venta
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AportesDetalle({ asociacionId, productorUID }) {
  const [aportes, setAportes] = useState([]);

  useEffect(() => {
    const fetchAportes = async () => {
      try {
        const q = query(
          collection(db, "producer_tokenizations"),
          where("associationId", "==", asociacionId)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(doc => doc.data())
          .filter(d => d.productorOwner === productorUID);
        setAportes(data);
      } catch (err) {
        console.error("Error fetching aportes:", err);
      }
    };
    fetchAportes();
  }, [asociacionId, productorUID]);

  return (
    <div style={{ fontSize: "12px" }}>
      {aportes.length === 0 ? (
        <p style={{ color: "#8B949E", margin: 0 }}>Sin aportes registrados</p>
      ) : (
        aportes.map((aporte, idx) => (
          <div
            key={idx}
            style={{
              padding: "8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "4px",
              marginBottom: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B949E" }}>Aporte {idx + 1}</span>
              <span style={{ fontWeight: 600 }}>{aporte.aporteKgs} kg en {aporte.aporteFardos} fardos</span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#8B949E", fontSize: "11px" }}>
              📅 {new Date(aporte.timestamp?.toDate?.() || aporte.timestamp).toLocaleDateString("es-AR")}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
