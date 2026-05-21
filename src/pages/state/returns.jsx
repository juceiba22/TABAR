import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { db, storage } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

export default function StateReturns() {
  const { user } = useRole();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [novedad, setNovedad] = useState("");
  
  // Option A State
  const [precioFet, setPrecioFet] = useState("");
  const [montoA, setMontoA] = useState("");
  const [fechaA, setFechaA] = useState("");
  const [comentariosA, setComentariosA] = useState("");

  // Option B State
  const [infoB, setInfoB] = useState("");
  const [fileB, setFileB] = useState(null);

  // Option C State
  const [provincia, setProvincia] = useState("");
  const [nroResolucion, setNroResolucion] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [montoC, setMontoC] = useState("");
  const [infoAdicionalC, setInfoAdicionalC] = useState("");

  const resetForm = () => {
    setNovedad("");
    setPrecioFet(""); setMontoA(""); setFechaA(""); setComentariosA("");
    setInfoB(""); setFileB(null);
    setProvincia(""); setNroResolucion(""); setAnio(new Date().getFullYear()); setMontoC(""); setInfoAdicionalC("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let data = {
        tipo: novedad,
        createdAt: serverTimestamp(),
        userId: user?.uid || "unknown",
      };

      if (novedad === "A") {
        data = {
          ...data,
          precioFet,
          monto: Number(montoA),
          fecha: fechaA,
          comentarios: comentariosA,
        };
      } else if (novedad === "B") {
        let fileUrl = null;
        if (fileB) {
          const fileRef = ref(storage, `novedades_fet/${Date.now()}_${fileB.name}`);
          const snapshot = await uploadBytes(fileRef, fileB);
          fileUrl = await getDownloadURL(snapshot.ref);
        }
        data = {
          ...data,
          informacion: infoB,
          fileUrl,
        };
      } else if (novedad === "C") {
        data = {
          ...data,
          provincia,
          nroResolucion: Number(nroResolucion),
          anio: Number(anio),
          monto: Number(montoC),
          informacionAdicional: infoAdicionalC,
        };
      } else {
        throw new Error("Debe seleccionar un tipo de novedad válido.");
      }

      await addDoc(collection(db, "novedades_fet"), data);
      
      setSuccess(true);
      resetForm();
    } catch (err) {
      console.error("Error al guardar:", err);
      setError("Hubo un error al guardar la información. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>△</div>
          <h1>Información del FET</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Novedades del Fondo Especial del Tabaco</p>
      </div>

      <div className="tabar-card" style={{ maxWidth: "600px" }}>
        {success && (
          <div style={{ padding: "12px", background: "rgba(63,185,80,0.1)", color: "#3FB950", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
            ¡Información guardada exitosamente!
          </div>
        )}
        {error && (
          <div style={{ padding: "12px", background: "rgba(248,81,73,0.1)", color: "#F85149", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="tabar-form-group">
            <label className="tabar-label">Nueva Novedad</label>
            <select className="tabar-input" value={novedad} onChange={(e) => setNovedad(e.target.value)} required>
              <option value="">Seleccione una opción...</option>
              <option value="A">A) Precio FET</option>
              <option value="B">B) Novedades Campaña 2026/2027</option>
              <option value="C">C) Transferencias a Provincias</option>
            </select>
          </div>

          {/* OPCIÓN A */}
          {novedad === "A" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--tb-border)" }}>
              <div className="tabar-form-group">
                <label className="tabar-label">Informar precio FET</label>
                <select className="tabar-input" value={precioFet} onChange={(e) => setPrecioFet(e.target.value)} required>
                  <option value="">Seleccione tipo...</option>
                  <option value="virginia">1.a) Precio FET virginia</option>
                  <option value="burley">1.b) Precio FET Burley</option>
                  <option value="criollo">1.c) Precio FET Criollo</option>
                </select>
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Monto ($)</label>
                <input type="number" step="0.01" className="tabar-input" value={montoA} onChange={(e) => setMontoA(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Fecha de la transferencia</label>
                <input type="date" className="tabar-input" value={fechaA} onChange={(e) => setFechaA(e.target.value)} required />
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Comentarios adicionales</label>
                <textarea className="tabar-input" value={comentariosA} onChange={(e) => setComentariosA(e.target.value)} rows={3} placeholder="Ingrese comentarios (opcional)"></textarea>
              </div>
            </div>
          )}

          {/* OPCIÓN B */}
          {novedad === "B" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--tb-border)" }}>
              <div className="tabar-form-group">
                <label className="tabar-label">¿Qué querés informar?</label>
                <textarea className="tabar-input" value={infoB} onChange={(e) => setInfoB(e.target.value)} rows={5} maxLength={2500} placeholder="Escriba aquí (máx 2500 caracteres)..." required></textarea>
                <div style={{ fontSize: "11px", color: "#8B949E", textAlign: "right", marginTop: "4px" }}>
                  {infoB.length}/2500
                </div>
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Cargar imagen o video (Opcional)</label>
                <input type="file" className="tabar-input" accept="image/*,video/*" onChange={(e) => setFileB(e.target.files[0])} style={{ padding: "8px" }} />
              </div>
            </div>
          )}

          {/* OPCIÓN C */}
          {novedad === "C" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--tb-border)" }}>
              <div className="tabar-form-group">
                <label className="tabar-label">Informar transferencia a Provincia</label>
                <select className="tabar-input" value={provincia} onChange={(e) => setProvincia(e.target.value)} required>
                  <option value="">Seleccione provincia...</option>
                  <option value="Salta">Salta</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Tucuman">Tucumán</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                </select>
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Nro Resolución</label>
                <input type="number" className="tabar-input" value={nroResolucion} onChange={(e) => setNroResolucion(e.target.value)} required />
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Año</label>
                <input type="number" className="tabar-input" value={anio} onChange={(e) => setAnio(e.target.value)} required />
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Monto ($)</label>
                <input type="number" step="0.01" className="tabar-input" value={montoC} onChange={(e) => setMontoC(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="tabar-form-group">
                <label className="tabar-label">Información adicional</label>
                <textarea className="tabar-input" value={infoAdicionalC} onChange={(e) => setInfoAdicionalC(e.target.value)} rows={3}></textarea>
              </div>
            </div>
          )}

          <div style={{ marginTop: "8px" }}>
            <button type="submit" disabled={!novedad || loading} className="tabar-btn tabar-btn-primary" style={{ width: "100%", opacity: (!novedad || loading) ? 0.6 : 1, cursor: (!novedad || loading) ? "not-allowed" : "pointer" }}>
              {loading ? "Guardando..." : "Guardar Información"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
