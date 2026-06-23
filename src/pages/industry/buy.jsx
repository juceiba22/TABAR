import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import { jsPDF } from "jspdf";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


// 1. Importar el hook de Privy para acceder a las wallets
import { useWallets } from '@privy-io/react-auth';

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)", border: "rgba(88,166,255,0.25)" };
const TIPOS_TABACO = ["Virginia", "Burley", "Criollo", "Oriental"];
const CALIDADES = ["T1F", "T1S", "T2F", "T2S", "B1L", "B1S", "B2", "C1", "C2"];

export default function IndustryBuy() {
  const { user, profile } = useRole();
  const { comprarIndustry } = useData();
  
  // 2. Obtener las wallets activas de Privy
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidadSolicitada, setCalidadSolicitada] = useState("");
  const [cantidadKgs, setCantidadKgs] = useState("");
  const [precioDisponible, setPrecioDisponible] = useState("");
  const [notaAdicional, setNotaAdicional] = useState("");

  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = tipoTabaco && calidadSolicitada && cantidadKgs && precioDisponible;

  // ... (tu función generatePDF se mantiene exactamente igual)

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 3. VALIDACIÓN WEB2.5: Verificar si el acopiador tiene su wallet institucional activa
      if (!embeddedWallet) {
        throw new Error("No se detectó tu firma criptográfica institucional. Por favor, ve a 'Mi Perfil' para generarla.");
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const numSolicitud = `ORD-${timestamp}-${randomId}`;
      const montoTotal = (parseInt(cantidadKgs) * parseFloat(precioDisponible)).toFixed(2);

      // 4. FIRMA CRIPTOGRÁFICA (On-Chain Proof): 
      // Creamos un mensaje único estructurado con los datos del contrato físico/Warrant
      const mensajeAFilmar = `
        TABAR Protocol - Orden de Compra
        Emisor: ${user?.email}
        Lote: ${cantidadKgs} Kg de Tabaco ${tipoTabaco} (${calidadSolicitada})
        Monto Total: $${montoTotal} ARS
        Nonce: ${numSolicitud}
      `.trim();

      // Solicitamos al proveedor de Privy que firme el mensaje de forma nativa e invisible
      const provider = await embeddedWallet.getEthereumProvider();
      const firmaCriptografica = await provider.request({
        method: 'personal_sign',
        params: [mensajeAFilmar, embeddedWallet.address],
      });

      // 5. Proceder con el PDF (Tu flujo Web2 original)
      const doc = await generatePDF();
      const pdfFileName = `orden_compra_${timestamp}_${randomId}.pdf`;
      doc.save(pdfFileName);

      const pdfData = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfData], { type: "application/pdf" });
      const storageRef = ref(storage, `purchase_orders/${pdfFileName}`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);

      // 6. Guardar todo en Firestore INCLUYENDO la firma y la wallet emisora
      const ordenData = {
        numeroOrden: numSolicitud,
        tipoTabaco: tipoTabaco,
        calidadSolicitada: calidadSolicitada,
        cantidadKgs: parseInt(cantidadKgs),
        precioDisponible: parseFloat(precioDisponible),
        montoTotal: montoTotal,
        notaAdicional: notaAdicional,
        pdfUrl: pdfUrl,
        pdfNombre: pdfFileName,
        userId: user?.uid,
        estado: "emitida",
        fechaCreacion: new Date().toISOString(),
        creadoPor: user?.email,
        
        // Atributos de Gobernanza Web3 agregados (Cumpliendo pág 7 y 8 del WP)
        walletEmisora: embeddedWallet.address,
        firmaDigitalWarrant: firmaCriptografica, 
        datosFirmadosRaw: mensajeAFilmar
      };

      const res = await comprarIndustry(ordenData);

      setLoading(false);
      if (res?.ok) {
        setStep("done");
      } else {
        setError(res?.error || "Error al procesar la solicitud");
      }
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      setError(err.message || "Error al generar la orden y la firma criptográfica.");
    }
  };

  // ... (El resto del componente de confirmación y renderizado se mantiene igual)
}


const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)", border: "rgba(88,166,255,0.25)" };

const TIPOS_TABACO = ["Virginia", "Burley", "Criollo", "Oriental"];
const CALIDADES = ["T1F", "T1S", "T2F", "T2S", "B1L", "B1S", "B2", "C1", "C2"];

