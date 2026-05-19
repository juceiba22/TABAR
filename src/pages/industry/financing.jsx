import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const C = { accent: "#58A6FF", dim: "rgba(88,166,255,0.10)", border: "rgba(88,166,255,0.25)" };

const MOTIVOS = [
    "Inicio de campaña - Fertilizantes",
    "Compra de Tabaco Verde",
    "Adelanto de Exportación",
    "Otro"
];

const TIPOS_TABACO = ["Virginia", "Burley", "Criollo", "Oriental"];

const PLAZOS = [
    { valor: 15, label: "15 días" },
    { valor: 30, label: "30 días" },
    { valor: 60, label: "60 días" },
    { valor: 90, label: "90 días" }
];

export default function IndustryFinancing() {
    const { user } = useRole();
    const { requestFinancing } = useData();

    // Form states
    const [motivoFinanciamiento, setMotivoFinanciamiento] = useState("");
    const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
    const [tipoTabacoGarantia, setTipoTabacoGarantia] = useState("");
    const [warrantFile, setWarrantFile] = useState(null);
    const [warrantInfo, setWarrantInfo] = useState(null);
    const [plazo, setPlazo] = useState("");

    const [step, setStep] = useState("form");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Validations
    const isFormValid = motivoFinanciamiento && tipoTabacoGarantia && warrantFile && plazo &&
        (motivoFinanciamiento !== "Otro" || motivoPersonalizado.trim());

    const formErrors = [];
    if (!motivoFinanciamiento) formErrors.push("Selecciona un motivo de financiamiento");
    if (motivoFinanciamiento === "Otro" && !motivoPersonalizado.trim()) formErrors.push("Especifica el motivo de financiamiento");
    if (!tipoTabacoGarantia) formErrors.push("Selecciona el tipo de tabaco en garantía");
    if (!warrantFile) formErrors.push("Carga el certificado de garantía (Warrant)");
    if (!plazo) formErrors.push("Selecciona el plazo de devolución");

    // Handle Warrant selection
    const handleWarrantChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError("");
        setWarrantFile(file);
        setWarrantInfo({
            nombre: file.name,
            tamaño: (file.size / 1024 / 1024).toFixed(2),
            tipo: file.type
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
            // 1. Upload Warrant to Firebase Storage
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 9);
            const warrantFileName = `warrant_${timestamp}_${randomId}`;
            const storageRef = ref(storage, `financing_warrants/${warrantFileName}`);

            await uploadBytes(storageRef, warrantFile);
            const warrantUrl = await getDownloadURL(storageRef);

            // 2. Prepare data for Firestore
            const financingData = {
                numeroSolicitud: `FIN-${timestamp}-${randomId}`,
                motivoFinanciamiento: motivoFinanciamiento === "Otro" ? motivoPersonalizado : motivoFinanciamiento,
                tipoTabacoGarantia: tipoTabacoGarantia,
                warrantUrl: warrantUrl,
                warrantNombre: warrantInfo.nombre,
                warrantTamaño: warrantInfo.tamaño,
                plazo: parseInt(plazo),
                userId: user?.uid,
                estado: "pendiente_aprobacion",
                fechaCreacion: new Date().toISOString(),
                creadoPor: user?.email
            };

            // 3. Send to backend/DataContext
            const res = await requestFinancing(financingData);

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
        setMotivoFinanciamiento("");
        setMotivoPersonalizado("");
        setTipoTabacoGarantia("");
        setWarrantFile(null);
        setWarrantInfo(null);
        setPlazo("");
        setStep("form");
    };

    return (
        <div>
            <div className="tabar-page-header">
                <div className="tabar-page-header-row">
                    <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>◈</div>
                    <h1>Solicitá financiamiento</h1>
                </div>
                <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Poné en garantía tu tabaco y obtené liquidez ahora mismo</p>
            </div>

            {step === "form" && (
                <div className="tabar-layout-sidebar">
                    <div>
                        <div className="tabar-card">
                            <h3 className="tabar-card-title">Solicitud de Financiamiento</h3>

                            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Motivo de Financiamiento *</label>
                                <select
                                    value={motivoFinanciamiento}
                                    onChange={(e) => {
                                        setMotivoFinanciamiento(e.target.value);
                                        if (e.target.value !== "Otro") setMotivoPersonalizado("");
                                    }}
                                    className="tabar-input"
                                    style={{ padding: "8px 12px", fontFamily: "inherit", cursor: "pointer" }}
                                >
                                    <option value="">-- Selecciona un motivo --</option>
                                    {MOTIVOS.map((motivo, idx) => (
                                        <option key={idx} value={motivo}>{motivo}</option>
                                    ))}
                                </select>
                            </div>

                            {motivoFinanciamiento === "Otro" && (
                                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                                    <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Especifica el motivo *</label>
                                    <textarea
                                        value={motivoPersonalizado}
                                        onChange={(e) => setMotivoPersonalizado(e.target.value)}
                                        placeholder="Describe el motivo del financiamiento..."
                                        className="tabar-input"
                                        style={{ minHeight: "60px", fontFamily: "inherit", resize: "vertical" }}
                                    />
                                </div>
                            )}

                            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Tipo de Tabaco en Garantía *</label>
                                <select
                                    value={tipoTabacoGarantia}
                                    onChange={(e) => setTipoTabacoGarantia(e.target.value)}
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
                                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Certificado de Garantía (Warrant) *</label>
                                <div style={{
                                    border: "2px dashed rgba(88,166,255,0.3)",
                                    borderRadius: "6px",
                                    padding: "12px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: warrantFile ? "rgba(63,185,80,0.08)" : "transparent"
                                }}>
                                    <input
                                        type="file"
                                        onChange={handleWarrantChange}
                                        style={{ display: "none" }}
                                        id="warrant-input"
                                    />
                                    <label htmlFor="warrant-input" style={{ cursor: "pointer", display: "block" }}>
                                        <div style={{ fontSize: "12px", color: "#8B949E", marginBottom: "4px" }}>
                                            Arrastra un archivo o haz clic para seleccionar
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#484F58" }}>
                                            PDF, imágenes u otros formatos aceptados
                                        </div>
                                    </label>
                                </div>

                                {warrantInfo && (
                                    <div style={{
                                        marginTop: "10px",
                                        padding: "8px",
                                        backgroundColor: "rgba(63,185,80,0.08)",
                                        borderRadius: "4px",
                                        border: "1px solid rgba(63,185,80,0.3)"
                                    }}>
                                        <div style={{ fontSize: "12px", color: "#3FB950", marginBottom: "2px" }}>✓ Archivo cargado</div>
                                        <div style={{ fontSize: "11px", color: "#8B949E" }}>📄 {warrantInfo.nombre}</div>
                                        <div style={{ fontSize: "11px", color: "#8B949E" }}>💾 {warrantInfo.tamaño} MB</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px", paddingBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Plazo de Devolución *</label>
                                <select
                                    value={plazo}
                                    onChange={(e) => setPlazo(e.target.value)}
                                    className="tabar-input"
                                    style={{ padding: "8px 12px", fontFamily: "inherit", cursor: "pointer" }}
                                >
                                    <option value="">-- Selecciona plazo --</option>
                                    {PLAZOS.map((p, idx) => (
                                        <option key={idx} value={p.valor}>{p.label}</option>
                                    ))}
                                </select>
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
                                Revisar solicitud
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div className="tabar-card">
                            <h3 className="tabar-card-title">¿Cómo funciona?</h3>
                            <StepInfo n="1" text="Selecciona el motivo de tu financiamiento" color={C.accent} bg={C.dim} />
                            <StepInfo n="2" text="Especifica el tipo de tabaco que pondrás como garantía" color={C.accent} bg={C.dim} />
                            <StepInfo n="3" text="Carga el certificado de garantía (Warrant)" color={C.accent} bg={C.dim} />
                            <StepInfo n="4" text="Elige el plazo para devolver el financiamiento" color={C.accent} bg={C.dim} />
                        </div>
                        <div className="tabar-notice">
                            Tu solicitud será revisada por el equipo de TABAR. Una vez aprobada, recibirás el financiamiento en tu cuenta. El tabaco en garantía será bloqueado hasta la devolución.
                        </div>
                    </div>
                </div>
            )}

            {step === "confirm" && (
                <div className="tabar-card">
                    <h3 className="tabar-card-title">Confirmá tu solicitud de financiamiento</h3>
                    <InfoRow label="Motivo" value={motivoFinanciamiento === "Otro" ? motivoPersonalizado : motivoFinanciamiento} />
                    <InfoRow label="Tipo de Tabaco en Garantía" value={tipoTabacoGarantia} />
                    <InfoRow label="Plazo de Devolución" value={`${plazo} días`} />
                    <InfoRow label="Warrant" value={`${warrantInfo.nombre} (${warrantInfo.tamaño} MB)`} />

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
                            {loading ? "Procesando..." : "Solicitar financiamiento"}
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
                    <h2 style={{ color: "#3FB950", margin: "0 0 8px", fontSize: "20px" }}>Solicitud enviada</h2>
                    <p style={{ color: "#8B949E", margin: "0 0 20px", fontSize: "13px" }}>
                        Tu solicitud de financiamiento ha sido recibida y está pendiente de aprobación.
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
                        <div><strong>Motivo:</strong> {motivoFinanciamiento === "Otro" ? motivoPersonalizado : motivoFinanciamiento}</div>
                        <div><strong>Tabaco en Garantía:</strong> {tipoTabacoGarantia}</div>
                        <div><strong>Plazo:</strong> {plazo} días</div>
                    </div>
                    <button
                        onClick={resetForm}
                        className="tabar-btn tabar-btn-secondary"
                    >
                        Nueva solicitud
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
