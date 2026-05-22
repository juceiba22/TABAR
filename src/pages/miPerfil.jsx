import { useState, useEffect, useRef } from "react";
import { useRole, ROLE_LABELS, ROLE_COLORS } from "../modules/roles/RoleContext";
import { db, storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

export default function MiPerfil() {
  const { user, role, profile, updateProfile } = useRole();
  
  // State for form fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // State for profile picture
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  // Status states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);
  const roleColor = ROLE_COLORS[role] || "#E3B64F";

  // Load profile data into form fields on load or change
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhone(profile.phone || "");
      setCompanyName(profile.companyName || "");
      setPhotoPreview(profile.profilePicUrl || "");
    }
  }, [profile]);

  // Handle local picture selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("La imagen supera el límite de 2MB.");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrorMsg("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Map roles to descriptions matching user specs
  const getRoleLabelExtended = (r) => {
    switch (r) {
      case "producer":
        return "Productor Tabacalero (Finca / Cultivo de Tabaco)";
      case "industry":
        return "Acopiador (Entidad / Acopio)";
      case "state":
        return "Estado (Ente Nacional / FET)";
      case "dealer":
        return "Dealer (Revendedor / Trader)";
      default:
        return ROLE_LABELS[r] || "Sin Rol";
    }
  };

  // Form submission handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let uploadedUrl = profile?.profilePicUrl || "";

      // 1. Upload photo if selected
      if (photoFile) {
        setIsUploading(true);
        const fileExt = photoFile.name.split(".").pop();
        const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}.${fileExt}`);
        
        const uploadResult = await uploadBytes(storageRef, photoFile);
        uploadedUrl = await getDownloadURL(uploadResult.ref);
        setIsUploading(false);
      }

      // 2. Perform updates in Context and Firestore
      const updates = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        profilePicUrl: uploadedUrl,
        updatedAt: new Date().toISOString()
      };

      await updateProfile(updates);

      setSuccessMsg("¡Perfil guardado y actualizado con éxito!");
      setPhotoFile(null); // Clear pending file

      // Clear success alert after 4 seconds
      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (err) {
      console.error("Error saving profile: ", err);
      setErrorMsg("Ocurrió un error al guardar tu perfil. Revisa tu conexión.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const hasChanges = () => {
    if (!profile) return false;
    return (
      displayName.trim() !== (profile.displayName || "").trim() ||
      phone.trim() !== (profile.phone || "").trim() ||
      companyName.trim() !== (profile.companyName || "").trim() ||
      photoFile !== null
    );
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Page Header */}
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: `rgba(${roleColor === "#E3B64F" ? "227,182,79" : roleColor === "#58A6FF" ? "88,166,255" : roleColor === "#F0883E" ? "240,136,62" : roleColor === "#BC8CFF" ? "188,140,255" : "63,185,80"}, 0.1)`, color: roleColor }}>
            👤
          </div>
          <h1>Mi Perfil de Usuario</h1>
        </div>
        <p style={{ color: "var(--tb-text-2)", fontSize: "13px", marginLeft: "38px" }}>
          Administrá tu información personal y los datos institucionales registrados en la red TABAR.
        </p>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="profile-container">
        
        {/* Top Hero Card: Avatar & Institution */}
        <div className="profile-hero-card">
          <div className="profile-avatar-wrap">
            <div 
              className="profile-avatar-inner" 
              onClick={triggerFileInput}
              style={{ borderColor: roleColor }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder" style={{ color: roleColor }}>
                  {displayName ? displayName.substring(0,2).toUpperCase() : "??"}
                </div>
              )}
              
              <div className="profile-avatar-overlay">
                <span className="camera-icon">📷</span>
                <span className="overlay-text">Cambiar foto</span>
              </div>
            </div>
            
            {/* Hidden Input File */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
              accept="image/*" 
              style={{ display: "none" }} 
            />
            
            {isUploading && (
              <div className="uploading-spinner-wrap">
                <div className="profile-micro-spinner" />
                <span>Subiendo foto...</span>
              </div>
            )}
          </div>

          <div className="profile-hero-details">
            <h2 className="profile-hero-name">
              {displayName || profile?.firstName || "Cargando..."}
            </h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
              <span className="role-pill-badge" style={{ background: `${roleColor}12`, color: roleColor, border: `1px solid ${roleColor}33` }}>
                {getRoleLabelExtended(role)}
              </span>
              <span className="verified-pill-badge">
                <span className="verified-dot" /> Cuenta Verificada
              </span>
            </div>
          </div>
        </div>

        {/* Form Layout Grid */}
        <div className="profile-grid">
          
          {/* Column 1: Personal Details */}
          <div className="profile-column-card">
            <h3 className="profile-section-title">Datos Personales del Responsable</h3>
            
            <div className="form-group-row">
              <div className="form-group flex-1">
                <label className="profile-field-label">Nombre</label>
                <div className="read-only-field-wrap">
                  <span className="read-only-text">{profile?.firstName || "—"}</span>
                  <span className="lock-icon" title="Campo verificado y no modificable">🔒</span>
                </div>
              </div>

              <div className="form-group flex-1">
                <label className="profile-field-label">Apellido</label>
                <div className="read-only-field-wrap">
                  <span className="read-only-text">{profile?.lastName || "—"}</span>
                  <span className="lock-icon" title="Campo verificado y no modificable">🔒</span>
                </div>
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group flex-1">
                <label className="profile-field-label">Tipo de documento</label>
                <div className="read-only-field-wrap">
                  <span className="read-only-text">{profile?.documentType?.toUpperCase() || "DNI"}</span>
                  <span className="lock-icon" title="Campo verificado y no modificable">🔒</span>
                </div>
              </div>

              <div className="form-group flex-2">
                <label className="profile-field-label">Número de documento</label>
                <div className="read-only-field-wrap">
                  <span className="read-only-text">{profile?.documentNumber || "—"}</span>
                  <span className="lock-icon" title="Campo verificado y no modificable">🔒</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="profile-field-label">Correo electrónico</label>
              <div className="read-only-field-wrap">
                <span className="read-only-text">{profile?.email || user?.email || "—"}</span>
                <span className="lock-icon" title="Campo verificado y no modificable">🔒</span>
              </div>
            </div>

            <hr className="profile-card-divider" />

            {/* Editable Fields in Personal Section */}
            <div className="form-group">
              <label htmlFor="displayName" className="profile-field-label required-label">Nombre del Responsable</label>
              <input 
                id="displayName"
                type="text" 
                className="tabar-input profile-editable-input" 
                placeholder="Ej. Ing. Alberto García" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <span className="field-helper-text">Tu firma profesional en las operaciones de la red.</span>
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="profile-field-label required-label">Teléfono de Contacto</label>
              <input 
                id="phone"
                type="tel" 
                className="tabar-input profile-editable-input" 
                placeholder="+54 9 387 123-4567" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <span className="field-helper-text">Número de comunicación directa para confirmación de transacciones.</span>
            </div>

          </div>

          {/* Column 2: Organization Details */}
          <div className="profile-column-card">
            <h3 className="profile-section-title">Datos de la Organización / Entidad</h3>

            <div className="form-group">
              <label htmlFor="companyName" className="profile-field-label required-label">Organización / Empresa</label>
              <input 
                id="companyName"
                type="text" 
                className="tabar-input profile-editable-input" 
                placeholder="Nombre de la Cooperativa, Finca o Empresa" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <span className="field-helper-text">Nombre legal o comercial de la entidad que representas.</span>
            </div>

            <div className="form-group">
              <label className="profile-field-label">Tipo de Institución</label>
              <div className="read-only-field-wrap institutional-badge-wrap">
                <span className="read-only-text" style={{ fontWeight: 500, color: "var(--tb-text)" }}>
                  {getRoleLabelExtended(role)}
                </span>
                <span className="lock-icon" title="Tipo de institución verificado">🔒</span>
              </div>
              <span className="field-helper-text">Definido durante el registro según tu perfil operativo.</span>
            </div>

            {/* Custom Info Banner based on Role */}
            <div className="profile-info-banner" style={{ borderLeftColor: roleColor }}>
              <span style={{ fontSize: "16px" }}>ℹ️</span>
              <div style={{ fontSize: "12px", color: "var(--tb-text-2)", lineHeight: "1.4" }}>
                {role === "producer" && "Como productor tabacalero, puedes tokenizar tus fardos de tabaco verde, asociarte con otros productores del sector y publicar ofertas en el marketplace."}
                {role === "industry" && "Como acopiador / cooperativa, estás habilitado para emitir órdenes de compra de tabaco certificado y solicitar financiamiento anticipado en la red."}
                {role === "state" && "Como representante del Estado Nacional o administrador del FET, puedes supervisar las certificaciones, auditar la liquidez de la red y publicar Planes Operativos Anuales (POAs)."}
                {role === "dealer" && "Como Dealer o inversor, tienes la capacidad de explorar el marketplace completo de órdenes y solicitudes activas para operar, inyectando financiamiento directo."}
              </div>
            </div>

          </div>

        </div>

        {/* Messages & Actions Panel */}
        <div className="profile-actions-panel">
          {successMsg && (
            <div className="profile-alert profile-alert-success">
              <span className="alert-icon">✨</span>
              <span className="alert-text">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="profile-alert profile-alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{errorMsg}</span>
            </div>
          )}

          <div className="profile-btn-container">
            <button 
              type="button" 
              onClick={() => {
                if (profile) {
                  setDisplayName(profile.displayName || "");
                  setPhone(profile.phone || "");
                  setCompanyName(profile.companyName || "");
                  setPhotoPreview(profile.profilePicUrl || "");
                  setPhotoFile(null);
                  setErrorMsg("");
                  setSuccessMsg("");
                }
              }} 
              className="tabar-btn tabar-btn-secondary"
              disabled={isSaving || !hasChanges()}
            >
              Restablecer
            </button>
            
            <button 
              type="submit" 
              className="tabar-btn tabar-btn-primary"
              disabled={isSaving || !hasChanges()}
              style={{
                background: hasChanges() ? "var(--tb-accent)" : "var(--tb-surface-3)",
                color: hasChanges() ? "var(--tb-bg)" : "var(--tb-text-3)",
                borderColor: hasChanges() ? "var(--tb-accent)" : "transparent",
              }}
            >
              {isSaving ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="profile-micro-spinner" />
                  <span>Guardando...</span>
                </div>
              ) : (
                "Guardar Perfil"
              )}
            </button>
          </div>
        </div>

      </form>

      {/* Styled Embed for the Profile Page Component */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .profile-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }

        .profile-hero-card {
          background: linear-gradient(135deg, var(--tb-surface-1) 0%, rgba(22, 27, 34, 0.4) 100%);
          border: 1px solid var(--tb-border);
          border-radius: 14px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .profile-avatar-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .profile-avatar-inner {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 3px solid var(--tb-border);
          position: relative;
          cursor: pointer;
          overflow: hidden;
          background: var(--tb-surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .profile-avatar-inner:hover {
          transform: scale(1.02);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          font-size: 32px;
          font-weight: bold;
          font-family: var(--tb-mono);
          letter-spacing: -1px;
        }

        .profile-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 12, 16, 0.75);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          gap: 4px;
        }

        .profile-avatar-inner:hover .profile-avatar-overlay {
          opacity: 1;
        }

        .profile-avatar-overlay .camera-icon {
          font-size: 18px;
        }

        .profile-avatar-overlay .overlay-text {
          font-size: 10px;
          font-weight: 500;
          color: var(--tb-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .uploading-spinner-wrap {
          position: absolute;
          bottom: -22px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--tb-text-2);
        }

        .profile-hero-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .profile-hero-name {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          color: var(--tb-text);
          letter-spacing: -0.5px;
        }

        .role-pill-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 20px;
        }

        .verified-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(63, 185, 80, 0.08);
          color: var(--tb-green);
          border: 1px solid rgba(63, 185, 80, 0.15);
          font-size: 11px;
          font-weight: 500;
          border-radius: 20px;
        }

        .verified-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--tb-green);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 800px) {
          .profile-grid {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        .profile-column-card {
          background: var(--tb-surface-1);
          border: 1px solid var(--tb-border);
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--tb-text);
          margin: 0 0 4px 0;
          border-bottom: 1px solid var(--tb-border);
          padding-bottom: 10px;
          letter-spacing: -0.1px;
        }

        .form-group-row {
          display: flex;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }

        .profile-field-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--tb-text-2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .required-label::after {
          content: " *";
          color: var(--tb-orange);
        }

        .read-only-field-wrap {
          background: rgba(22, 27, 34, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 38px;
        }

        .read-only-text {
          font-size: 13px;
          color: var(--tb-text-2);
        }

        .lock-icon {
          font-size: 10px;
          color: var(--tb-text-3);
          user-select: none;
        }

        .profile-card-divider {
          border: none;
          border-top: 1px dashed var(--tb-border);
          margin: 4px 0;
        }

        .profile-editable-input {
          height: 38px;
        }

        .field-helper-text {
          font-size: 11px;
          color: var(--tb-text-3);
          line-height: 1.2;
          margin-top: -2px;
        }

        .profile-info-banner {
          background: rgba(88, 166, 255, 0.04);
          border: 1px solid rgba(88, 166, 255, 0.08);
          border-left: 3px solid var(--tb-blue);
          border-radius: 8px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-top: 4px;
        }

        .profile-actions-panel {
          background: var(--tb-surface-1);
          border: 1px solid var(--tb-border);
          border-radius: 14px;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }

        @media (min-width: 640px) {
          .profile-actions-panel {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .profile-btn-container {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          align-items: center;
          margin-left: auto;
        }

        .profile-alert {
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: profileFadeIn 0.3s ease;
        }

        .profile-alert-success {
          background: rgba(63, 185, 80, 0.06);
          border: 1px solid rgba(63, 185, 80, 0.15);
          color: var(--tb-green);
        }

        .profile-alert-error {
          background: rgba(248, 81, 73, 0.06);
          border: 1px solid rgba(248, 81, 73, 0.15);
          color: var(--tb-red);
        }

        .profile-micro-spinner {
          width: 14px;
          height: 14px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes profileFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `
      }} />

    </div>
  );
}
