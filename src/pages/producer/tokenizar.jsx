import { useState, useEffect } from "react";
import { useData } from "../../modules/roles/DataContext";
import { useRole } from "../../modules/roles/RoleContext";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

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

export default function ProducerTokenizar() {
  const { tokenizarProducer, campana } = useData();
  const { user } = useRole();

  // Estados del formulario
  const [totalKgs, setTotalKgs] = useState("");
  const [tamanoFardo, setTamanoFardo] = useState("");
  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidad, setCalidad] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [productoresDisponibles, setProductoresDisponibles] = useState([]);
  const [productorAsociado, setProductorAsociado] = useState("");
  const [loadingProductores, setLoadingProductores] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");

  // Calcular cantidad de fardos basado en Kgs y tamaño
  const numTotalKgs = parseInt(totalKgs) || 0;
  const numTamanoFardo = parseInt(tamanoFardo) || 0;
  const cantidadFardos = numTamanoFardo > 0 ? Math.ceil(numTotalKgs / numTamanoFardo) : 0;
  const precioFinal = precioVenta ? parseFloat(precioVenta) : 85;
  const usdTotal = cantidadFardos * precioFinal;

  // Traer asociaciones disponibles para la Venta Asociada
  useEffect(() => {
    if (user?.uid) {
      const fetchAssociations = async () => {
        setLoadingProductores(true); // Reusing the same loading state
        try {
          // In a real app we'd query where user is a member, but let's just get all or those where user is member.
          // Since we might want to join any association to sell, let's fetch all active ones
          const q = query(collection(db, "producer_associations"), where("estadoAsociacion", "==", "activa"));
          const querySnapshot = await getDocs(q);
          const assocs = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // User can associate their tokens to associations they belong to.
            // Or maybe any? Let's say any association they are a member of.
            if (data.creadoPor === user.uid || (data.productores && data.productores.some(p => p.uid === user.uid))) {
              assocs.push({ id: doc.id, ...data });
            }
          });
          setProductoresDisponibles(assocs); // reusing the state variable for associations
        } catch (err) {
          console.error("Error fetching associations:", err);
        }
        setLoadingProductores(false);
      };
      fetchAssociations();
    }
  }, [user]);

  // Validar que todos los campos estén completos
  const isFormValid = totalKgs && tamanoFardo && tipoTabaco && calidad && tipoVenta && (!precioVenta || parseFloat(precioVenta) > 0) && (tipoVenta !== "asociada" || productorAsociado);

  // Generar código de transacción único
  const generarCodigoTransaccion = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TABAR-${timestamp}-${random}`;
  };

  // Generar PDF con datos del certificado
  const generarCertificadoPDF = (assocObj) => {
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
    doc.text("CERTIFICADO DE CERTIFICACIÓN Y COTIZACIÓN TABAR", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Certificación y Digitalización de Activos Tabacaleros", 20, 28);

    // Línea divisoria
    doc.setDrawColor(63, 185, 80);
    doc.line(20, 32, 190, 32);

    // Sección: Datos del Productor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL PRODUCTOR", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${user?.displayName || "No disponible"}`, 20, 50);
    doc.text(`Email: ${user?.email || "No disponible"}`, 20, 57);
    doc.text(`ID Productor: ${user?.uid?.substring(0, 12) || "No disponible"}`, 20, 64);

    // Sección: Detalles del Lote
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DETALLES DEL LOTE", 20, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Kgs a Certificar: ${totalKgs} kg`, 20, 83);
    doc.text(`Tamaño del Fardo: ${tamanoFardo} kg`, 20, 90);
    doc.text(`Cantidad de Fardos: ${cantidadFardos}`, 20, 97);
    doc.text(`Tipo de Tabaco: ${TIPOS_TABACO.find(t => t.value === tipoTabaco)?.label || tipoTabaco}`, 20, 104);
    doc.text(`Calidad: ${calidad}`, 20, 111);
    doc.text(`Tipo de Venta: ${tipoVenta === "individual" ? "Venta Individual" : "Venta Asociada"}`, 20, 118);

    // Sección: Precios
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PRECIOS", 20, 129);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Precio USD Financing (acopiador): $85`, 20, 137);
    doc.text(`Precio de Venta (productor): $${precioVenta ? precioVenta : "No especificado"}`, 20, 144);

    let yPos = 155;

    // Sección: Financiamiento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FINANCIAMIENTO ADELANTADO", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Monto USD: USD ${usdTotal.toLocaleString("es-AR")}`, 20, yPos);
    yPos += 7;
    doc.text(`Activos TABAR Generados: ${cantidadFardos.toLocaleString("es-AR")}`, 20, yPos);
    yPos += 11;

    // Sección Asociación Vinculada si existe
    if (assocObj) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("ASOCIACIÓN VINCULADA", 20, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Asociación: ${assocObj.nombre}`, 20, yPos);
        yPos += 7;
        doc.text(`ID Asociación: ${assocObj.id}`, 20, yPos);
        yPos += 11;
    }

    // Sección: Información de Transacción
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMACIÓN DE TRANSACCIÓN", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Código de Transacción: ${codigo}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha y Hora: ${fechaHora}`, 20, yPos);
    yPos += 7;
    doc.text(`Estado: Certificado y Tokenizado`, 20, yPos);

    // Pie de página
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(139, 148, 158);
    doc.text("Este certificado es un comprobante digital de la certificación realizada en la plataforma TABAR.", 20, 250);
    doc.text("La existencia de este documento implica la aceptación de los términos y condiciones del financiamiento tabacalero.", 20, 256);

    // Guardar el PDF
    doc.save(`TABAR_Certificado_${codigo}.pdf`);

    return codigo;
  };

  const handleTokenizar = async () => {
    if (tipoVenta === "asociada" && !productorAsociado) {
        setError("Debes seleccionar una asociación");
        return;
    }
    setError("");
    setLoading(true);

    const assocObj = tipoVenta === "asociada" ? JSON.parse(productorAsociado) : null;
    
    const tokenizationData = {
      cantidadFardos,
      totalKgs: parseInt(totalKgs),
      tamanoFardo: parseInt(tamanoFardo),
      tipoTabaco,
      calidad,
      tipoVenta,
      precioVenta: precioFinal,
      usdTotal,
      productorOwner: user.uid,
    };

    if (assocObj) {
      tokenizationData.asociacionVinculada = assocObj.id;
      tokenizationData.asociacionNombre = assocObj.nombre;
    }

    const res = await tokenizarProducer(tokenizationData);
    if (res.ok) {
      // Generar PDF
      const codigo = generarCertificadoPDF(assocObj);
      setTransactionCode(codigo);
      setSuccess(true);
    } else {
      setError(res.error || "Error al tokenizar los fardos");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🌿</div>
        <h2 style={{ color: "#3FB950", marginBottom: "12px" }}>¡Certificación Exitosa!</h2>
        <p style={{ color: "#8B949E", marginBottom: "12px", fontSize: "12px" }}>
          Tus {cantidadFardos} fardos ({totalKgs} kg) han sido certificados y ya están a la venta.
        </p>
        <div style={{
          background: "rgba(63,185,80,0.1)",
          border: "1px solid rgba(63,185,80,0.3)",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          fontSize: "11px"
        }}>
          <p style={{ margin: "0 0 8px 0", color: "#8B949E" }}>Código de Transacción:</p>
          <p style={{ margin: 0, color: "#3FB950", fontFamily: "monospace", fontWeight: "bold", fontSize: "13px" }}>
            {transactionCode}
          </p>
        </div>
        <p style={{ color: "#8B949E", marginBottom: "30px", fontSize: "12px" }}>
          Tu tabaco ha sido cotizado exitosamente por nuestro sistema.
          <br />
          Se ha generado un PDF con los detalles del certificado.
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
          <h1>Certificación y Cotización</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Transformá tu tabaco físico en activos digitales financieros</p>
      </div>

      <div className="tabar-card">
        <h3 className="tabar-card-title">Información del Lote</h3>

        {/* Total Kgs a Certificar */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Total Kgs a Certificar *
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
            Cantidad total de kilos de tabaco a certificar
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

        {/* Precio de venta */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Precio de venta ($)
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej: 2.50"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            disabled={loading || showConfirm}
          />
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
                onChange={(e) => { setTipoVenta(e.target.value); setProductorAsociado(""); }}
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

        {/* Asociación Vinculada */}
        {tipoVenta === "asociada" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
              Asociación Vinculada *
            </label>
            <select
              className="tabar-input"
              value={productorAsociado}
              onChange={(e) => setProductorAsociado(e.target.value)}
              disabled={loading || showConfirm || loadingProductores}
              style={{ cursor: "pointer" }}
            >
              <option value="">{loadingProductores ? "Cargando asociaciones..." : "Seleccionar asociación"}</option>
              {productoresDisponibles.map(a => (
                <option key={a.id} value={JSON.stringify(a)}>{a.nombre} (ID: {a.id})</option>
              ))}
            </select>
            <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
              Si no ves tu asociación, puedes crearla en el menú "Venta en Bloque"
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
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--tb-text-2)" }}>Resumen de la operación</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Total Kgs a certificar</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{totalKgs} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Tamaño por fardo</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{tamanoFardo} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Cantidad de fardos</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>{cantidadFardos}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Precio USD Financing</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>$85</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Precio de Venta</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>${precioVenta ? precioVenta : "85"}</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Financiamiento adelantado (USD)</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>USD {usdTotal.toLocaleString("es-AR")}</span>
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
            {!isFormValid ? "Completa todos los campos" : "Generar Certificado"}
          </button>
        ) : (
          <div style={{
            background: "rgba(227,182,79,0.05)",
            border: "1px solid rgba(227,182,79,0.2)",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center"
          }}>
            <h4 style={{ color: "#E3B64F", margin: "0 0 10px 0" }}>Confirmar Firma Digital</h4>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Estás por certificar legalmente {cantidadFardos} fardos ({totalKgs} kg) de {tipoTabaco === "virginia" ? "Virginia" : tipoTabaco === "burley" ? "Burley" : "Criollo"}.
              <br />
              Esta acción es irreversible en el registro fiduciario y generará un PDF con el código de transacción.
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
                {loading ? "Certificando..." : "Confirmar y Generar Certificado"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", padding: "14px", background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "#58A6FF", margin: 0 }}>
          ℹ️ Actualmente hay {campana.fardosDisponibles?.toLocaleString("es-AR")} TABAR disponibles en la campaña activa.
        </p>
      </div>
    </div>
  );
}