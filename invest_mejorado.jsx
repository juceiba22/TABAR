import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const C = { accent: "#F0883E", dim: "rgba(240,136,62,0.10)" };

const ENTIDADES = [
  "Cámara del Tabaco de Jujuy",
  "Cooperativa de Tabacaleros de Jujuy",
  "Latitud Sur S.A. Compañía de Seguros",
  "Latser S.A.",
  "Cámara del Tabaco de Salta",
  "Cooperativa de Tabacaleros de Salta",
  "Asociación Mutual de Productores Tabacaleros",
  "Asociación Mutual de Seguros",
  "Cámara del Tabaco de Tucumán",
  "Cooperativa de Productores Agropecuarios del Tucumán Ltda.",
  "Asociación de Productores Tabacaleros de Tucumán",
  "Unión de Tabacaleros de Tucumán (UTT)",
  "Cámara del Tabaco de Catamarca",
  "Asociación de Tabacaleros de General San Martín",
  "Cooperativa Tabacalera y Agropecuaria del Chaco",
  "Instituto Provincial del Tabaco (IPT)",
  "Cooperativa de Tabacaleros",
  "Cámara del Tabaco de Misiones (Productores)",
  "APTM Asociación Plantadores de Tabaco de Misiones (Productores)",
  "Asociación de Campesinos Tabacaleros Independientes (Productores)",
  "Cooperativa Agroindustrial de Misiones Limitada (ex CTM)",
  "Cooperativa Citrícola Agroindustrial de Misiones",
  "Frigorífica Leandro N. Alem LTDA.",
  "CO.T.TA.PROM.M",
  "Cooperativa Tabacalera San Vicente LTDA. (COTAVI)"
];

