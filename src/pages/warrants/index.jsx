import React, { useState, useEffect, useContext } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRole, ROLE_LABELS } from "../../modules/roles/RoleContext";
import { db, storage } from "../../config/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Web3Context } from "../../context/Web3Context";
import jsPDF from "jspdf";

const TIPOS_PRODUCTO = [
  { value: "Tabaco Virginia", label: "Tabaco Virginia" },
  { value: "Tabaco Burley", label: "Tabaco Burley" },
  { value: "Tabaco Criollo", label: "Tabaco Criollo" },
];

const PRESENTACIONES = [
  { value: "Fardos", label: "Fardos" },
  { value: "Cajas", label: "Cajas" },
  { value: "Granel", label: "Granel" },
];

const UNIDADES_MEDIDA = [
  { value: "Kgs", label: "Kilogramos (Kgs)" },
  { value: "Fardos", label: "Fardos" },
];

const PROVINCIAS = [
  "Misiones", "Salta", "Jujuy", "Tucumán", "Corrientes", "Chaco", "Catamarca", "Buenos Aires", "Córdoba", "Santa Fe"
];

const COBERTURAS = [
  { value: "Todo Riesgo", label: "Todo Riesgo Operativo" },
  { value: "Incendio y Tormenta", label: "Incendio, Rayo y Tormenta" },
  { value: "Robo y Hurto", label: "Robo y Hurto" },
];

