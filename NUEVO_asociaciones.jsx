import { useState, useEffect } from "react";
import { useData } from "../modules/roles/DataContext";
import { useRole } from "../modules/roles/RoleContext";

export default function ProducerAssociaciones() {
  const { crearAsociacion, obtenerAsociacionesDelProductor, obtenerAsociacionesDisponiblesParaUnirse, unirseAAsociacion } = useData();
  const { user } = useRole();

  // Estados para crear asociación
  const [nombreAsociacion, setNombreAsociacion] = useState("");
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");
  const [successCrear, setSuccessCrear] = useState(false);

  // Estados para mis asociaciones
  const [misAsociaciones, setMisAsociaciones] = useState([]);
  const [loadingMias, setLoadingMias] = useState(true);

  // Estados para unirse
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(true);
  const [errorUnirse, setErrorUnirse] = useState("");
  const [successUnirse, setSuccessUnirse] = useState("");

  // Cargar asociaciones al montar
  useEffect(() => {
    cargarAsociaciones();
  }, [user]);

  const cargarAsociaciones = async () => {
    if (!user?.uid) return;

    setLoadingMias(true);
    setLoadingDisponibles(true);

    try {
      // Cargar mis asociaciones
      const resMias = await obtenerAsociacionesDelProductor();
      if (resMias.ok) {
        setMisAsociaciones(resMias.asociaciones || []);
      }

      // Cargar asociaciones disponibles para unirse
      const resDisp = await obtenerAsociacionesDisponiblesParaUnirse();
      if (resDisp.ok) {
        setAsociacionesDisponibles(resDisp.asociaciones || []);
      }
    } catch (err) {
      console.error("Error al cargar asociaciones:", err);
    } finally {
      setLoadingMias(false);
      setLoadingDisponibles(false);
    }
  };

  const handleCrearAsociacion = async () => {
    if (!nombreAsociacion.trim()) {
      setErrorCrear("El nombre de la asociación no puede estar vacío");
      return;
    }

    setLoadingCrear(true);
    setErrorCrear("");
    setSuccessCrear(false);

    try {
      const res = await crearAsociacion(nombreAsociacion);
      if (res.ok) {
        setSuccessCrear(true);
        setNombreAsociacion("");
        setTimeout(() => setSuccessCrear(false), 3000);
        // Recargar lista
        cargarAsociaciones();
      } else {
        setErrorCrear(res.error || "Error al crear la asociación");
      }
    } catch (err) {
      setErrorCrear(err.message || "Error desconocido");
    } finally {
      setLoadingCrear(false);
    }
  };

  const handleUnirseAsociacion = async (associationId) => {
    setLoadingDisponibles(true);
    setErrorUnirse("");
    setSuccessUnirse("");

    try {
      // Unirse con datos mínimos (sin tokenización)
      const res = await unirseAAsociacion(associationId, {
        tipoTabaco: "Por definir",
        calidad: "Por definir",
        kgs: 0,
        cantidadFardos: 0,
        usdTotal: 0
      });

      if (res.ok) {
        setSuccessUnirse("¡Te has unido correctamente a la asociación!");
        setTimeout(() => setSuccessUnirse(""), 3000);
        cargarAsociaciones();
      } else {
        setErrorUnirse(res.error || "Error al unirse a la asociación");
      }
    } catch (err) {
      setErrorUnirse(err.message || "Error desconocido");
    } finally {
      setLoadingDisponibles(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "30px" }}>
        🤝 Asociaciones de Productores
      </h1>

      {/* SECCIÓN 1: CREAR ASOCIACIÓN */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>
          ✨ Crear Nueva Asociación
        </h2>

        {errorCrear && (
          <div
            style={{
              backgroundColor: "#da3633",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ❌ {errorCrear}
          </div>
        )}

        {successCrear && (
          <div
            style={{
              backgroundColor: "#238636",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ✅ ¡Asociación creada exitosamente!
          </div>
        )}

        <input
          type="text"
          className="tabar-input"
          placeholder="Nombre de la asociación"
          value={nombreAsociacion}
          onChange={(e) => setNombreAsociacion(e.target.value)}
          disabled={loadingCrear}
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <button
          onClick={handleCrearAsociacion}
          disabled={loadingCrear || !nombreAsociacion.trim()}
          style={{
            backgroundColor: "#238636",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loadingCrear ? "not-allowed" : "pointer",
            opacity: loadingCrear || !nombreAsociacion.trim() ? 0.6 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {loadingCrear ? "Creando..." : "Crear Asociación"}
        </button>
      </div>

      {/* SECCIÓN 2: MIS ASOCIACIONES */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>
          📋 Mis Asociaciones ({misAsociaciones.length})
        </h2>

        {loadingMias ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>Cargando...</p>
        ) : misAsociaciones.length === 0 ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>
            Aún no perteneces a ninguna asociación. Crea una o únete a una existente.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {misAsociaciones.map((asoc) => (
              <div
                key={asoc.id}
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "13px"
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "8px", color: "#e6edf3" }}>
                  {asoc.nombre}
                </div>
                <div style={{ color: "#8B949E", fontSize: "12px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  <div>👥 Miembros: {asoc.productores?.length || 0}</div>
                  <div>📦 Fardos: {asoc.inventario?.totalFardos || 0}</div>
                  <div>⚖️ Total Kgs: {asoc.inventario?.totalKgs || 0}</div>
                  <div>💰 Creado: {asoc.creadoPor === user.uid ? "por ti" : "por otro productor"}</div>
                </div>

                {asoc.inventario?.tiposTabaco && asoc.inventario.tiposTabaco.length > 0 && (
                  <div style={{ color: "#8B949E", fontSize: "12px", marginTop: "8px", backgroundColor: "#0d1117", padding: "8px", borderRadius: "4px" }}>
                    <strong style={{ color: "#e6edf3" }}>Tipos de tabaco:</strong>
                    {asoc.inventario.tiposTabaco.map((tipo, idx) => (
                      <div key={idx} style={{ marginLeft: "16px", marginTop: "4px" }}>
                        <strong>{tipo.tipo}</strong>: {tipo.kgs} Kgs ({tipo.fardos} fardos) - ${tipo.usdTotal.toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}

                {asoc.productores && (
                  <div style={{ color: "#8B949E", fontSize: "11px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #30363d" }}>
                    <strong style={{ color: "#e6edf3" }}>Productores:</strong> {asoc.productores.map(p => p.nombre).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: UNIRSE A ASOCIACIONES */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#e6edf3" }}>
          🔗 Asociaciones Disponibles para Unirte ({asociacionesDisponibles.length})
        </h2>

        {errorUnirse && (
          <div
            style={{
              backgroundColor: "#da3633",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ❌ {errorUnirse}
          </div>
        )}

        {successUnirse && (
          <div
            style={{
              backgroundColor: "#238636",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ✅ {successUnirse}
          </div>
        )}

        {loadingDisponibles ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>Cargando...</p>
        ) : asociacionesDisponibles.length === 0 ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>
            No hay asociaciones disponibles para unirse en este momento.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {asociacionesDisponibles.map((asoc) => (
              <div
                key={asoc.id}
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "13px", color: "#e6edf3" }}>
                    {asoc.nombre}
                  </div>
                  <div style={{ color: "#8B949E", fontSize: "12px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
                    <div>👥 {asoc.cantidadProductores} miembro{asoc.cantidadProductores !== 1 ? "s" : ""}</div>
                    <div>📦 {asoc.inventario?.totalFardos || 0} Fardos</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnirseAsociacion(asoc.id)}
                  disabled={loadingDisponibles}
                  style={{
                    backgroundColor: "#238636",
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: loadingDisponibles ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "opacity 0.2s"
                  }}
                >
                  {loadingDisponibles ? "..." : "Unirse"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