export default function StateInvest() {
  const { user } = useRole();
  const { invertirState } = useData();
  
  // Form states
  const [entidad, setEntidad] = useState("");
  const [numeroResolucion, setNumeroResolucion] = useState("");
  const [anioResolucion, setAnioResolucion] = useState("");
  const [monto, setMonto] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null); // { nombre, tamaño }
  
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validations
  const isFormValid = entidad && numeroResolucion && anioResolucion && monto && pdfFile;
  const formErrors = [];

  if (!entidad) formErrors.push("Selecciona una entidad beneficiaria");
  if (!numeroResolucion) formErrors.push("Ingresa el número de resolución");
  if (!anioResolucion) formErrors.push("Ingresa el año de resolución");
  if (!monto) formErrors.push("Ingresa el monto");
  if (!pdfFile) formErrors.push("Carga un archivo PDF");

  // Handle PDF selection
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF válido");
      setPdfFile(null);
      setPdfInfo(null);
      return;
    }

    setError("");
    setPdfFile(file);
    setPdfInfo({
      nombre: file.name,
      tamaño: (file.size / 1024 / 1024).toFixed(2) // MB
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!isFormValid) {
      setError(formErrors[0]);
      return;
    }
    setError("");
    setStep("confirm");
  };

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Upload PDF to Firebase Storage
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const pdfFileName = `poa_${timestamp}_${randomId}.pdf`;
      const storageRef = ref(storage, `poa_uploads/${pdfFileName}`);
      
      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      // 2. Prepare data for Firestore
      const poaData = {
        entidad: entidad,
        numeroResolucion: parseInt(numeroResolucion),
        anioResolucion: parseInt(anioResolucion),
        monto: parseInt(monto),
        pdfUrl: pdfUrl,
        pdfNombre: pdfInfo.nombre,
        pdfTamaño: pdfInfo.tamaño,
        userId: user?.uid,
        estado: "pendiente_aprobacion",
        fechaCreacion: new Date().toISOString(),
        creadoPor: user?.email
      };

      // 3. Send to backend/DataContext
      // Assuming invertirState can handle POA data, or you might need a different function
      const res = await invertirState(poaData);
      
      setLoading(false);
      if (res?.ok) {
        setStep("done");
      } else {
        setError(res?.error || "Error al procesar la solicitud");
      }
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      setError(err.message || "Error al cargar el archivo. Intenta nuevamente.");
    }
  };

  // Reset form
  const resetForm = () => {
    setEntidad("");
    setNumeroResolucion("");
    setAnioResolucion("");
    setMonto("");
    setPdfFile(null);
    setPdfInfo(null);
    setStep("form");
  };

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Crear asignación FET</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Gestión de Plan Operativo Anual para entidades beneficiarias</p>
      </div>

      {step === "form" && (
        <div className="tabar-layout-sidebar">
          <div>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Cargar POA (Plan Operativo Anual)</h3>
              
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Entidad Beneficiaria *</label>
                <select 
                  value={entidad}
                  onChange={(e) => setEntidad(e.target.value)}
                  className="tabar-input"
                  style={{ padding: "8px 12px", fontFamily: "inherit", cursor: "pointer" }}
                >
                  <option value="">-- Selecciona una entidad --</option>
                  {ENTIDADES.map((ent, idx) => (
                    <option key={idx} value={ent}>{ent}</option>
                  ))}
                </select>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Número de Resolución *</label>
                <input 
                  type="number" 
                  min="1"
                  value={numeroResolucion}
                  onChange={(e) => setNumeroResolucion(e.target.value)}
                  placeholder="Ej: 12345"
                  className="tabar-input"
                />
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Año de Resolución *</label>
                <input 
                  type="number" 
                  min="2000"
                  max={new Date().getFullYear()}
                  value={anioResolucion}
                  onChange={(e) => setAnioResolucion(e.target.value)}
                  placeholder={new Date().getFullYear().toString()}
                  className="tabar-input"
                />
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Monto (en $) *</label>
                <input 
                  type="number" 
                  min="1"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 50000"
                  className="tabar-input"
                />
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Archivo POA (PDF) *</label>
                <div style={{
                  border: "2px dashed rgba(240,136,62,0.3)",
                  borderRadius: "6px",
                  padding: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: pdfFile ? "rgba(63,185,80,0.08)" : "transparent"
                }}>
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    style={{ display: "none" }}
                    id="pdf-input"
                  />
                  <label htmlFor="pdf-input" style={{ cursor: "pointer", display: "block" }}>
                    <div style={{ fontSize: "12px", color: "#8B949E", marginBottom: "4px" }}>
                      Arrastra un PDF o haz clic para seleccionar
                    </div>
                    <div style={{ fontSize: "11px", color: "#484F58" }}>
                      Máximo: sin límite de tamaño
                    </div>
                  </label>
                </div>

                {pdfInfo && (
                  <div style={{
                    marginTop: "10px",
                    padding: "8px",
                    backgroundColor: "rgba(63,185,80,0.08)",
                    borderRadius: "4px",
                    border: "1px solid rgba(63,185,80,0.3)"
                  }}>
                    <div style={{ fontSize: "12px", color: "#3FB950", marginBottom: "2px" }}>✓ Archivo cargado</div>
                    <div style={{ fontSize: "11px", color: "#8B949E" }}>📄 {pdfInfo.nombre}</div>
                    <div style={{ fontSize: "11px", color: "#8B949E" }}>💾 {pdfInfo.tamaño} MB</div>
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  background: "rgba(248,81,73,0.1)",
                  border: "1px solid rgba(248,81,73,0.3)",
                  borderRadius: "6px",
                  padding: "10px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#F85149"
                }}>
                  {error}
                </div>
              )}

              <button 
                onClick={handleConfirm}
                disabled={!isFormValid}
                className="tabar-btn tabar-btn-primary tabar-btn-full"
                style={{ 
                  marginTop: "16px",
                  background: isFormValid ? C.accent : "#484F58",
                  borderColor: isFormValid ? C.accent : "#484F58",
                  color: "#080C10",
                  cursor: isFormValid ? "pointer" : "not-allowed",
                  opacity: isFormValid ? 1 : 0.6
                }}
              >
                Revisar información
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Información requerida</h3>
              <StepInfo n="1" text="Selecciona la entidad beneficiaria del POA" color={C.accent} bg={C.dim} />
              <StepInfo n="2" text="Especifica el número y año de la resolución" color={C.accent} bg={C.dim} />
              <StepInfo n="3" text="Ingresa el monto total asignado" color={C.accent} bg={C.dim} />
              <StepInfo n="4" text="Carga el archivo del Plan Operativo Anual en PDF" color={C.accent} bg={C.dim} />
            </div>
            <div className="tabar-notice">
              Asegúrate de que todos los campos estén completados antes de continuar. El archivo PDF será validado y almacenado de forma segura.
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Confirmá los datos del POA</h3>
          <InfoRow label="Entidad" value={entidad} />
          <InfoRow label="Número de Resolución" value={numeroResolucion} />
          <InfoRow label="Año de Resolución" value={anioResolucion} />
          <InfoRow label="Monto" value={`$${parseInt(monto).toLocaleString("es-AR")}`} valueColor="#3FB950" />
          <InfoRow label="Archivo" value={`${pdfInfo.nombre} (${pdfInfo.tamaño} MB)`} />
          
          {error && (
            <div className="tabar-notice" style={{ 
              color: "#F85149", 
              borderColor: "rgba(248,81,73,0.3)", 
              marginTop: "16px" 
            }}>
              {error}
            </div>
          )}
          
          <div className="tabar-btn-row" style={{ marginTop: "20px" }}>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="tabar-btn tabar-btn-primary tabar-btn-full"
              style={{ 
                background: C.accent, 
                borderColor: C.accent, 
                color: "#080C10",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Procesando..." : "Confirmar carga"}
            </button>
            <button 
              onClick={() => setStep("form")}
              disabled={loading}
              className="tabar-btn tabar-btn-ghost"
              style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="tabar-done-box">
          <div className="tabar-done-icon" style={{ color: "#3FB950" }}>✓</div>
          <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>POA cargado exitosamente</h2>
          <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
            Se registró el Plan Operativo Anual de <strong>{entidad}</strong>. Pendiente de aprobación.
          </p>
          <div style={{
            background: "rgba(88,166,255,0.08)",
            border: "1px solid rgba(88,166,255,0.2)",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "12px",
            color: "#58A6FF"
          }}>
            <div><strong>Monto:</strong> ${parseInt(monto).toLocaleString("es-AR")}</div>
            <div><strong>Archivo:</strong> {pdfInfo.nombre}</div>
          </div>
          <button 
            onClick={resetForm}
            className="tabar-btn tabar-btn-secondary"
          >
            Cargar otro POA
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      padding: "6px 0", 
      borderBottom: "1px solid rgba(255,255,255,0.04)", 
      flexWrap: "wrap", 
      gap: "4px",
      alignItems: "center"
    }}>
      <span style={{ fontSize: "12px", color: "#484F58" }}>{label}</span>
      <span style={{ 
        fontSize: "12px", 
        color: valueColor || "#8B949E", 
        fontWeight: 500,
        wordBreak: "break-word",
        textAlign: "right",
        maxWidth: "60%"
      }}>{value}</span>
    </div>
  );
}

function StepInfo({ n, text, color, bg }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
      <div style={{ 
        minWidth: "24px", 
        height: "24px", 
        borderRadius: "6px", 
        background: bg, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: "11px", 
        color, 
        fontWeight: 600 
      }}>
        {n}
      </div>
      <span style={{ fontSize: "13px", color: "#8B949E", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
