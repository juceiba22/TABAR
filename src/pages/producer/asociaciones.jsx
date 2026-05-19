import { useState, useEffect } from "react";
import { useData } from "../../modules/roles/DataContext";
import { useRole } from "../../modules/roles/RoleContext";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function ProducerAssociations() {
  const { crearOUnirseAsociacion, venderAsociacionEnBloque } = useData();
  const { user, profile } = useRole();

  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to associations where I am a member
    const unsubscribe = onSnapshot(collection(db, "producer_associations"), (snapshot) => {
      const assocs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Check if user is in producers array or created it
        if (data.creadoPor === user.uid || (data.productores && data.productores.some(p => p.uid === user.uid))) {
           assocs.push({ id: doc.id, ...data });
        }
      });
      setAssociations(assocs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching associations:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateAssociation = async () => {
    if (!newNombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setError("");
    setCreating(true);

    const assocId = `ASSOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAssoc = {
      id: assocId,
      nombre: newNombre,
      creadoPor: user.uid,
      productores: [{
        uid: user.uid,
        nombre: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.displayName || user.email,
        email: user.email,
        rol: "coordinador"
      }],
      totalKgsConsolidados: 0
    };

    const res = await crearOUnirseAsociacion(newAssoc);
    if (res.ok) {
      setSuccess("Asociación creada con éxito");
      setNewNombre("");
      setShowCreateModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(res.error || "Error al crear la asociación");
    }
    setCreating(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>🤝</div>
          <h1>Asociaciones y Venta en Bloque</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Consolida tu inventario con otros productores para negociar mejores precios.</p>
      </div>

      {success && (
        <div style={{ color: "#3FB950", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(63,185,80,0.1)", borderRadius: "6px", border: "1px solid rgba(63,185,80,0.2)" }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ color: "#F85149", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px", border: "1px solid rgba(248,81,73,0.2)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button 
          className="tabar-btn tabar-btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          Nueva Asociación
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#8B949E", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>Cargando asociaciones...</p>
      ) : associations.length === 0 ? (
        <div className="tabar-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "30px", marginBottom: "16px" }}>👥</div>
          <h3 style={{ color: "var(--tb-text)", margin: "0 0 8px 0" }}>Aún no perteneces a ninguna asociación</h3>
          <p style={{ color: "#8B949E", fontSize: "12px", margin: 0 }}>Crea una nueva asociación para agrupar kilos de tabaco y vender en bloque.</p>
        </div>
      ) : (
        associations.map(assoc => (
          <div key={assoc.id} className="tabar-card" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 className="tabar-card-title" style={{ margin: "0 0 4px 0", color: C.accent }}>{assoc.nombre}</h3>
                <p style={{ fontSize: "11px", color: "#8B949E", margin: 0 }}>ID: {assoc.id}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", color: "var(--tb-text)" }}>
                {assoc.estadoAsociacion === "activa" ? "Activa" : "Inactiva"}
              </div>
            </div>

            <div style={{ background: "var(--tb-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--tb-border)", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", color: "#8B949E", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Inventario Consolidado</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "24px", color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>
                  {assoc.totalKgsConsolidados?.toLocaleString("es-AR") || 0}
                </span>
                <span style={{ color: "#8B949E", fontSize: "12px" }}>Kgs disponibles</span>
              </div>
            </div>

            <h4 style={{ fontSize: "12px", color: "var(--tb-text)", margin: "0 0 12px 0" }}>Miembros ({assoc.productores?.length || 0})</h4>
            <div style={{ overflowX: "auto" }}>
              <table className="tabar-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {assoc.productores?.map(p => (
                    <tr key={p.uid}>
                      <td>{p.nombre} {p.uid === user.uid ? "(Tú)" : ""}</td>
                      <td>{p.email}</td>
                      <td>
                        <span style={{ 
                          fontSize: "10px", 
                          background: p.rol === "coordinador" ? "rgba(227,182,79,0.1)" : "rgba(255,255,255,0.05)",
                          color: p.rol === "coordinador" ? "#E3B64F" : "#8B949E",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase"
                        }}>
                          {p.rol}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                {/* Venta en bloque button only enabled if there's stock and user is coordinator (or created it) */}
                {(assoc.creadoPor === user.uid || assoc.productores?.find(p => p.uid === user.uid)?.rol === "coordinador") && (
                   <button 
                    className="tabar-btn tabar-btn-primary" 
                    style={{ background: C.accent, color: "#000" }}
                    disabled={!assoc.totalKgsConsolidados || assoc.totalKgsConsolidados <= 0}
                    onClick={() => {
                        // TODO: Implementar modal de venta en bloque
                        alert("Flujo de venta en bloque en desarrollo");
                    }}
                   >
                     Ejecutar Venta en Bloque
                   </button>
                )}
            </div>
          </div>
        ))
      )}

      {/* Modal for creating association */}
      {showCreateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="tabar-card" style={{ width: "100%", maxWidth: "400px", background: "#161B22" }}>
            <h3 className="tabar-card-title">Crear Asociación</h3>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Define un nombre para tu nueva asociación de productores.
            </p>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px" }}>
                Nombre de la Asociación
              </label>
              <input
                type="text"
                className="tabar-input"
                placeholder="Ej: Cooperativa del Norte"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                disabled={creating}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                className="tabar-btn tabar-btn-ghost" 
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button 
                className="tabar-btn tabar-btn-primary" 
                onClick={handleCreateAssociation}
                disabled={creating || !newNombre.trim()}
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
