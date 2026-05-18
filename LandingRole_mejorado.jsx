/**
 * LandingRole.jsx — TABAR Auth v3
 *
 * Mejoras en esta versión:
 *  ① Agregados campos: Nombre, Apellido
 *  ② Agregado selector de tipo documento (DNI/Pasaporte) + campo de número
 *  ③ Validación simple de documento
 *  ④ Campos disponibles en LOGIN y REGISTER
 *  ⑤ Datos persistidos en Firestore y localStorage
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useRole } from "../modules/roles/RoleContext";

/* ─── Paleta de roles ────────────────────────────────────────────────────── */
const ROLE_PALETTE = {
  admin: { color: "#E3B64F", dim: "rgba(227,182,79,0.12)", border: "rgba(227,182,79,0.35)", glyph: "◈" },
  industry: { color: "#58A6FF", dim: "rgba(88,166,255,0.12)", border: "rgba(88,166,255,0.35)", glyph: "⬡" },
  state: { color: "#F0883E", dim: "rgba(240,136,62,0.12)", border: "rgba(240,136,62,0.35)", glyph: "◉" },
  dealer: { color: "#BC8CFF", dim: "rgba(188,140,255,0.12)", border: "rgba(188,140,255,0.35)", glyph: "◇" },
  producer: { color: "#3FB950", dim: "rgba(63,185,80,0.12)", border: "rgba(63,185,80,0.35)", glyph: "🌿" },
};

const ROLES_INFO = [
  { id: "producer", title: "Productor Tabacalero", subtitle: "Finca / Cultivo de Tabaco" },
  { id: "industry", title: "Industria", subtitle: "Exportador / Productor" },
  { id: "state", title: "Estado", subtitle: "Ente Nacional / FET" },
  { id: "dealer", title: "Dealer", subtitle: "Revendedor / Trader" },
  { id: "admin", title: "Administración", subtitle: "Fideicomiso / Admin" },
];

/* ─── Tipos de documento ────────────────────────────────────────────────── */
const DOCUMENT_TYPES = [
  { value: "dni", label: "DNI" },
  { value: "passport", label: "Pasaporte" },
];

/* ─── Validaciones ──────────────────────────────────────────────────────── */
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Muy débil", color: "#F85149" };
  if (score === 2) return { score, label: "Débil", color: "#F0883E" };
  if (score === 3) return { score, label: "Aceptable", color: "#E3B64F" };
  if (score === 4) return { score, label: "Fuerte", color: "#3FB950" };
  return { score, label: "Muy fuerte", color: "#58A6FF" };
}