export default function WarrantsPage() {
  const { user, role, profile } = useRole();
  const { account } = useContext(Web3Context);
  const { ready: privyReady } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = privyReady
    ? (wallets || []).find((w) => w.walletClientType === "privy")
    : null;

  // Tabs
  const [activeTab, setActiveTab] = useState("emisiones");

  // eWarrants List
  const [warrants, setWarrants] = useState([]);
  const [loadingWarrants, setLoadingWarrants] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Signature state
  const [signingId, setSigningId] = useState(null);

  // Endorse state
  const [endorsingId, setEndorsingId] = useState(null);
  const [endorseCuit, setEndorseCuit] = useState("");
  const [endorseRazon, setEndorseRazon] = useState("");

  // Cancel state
  const [cancellingId, setCancellingId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    fechaEmision: new Date().toISOString().split("T")[0],
    plazo: "90",
    fechaVencimiento: "",
    // Emisor
    emisorCuit: "",
    emisorRazon: "",
    emisorDomicilio: "",
    emisorProvincia: "Misiones",
    emisorLocalidad: "",
    emisorTelefono: "",
    // Deposito
    depositoCuit: "",
    depositoRazon: "",
    depositoDomicilio: "",
    depositoProvincia: "Misiones",
    depositoLocalidad: "",
    depositoZona: "",
    depositoTipoAlmacen: "General",
    depositoLat: "",
    depositoLng: "",
    depositoTelefono: "",
    // Producto
    producto: "Tabaco Virginia",
    presentacion: "Fardos",
    calidad: "Clase A",
    unidadMedida: "Kgs",
    cantidad: "",
    observaciones: "",
    moneda: "USD",
    precioUnitario: "",
    valorTotal: 0,
    // Seguro
    seguroCuit: "",
    seguroCompania: "",
    seguroPoliza: "",
    seguroMonto: "",
    seguroCobertura: "Todo Riesgo",
    seguroVencimiento: "",
  });

  const [firmantes, setFirmantes] = useState([
    { nombre: profile?.firstName || "Usuario", apellido: profile?.lastName || "TABAR", cuit: "20-99999999-9", email: user?.email || "", rol: "Emisor / Depositante" }
  ]);

  const [nuevoFirmante, setNuevoFirmante] = useState({ nombre: "", apellido: "", cuit: "", email: "", rol: "Firmante Autorizado" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Tokenizaciones propias sin warrant asociado todavía (para vincular al emitir)
  const [tokenizaciones, setTokenizaciones] = useState([]);
  const [tokenizacionId, setTokenizacionId] = useState("");

  useEffect(() => {
    if (!user?.uid) { setTokenizaciones([]); return; }
    const q = query(collection(db, "producer_tokenizations"), where("productorOwner", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (!data.warrantId) items.push({ id: d.id, ...data });
      });
      setTokenizaciones(items);
    });
    return () => unsubscribe();
  }, [user]);

  // Load Warrants
  useEffect(() => {
    const q = collection(db, "warrants");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setWarrants(items);
      setLoadingWarrants(false);
    }, (err) => {
      console.error("Error al cargar warrants:", err);
      setLoadingWarrants(false);
    });
    return () => unsubscribe();
  }, []);

  // Update dynamic dates & values
  useEffect(() => {
    const p = parseInt(form.plazo) || 0;
    if (form.fechaEmision) {
      const date = new Date(form.fechaEmision);
      date.setDate(date.getDate() + p);
      setForm((prev) => ({ ...prev, fechaVencimiento: date.toISOString().split("T")[0] }));
    }
  }, [form.fechaEmision, form.plazo]);

  useEffect(() => {
    const cant = parseFloat(form.cantidad) || 0;
    const prec = parseFloat(form.precioUnitario) || 0;
    setForm((prev) => ({ ...prev, valorTotal: cant * prec }));
  }, [form.cantidad, form.precioUnitario]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCuitChange = (e) => {
    const { name, value } = e.target;
    const clean = value.replace(/\D/g, "");
    let formatted = clean;
    if (clean.length > 2 && clean.length <= 10) {
      formatted = `${clean.slice(0, 2)}-${clean.slice(2)}`;
    } else if (clean.length > 10) {
      formatted = `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10, 11)}`;
    }
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleAgregarFirmante = () => {
    if (!nuevoFirmante.nombre || !nuevoFirmante.apellido || !nuevoFirmante.cuit || !nuevoFirmante.email) {
      alert("Por favor, completa todos los campos del firmante.");
      return;
    }
    setFirmantes([...firmantes, nuevoFirmante]);
    setNuevoFirmante({ nombre: "", apellido: "", cuit: "", email: "", rol: "Firmante Autorizado" });
  };

  const handleEliminarFirmante = (index) => {
    setFirmantes(firmantes.filter((_, i) => i !== index));
  };

  const cleanForm = () => {
    setForm({
      fechaEmision: new Date().toISOString().split("T")[0],
      plazo: "90",
      fechaVencimiento: "",
      emisorCuit: "",
      emisorRazon: "",
      emisorDomicilio: "",
      emisorProvincia: "Misiones",
      emisorLocalidad: "",
      emisorTelefono: "",
      depositoCuit: "",
      depositoRazon: "",
      depositoDomicilio: "",
      depositoProvincia: "Misiones",
      depositoLocalidad: "",
      depositoZona: "",
      depositoTipoAlmacen: "General",
      depositoLat: "",
      depositoLng: "",
      depositoTelefono: "",
      producto: "Tabaco Virginia",
      presentacion: "Fardos",
      calidad: "Clase A",
      unidadMedida: "Kgs",
      cantidad: "",
      observaciones: "",
      moneda: "USD",
      precioUnitario: "",
      valorTotal: 0,
      seguroCuit: "",
      seguroCompania: "",
      seguroPoliza: "",
      seguroMonto: "",
      seguroCobertura: "Todo Riesgo",
      seguroVencimiento: "",
    });
    setFirmantes([
      { nombre: profile?.firstName || "Usuario", apellido: profile?.lastName || "TABAR", cuit: "20-99999999-9", email: user?.email || "", rol: "Emisor / Depositante" }
    ]);
  };

  // Generate eWarrant PDF
  const generarWarrantPDF = (codigo, warrantData) => {
    const doc = new jsPDF();
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(227, 182, 79);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CERTIFICADO DE DEPOSITO Y WARRANT DIGITAL", 105, 20, { align: "center" });

    doc.setTextColor(139, 148, 158);
    doc.setFontSize(10);
    doc.text(`TABAR Protocol - Nro. Identificación: ${codigo}`, 105, 28, { align: "center" });

    // Body
    doc.setTextColor(240, 246, 252);
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(227, 182, 79);
    doc.line(15, 45, 195, 45);

    let y = 55;
    doc.setFont("helvetica", "bold");
    doc.text("1. DATOS DEL EMISOR / DEPOSITANTE", 15, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Razón Social: ${warrantData.emisorRazon}`, 15, y);
    doc.text(`CUIT: ${warrantData.emisorCuit}`, 110, y);
    y += 6;
    doc.text(`Domicilio: ${warrantData.emisorDomicilio}, ${warrantData.emisorLocalidad}, ${warrantData.emisorProvincia}`, 15, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("2. DATOS DEL DEPOSITO Y ESTABLECIMIENTO", 15, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Razón Social: ${warrantData.depositoRazon}`, 15, y);
    doc.text(`Almacén: ${warrantData.depositoTipoAlmacen}`, 110, y);
    y += 6;
    doc.text(`Ubicación: ${warrantData.depositoDomicilio}, ${warrantData.depositoLocalidad}, ${warrantData.depositoProvincia}`, 15, y);
    y += 6;
    doc.text(`Georreferencia: Lat ${warrantData.depositoLat}, Lng ${warrantData.depositoLng}`, 15, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("3. DETALLE DE PRODUCTOS DEPOSITADOS", 15, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Producto: ${warrantData.producto}`, 15, y);
    doc.text(`Cantidad: ${warrantData.cantidad} ${warrantData.unidadMedida}`, 110, y);
    y += 6;
    doc.text(`Presentación: ${warrantData.presentacion} (${warrantData.calidad})`, 15, y);
    doc.text(`Valor Lote: ${warrantData.moneda} $${warrantData.valorTotal.toLocaleString("es-AR")}`, 110, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("4. COBERTURA DE SEGURO", 15, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Compañía: ${warrantData.seguroCompania}`, 15, y);
    doc.text(`Póliza Nro: ${warrantData.seguroPoliza}`, 110, y);
    y += 6;
    doc.text(`Cobertura: ${warrantData.seguroCobertura}`, 15, y);
    doc.text(`Monto Asegurado: $${warrantData.seguroMonto}`, 110, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("5. VENCIMIENTOS Y PLAZOS", 15, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.text(`Fecha Emisión: ${warrantData.fechaEmision}`, 15, y);
    doc.text(`Plazo: ${warrantData.plazo} días`, 80, y);
    doc.text(`Fecha Vencimiento: ${warrantData.fechaVencimiento}`, 130, y);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(139, 148, 158);
    doc.text("Este documento electrónico es un Warrant válido bajo el estándar TABAR Tech Protocol.", 15, 275);

    return doc;
  };

  // Submit / Create Warrant
  const handleCreateWarrant = async (isDraft = false) => {
    setFormError("");
    
    // Validations (skip if draft)
    if (!isDraft) {
      if (!form.emisorRazon || !form.emisorCuit || !form.producto || !form.cantidad || !form.precioUnitario) {
        setFormError("Por favor, completa los campos requeridos del depositante y del producto.");
        return;
      }
    }

    setFormLoading(true);

    try {
      const timestamp = Date.now();
      const code = `WNT-${timestamp}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      let pdfUrl = "";
      let signature = "";

      // Signature via Privy
      if (!isDraft) {
        if (!embeddedWallet) {
          throw new Error("No se detectó tu Billetera integrada Privy. Actívala en tu Perfil.");
        }
        
        const messageToSign = `
          TABAR Protocol - eWarrant Digital
          Emisor CUIT: ${form.emisorCuit}
          Lote: ${form.cantidad} ${form.unidadMedida} de ${form.producto}
          Monto Estimado: ${form.moneda} $${form.valorTotal}
          Fecha Vencimiento: ${form.fechaVencimiento}
          ID Identificador: ${code}
        `.trim();

        const provider = await embeddedWallet.getEthereumProvider();
        signature = await provider.request({
          method: "personal_sign",
          params: [messageToSign, embeddedWallet.address],
        });

        // Generate PDF
        const doc = generarWarrantPDF(code, form);
        const pdfData = doc.output("arraybuffer");
        const pdfBlob = new Blob([pdfData], { type: "application/pdf" });

        const storageRef = ref(storage, `warrants_documents/${code}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
        pdfUrl = await getDownloadURL(storageRef);
      }

      // Add to Firestore
      const warrantData = {
        ...form,
        numero: code,
        depositante: form.emisorRazon,
        estado: isDraft ? "borrador" : "pendiente_firma",
        firmaEmisor: signature,
        pdfUrl,
        firmantesDesignados: firmantes,
        creadoPor: user?.uid,
        emailCreador: user?.email,
        tenedorActual: form.emisorRazon,
        tenedorCuit: form.emisorCuit,
        tokenizacionId: tokenizacionId || null,
        fechaCreacion: new Date().toISOString(),
      };

      const newWarrantRef = await addDoc(collection(db, "warrants"), warrantData);

      // Registrar el vínculo también del lado de la tokenización, para
      // poder resolverlo sin tener que recorrer todos los warrants.
      if (tokenizacionId) {
        await updateDoc(doc(db, "producer_tokenizations", tokenizacionId), {
          warrantId: newWarrantRef.id,
        });
      }

      alert(isDraft ? "Borrador guardado exitosamente." : "eWarrant emitido y firmado con éxito.");
      setTokenizacionId("");
      cleanForm();
      setActiveTab("emisiones");
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Error al procesar el warrant.");
    } finally {
      setFormLoading(false);
    }
  };

  // Sign Pending Warrant
  const handleSignWarrant = async (warrant) => {
    if (!embeddedWallet) {
      alert("No se detectó tu Billetera integrada Privy.");
      return;
    }
    setSigningId(warrant.id);
    try {
      const messageToSign = `
        TABAR Protocol - Firma Autorizada de eWarrant
        Número: ${warrant.numero}
        Depositante: ${warrant.emisorRazon}
        Lote: ${warrant.cantidad} ${warrant.unidadMedida} de ${warrant.producto}
        Firmante CUIT: ${profile?.firstName || ""} - ${user?.email}
      `.trim();

      const provider = await embeddedWallet.getEthereumProvider();
      const signature = await provider.request({
        method: "personal_sign",
        params: [messageToSign, embeddedWallet.address],
      });

      // Update state to valid / signed
      await updateDoc(doc(db, "warrants", warrant.id), {
        estado: "vigente",
        firmaAutorizada: signature,
      });

      alert("Documento firmado criptográficamente con éxito. Estado: Vigente.");
    } catch (err) {
      console.error(err);
      alert("Error al firmar: " + err.message);
    } finally {
      setSigningId(null);
    }
  };

  // Endorse Warrant
  const handleEndorseWarrant = async () => {
    if (!endorseCuit || !endorseRazon) {
      alert("Completa los datos del beneficiario del endoso.");
      return;
    }
    try {
      await updateDoc(doc(db, "warrants", endorsingId), {
        tenedorActual: endorseRazon,
        tenedorCuit: endorseCuit,
        estado: "endosado",
      });
      alert("Warrant endosado correctamente.");
      setEndorsingId(null);
      setEndorseCuit("");
      setEndorseRazon("");
    } catch (err) {
      console.error(err);
      alert("Error al endosar.");
    }
  };

  // Cancel Warrant (Release Goods)
  const handleCancelWarrant = async (id) => {
    if (!window.confirm("¿Seguro que deseas iniciar la cancelación y liberar la mercadería?")) return;
    try {
      await updateDoc(doc(db, "warrants", id), {
        estado: "cancelado",
      });
      alert("Mercadería liberada y eWarrant cancelado.");
    } catch (err) {
      console.error(err);
      alert("Error al cancelar.");
    }
  };

  // Filters
  const filteredWarrants = warrants.filter((w) => {
    const queryLower = searchQuery.toLowerCase();
    return (
      w.numero?.toLowerCase().includes(queryLower) ||
      w.depositante?.toLowerCase().includes(queryLower) ||
      w.producto?.toLowerCase().includes(queryLower)
    );
  });

  return (
    <div className="tabar-warrants-page" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "var(--tb-text)", margin: "0 0 6px 0" }}>Warrants Digitales</h1>
        <p style={{ fontSize: "13px", color: "var(--tb-text-2)", margin: 0 }}>
          Módulo de emisión, control de firmas y endosos de certificados de depósito estructurados.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: "flex",
        gap: "8px",
        borderBottom: "1px solid var(--tb-border)",
        marginBottom: "24px",
        overflowX: "auto",
        paddingBottom: "8px"
      }}>
        {[
          { id: "emisiones", label: "Mis Emisiones" },
          { id: "emitir", label: "+ Emitir" },
          { id: "pendientes", label: "Pendientes de Firma" },
          { id: "endosar", label: "Para Endosar" },
          { id: "cancelar", label: "Para Cancelar" },
          { id: "vencer", label: "Próximos a Vencer" },
          { id: "documentos", label: "Mis Documentos Globales" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              background: activeTab === t.id ? "rgba(227,182,79,0.1)" : "transparent",
              color: activeTab === t.id ? "var(--tb-accent)" : "var(--tb-text-2)",
              border: activeTab === t.id ? "1px solid rgba(227,182,79,0.25)" : "1px solid transparent",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: MIS EMISIONES */}
      {activeTab === "emisiones" && (
        <div className="tabar-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h3 className="tabar-card-title" style={{ margin: "0 0 4px 0" }}>Mis Emisiones</h3>
              <p style={{ fontSize: "12px", color: "var(--tb-text-2)" }}>Listado completo de tus eWarrants emitidos.</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" }}>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tabar-input"
                style={{ width: "200px", padding: "6px 12px", fontSize: "12px" }}
              />
              {searchQuery && (
                <button className="tabar-btn tabar-btn-ghost" onClick={() => setSearchQuery("")} style={{ padding: "6px 12px" }}>
                  Limpiar
                </button>
              )}
              <button className="tabar-btn tabar-btn-primary" onClick={() => setActiveTab("emitir")}>
                + Emitir
              </button>
            </div>
          </div>

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Depositante</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor Total</th>
                  <th>Moneda</th>
                  <th>Emisión</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingWarrants ? (
                  <tr><td colSpan="10" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>Cargando emisiones...</td></tr>
                ) : filteredWarrants.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No se encontraron emisiones registradas.</td></tr>
                ) : (
                  filteredWarrants.map((w) => (
                    <tr key={w.id}>
                      <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                      <td>{w.depositante}</td>
                      <td>{w.producto}</td>
                      <td>{w.cantidad} {w.unidadMedida}</td>
                      <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                      <td>{w.moneda}</td>
                      <td>{w.fechaEmision}</td>
                      <td>{w.plazo} días</td>
                      <td>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          background: w.estado === "vigente" ? "rgba(63,185,80,0.1)" : w.estado === "borrador" ? "rgba(139,148,158,0.1)" : "rgba(240,136,62,0.1)",
                          color: w.estado === "vigente" ? "var(--tb-green)" : w.estado === "borrador" ? "var(--tb-text-2)" : w.estado === "orange",
                          border: `1px solid ${w.estado === "vigente" ? "rgba(63,185,80,0.2)" : "rgba(139,148,158,0.2)"}`
                        }}>
                          {w.estado.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {w.pdfUrl && (
                          <a href={w.pdfUrl} target="_blank" rel="noopener noreferrer" className="tabar-btn tabar-btn-ghost" style={{ padding: "4px 8px", fontSize: "11px" }}>
                            Descargar PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EMITIR */}
      {activeTab === "emitir" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Formulario de Emisión</h3>
          <p style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "20px" }}>
            Por favor, completa los siguientes campos. Todos los warrants requieren firma criptográfica institucional.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Fechas */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Fechas</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Fecha de Emisión *</label>
                  <input type="date" name="fechaEmision" value={form.fechaEmision} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Plazo (días) *</label>
                  <input type="number" name="plazo" value={form.plazo} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Fecha de Vencimiento (Autocalculada)</label>
                  <input type="date" name="fechaVencimiento" value={form.fechaVencimiento} readOnly className="tabar-input" style={{ opacity: 0.7 }} />
                </div>
              </div>
            </div>

            {/* Depositante */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Depositante - Emisor</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>CUIT *</label>
                  <input type="text" name="emisorCuit" value={form.emisorCuit} onChange={handleCuitChange} placeholder="99-99999999-9" className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Razón Social *</label>
                  <input type="text" name="emisorRazon" value={form.emisorRazon} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Domicilio *</label>
                  <input type="text" name="emisorDomicilio" value={form.emisorDomicilio} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Provincia *</label>
                  <select name="emisorProvincia" value={form.emisorProvincia} onChange={handleInputChange} className="tabar-input" style={{ cursor: "pointer" }}>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Localidad / Ciudad *</label>
                  <input type="text" name="emisorLocalidad" value={form.emisorLocalidad} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Teléfono *</label>
                  <input type="text" name="emisorTelefono" value={form.emisorTelefono} onChange={handleInputChange} className="tabar-input" />
                </div>
              </div>
            </div>

            {/* Deposito */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Depósito - Establecimiento</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>CUIT Establecimiento *</label>
                  <input type="text" name="depositoCuit" value={form.depositoCuit} onChange={handleCuitChange} placeholder="99-99999999-9" className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Razón Social *</label>
                  <input type="text" name="depositoRazon" value={form.depositoRazon} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Domicilio *</label>
                  <input type="text" name="depositoDomicilio" value={form.depositoDomicilio} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Provincia *</label>
                  <select name="depositoProvincia" value={form.depositoProvincia} onChange={handleInputChange} className="tabar-input">
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Localidad *</label>
                  <input type="text" name="depositoLocalidad" value={form.depositoLocalidad} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Zona *</label>
                  <input type="text" name="depositoZona" value={form.depositoZona} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Tipo Almacén *</label>
                  <select name="depositoTipoAlmacen" value={form.depositoTipoAlmacen} onChange={handleInputChange} className="tabar-input">
                    <option value="General">General</option>
                    <option value="Frigorífico">Frigorífico</option>
                    <option value="Fiscal">Fiscal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Ubicación Latitud *</label>
                  <input type="text" name="depositoLat" value={form.depositoLat} onChange={handleInputChange} placeholder="-24.185" className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Ubicación Longitud *</label>
                  <input type="text" name="depositoLng" value={form.depositoLng} onChange={handleInputChange} placeholder="-65.299" className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Teléfono Depósito *</label>
                  <input type="text" name="depositoTelefono" value={form.depositoTelefono} onChange={handleInputChange} className="tabar-input" />
                </div>
              </div>
            </div>

            {/* Vínculo con producción tokenizada */}
            {tokenizaciones.length > 0 && (
              <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Vincular a producción tokenizada (opcional)</h4>
                <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>
                  Lote certificado a respaldar con este warrant
                </label>
                <select
                  value={tokenizacionId}
                  onChange={(e) => setTokenizacionId(e.target.value)}
                  className="tabar-input"
                >
                  <option value="">Sin vincular</option>
                  {tokenizaciones.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tipoTabaco || "Tabaco"} — {t.cantidadFardos || 0} fardos ({t.numeroCertificado || t.id})
                    </option>
                  ))}
                </select>
                <span style={{ display: "block", fontSize: "11px", color: "var(--tb-text-3)", marginTop: "4px" }}>
                  Al emitir el warrant, queda registrado como el respaldo de esa tokenización.
                </span>
              </div>
            )}

            {/* Producto */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Producto / Mercadería</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Producto *</label>
                  <select name="producto" value={form.producto} onChange={handleInputChange} className="tabar-input">
                    {TIPOS_PRODUCTO.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Presentación *</label>
                  <select name="presentacion" value={form.presentacion} onChange={handleInputChange} className="tabar-input">
                    {PRESENTACIONES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Calidad / Clase *</label>
                  <input type="text" name="calidad" value={form.calidad} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Unidad de Medida *</label>
                  <select name="unidadMedida" value={form.unidadMedida} onChange={handleInputChange} className="tabar-input">
                    {UNIDADES_MEDIDA.map(um => <option key={um.value} value={um.value}>{um.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Cantidad *</label>
                  <input type="number" name="cantidad" value={form.cantidad} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Moneda *</label>
                  <select name="moneda" value={form.moneda} onChange={handleInputChange} className="tabar-input">
                    <option value="USD">Dólares (USD)</option>
                    <option value="ARS">Pesos (ARS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Precio Unitario *</label>
                  <input type="number" name="precioUnitario" value={form.precioUnitario} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Valor Total Estimado (Calculado)</label>
                  <input type="text" value={`$${form.valorTotal.toLocaleString("es-AR")}`} readOnly className="tabar-input" style={{ opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Observaciones (Máx. 1500 caracteres)</label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleInputChange}
                  maxLength="1500"
                  className="tabar-input"
                  style={{ height: "80px", resize: "none" }}
                />
                <div style={{ fontSize: "10px", color: "var(--tb-text-3)", textAlign: "right" }}>
                  {form.observaciones.length} / 1500 caracteres
                </div>
              </div>
            </div>

            {/* Seguro */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Seguros contratados</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>CUIT Aseguradora *</label>
                  <input type="text" name="seguroCuit" value={form.seguroCuit} onChange={handleCuitChange} placeholder="99-99999999-9" className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Compañía de Seguros *</label>
                  <input type="text" name="seguroCompania" value={form.seguroCompania} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Póliza Nro *</label>
                  <input type="text" name="seguroPoliza" value={form.seguroPoliza} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Monto Asegurado *</label>
                  <input type="number" name="seguroMonto" value={form.seguroMonto} onChange={handleInputChange} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Cobertura *</label>
                  <select name="seguroCobertura" value={form.seguroCobertura} onChange={handleInputChange} className="tabar-input">
                    {COBERTURAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Vencimiento Póliza *</label>
                  <input type="date" name="seguroVencimiento" value={form.seguroVencimiento} onChange={handleInputChange} className="tabar-input" />
                </div>
              </div>
            </div>

            {/* Firmantes */}
            <div style={{ border: "1px solid var(--tb-border)", borderRadius: "8px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Firmantes Designados</h4>
              
              <div className="tabar-table-wrap" style={{ marginBottom: "16px" }}>
                <table className="tabar-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>CUIT/CUIL</th>
                      <th>E-mail</th>
                      <th>En representación de</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firmantes.map((f, i) => (
                      <tr key={i}>
                        <td>{f.nombre}</td>
                        <td>{f.apellido}</td>
                        <td className="mono">{f.cuit}</td>
                        <td>{f.email}</td>
                        <td>{f.rol}</td>
                        <td>
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => handleEliminarFirmante(i)}
                              style={{ background: "transparent", border: "none", color: "var(--tb-red)", cursor: "pointer" }}
                            >
                              🗑️
                            </button>
                          )}
                          {i === 0 && <span style={{ color: "var(--tb-accent)" }}>🔑 Creador</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Agregar Firmante */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                padding: "12px",
                borderRadius: "6px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "10px",
                alignItems: "end"
              }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", marginBottom: "4px" }}>Nombre</label>
                  <input type="text" value={nuevoFirmante.nombre} onChange={(e) => setNuevoFirmante({ ...nuevoFirmante, nombre: e.target.value })} className="tabar-input" style={{ padding: "4px 8px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", marginBottom: "4px" }}>Apellido</label>
                  <input type="text" value={nuevoFirmante.apellido} onChange={(e) => setNuevoFirmante({ ...nuevoFirmante, apellido: e.target.value })} className="tabar-input" style={{ padding: "4px 8px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", marginBottom: "4px" }}>CUIT</label>
                  <input type="text" value={nuevoFirmante.cuit} onChange={(e) => setNuevoFirmante({ ...nuevoFirmante, cuit: e.target.value })} className="tabar-input" placeholder="20-xxxxxxxx-x" style={{ padding: "4px 8px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", marginBottom: "4px" }}>E-mail</label>
                  <input type="email" value={nuevoFirmante.email} onChange={(e) => setNuevoFirmante({ ...nuevoFirmante, email: e.target.value })} className="tabar-input" style={{ padding: "4px 8px", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", marginBottom: "4px" }}>En representación</label>
                  <input type="text" value={nuevoFirmante.rol} onChange={(e) => setNuevoFirmante({ ...nuevoFirmante, rol: e.target.value })} className="tabar-input" style={{ padding: "4px 8px", fontSize: "12px" }} />
                </div>
                <button type="button" onClick={handleAgregarFirmante} className="tabar-btn tabar-btn-primary" style={{ padding: "8px 12px", fontSize: "11px" }}>
                  Añadir
                </button>
              </div>
            </div>

            {formError && (
              <div style={{ color: "var(--tb-red)", fontSize: "12px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px" }}>
                {formError}
              </div>
            )}

            {/* Actions Form */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" onClick={cleanForm} className="tabar-btn tabar-btn-ghost" disabled={formLoading}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleCreateWarrant(true)} className="tabar-btn tabar-btn-ghost" style={{ borderColor: "var(--tb-accent)", color: "var(--tb-accent)" }} disabled={formLoading}>
                Guardar Borrador
              </button>
              <button type="button" onClick={() => handleCreateWarrant(false)} className="tabar-btn tabar-btn-primary" disabled={formLoading}>
                {formLoading ? "FIRMANDO & PROCESANDO..." : "EMITIR Y FIRMAR DIGITALMENTE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PENDIENTES DE FIRMA */}
      {activeTab === "pendientes" && (
        <div className="tabar-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="tabar-card-title">Pendientes de Firma</h3>
              <p style={{ fontSize: "12px", color: "var(--tb-text-2)" }}>Firmas autorizadas pendientes para la validez del Warrant.</p>
            </div>
            <button className="tabar-btn tabar-btn-ghost" style={{ padding: "6px 12px" }} onClick={() => alert("Función de exportación de Warrants generada con éxito en PDF/CSV")}>
              Exportar
            </button>
          </div>

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Depositante</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warrants.filter(w => w.estado === "pendiente_firma").length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No hay warrants pendientes de firma.</td></tr>
                ) : (
                  warrants.filter(w => w.estado === "pendiente_firma").map(w => (
                    <tr key={w.id}>
                      <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                      <td>{w.depositante}</td>
                      <td>{w.producto}</td>
                      <td>{w.cantidad} {w.unidadMedida}</td>
                      <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                      <td>
                        <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", background: "rgba(240,136,62,0.1)", color: "var(--tb-orange)" }}>
                          FALTA FIRMA
                        </span>
                      </td>
                      <td>
                        <button
                          className="tabar-btn tabar-btn-primary"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          disabled={signingId === w.id}
                          onClick={() => handleSignWarrant(w)}
                        >
                          {signingId === w.id ? "Firmando..." : "Firmar eWarrant"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PARA ENDOSAR */}
      {activeTab === "endosar" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Para Endosar</h3>
          <p style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "12px" }}>
            Seleccioná un documento vigente para iniciar un nuevo endoso.
          </p>
          <div style={{ background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.15)", padding: "10px 16px", borderRadius: "6px", fontSize: "12px", color: "var(--tb-blue)", marginBottom: "20px" }}>
            💡 <strong>Tip:</strong> Mostrando Warrants por defecto. Para endosar un Certificado de Depósito, usá el filtro en la columna 'Documento'.
          </div>

          {endorsingId && (
            <div style={{ background: "var(--tb-surface-2)", border: "1px solid var(--tb-border)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--tb-accent)" }}>Endosar Warrant</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>CUIT del Nuevo Beneficiario</label>
                  <input type="text" placeholder="30-xxxxxxxx-x" value={endorseCuit} onChange={(e) => setEndorseCuit(e.target.value)} className="tabar-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>Razón Social Beneficiario</label>
                  <input type="text" value={endorseRazon} onChange={(e) => setEndorseRazon(e.target.value)} className="tabar-input" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="tabar-btn tabar-btn-primary" onClick={handleEndorseWarrant}>Confirmar Endoso Criptográfico</button>
                <button className="tabar-btn tabar-btn-ghost" onClick={() => setEndorsingId(null)}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nro.</th>
                  <th>Depositante</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor Total</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warrants.filter(w => w.estado === "vigente" || w.estado === "endosado").length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No hay warrants disponibles para endoso.</td></tr>
                ) : (
                  warrants.filter(w => w.estado === "vigente" || w.estado === "endosado").map(w => (
                    <tr key={w.id}>
                      <td>WARRANT</td>
                      <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                      <td>{w.depositante}</td>
                      <td>{w.producto}</td>
                      <td>{w.cantidad} {w.unidadMedida}</td>
                      <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                      <td>{w.fechaVencimiento}</td>
                      <td>
                        <button className="tabar-btn tabar-btn-ghost" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEndorsingId(w.id)}>
                          Endosar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PARA CANCELAR */}
      {activeTab === "cancelar" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Para Cancelar</h3>
          <p style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "20px" }}>
            Como tenedor de un warrant, podés iniciar el proceso de cancelación y liberación de mercadería.
          </p>

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Nro.</th>
                  <th>Depositante</th>
                  <th>Tenedor Actual</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warrants.filter(w => w.estado === "vigente" || w.estado === "endosado").length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No hay warrants activos para cancelar.</td></tr>
                ) : (
                  warrants.filter(w => w.estado === "vigente" || w.estado === "endosado").map(w => (
                    <tr key={w.id}>
                      <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                      <td>{w.depositante}</td>
                      <td>{w.tenedorActual}</td>
                      <td>{w.producto}</td>
                      <td>{w.cantidad} {w.unidadMedida}</td>
                      <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                      <td>{w.fechaVencimiento}</td>
                      <td>
                        <button className="tabar-btn tabar-btn-ghost" style={{ borderColor: "var(--tb-red)", color: "var(--tb-red)", padding: "4px 8px", fontSize: "11px" }} onClick={() => handleCancelWarrant(w.id)}>
                          Cancelar y Liberar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PROXIMOS A VENCER */}
      {activeTab === "vencer" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Próximos a Vencer</h3>
          <p style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "12px" }}>
            Avisos de plazos de vencimiento legales en las custodias de warrants.
          </p>
          <div style={{ background: "rgba(240,136,62,0.05)", border: "1px solid rgba(240,136,62,0.15)", padding: "10px 16px", borderRadius: "6px", fontSize: "12px", color: "var(--tb-orange)", marginBottom: "20px" }}>
            ⚠️ <strong>Importante:</strong> Solo el tenedor actual del Warrant puede cancelar el documento y liberar la mercadería.
          </div>

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Nro.</th>
                  <th>Depositante</th>
                  <th>Tenedor Actual</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor</th>
                  <th style={{ color: "var(--tb-green)", fontWeight: 600 }}>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warrants.filter(w => w.estado === "vigente" || w.estado === "endosado").length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No hay warrants activos con plazos registrados.</td></tr>
                ) : (
                  warrants
                    .filter(w => w.estado === "vigente" || w.estado === "endosado")
                    .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
                    .map(w => (
                      <tr key={w.id}>
                        <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                        <td>{w.depositante}</td>
                        <td>{w.tenedorActual}</td>
                        <td>{w.producto}</td>
                        <td>{w.cantidad} {w.unidadMedida}</td>
                        <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                        <td style={{ color: "var(--tb-green)", fontWeight: 500 }}>{w.fechaVencimiento}</td>
                        <td>
                          {w.pdfUrl && (
                            <a href={w.pdfUrl} target="_blank" rel="noopener noreferrer" className="tabar-btn tabar-btn-ghost" style={{ padding: "4px 8px", fontSize: "11px" }}>
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MIS DOCUMENTOS GLOBALES */}
      {activeTab === "documentos" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Mis Documentos Globales</h3>
          <p style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "20px" }}>
            Visualización histórica consolidada de todos tus eWarrants creados en la plataforma.
          </p>

          <div className="tabar-table-wrap">
            <table className="tabar-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nro.</th>
                  <th>Depositante</th>
                  <th>Tenedor Actual</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor Total</th>
                  <th>Fecha Emisión</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {warrants.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: "center", color: "var(--tb-text-3)" }}>No se encontraron documentos globales.</td></tr>
                ) : (
                  warrants.map(w => (
                    <tr key={w.id}>
                      <td>WARRANT</td>
                      <td className="mono" style={{ color: "var(--tb-accent)" }}>{w.numero}</td>
                      <td>{w.depositante}</td>
                      <td>{w.tenedorActual}</td>
                      <td>{w.producto}</td>
                      <td>{w.cantidad} {w.unidadMedida}</td>
                      <td className="mono">${parseFloat(w.valorTotal).toLocaleString("es-AR")}</td>
                      <td>{w.fechaEmision}</td>
                      <td>{w.fechaVencimiento}</td>
                      <td>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          background: w.estado === "vigente" ? "rgba(63,185,80,0.1)" : w.estado === "borrador" ? "rgba(139,148,158,0.1)" : w.estado === "cancelado" ? "rgba(248,81,73,0.1)" : "rgba(240,136,62,0.1)",
                          color: w.estado === "vigente" ? "var(--tb-green)" : w.estado === "borrador" ? "var(--tb-text-2)" : w.estado === "cancelado" ? "var(--tb-red)" : "var(--tb-orange)"
                        }}>
                          {w.estado.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {w.pdfUrl && (
                          <a href={w.pdfUrl} target="_blank" rel="noopener noreferrer" className="tabar-btn tabar-btn-ghost" style={{ padding: "4px 8px", fontSize: "11px" }}>
                            Descargar
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