export default function IndustryBuy() {
  const { user, profile } = useRole();
  const { comprarIndustry } = useData();

  // Form states
  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidadSolicitada, setCalidadSolicitada] = useState("");
  const [cantidadKgs, setCantidadKgs] = useState("");
  const [precioDisponible, setPrecioDisponible] = useState("");
  const [notaAdicional, setNotaAdicional] = useState("");

  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validations
  const isFormValid = tipoTabaco && calidadSolicitada && cantidadKgs && precioDisponible;
  const formErrors = [];

  if (!tipoTabaco) formErrors.push("Selecciona un tipo de tabaco");
  if (!calidadSolicitada) formErrors.push("Ingresa la calidad solicitada");
  if (!cantidadKgs) formErrors.push("Ingresa la cantidad de Kgs");
  if (!precioDisponible) formErrors.push("Ingresa el precio que estás dispuesto a pagar");

  const handleConfirm = () => {
    if (!isFormValid) {
      setError(formErrors[0]);
      return;
    }
    setError("");
    setStep("confirm");
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(88, 166, 255);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("ORDEN DE COMPRA", pageWidth / 2, 20, { align: "center" });

      // Order number and date
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      const numeroOrden = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      doc.text(`Número de Orden: ${numeroOrden}`, 20, 50);
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 20, 58);

      // Acopiador info
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Información del Acopiador", 20, 75);
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Email: ${user?.email}`, 20, 83);
      doc.text(`Usuario: ${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.displayName || user?.email, 20, 91);
      doc.text(`DNI / Documento: ${profile?.documentNumber || "No especificado"}`, 20, 99);

      // Order details
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Detalles de la Orden", 20, 110);

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Tipo de Tabaco: ${tipoTabaco}`, 20, 118);
      doc.text(`Calidad Solicitada: ${calidadSolicitada}`, 20, 126);
      doc.text(`Cantidad: ${parseInt(cantidadKgs).toLocaleString("es-AR")} Kgs`, 20, 134);
      doc.text(`Precio Unitario: $${parseFloat(precioDisponible).toFixed(2)}`, 20, 142);

      const montoTotal = (parseInt(cantidadKgs) * parseFloat(precioDisponible)).toFixed(2);
      doc.setFont(undefined, "bold");
      doc.text(`Monto Total: $${parseFloat(montoTotal).toLocaleString("es-AR")}`, 20, 150);

      // Notes
      if (notaAdicional) {
        doc.setFont(undefined, "normal");
        doc.setFontSize(10);
        doc.text("Notas Adicionales:", 20, 168);
        const notasLines = doc.splitTextToSize(notaAdicional, 170);
        doc.text(notasLines, 20, 176);
      }

      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("Documento generado automáticamente por TABAR — Plataforma de Financiamiento Agroindustrial", 20, pageHeight - 10);

      return doc;
    } catch (err) {
      console.error("Error generating PDF:", err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Generate PDF
      const doc = await generatePDF();

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const pdfFileName = `orden_compra_${timestamp}_${randomId}.pdf`;

      // Descarga automática del PDF
      doc.save(pdfFileName);

      const pdfData = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfData], { type: "application/pdf" });

      // 2. Upload PDF to Firebase Storage
      const storageRef = ref(storage, `purchase_orders/${pdfFileName}`);

      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);

      // 3. Prepare data for Firestore
      const ordenData = {
        numeroOrden: `ORD-${timestamp}-${randomId}`,
        tipoTabaco: tipoTabaco,
        calidadSolicitada: calidadSolicitada,
        cantidadKgs: parseInt(cantidadKgs),
        precioDisponible: parseFloat(precioDisponible),
        montoTotal: (parseInt(cantidadKgs) * parseFloat(precioDisponible)).toFixed(2),
        notaAdicional: notaAdicional,
        pdfUrl: pdfUrl,
        pdfNombre: pdfFileName,
        userId: user?.uid,
        estado: "emitida",
        fechaCreacion: new Date().toISOString(),
        creadoPor: user?.email
      };

      // 4. Save to Firestore
      const res = await comprarIndustry(ordenData);

      setLoading(false);
      if (res?.ok) {
        setStep("done");
      } else {
        setError(res?.error || "Error al procesar la solicitud");
      }
    } catch (err) {
      setLoading(false);
      console.error("Error:", err);
      setError(err.message || "Error al generar la orden. Intenta nuevamente.");
    }
  };

  const resetForm = () => {
    setTipoTabaco("");
    setCalidadSolicitada("");
    setCantidadKgs("");
    setPrecioDisponible("");
    setNotaAdicional("");
    setStep("form");
  };

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Emitir Orden de Compra</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Configurá el precio que estás dispuesto a pagar</p>
      </div>

      {step === "form" && (
        <div className="tabar-layout-sidebar">
          <div>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Nueva Orden de Compra</h3>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Tipo de Tabaco *</label>
                <select
                  value={tipoTabaco}
                  onChange={(e) => setTipoTabaco(e.target.value)}
                  className="tabar-input"
                  style={{ padding: "8px 12px", fontFamily: "inherit", cursor: "pointer" }}
                >
                  <option value="">-- Selecciona tipo --</option>
                  {TIPOS_TABACO.map((tipo, idx) => (
                    <option key={idx} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Calidad Solicitada *</label>
                <select
                  value={calidadSolicitada}
                  onChange={(e) => setCalidadSolicitada(e.target.value)}
                  className="tabar-input"
                  style={{ padding: "8px 12px", fontFamily: "inherit", cursor: "pointer" }}
                >
                  <option value="">-- Selecciona calidad --</option>
                  {CALIDADES.map((calidad, idx) => (
                    <option key={idx} value={calidad}>{calidad}</option>
                  ))}
                </select>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Cantidad de Kgs *</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadKgs}
                  onChange={(e) => setCantidadKgs(e.target.value)}
                  placeholder="Ej: 1000"
                  className="tabar-input"
                />
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Precio que estás dispuesto a pagar ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioDisponible}
                  onChange={(e) => setPrecioDisponible(e.target.value)}
                  placeholder="Ej: 2.50"
                  className="tabar-input"
                />
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Nota Adicional</label>
                <textarea
                  value={notaAdicional}
                  onChange={(e) => setNotaAdicional(e.target.value)}
                  placeholder="Información adicional sobre la orden..."
                  className="tabar-input"
                  style={{ minHeight: "80px", fontFamily: "inherit", resize: "vertical" }}
                />
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
                Revisar orden
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="tabar-card">
              <h3 className="tabar-card-title">Información requerida</h3>
              <StepInfo n="1" text="Selecciona el tipo de tabaco que buscas" color={C.accent} bg={C.dim} />
              <StepInfo n="2" text="Especifica la calidad que necesitas" color={C.accent} bg={C.dim} />
              <StepInfo n="3" text="Ingresa la cantidad de kilogramos" color={C.accent} bg={C.dim} />
              <StepInfo n="4" text="Configura el precio que estás dispuesto a pagar" color={C.accent} bg={C.dim} />
            </div>
            <div className="tabar-notice">
              Al emitir la orden, se generará un documento PDF con todos los detalles. Los productores podrán ver tu solicitud en la plataforma.
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Confirmá tu orden de compra</h3>
          <InfoRow label="Tipo de Tabaco" value={tipoTabaco} />
          <InfoRow label="Calidad Solicitada" value={calidadSolicitada} />
          <InfoRow label="Cantidad" value={`${parseInt(cantidadKgs).toLocaleString("es-AR")} Kgs`} />
          <InfoRow label="Precio por Kg" value={`$${parseFloat(precioDisponible).toFixed(2)}`} />
          <InfoRow label="Monto Total" value={`$${(parseInt(cantidadKgs) * parseFloat(precioDisponible)).toLocaleString("es-AR")}`} valueColor="#3FB950" />
          {notaAdicional && <InfoRow label="Nota" value={notaAdicional} />}

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
              {loading ? "Procesando..." : "Emitir orden de compra"}
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
          <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>Orden emitida exitosamente</h2>
          <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
            Tu orden de compra de {parseInt(cantidadKgs).toLocaleString("es-AR")} Kgs de {tipoTabaco} ha sido emitida.
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
            <div><strong>Calidad Solicitada:</strong> {calidadSolicitada}</div>
            <div><strong>Cantidad:</strong> {parseInt(cantidadKgs).toLocaleString("es-AR")} Kgs</div>
            <div><strong>Monto Total:</strong> ${(parseInt(cantidadKgs) * parseFloat(precioDisponible)).toLocaleString("es-AR")}</div>
          </div>
          <button
            onClick={resetForm}
            className="tabar-btn tabar-btn-secondary"
          >
            Emitir otra orden
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