/* ─── Mapeo de errores Firebase v9+ ─────────────────────────────────────── */
function mapFirebaseError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Credenciales inválidas. Verificá tu email y contraseña.";
    case "auth/email-already-in-use":
      return "Este correo ya está registrado. Intentá iniciar sesión.";
    case "auth/weak-password":
      return "La contraseña es muy débil (mínimo 6 caracteres).";
    case "auth/too-many-requests":
      return "Demasiados intentos. Esperá unos minutos antes de reintentar.";
    case "auth/network-request-failed":
      return "Error de conexión. Verificá tu internet.";
    case "auth/user-disabled":
      return "Esta cuenta fue deshabilitada. Contactá al administrador.";
    case "auth/operation-not-allowed":
      return "Método de autenticación no habilitado.";
    default:
      return "Error inesperado. Intentá de nuevo.";
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Componente principal
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingRole() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useRole();

  // Redirect si ya está autenticado y tiene rol
  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  /* ─── Modos de la pantalla ──────────────────────────────────────────── */
  // "login" | "register" | "forgot" | "verify-email" | "no-role"
  const [mode, setMode] = useState("login");

  /* ─── Campos de autenticación ──────────────────────────────────────── */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ─── Campos de perfil (disponibles en LOGIN y REGISTER) ───────────── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState("dni");
  const [documentNumber, setDocumentNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedRole, setSelectedRole] = useState("industry");

  /* ─── Estado UI ─────────────────────────────────────────────────────── */
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ─── Verificación email: reenvío con cooldown ─────────────────────── */
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [mode]);

  // Countdown para reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Si el usuario autenticado no tiene rol, mostrar pantalla adecuada
  useEffect(() => {
    if (!authLoading && user && !role) {
      setMode("no-role");
    }
  }, [user, role, authLoading]);

  /* ─── Validación client-side ─────────────────────────────────────── */
  const validateDocumentNumber = useCallback((doc, type) => {
    if (!doc.trim()) return false;
    // Validación simple: debe contener al menos números
    return /\d/.test(doc);
  }, []);

  const validateRegister = useCallback(() => {
    // Validaciones de documento (disponible en LOGIN y REGISTER)
    if (!firstName.trim())
      return "El nombre es obligatorio.";
    if (!lastName.trim())
      return "El apellido es obligatorio.";
    if (!documentNumber.trim())
      return "El número de documento es obligatorio.";
    if (!validateDocumentNumber(documentNumber, documentType))
      return "El número de documento debe contener números.";

    // Validaciones específicas de REGISTER
    if (mode === "register") {
      if (!displayName.trim())
        return "El nombre del responsable es obligatorio.";
      if (!companyName.trim())
        return "El nombre de la organización es obligatorio.";
    }

    if (password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== passwordConfirm)
      return "Las contraseñas no coinciden.";
    return null;
  }, [firstName, lastName, documentNumber, documentType, displayName, companyName, password, passwordConfirm, mode, validateDocumentNumber]);

  /* ─── Reenviar email de verificación ──────────────────────────────── */
  const handleResendVerification = async () => {
    if (!pendingUser || resendCooldown > 0) return;
    try {
      await sendEmailVerification(pendingUser);
      setMessage("Correo reenviado. Revisá tu bandeja (y carpeta de SPAM).");
      setResendCooldown(60);
    } catch {
      setError("No se pudo reenviar el correo. Intentá más tarde.");
    }
  };

  /* ─── Handler principal ─────────────────────────────────────────── */
  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      /* ── LOGIN ── */
      if (mode === "login") {
        // Validar campos de documento incluso en login
        const validationError = validateRegister();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        const cred = await signInWithEmailAndPassword(auth, email, password);

        if (!cred.user.emailVerified) {
          setPendingUser(cred.user);
          await signOut(auth);
          setMode("verify-email");
          setLoading(false);
          return;
        }

        // Actualizar perfil en Firestore con datos de documento
        const userRef = doc(db, "users", cred.user.uid);
        const userSnap = await getDoc(userRef);

        let profileData = {
          uid: cred.user.uid,
          email: cred.user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          documentType,
          documentNumber: documentNumber.trim(),
          displayName: cred.user.email.split('@')[0],
          companyName: "Entidad a confirmar",
          role: "industry",
          createdAt: new Date().toISOString(),
          status: "approved",
          emailVerified: true,
        };

        if (!userSnap.exists()) {
          // Crear nuevo perfil
          await setDoc(userRef, profileData);
          window.location.reload();
          return;
        } else {
          // Actualizar perfil existente con nuevos datos
          await setDoc(userRef, {
            ...userSnap.data(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            documentType,
            documentNumber: documentNumber.trim(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }

        /* ── REGISTER ── */
      } else if (mode === "register") {
        const validationError = validateRegister();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Enviar verificación primero
        await sendEmailVerification(fbUser);

        // Guardar datos temporales en localStorage
        const pendingProfile = {
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          documentType,
          documentNumber: documentNumber.trim(),
          displayName: displayName.trim(),
          companyName: companyName.trim(),
          role: selectedRole,
          createdAt: new Date().toISOString(),
          status: "pending_verification",
          emailVerified: false,
        };
        localStorage.setItem(`pending_profile_${fbUser.uid}`, JSON.stringify(pendingProfile));

        setPendingUser(fbUser);
        await signOut(auth);
        setResendCooldown(60);
        setMode("verify-email");

        /* ── FORGOT PASSWORD ── */
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Instrucciones enviadas. Revisá tu casilla (y carpeta de SPAM).");
      }

    } catch (err) {
      setError(mapFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  /* ─── Pantalla de carga inicial ─────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="lr-splash">
        <div className="lr-splash-logo">
          <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
          </svg>
        </div>
        <div className="lr-spinner" />
      </div>
    );
  }

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <div className="lr-root">
      {/* Fondo decorativo */}
      <div className="lr-bg-grid" aria-hidden="true" />
      <div className="lr-bg-glow" aria-hidden="true" />

      <div className="lr-layout">
        {/* ── Panel izquierdo (branding) ── */}
        <aside className="lr-brand">
          <div className="lr-brand-inner">
            <div className="lr-logo">
              <div className="lr-logo-mark">
                <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
                </svg>
              </div>
              <div>
                <div className="lr-logo-name">TABAR</div>
                <div className="lr-logo-sub">AgroTabaco Labs</div>
              </div>
            </div>

            <div className="lr-brand-copy">
              <h1 className="lr-brand-title">
                Tokenización<br />agroindustrial<br />tabacalera.
              </h1>
              <p className="lr-brand-desc">
                Plataforma institucional de financiamiento y comercialización de activos
                tabacaleros bajo protocolo blockchain.
              </p>
            </div>

            <div className="lr-brand-stats">
              {[
                { label: "Tasa anual FET", value: "8.5%" },
                { label: "Respaldo", value: "Real" },
                { label: "Trazabilidad", value: "On-chain" },
              ].map(s => (
                <div key={s.label} className="lr-stat">
                  <div className="lr-stat-value">{s.value}</div>
                  <div className="lr-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="lr-brand-footer">
              TABAR Protocol v1.0 · Acceso institucional restringido
            </div>
          </div>
        </aside>

        {/* ── Panel derecho (formulario) ── */}
        <main className="lr-form-panel">
          <div className="lr-form-wrap">

            {/* ═══ MODO: VERIFICAR EMAIL ═══ */}
            {mode === "verify-email" && (
              <VerifyEmailScreen
                email={email}
                cooldown={resendCooldown}
                message={message}
                error={error}
                onResend={handleResendVerification}
                onBack={() => { setMode("login"); setPendingUser(null); }}
              />
            )}

            {/* ═══ MODO: SIN ROL ═══ */}
            {mode === "no-role" && (
              <NoRoleScreen onLogout={async () => { await signOut(auth); setMode("login"); }} />
            )}

            {/* ═══ MODOS: LOGIN / REGISTER / FORGOT ═══ */}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <>
                <div className="lr-form-header">
                  <div className="lr-form-logo-mobile">
                    <div className="lr-logo-mark lr-logo-mark--sm">
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                        <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
                      </svg>
                    </div>
                    <span className="lr-logo-name lr-logo-name--sm">TABAR</span>
                  </div>
                  <h2 className="lr-form-title">
                    {mode === "login" && "Iniciar sesión"}
                    {mode === "register" && "Registro institucional"}
                    {mode === "forgot" && "Recuperar acceso"}
                  </h2>
                  <p className="lr-form-subtitle">
                    {mode === "login" && "Ingresá tus credenciales autorizadas"}
                    {mode === "register" && "Completá los datos de tu entidad"}
                    {mode === "forgot" && "Te enviaremos instrucciones a tu correo"}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="lr-form" noValidate>

                  {error && <Alert type="error" text={error} />}
                  {message && <Alert type="success" text={message} />}

                  {/* ── NUEVOS CAMPOS: Nombre y Apellido + Documento (LOGIN y REGISTER) ── */}
                  {(mode === "login" || mode === "register") && (
                    <>
                      {/* Nombre */}
                      <Field label="Nombre">
                        <input
                          required
                          type="text"
                          className="lr-input"
                          placeholder="Ej. Juan"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          disabled={loading}
                          autoComplete="given-name"
                        />
                      </Field>

                      {/* Apellido */}
                      <Field label="Apellido">
                        <input
                          required
                          type="text"
                          className="lr-input"
                          placeholder="Ej. García"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          disabled={loading}
                          autoComplete="family-name"
                        />
                      </Field>

                      {/* Tipo de Documento + Número */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <Field label="Tipo de documento">
                          <select
                            required
                            className="lr-input"
                            value={documentType}
                            onChange={e => setDocumentType(e.target.value)}
                            disabled={loading}
                          >
                            {DOCUMENT_TYPES.map(dt => (
                              <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Número">
                          <input
                            required
                            type="text"
                            className="lr-input"
                            placeholder={documentType === "dni" ? "Ej. 12345678" : "Ej. ABC123456"}
                            value={documentNumber}
                            onChange={e => setDocumentNumber(e.target.value)}
                            disabled={loading}
                            autoComplete="off"
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {/* ── Campos extra de REGISTRO ── */}
                  {mode === "register" && (
                    <>
                      <Field label="Nombre del responsable">
                        <input
                          required
                          type="text"
                          className="lr-input"
                          placeholder="Ej. Ing. Alberto García"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          disabled={loading}
                          autoComplete="name"
                        />
                      </Field>

                      <Field label="Organización / empresa">
                        <input
                          required
                          type="text"
                          className="lr-input"
                          placeholder="Ej. Cooperativa Tabacalera de Salta"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          disabled={loading}
                          autoComplete="organization"
                        />
                      </Field>

                      <Field label="Tipo de institución">
                        <RoleSelector
                          roles={ROLES_INFO}
                          selected={selectedRole}
                          onSelect={setSelectedRole}
                          disabled={loading}
                        />
                      </Field>
                    </>
                  )}

                  {/* ── Email ── */}
                  <Field label="Correo electrónico">
                    <input
                      required
                      type="email"
                      className="lr-input"
                      placeholder="usuario@institucion.gov.ar"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </Field>

                  {/* ── Contraseña ── */}
                  {mode !== "forgot" && (
                    <Field
                      label="Contraseña"
                      action={mode === "login" ? (
                        <button
                          type="button"
                          className="lr-text-btn"
                          onClick={() => setMode("forgot")}
                          disabled={loading}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      ) : null}
                    >
                      <PasswordInput
                        value={password}
                        onChange={setPassword}
                        show={showPassword}
                        onToggleShow={() => setShowPassword(v => !v)}
                        disabled={loading}
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        placeholder="••••••••"
                      />
                      {/* Strength indicator solo en registro */}
                      {mode === "register" && password && (
                        <StrengthBar password={password} />
                      )}
                    </Field>
                  )}

                  {/* ── Confirmar contraseña — solo en registro ── */}
                  {mode === "register" && (
                    <Field label="Confirmá la contraseña">
                      <PasswordInput
                        value={passwordConfirm}
                        onChange={setPasswordConfirm}
                        show={showPassword}
                        onToggleShow={() => setShowPassword(v => !v)}
                        disabled={loading}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        hasError={passwordConfirm && password !== passwordConfirm}
                      />
                      {passwordConfirm && password !== passwordConfirm && (
                        <span className="lr-field-hint lr-field-hint--error">
                          Las contraseñas no coinciden
                        </span>
                      )}
                      {passwordConfirm && password === passwordConfirm && password && (
                        <span className="lr-field-hint lr-field-hint--ok">
                          ✓ Las contraseñas coinciden
                        </span>
                      )}
                    </Field>
                  )}

                  {/* ── Submit ── */}
                  <button
                    type="submit"
                    className="lr-btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="lr-btn-spinner" />
                    ) : (
                      <>
                        {mode === "login" && "Ingresar al sistema"}
                        {mode === "register" && "Solicitar alta"}
                        {mode === "forgot" && "Enviar instrucciones"}
                      </>
                    )}
                  </button>

                  {/* ── Footer del form ── */}
                  <div className="lr-form-footer">
                    {mode === "login" && (
                      <>
                        <span>¿No tenés cuenta institucional?</span>
                        <button type="button" className="lr-text-btn lr-text-btn--accent" onClick={() => setMode("register")} disabled={loading}>
                          Registrar entidad
                        </button>
                      </>
                    )}
                    {mode === "register" && (
                      <>
                        <span>¿Ya tenés acceso?</span>
                        <button type="button" className="lr-text-btn lr-text-btn--accent" onClick={() => setMode("login")} disabled={loading}>
                          Iniciar sesión
                        </button>
                      </>
                    )}
                    {mode === "forgot" && (
                      <>
                        <span>¿Recordaste tu contraseña?</span>
                        <button type="button" className="lr-text-btn lr-text-btn--accent" onClick={() => setMode("login")} disabled={loading}>
                          Volver al inicio
                        </button>
                      </>
                    )}
                  </div>

                </form>
              </>
            )}

          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-componentes
═══════════════════════════════════════════════════════════════════════════ */

function Field({ label, action, children }) {
  return (
    <div className="lr-field">
      <div className="lr-field-header">
        <label className="lr-label">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function Alert({ type, text }) {
  return (
    <div className={`lr-alert lr-alert--${type}`} role="alert">
      <span className="lr-alert-icon">{type === "error" ? "⚠" : "✓"}</span>
      {text}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggleShow, disabled, autoComplete, placeholder, hasError }) {
  return (
    <div className="lr-pwd-wrap">
      <input
        required
        type={show ? "text" : "password"}
        className={`lr-input lr-input--pwd${hasError ? " lr-input--error" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="lr-pwd-toggle"
        onClick={onToggleShow}
        disabled={disabled}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function StrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="lr-strength">
      <div className="lr-strength-bars">
        {bars.map(b => (
          <div
            key={b}
            className="lr-strength-bar"
            style={{ background: b <= score ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <span className="lr-strength-label" style={{ color }}>{label}</span>
    </div>
  );
}

function RoleSelector({ roles, selected, onSelect, disabled }) {
  return (
    <div className="lr-roles-grid">
      {roles.map(r => {
        const p = ROLE_PALETTE[r.id];
        return (
          <button
            key={r.id}
            type="button"
            className={`lr-role-item${selected === r.id ? " lr-role-item--active" : ""}`}
            onClick={() => onSelect(r.id)}
            disabled={disabled}
            style={selected === r.id ? {
              borderColor: p.border,
              background: p.dim,
            } : {}}
          >
            <span
              className="lr-role-glyph"
              style={{ color: p.color }}
            >
              {p.glyph}
            </span>
            <span className="lr-role-text">
              <span className="lr-role-title">{r.title}</span>
              <span className="lr-role-sub">{r.subtitle}</span>
            </span>
            {selected === r.id && (
              <span className="lr-role-check" style={{ color: p.color }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function VerifyEmailScreen({ email, cooldown, message, error, onResend, onBack }) {
  return (
    <div className="lr-status-screen">
      <div className="lr-status-icon lr-status-icon--info">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="M2 7l10 6 10-6" />
        </svg>
      </div>
      <h2 className="lr-status-title">Verificá tu correo</h2>
      <p className="lr-status-desc">
        Enviamos un enlace de verificación a <strong>{email}</strong>. Revisá tu bandeja de entrada (incluyendo SPAM).
      </p>
      {error && <Alert type="error" text={error} />}
      {message && <Alert type="success" text={message} />}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          className="lr-btn-primary"
          onClick={onResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar correo"}
        </button>
        <button
          type="button"
          className="lr-btn-secondary"
          onClick={onBack}
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function NoRoleScreen({ onLogout }) {
  return (
    <div className="lr-status-screen">
      <div className="lr-status-icon lr-status-icon--warning">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="lr-status-title">Acceso pendiente</h2>
      <p className="lr-status-desc">
        Tu cuenta está autenticada pero aún no tiene asignado un rol. Contactá al administrador para obtener acceso.
      </p>
      <button type="button" className="lr-btn-primary" onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}

/* ─── Estilos CSS ────────────────────────────────────────────────────────── */
const STYLES = `
/* Los estilos existentes se mantienen igual */
/* Solo se agregan estilos para los campos de documento */
.lr-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #F0F6FC;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  width: 100%;
  font-family: inherit;
  transition: background 0.2s, border-color 0.2s;
}

.lr-input:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
}

.lr-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.1);
  border-color: #3FB950;
  box-shadow: 0 0 0 2px rgba(63, 185, 80, 0.15);
}

.lr-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lr-input--error {
  border-color: #F85149;
  background: rgba(248, 81, 73, 0.05);
}

.lr-input--error:focus {
  box-shadow: 0 0 0 2px rgba(248, 81, 73, 0.15);
  border-color: #F85149;
}

/* Selector grid para documento y número */
@media (max-width: 768px) {
  .lr-form > div[style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }
}
`;
