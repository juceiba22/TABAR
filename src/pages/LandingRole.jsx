import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const ROLE_PALETTE = {
  admin: { color: "#E3B64F", dim: "rgba(227,182,79,0.10)", glyph: "◈" },
  industry: { color: "#58A6FF", dim: "rgba(88,166,255,0.10)", glyph: "⬡" },
  state: { color: "#F0883E", dim: "rgba(240,136,62,0.10)", glyph: "◉" },
  dealer: { color: "#BC8CFF", dim: "rgba(188,140,255,0.10)", glyph: "◇" },
};

const ROLES_INFO = [
  { id: "admin", title: "Administración", subtitle: "Fideicomiso / Admin" },
  { id: "industry", title: "Industria", subtitle: "Exportador / Productor" },
  { id: "state", title: "Estado", subtitle: "Ente Nacional / FET" },
  { id: "dealer", title: "Dealer", subtitle: "Revendedor / Trader" },
];

export default function LandingRole() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedRole, setSelectedRole] = useState("industry");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear states when switching modes
  useEffect(() => {
    setError("");
    setMessage("");
  }, [mode]);

  const handleAuth = async (e) => {

    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {

      console.log(`Starting ${mode} flow for:`, email);

      // =========================
      // LOGIN
      // =========================

      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // refresca el usuario desde Firebase
        await cred.user.reload();
        
        // FIX: No desloguear aquí si no está verificado.
        // AppShell se encargará de mostrar la pantalla de verificación
        // permitiendo al usuario ver que entró pero necesita validar su mail.
        console.log("LOGIN_SUCCESS:", cred.user.uid);
      }

      // =========================
      // REGISTER
      // =========================

      else if (mode === "register") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCredential.user;
        console.log("AUTH_USER_CREATED:", user.uid);

        // =========================
        // 1. SEND VERIFICATION EMAIL
        // =========================

        try {
          await sendEmailVerification(user);
          console.log("VERIFICATION_EMAIL_SENT");
        } catch (vErr) {
          console.error("VERIFICATION_ERROR:", vErr);
          setError(`No se pudo enviar el correo de verificación: ${vErr.message}`);
          // Si falla el envío de mail, aquí sí deslogueamos por seguridad
          await signOut(auth);
          return;
        }

        // =========================
        // 2. CREATE FIRESTORE PROFILE
        // =========================

        const profileData = {
          uid: user.uid,
          email,
          displayName,
          companyName,
          role: selectedRole,
          createdAt: new Date().toISOString(),
          status: "approved",
          emailVerified: false
        };

        // FIX: merge: true para evitar colisiones si el onAuthStateChanged
        // ya disparó un markEmailVerifiedInFirestore paralelo
        await setDoc(
          doc(db, "users", user.uid),
          profileData,
          { merge: true }
        );

        console.log("FIRESTORE_PROFILE_CREATED:", profileData);

        // =========================
        // 3. SUCCESS & REDIRECT
        // =========================
        // FIX: NO hacemos signOut(auth). El usuario ya está logueado.
        // AppShell detectará emailVerified: false y mostrará la pantalla de aviso.
        
        setMessage("Cuenta creada. Por favor, verificá tu correo para continuar.");
        
        // No es necesario setMode("login") porque AppShell ya lo sacará de aquí
        // al detectar que user es truthy.
      }


      // =========================
      // FORGOT PASSWORD
      // =========================

      else if (mode === "forgot") {

        await sendPasswordResetEmail(
          auth,
          email
        );

        setMessage(
          "Instrucciones enviadas. Revisa tu casilla de correo."
        );
      }

    } catch (err) {

      console.error(
        "AUTH_OPERATION_FAILED:",
        err
      );

      let friendlyError =
        "Error en el sistema. Intente más tarde.";

      switch (err.code) {

        case "auth/user-not-found":
        case "auth/wrong-password":
          friendlyError =
            "Credenciales inválidas. Verifique su email y contraseña.";
          break;

        case "auth/email-already-in-use":
          friendlyError =
            "El correo electrónico ya está registrado.";
          break;

        case "auth/weak-password":
          friendlyError =
            "La contraseña es muy débil (mínimo 6 caracteres).";
          break;

        case "auth/invalid-email":
          friendlyError =
            "Formato de correo electrónico inválido.";
          break;

        case "auth/too-many-requests":
          friendlyError =
            "Demasiados intentos fallidos. Intente de nuevo en unos minutos.";
          break;

        case "auth/network-request-failed":
          friendlyError =
            "Error de conexión. Verifique su internet.";
          break;

        default:
          friendlyError =
            err.message || friendlyError;
      }

      setError(friendlyError);

    } finally {

      // evita flicker UI
      setTimeout(
        () => setLoading(false),
        500
      );
    }
  };

  return (
    <div className="tabar-landing">
      <div className="tabar-hero">
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
              </svg>
            </div>
            <div className="logo-text">
              <h1 className="tabar-hero-title">TABAR</h1>
              <span className="logo-subtitle">Agroindustrial Financing</span>
            </div>
          </div>
          <p className="tabar-hero-desc">
            {mode === "login" && "Acceso institucional a la plataforma de tokenización tabacalera."}
            {mode === "register" && "Crea una cuenta institucional para tu organización."}
            {mode === "forgot" && "Recupera el acceso a tu cuenta institucional."}
          </p>
        </div>
      </div>

      <div className="tabar-landing-main">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{mode === "login" ? "Iniciar Sesión" : mode === "register" ? "Registro Institucional" : "Recuperar Acceso"}</h2>
            <p>{mode === "login" ? "Ingresá tus credenciales autorizadas" : mode === "register" ? "Completa los datos de tu entidad" : "Ingresá tu email registrado"}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {error && <div className="auth-alert alert-error">{error}</div>}
            {message && <div className="auth-alert alert-success">{message}</div>}

            {mode === "register" && (
              <>
                <div className="form-group">
                  <label>Nombre del Responsable</label>
                  <input
                    required
                    type="text"
                    className="tabar-input"
                    placeholder="Ej. Ing. Alberto García"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Organización / Empresa</label>
                  <input
                    required
                    type="text"
                    className="tabar-input"
                    placeholder="Ej. Cooperativa Tabacalera de Salta"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Institución</label>
                  <div className="role-selector-grid">
                    {ROLES_INFO.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        className={`role-item ${selectedRole === r.id ? 'active' : ''}`}
                        onClick={() => setSelectedRole(r.id)}
                        disabled={loading}
                        style={{
                          '--role-color': ROLE_PALETTE[r.id].color,
                          '--role-bg': ROLE_PALETTE[r.id].dim
                        }}
                      >
                        <span className="role-glyph">{ROLE_PALETTE[r.id].glyph}</span>
                        <div className="role-text">
                          <span className="role-title">{r.title}</span>
                          <span className="role-sub">{r.subtitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                required
                type="email"
                className="tabar-input"
                placeholder="usuario@institucion.gov.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {mode !== "forgot" && (
              <div className="form-group">
                <div className="label-row">
                  <label>Contraseña</label>
                  {mode === "login" && (
                    <button type="button" className="text-link" onClick={() => setMode("forgot")} disabled={loading}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  required
                  type="password"
                  className="tabar-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              className={`tabar-btn tabar-btn-primary tabar-btn-full auth-submit ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  mode === "login" ? "Ingresar al Sistema" : mode === "register" ? "Solicitar Alta" : "Enviar Correo"
                )}
              </span>
            </button>

            <div className="auth-footer">
              {mode === "login" ? (
                <>
                  <span>¿No tenés una cuenta institucional?</span>
                  <button type="button" className="text-link accent" onClick={() => setMode("register")} disabled={loading}>
                    Registrar Entidad
                  </button>
                </>
              ) : (
                <>
                  <span>¿Ya tienes acceso?</span>
                  <button type="button" className="text-link accent" onClick={() => setMode("login")} disabled={loading}>
                    Volver al Inicio
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      <footer className="tabar-footer">
        <div className="footer-content">
          <p>AgroTabaco Labs — TABAR Protocol v1.0 MVP</p>
          <p className="security-notice">Sistema de acceso restringido para personal autorizado.</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .auth-card {
          background: var(--tb-surface-1);
          border: 1px solid var(--tb-border);
          border-radius: 16px;
          padding: 32px;
          max-width: 440px;
          margin: 0 auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
        }
        .btn-loading {
          opacity: 0.8;
          cursor: not-allowed;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .auth-header h2 {
          margin: 0 0 8px;
          font-size: 24px;
          color: var(--tb-text);
        }
        .auth-header p {
          color: var(--tb-text-2);
          font-size: 14px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--tb-text-2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .text-link {
          background: none;
          border: none;
          padding: 0;
          font-size: 12px;
          color: var(--tb-text-3);
          cursor: pointer;
          font-family: var(--tb-font);
        }
        .text-link:hover:not(:disabled) {
          color: var(--tb-text-2);
          text-decoration: underline;
        }
        .text-link:disabled {
          cursor: default;
          opacity: 0.5;
        }
        .text-link.accent {
          color: var(--tb-accent);
          font-weight: 600;
          margin-left: 6px;
        }
        .role-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .role-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--tb-border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          color: var(--tb-text);
          font-family: var(--tb-font);
        }
        .role-item:hover:not(:disabled) {
          border-color: var(--tb-border-hover);
          background: rgba(255,255,255,0.02);
        }
        .role-item.active {
          background: var(--role-bg);
          border-color: var(--role-color);
        }
        .role-glyph {
          font-size: 18px;
          color: var(--role-color);
        }
        .role-title {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }
        .role-sub {
          display: block;
          font-size: 10px;
          color: var(--tb-text-3);
        }
        .auth-alert {
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid;
        }
        .alert-error {
          background: rgba(248, 81, 73, 0.1);
          color: var(--tb-red);
          border-color: rgba(248, 81, 73, 0.2);
        }
        .alert-success {
          background: rgba(63, 185, 80, 0.1);
          color: var(--tb-green);
          border-color: rgba(63, 185, 80, 0.2);
        }
        .auth-footer {
          text-align: center;
          margin-top: 10px;
          font-size: 13px;
          color: var(--tb-text-2);
        }
        .security-notice {
          font-size: 9px;
          opacity: 0.5;
          margin-top: 4px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .logo-icon {
          width: 48px;
          height: 48px;
          background: var(--tb-accent);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          text-align: left;
        }
        .logo-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--tb-text-3);
        }
      `}} />
    </div>
  );
}
