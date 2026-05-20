import { useState, useEffect } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

export default function ProducerAsociaciones() {
  const { user } = useRole();
  const { crearAsociacion, obtenerTodasLasAsociaciones } = useData();
  const [asociaciones, setAsociaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssocName, setNewAssocName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAsociaciones = async () => {
    try {
      const res = await obtenerTodasLasAsociaciones();
      if (res.ok) {
        setAsociaciones(res.asociaciones || []);
      } else {
        setError(res.error || "Error al cargar asociaciones");
      }
    } catch (err) {
      console.error("Error fetching asociaciones:", err);
      setError("Error al cargar asociaciones");
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      if (user?.uid) {
        await fetchAsociaciones();
      }
      setLoading(false);
    };
    initFetch();
  }, [user]);

  const handleCrearAsociacion = async (e) => {
    e.preventDefault();
    if (!newAssocName.trim()) return;

    setCreating(true);
    try {
      const res = await crearAsociacion(newAssocName.trim());
      if (res.ok) {
        setNewAssocName("");
        setShowCreateModal(false);
        await fetchAsociaciones();
      } else {
        alert(res.error || "Error al crear la asociación");
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar la solicitud");
    }
    setCreating(false);
  };

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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="tabar-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div className="tabar-page-header-row">
            <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>👥</div>
            <h1 style={{ margin: 0 }}>Asociaciones de Venta</h1>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "#8B949E", fontSize: "13px" }}>
            Visualizá y participá en las asociaciones fiduciarias de productores
          </p>
        </div>
        <button 
          className="tabar-btn tabar-btn-primary" 
          onClick={() => setShowCreateModal(true)}
          style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", height: "fit-content" }}
        >
          <span>➕</span> Crear Asociación
        </button>
      </div>

      {asociaciones.length === 0 ? (
        <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: "50px", marginBottom: "20px" }}>📭</div>
          <h2 style={{ color: "#8B949E" }}>Sin asociaciones aún</h2>
          <p style={{ color: "#8B949E", marginBottom: "30px" }}>
            Sé el primero en crear una asociación para que otros productores puedan unirse.
          </p>
        </div>
      ) : (
        asociaciones.map((asoc) => {
          const coorObj = asoc.productores?.find(p => p.rol === "coordinador");
          const esMiembro = asoc.productoresUIDs?.includes(user.uid) || asoc.productores?.some(p => p.uid === user.uid);
          const esCoordinador = coorObj?.uid === user.uid;

          return (
            <div key={asoc.id} className="tabar-card" style={{ marginBottom: "20px", border: esMiembro ? "1px solid rgba(63,185,80,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>{asoc.nombre}</h3>
                  {esCoordinador ? (
                    <span style={{ background: "rgba(56,139,253,0.15)", color: "#58A6FF", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>Coordinador</span>
                  ) : esMiembro ? (
                    <span style={{ background: "rgba(63,185,80,0.15)", color: "#3FB950", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>Miembro</span>
                  ) : null}
                </div>
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
                  Coordinador: <strong>{coorObj?.nombre || "No asignado"}</strong>
                </p>
                <p style={{ fontSize: "12px", color: "#8B949E", margin: 0 }}>
                  Miembros: <span style={{ color: "#C9D1D9" }}>{asoc.productores?.map(p => p.nombre).join(", ") || "Ninguno"}</span>
                </p>
              </div>

              <div style={{
                background: "rgba(63,185,80,0.03)",
                border: "1px solid rgba(63,185,80,0.15)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: C.accent, letterSpacing: "0.5px" }}>
                  INVENTARIO CONSOLIDADO
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#8B949E" }}>Total Kgs:</span>
                    <p style={{ margin: 0, fontWeight: 600 }}>{(asoc.inventario?.totalKgs || 0).toLocaleString("es-AR")} kg</p>
                  </div>
                  <div>
                    <span style={{ color: "#8B949E" }}>Total Fardos:</span>
                    <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario?.totalFardos || 0}</p>
                  </div>
                  <div>
                    <span style={{ color: "#8B949E" }}>Tipos de Tabaco:</span>
                    <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario?.tipoTabaco || "Ninguno"}</p>
                  </div>
                  <div>
                    <span style={{ color: "#8B949E" }}>Financiamiento USD:</span>
                    <p style={{ margin: 0, fontWeight: 600, color: C.accent }}>USD ${(asoc.inventario?.usdFinanciamientoTotal || 0).toLocaleString("es-AR")}</p>
                  </div>
                </div>

                {/* Desglose por tipo de tabaco */}
                {asoc.inventario?.tiposTabaco && asoc.inventario.tiposTabaco.length > 0 && (
                  <div style={{ marginTop: "14px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                    <span style={{ color: "#8B949E", display: "block", marginBottom: "8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Desglose de Aportes:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {asoc.inventario.tiposTabaco.map((t, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "6px 12px", borderRadius: "4px", fontSize: "11px" }}>
                          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>🌿 {t.tipo}</span>
                          <span>
                            <strong>{t.kgs.toLocaleString("es-AR")} kg</strong> ({t.fardos} fardos)
                            <span style={{ color: C.accent, marginLeft: "10px", fontWeight: "bold" }}>USD ${(t.usdTotal || 0).toLocaleString("es-AR")}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {esMiembro && (
                <div style={{ marginBottom: "12px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#8B949E" }}>MIS APORTES</h4>
                  <AportesDetalle asociacionId={asoc.id} productorUID={user.uid} />
                </div>
              )}

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
          );
        })
      )}

      {/* Modal para Crear Asociación */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="tabar-card" style={{
            maxWidth: "450px",
            width: "100%",
            background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            padding: "24px",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#FFF" }}>Crear Nueva Asociación</h3>
            <p style={{ color: "#8B949E", fontSize: "12px", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              Creá un grupo de venta colectiva. Otros productores del sistema podrán seleccionar esta asociación al certificar sus fardos para consolidar stock y vender en bloque.
            </p>
            <form onSubmit={handleCrearAsociacion}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
                  Nombre de la Asociación *
                </label>
                <input
                  type="text"
                  required
                  className="tabar-input"
                  placeholder="Ej: Cooperativa Virginia 2026"
                  value={newAssocName}
                  onChange={(e) => setNewAssocName(e.target.value)}
                  disabled={creating}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="tabar-btn tabar-btn-ghost"
                  onClick={() => { setShowCreateModal(false); setNewAssocName(""); }}
                  disabled={creating}
                  style={{ fontSize: "13px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tabar-btn tabar-btn-primary"
                  disabled={creating || !newAssocName.trim()}
                  style={{ fontSize: "13px" }}
                >
                  {creating ? "Creando..." : "Crear Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
