// src/pages/producer/tokenizar.jsx
import { useState, useEffect, useContext } from "react";
import { useData } from "../../modules/roles/DataContext";
import { useRole } from "../../modules/roles/RoleContext";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Web3Context } from "../../context/Web3Context";
import { useTabarContract } from "../../hooks/useTabarContract";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)", border: "rgba(227,182,79,0.25)" };

const TIPOS_TABACO = [
  { value: "virginia", label: "Virginia" },
  { value: "burley", label: "Burley" },
  { value: "criollo", label: "Criollo" }
];

const OPCIONES_CALIDAD = [
  "T1F", "T1L", "B1F", "B1L", "C1F", "C1L", "X1F", "X1L",
  "T2F", "T2L", "T2KL", "T2KF", "B2F", "B2L", "B2KL", "B2KF",
  "C2F", "C2L", "C2K", "X2F", "X2L", "X2K",
  "B3F", "B3L", "B3KL", "B3KF", "C3F", "C3L", "C3K", "X3F", "X3L", "X3K",
  "B4F", "B4L"
];

const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProducerTokenizar() {
  const { tokenizarProducer, obtenerTodasLasAsociaciones, unirseAAsociacion } = useData();
  const { user, profile } = useRole();

  // Conexión al motor Web3 global e inyección de hooks
  const { account, contract } = useContext(Web3Context);
  const { getBalanceOf } = useTabarContract();
  const [tokenBalance, setTokenBalance] = useState("0.00");
  const [loadingBalance, setLoadingBalance] = useState(false);

  const { ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = privyReady
    ? (wallets || []).find((w) => w.walletClientType === 'privy')
    : null;

  // Estados del formulario
  const [totalKgs, setTotalKgs] = useState("");
  const [tamanoFardo, setTamanoFardo] = useState("");
  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidad, setCalidad] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");

  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
  const [asociacionSeleccionada, setAsociacionSeleccionada] = useState("");
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");

  const numTotalKgs = parseInt(totalKgs) || 0;
  const numTamanoFardo = parseInt(tamanoFardo) || 0;
  const cantidadFardos = numTamanoFardo > 0 ? numTotalKgs / numTamanoFardo : 0;
  const precioFinal = parseFloat(precioVenta) || 0;
  const usdTotal = numTotalKgs * precioFinal;

  // Efecto para consultar el balance real en Polygon Mainnet
  useEffect(() => {
    const fetchOnChainBalance = async () => {
      if (contract && account) {
        setLoadingBalance(true);
        const bal = await getBalanceOf(account);
        setTokenBalance(bal);
        setLoadingBalance(false);
      }
    };
    fetchOnChainBalance();
  }, [account, contract]);

  useEffect(() => {
    if (user?.uid && tipoVenta === "asociada") {
      const fetchAsociaciones = async () => {
        setLoadingAsociaciones(true);
        try {
          const res = await obtenerTodasLasAsociaciones();
          if (res.ok) {
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

  useEffect(() => {
    if (!fotoFile) {
      setFotoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(fotoFile);
    setFotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [fotoFile]);

  const isFormValid =
    totalKgs &&
    tamanoFardo &&
    tipoTabaco &&
    calidad &&
    tipoVenta &&
    precioVenta &&
    parseFloat(precioVenta) > 0 &&
    (tipoVenta !== "asociada" || asociacionSeleccionada);

  const generarCodigoTransaccion = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TABAR-${timestamp}-${random}`;
  };

  const generarOrdenVentaPDF = async (producerObj, codigo) => {
    const doc = new jsPDF();
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString("es-AR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ORDEN DE VENTA EN TABAR", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Registro digital de orden de venta de tabaco", 20, 28);

    doc.setDrawColor(63, 185, 80);
    doc.line(20, 32, 190, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL PRODUCTOR", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${profile?.firstName || ""} ${profile?.lastName || ""}`, 20, 50);
    doc.text(`Email: ${user?.email || "No disponible"}`, 20, 57);
    doc.text(`ID Productor: ${user?.uid?.substring(0, 12) || "No disponible"}`, 20, 64);

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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PRECIO DE VENTA", 20, 129);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Precio de Venta ($/kg): $${fmtMoney(precioFinal)}`, 20, 137);

    let yPos = 150;

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

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(139, 148, 158);
    doc.text("Este documento es un comprobante digital de la orden de venta registrada en la plataforma TABAR.", 20, 250);
    doc.text("La existencia de este documento implies la aceptación de los términos y condiciones de la operación de venta.", 20, 256);

    return doc;
  };

  const handleTokenizar = async () => {
    if (tipoVenta === "asociada" && !asociacionSeleccionada) {
      setError("Debes seleccionar una asociación");
      return;
    }

    setError("");
    setLoading(true);
    let associationId = null;

    try {
      if (!embeddedWallet) {
        throw new Error(
          "Falta tu Firma Digital Institucional. Por favor, ve a 'Mi Perfil' para activar tu entorno cerrado."
        );
      }

      const codigo = generarCodigoTransaccion();

      const mensajeAFirmar = `
        TABAR Protocol - Certificación de Lote
        Productor Custodio: ${user?.email}
        Detalle: ${numTotalKgs} Kg de Tabaco ${tipoTabaco} (${calidad})
        Fardos Equivalentes: ${cantidadFardos}
        ID de Trazabilidad: ${codigo}
      `.trim();

      const provider = await embeddedWallet.getEthereumProvider();
      const firmaProductor = await provider.request({
        method: 'personal_sign',
        params: [mensajeAFirmar, embeddedWallet.address],
      });

      let uploadedFotoUrl = "";
      if (fotoFile) {
        const fileRef = ref(storage, `muestras_tabaco/${Date.now()}_${fotoFile.name}`);
        const snapshot = await uploadBytes(fileRef, fotoFile);
        uploadedFotoUrl = await getDownloadURL(snapshot.ref);
      }

      if (tipoVenta === "asociada") {
        const res = await unirseAAsociacion(asociacionSeleccionada, {
          tipoTabaco, calidad, kgs: numTotalKgs, cantidadFardos, usdTotal
        });

        if (!res.ok) {
          setError(res.error);
          setLoading(false);
          return;
        }
        associationId = res.associationId;
      }

      let selectedAssoc = null;
      if (associationId) {
        selectedAssoc = asociacionesDisponibles.find(a => a.id === associationId);
      }

      const doc = await generarOrdenVentaPDF(selectedAssoc ? {
        firstName: selectedAssoc.nombre,
        lastName: "",
        documentNumber: `ID: ${associationId.substring(0, 8)}`,
        email: "Venta Asociada"
      } : null, codigo);

      const pdfFileName = `Orden_Venta_TABAR_${codigo}.pdf`;
      doc.save(pdfFileName);

      const pdfData = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfData], { type: "application/pdf" });
      const storageRef = ref(storage, `certifications/${pdfFileName}`);
      await uploadBytes(storageRef, pdfBlob);
      const pdfUrl = await getDownloadURL(storageRef);

      const tokenizationData = {
        numeroCertificado: codigo,
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
        fotoUrl: uploadedFotoUrl,
        pdfUrl: pdfUrl,
        pdfNombre: pdfFileName,
        estado: "pendiente_acopio",
        fechaCreacion: new Date().toISOString(),
        creadoPor: user?.email,
        walletProductor: embeddedWallet.address,
        firmaDigitalOrigen: firmaProductor,
        datosCertificadosRaw: mensajeAFirmar
      };

      const res = await tokenizarProducer(tokenizationData);
      
      if (res.ok) {
        setTransactionCode(codigo);
        setSuccess(true);
      } else {
        setError(res.error || "Error al registrar la orden de venta");
      }
    } catch (err) {
      console.error(err);
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
          Tu orden de venta fue registrada exitosamente. Se generó un PDF respaldatorio.
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

      {/* TARJETA DE SALDO REAL ON-CHAIN INCORPORADA ARMÓNICAMENTE */}
      {account && (
        <div className="tabar-card" style={{ marginBottom: "20px", borderLeft: `4px solid ${C.accent}`, padding: "16px 20px" }}>
          <span style={{ fontSize: "11px", color: "#8B949E", fontWeight: 600, uppercase: true }}>
            Tu Balance de Garantías en Polygon
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#FFF", marginTop: "4px", fontFamily: "monospace" }}>
            {loadingBalance ? "Sincronizando Ledger..." : `${tokenBalance} TABAR`}
          </h2>
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "4px" }}>
            Billetera integrada: {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </p>
        </div>
      )}

      <div className="tabar-card">
        <h3 className="tabar-card-title">Información del Lote</h3>

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
        </div>

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
        </div>

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
        </div>

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
              <img src={fotoPreview} alt="Muestra" style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "8px", objectFit: "cover" }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tipo de Venta *
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input type="radio" name="tipoVenta" value="individual" checked={tipoVenta === "individual"} onChange={(e) => { setTipoVenta(e.target.value); setAsociacionSeleccionada(""); }} disabled={loading || showConfirm} />
              <span>Venta Individual</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input type="radio" name="tipoVenta" value="asociada" checked={tipoVenta === "asociada"} onChange={(e) => setTipoVenta(e.target.value)} disabled={loading || showConfirm} />
              <span>Venta Asociada</span>
            </label>
          </div>
        </div>

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
              <option value="">{loadingAsociaciones ? "Cargando..." : "Seleccionar asociación"}</option>
              {asociacionesDisponibles.map(asoc => (
                <option key={asoc.id} value={asoc.id}>
                  {asoc.nombre} - {asoc.inventario?.totalKgs || 0} Kgs (Miembros: {asoc.productores?.map(p => p.nombre).join(", ") || ""})
                </option>
              ))}
            </select>
          </div>
        )}

        {cantidadFardos > 0 && !showConfirm && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(227,182,79,0.2)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px" }}>Resumen de la orden</h4>
            <div style={{ display: "flex", justifyBetween: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Cantidad de fardos</span>
              <span style={{ color: "#3FB950", fontWeight: 600 }}>{fmtFardos(cantidadFardos)}</span>
            </div>
            <div style={{ display: "flex", justifyBetween: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Total de la orden</span>
              <span style={{ color: "#3FB950", fontWeight: 600 }}>${fmtMoney(usdTotal)}</span>
            </div>
          </div>
        )}

        {error && <div style={{ color: "#F85149", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px" }}>{error}</div>}

        {!showConfirm ? (
          <button className="tabar-btn tabar-btn-primary" disabled={!isFormValid || loading} onClick={() => setShowConfirm(true)} style={{ opacity: !isFormValid ? 0.5 : 1 }}>
            {!isFormValid ? "Completa todos los campos" : "Generar Orden de Venta"}
          </button>
        ) : (
          <div style={{ background: "rgba(227,182,79,0.05)", border: "1px solid rgba(227,182,79,0.2)", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <h4 style={{ color: "#E3B64F", margin: "0 0 10px 0" }}>Confirmar Registro Digital</h4>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Firmarás digitalmente los metadatos de {fmtFardos(cantidadFardos)} fardos a ${fmtMoney(precioFinal)}/kg con tu cuenta institucional.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="tabar-btn tabar-btn-ghost" onClick={() => setShowConfirm(false)} disabled={loading}>Cancelar</button>
              <button className="tabar-btn tabar-btn-primary" style={{ background: "#E3B64F", color: "#000" }} onClick={handleTokenizar} disabled={loading}>
                {loading ? "Firmando y Subiendo..." : "Confirmar y Firmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}