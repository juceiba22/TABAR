import { useState, useEffect } from "react";
import { useData } from "../../modules/roles/DataContext";
import { useRole } from "../../modules/roles/RoleContext";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 1. Importar el hook de Privy para acceder a la billetera embebida
import { useWallets } from '@privy-io/react-auth';

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)", border: "rgba(227,182,79,0.25)" };
const TIPOS_TABACO = ["Virginia", "Burley", "Criollo", "Oriental"];
const CALIDADES = ["T1F", "T1S", "T2F", "T2S", "B1L", "B1S", "B2", "C1", "C2"];
const KG_POR_FARDO = 200;

export default function TokenizarProducer() {
  const { user, profile } = useRole();
  const { tokenizarProducer } = useData();
  
  // 2. Obtener las wallets activas de Privy
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidad, setCalidad] = useState("");
  const [kilos, setKilos] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fardosEstimados = kilos ? (parseInt(kilos) / KG_POR_FARDO).toFixed(1) : 0;
  const isFormValid = tipoTabaco && calidad && kilos && parseInt(kilos) > 0;

  // ... (Tu función de generación de PDF 'generatePDF' se mantiene exactamente igual)

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 3. VALIDACIÓN WEB2.5: Verificar si el productor tiene su wallet Privy inicializada
      if (!embeddedWallet) {
        throw new Error(
          "Falta tu Firma Digital Institucional. Por favor, ve a 'Mi Perfil' para activar tu entorno cerrado."
        );
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const numCertificado = `CERT-${timestamp}-${randomId}`;

      // 4. ESTRUCTURACIÓN DEL MENSAJE PARA FIRMA CRIPTOGRÁFICA
      // Creamos la cadena de texto exacta que representa el lote físico real
      const mensajeAFirmar = `
        TABAR Protocol - Certificación de Lote
        Productor Custodio: ${user?.email}
        Detalle: ${kilos} Kg de Tabaco ${tipoTabaco} (${calidad})
        Fardos Equivalentes: ${fardosEstimados}
        ID de Trazabilidad: ${numCertificado}
      `.trim();

      // Solicitamos a Privy que firme el manifiesto del lote de forma transparente para el productor
      const provider = await embeddedWallet.getEthereumProvider();
      const firmaProductor = await provider.request({
        method: 'personal_sign',
        params: [mensajeAFirmar, embeddedWallet.address],
      });

      // 5. Generación y guardado del PDF (Flujo Web2 original)
      const doc = await generatePDF();
      const pdfFileName = `certificacion_${timestamp}_${randomId}.pdf`;
      doc.save(pdfFileName);

      const pdfData = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfData], { type: "application/pdf" });
      const storageRef = ref(storage, `certifications/${pdfFileName}`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);

      // 6. Persistencia de datos en Firestore enriquecida con metadatos de Gobernanza Criptográfica
      const certificacionData = {
        numeroCertificado: numCertificado,
        tipoTabaco: tipoTabaco,
        calidad: calidad,
        cantidadKgs: parseInt(kilos),
        fardosEstimados: parseFloat(fardosEstimados),
        observaciones: observaciones,
        pdfUrl: pdfUrl,
        pdfNombre: pdfFileName,
        userId: user?.uid,
        estado: "pendiente_acopio", // Queda a la espera de que el Acopiador/Fideicomiso valide
        fechaCreacion: new Date().toISOString(),
        creadoPor: user?.email,
        
        // Bloque de Auditoría Criptográfica Web2.5 (Págs. 7-8 del WP)
        walletProductor: embeddedWallet.address,
        firmaDigitalOrigen: firmaProductor,
        datosCertificadosRaw: mensajeAFirmar
      };

      const res = await tokenizarProducer(certificacionData);

      setLoading(false);
      if (res?.ok) {
        setStep("done");
      } else {
        setError(res?.error || "Error al registrar la certificación");
      }
    } catch (err) {
      setLoading(false);
      console.error("Error en certificación:", err);
      setError(err.message || "Error al procesar la certificación digital del fardo.");
    }
  };

  // ... (El resto del renderizado y el diseño HTML/CSS se mantiene idéntico)
}
const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

// Opciones de Tipo de Tabaco
const TIPOS_TABACO = [
  { value: "virginia", label: "Virginia" },
  { value: "burley", label: "Burley" },
  { value: "criollo", label: "Criollo" }
];

// Opciones de Calidad
const OPCIONES_CALIDAD = [
  "T1F", "T1L", "B1F", "B1L", "C1F", "C1L", "X1F", "X1L",
  "T2F", "T2L", "T2KL", "T2KF", "B2F", "B2L", "B2KL", "B2KF",
  "C2F", "C2L", "C2K", "X2F", "X2L", "X2K",
  "B3F", "B3L", "B3KL", "B3KF", "C3F", "C3L", "C3K", "X3F", "X3L", "X3K",
  "B4F", "B4L"
];

// Formateadores
const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProducerTokenizar() {
  const { tokenizarProducer, obtenerTodasLasAsociaciones, unirseAAsociacion } = useData();
  const { user, profile } = useRole();

  // Estados del formulario
  const [totalKgs, setTotalKgs] = useState("");
  const [tamanoFardo, setTamanoFardo] = useState("");
  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidad, setCalidad] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");

  // Estados para asociaciones existentes
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
  const [asociacionSeleccionada, setAsociacionSeleccionada] = useState("");
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");

  // Cálculos de la orden de venta
  // - Kgs y tamaño del fardo se trabajan como enteros (input del usuario).
  // - La cantidad de fardos se mantiene con decimales (sin redondeo).
  // - El precio de venta es exclusivamente el cargado por el usuario (pesos por kg).
  // - El total en pesos = kgs totales * precio de venta por kg.
  // NOTA: el campo `usdTotal` se conserva como nombre interno por compatibilidad
  // con los documentos previos en Firestore, pero representa pesos (ARS).
  const numTotalKgs = parseInt(totalKgs) || 0;
  const numTamanoFardo = parseInt(tamanoFardo) || 0;
  const cantidadFardos = numTamanoFardo > 0 ? numTotalKgs / numTamanoFardo : 0;
  const precioFinal = parseFloat(precioVenta) || 0;
  const usdTotal = numTotalKgs * precioFinal;

  // Cargar todas las asociaciones activas cuando el usuario elige venta asociada
  useEffect(() => {
    if (user?.uid && tipoVenta === "asociada") {
      const fetchAsociaciones = async () => {
        setLoadingAsociaciones(true);
        try {
          const res = await obtenerTodasLasAsociaciones();
          if (res.ok) {
            // Filtrar solo las activas
            const activas = (res.asociaciones || []).filter(asoc => asoc.estado === "activa");
            setAsociacionesDisponibles(activas);
          }
        } catch (err) {
          console.error("Error fetching asociaciones:", err);
        }
        setLoadingAsociaciones(false);
      };

      fetchAsociaciones();
    }
  }, [user, tipoVenta]);

  // Preview de foto
  useEffect(() => {
    if (!fotoFile) {
      setFotoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(fotoFile);
    setFotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [fotoFile]);

  // Validar que todos los campos estén completos.
  // Precio de venta pasa a ser OBLIGATORIO y mayor a 0.
  const isFormValid =
    totalKgs &&
    tamanoFardo &&
    tipoTabaco &&
    calidad &&
    tipoVenta &&
    precioVenta &&
    parseFloat(precioVenta) > 0 &&
    (tipoVenta !== "asociada" || asociacionSeleccionada);

  // Generar código de transacción único
  const generarCodigoTransaccion = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TABAR-${timestamp}-${random}`;
  };

  // Generar PDF con datos de la Orden de Venta
  const generarOrdenVentaPDF = (producerObj) => {
    const doc = new jsPDF();
    const codigo = generarCodigoTransaccion();
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ORDEN DE VENTA EN TABAR", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Registro digital de orden de venta de tabaco", 20, 28);

    // Línea divisoria
    doc.setDrawColor(63, 185, 80);
    doc.line(20, 32, 190, 32);

    // Sección: Datos del Productor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL PRODUCTOR", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${profile?.firstName || ""} ${profile?.lastName || ""}`, 20, 50);
    doc.text(`Email: ${user?.email || "No disponible"}`, 20, 57);
    doc.text(`ID Productor: ${user?.uid?.substring(0, 12) || "No disponible"}`, 20, 64);

    // Sección: Detalles del Lote
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DETALLES DEL LOTE", 20, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Kgs ofrecidos: ${numTotalKgs} kg`, 20, 83);
    doc.text(`Tamaño del Fardo: ${numTamanoFardo} kg`, 20, 90);
    doc.text(`Cantidad de Fardos: ${fmtFardos(cantidadFardos)}`, 20, 97);
    doc.text(`Tipo de Tabaco: ${TIPOS_TABACO.find(t => t.value === tipoTabaco)?.label || tipoTabaco}`, 20, 104);
    doc.text(`Calidad: ${calidad}`, 20, 111);
    doc.text(`Tipo de Venta: ${tipoVenta === "individual" ? "Venta Individual" : "Venta Asociada"}`, 20, 118);

    // Sección: Precio
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PRECIO DE VENTA", 20, 129);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Precio de Venta ($/kg): $${fmtMoney(precioFinal)}`, 20, 137);

    let yPos = 150;

    // Sección: Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL DE LA ORDEN DE VENTA", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Monto Total: $${fmtMoney(usdTotal)}`, 20, yPos);
    yPos += 7;
    doc.text(`Activos TABAR Generados: ${fmtFardos(cantidadFardos)}`, 20, yPos);
    yPos += 11;

    // Sección Asociación de Venta (si corresponde)
    if (producerObj) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("ASOCIACIÓN DE VENTA", 20, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Nombre: ${producerObj.firstName} ${producerObj.lastName}`, 20, yPos);
        yPos += 7;
        doc.text(`ID: ${producerObj.documentNumber}`, 20, yPos);
        yPos += 7;
        doc.text(`Email: ${producerObj.email}`, 20, yPos);
        yPos += 11;
    }

    // Sección: Información de Transacción
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMACIÓN DE LA ORDEN", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Código de Orden: ${codigo}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha y Hora: ${fechaHora}`, 20, yPos);
    yPos += 7;
    doc.text(`Estado: Orden de venta registrada`, 20, yPos);

    // Pie de página
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(139, 148, 158);
    doc.text("Este documento es un comprobante digital de la orden de venta registrada en la plataforma TABAR.", 20, 250);
    doc.text("La existencia de este documento implica la aceptación de los términos y condiciones de la operación de venta.", 20, 256);

    // Guardar el PDF
    doc.save(`Orden_Venta_TABAR_${codigo}.pdf`);

    return codigo;
  };

  const handleTokenizar = async () => {
    // Validaciones
    if (tipoVenta === "asociada" && !asociacionSeleccionada) {
      setError("Debes seleccionar una asociación");
      return;
    }

    setError("");
    setLoading(true);

    let associationId = null;

    try {
      let uploadedFotoUrl = "";
      if (fotoFile) {
        const fileRef = ref(storage, `muestras_tabaco/${Date.now()}_${fotoFile.name}`);
        const snapshot = await uploadBytes(fileRef, fotoFile);
        uploadedFotoUrl = await getDownloadURL(snapshot.ref);
      }

      if (tipoVenta === "asociada") {
        // Unirse/Aportar a la asociación seleccionada
        const res = await unirseAAsociacion(asociacionSeleccionada, {
          tipoTabaco,
          calidad,
          kgs: numTotalKgs,
          cantidadFardos,
          usdTotal
        });

        if (!res.ok) {
          setError(res.error);
          setLoading(false);
          return;
        }

        associationId = res.associationId;
      }

      // Preparar datos de la orden de venta
      const tokenizationData = {
        cantidadFardos,
        totalKgs: numTotalKgs,
        tamanoFardo: numTamanoFardo,
        tipoTabaco,
        calidad,
        tipoVenta,
        precioVenta: precioFinal,
        usdTotal,
        productorOwner: user.uid,
        associationId: associationId,
        fotoUrl: uploadedFotoUrl
      };

      // Llamar a tokenizarProducer (registra la orden de venta)
      const res = await tokenizarProducer(tokenizationData);
      if (res.ok) {
        // Intentar obtener información de la asociación seleccionada para el PDF
        let selectedAssoc = null;
        if (associationId) {
          selectedAssoc = asociacionesDisponibles.find(a => a.id === associationId);
        }

        const codigo = generarOrdenVentaPDF(selectedAssoc ? {
          firstName: selectedAssoc.nombre,
          lastName: "",
          documentNumber: `ID: ${associationId.substring(0, 8)}`,
          email: "Venta Asociada"
        } : null);

        setTransactionCode(codigo);
        setSuccess(true);
      } else {
        setError(res.error || "Error al registrar la orden de venta");
      }
    } catch (err) {
      setError(err.message || "Error al procesar");
    }

    setLoading(false);
  };


  if (success) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🌿</div>
        <h2 style={{ color: "#3FB950", marginBottom: "12px" }}>¡Orden de Venta Generada!</h2>
        <p style={{ color: "#8B949E", marginBottom: "12px", fontSize: "12px" }}>
          Tu orden de venta por {fmtFardos(cantidadFardos)} fardos ({numTotalKgs} kg) quedó registrada y disponible en el mercado.
        </p>
        <div style={{
          background: "rgba(63,185,80,0.1)",
          border: "1px solid rgba(63,185,80,0.3)",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          fontSize: "11px"
        }}>
          <p style={{ margin: "0 0 8px 0", color: "#8B949E" }}>Código de Orden:</p>
          <p style={{ margin: 0, color: "#3FB950", fontFamily: "monospace", fontWeight: "bold", fontSize: "13px" }}>
            {transactionCode}
          </p>
        </div>
        <p style={{ color: "#8B949E", marginBottom: "30px", fontSize: "12px" }}>
          Tu orden de venta fue registrada exitosamente.
          <br />
          Se ha generado un PDF con los detalles de la operación.
        </p>
        <Link to="/producer" className="tabar-btn tabar-btn-primary">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Orden de Venta</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Registrá una orden de venta de tu tabaco en la plataforma TABAR</p>
      </div>

      <div className="tabar-card">
        <h3 className="tabar-card-title">Información del Lote</h3>

        {/* Total Kgs a ofrecer */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Total Kgs a ofrecer *
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej. 500"
            value={totalKgs}
            onChange={(e) => setTotalKgs(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
            Cantidad total de kilos de tabaco que vas a ofrecer en esta orden
          </p>
        </div>

        {/* Tamaño del Fardo */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tamaño del Fardo (kg) *
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej. 50"
            value={tamanoFardo}
            onChange={(e) => setTamanoFardo(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
            Peso de cada fardo individual
          </p>
        </div>

        {/* Precio de venta (obligatorio) */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Precio de venta ($/kg) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="tabar-input"
            placeholder="Ej: 2.50"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
            Precio en pesos por kilogramo que querés cobrar
          </p>
        </div>

        {/* Tipo de Tabaco */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tipo de Tabaco *
          </label>
          <select
            className="tabar-input"
            value={tipoTabaco}
            onChange={(e) => setTipoTabaco(e.target.value)}
            disabled={loading || showConfirm}
            style={{ cursor: "pointer" }}
          >
            <option value="">Seleccionar tipo de tabaco</option>
            {TIPOS_TABACO.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>

        {/* Calidad */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Calidad *
          </label>
          <select
            className="tabar-input"
            value={calidad}
            onChange={(e) => setCalidad(e.target.value)}
            disabled={loading || showConfirm}
            style={{ cursor: "pointer" }}
          >
            <option value="">Seleccionar calidad</option>
            {OPCIONES_CALIDAD.map(opcion => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        </div>

        {/* Foto de Muestra */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Foto de muestra de tabaco (Opcional)
          </label>
          <input
            type="file"
            className="tabar-input"
            accept="image/*"
            onChange={(e) => setFotoFile(e.target.files[0] || null)}
            disabled={loading || showConfirm}
            style={{ padding: "8px" }}
          />
          {fotoPreview && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#8B949E" }}>Vista previa:</span>
              <img
                src={fotoPreview}
                alt="Muestra de tabaco"
                style={{
                  maxWidth: "100%",
                  maxHeight: "180px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  objectFit: "cover"
                }}
              />
            </div>
          )}
        </div>

        {/* Tipo de Venta */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tipo de Venta *
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="radio"
                name="tipoVenta"
                value="individual"
                checked={tipoVenta === "individual"}
                onChange={(e) => { setTipoVenta(e.target.value); setAsociacionSeleccionada(""); }}
                disabled={loading || showConfirm}
              />
              <span>Venta Individual</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="radio"
                name="tipoVenta"
                value="asociada"
                checked={tipoVenta === "asociada"}
                onChange={(e) => setTipoVenta(e.target.value)}
                disabled={loading || showConfirm}
              />
              <span>Venta Asociada</span>
            </label>
          </div>
        </div>

        {/* Asociación Existente - para Venta Asociada */}
        {tipoVenta === "asociada" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
              Seleccionar Asociación de Venta *
            </label>
            <select
              className="tabar-input"
              value={asociacionSeleccionada}
              onChange={(e) => setAsociacionSeleccionada(e.target.value)}
              disabled={loading || showConfirm || loadingAsociaciones}
              style={{ cursor: "pointer" }}
            >
              <option value="">{loadingAsociaciones ? "Cargando asociaciones..." : "Seleccionar asociación de productores"}</option>
              {asociacionesDisponibles.map(asoc => (
                <option key={asoc.id} value={asoc.id}>
                  {asoc.nombre} - {asoc.inventario?.totalKgs || 0} Kgs, {asoc.inventario?.totalFardos || 0} fardos (Miembros: {asoc.productores?.map(p => p.nombre).join(", ") || ""})
                </option>
              ))}
            </select>
            <p style={{ fontSize: "11px", color: "#8B949E", marginTop: "6px" }}>
              ¿No encuentras una asociación? Crea una nueva en la pestaña <Link to="/producer/asociaciones" style={{ color: "#3FB950", textDecoration: "underline" }}>Mis Asociaciones</Link>.
            </p>
          </div>
        )}

        {/* Resumen de la operación */}
        {cantidadFardos > 0 && !showConfirm && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--tb-border)",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--tb-text-2)" }}>Resumen de la orden de venta</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Total Kgs ofrecidos</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{numTotalKgs} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Tamaño por fardo</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{numTamanoFardo} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Cantidad de fardos</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>{fmtFardos(cantidadFardos)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Precio de Venta ($/kg)</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>${fmtMoney(precioFinal)}</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Total orden de venta ($)</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>${fmtMoney(usdTotal)}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: "#F85149", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px", border: "1px solid rgba(248,81,73,0.2)" }}>
            {error}
          </div>
        )}

        {!showConfirm ? (
          <button
            className="tabar-btn tabar-btn-primary"
            disabled={!isFormValid || loading}
            onClick={() => setShowConfirm(true)}
            style={{ opacity: !isFormValid ? 0.5 : 1, cursor: !isFormValid ? "not-allowed" : "pointer" }}
          >
            {!isFormValid ? "Completa todos los campos" : "Generar Orden de Venta"}
          </button>
        ) : (
          <div style={{
            background: "rgba(227,182,79,0.05)",
            border: "1px solid rgba(227,182,79,0.2)",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center"
          }}>
            <h4 style={{ color: "#E3B64F", margin: "0 0 10px 0" }}>Confirmar Orden de Venta</h4>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Estás por registrar una orden de venta de {fmtFardos(cantidadFardos)} fardos ({numTotalKgs} kg) de {tipoTabaco === "virginia" ? "Virginia" : tipoTabaco === "burley" ? "Burley" : "Criollo"} a ${fmtMoney(precioFinal)}/kg.
              <br />
              Esta acción quedará registrada en el sistema y generará un PDF con el código de la orden.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="tabar-btn tabar-btn-ghost"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="tabar-btn tabar-btn-primary"
                style={{ background: "#E3B64F", color: "#000" }}
                onClick={handleTokenizar}
                disabled={loading}
              >
                {loading ? "Registrando..." : "Confirmar y Generar Orden"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", padding: "14px", background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "#58A6FF", margin: 0 }}>
          ℹ️ Tu orden de venta queda disponible en el mercado TABAR una vez registrada.
        </p>
      </div>
    </div>
  );
}
