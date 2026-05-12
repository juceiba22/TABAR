import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
// Role palette and info managed inline for the MVP

const ROLE_PALETTE_INLINE = {
  admin: { color: "#E3B64F", dim: "rgba(227,182,79,0.10)" },
  industry: { color: "#58A6FF", dim: "rgba(88,166,255,0.10)" },
  state: { color: "#F0883E", dim: "rgba(240,136,62,0.10)" },
  dealer: { color: "#BC8CFF", dim: "rgba(188,140,255,0.10)" },
};

const ROLES_INFO_INLINE = [
  { id: "admin", glyph: "◈", title: "Administración", subtitle: "Acopiador" },
  { id: "industry", glyph: "⬡", title: "Industria", subtitle: "Exportador" },
  { id: "state", glyph: "◉", title: "Estado Nacional", subtitle: "FET" },
  { id: "dealer", glyph: "◇", title: "Dealer", subtitle: "Revendedor" },
];

export default function LandingRole() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedRole, setSelectedRole] = useState("industry");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        // RoleContext will handle redirect automatically based on user role
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Save user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          displayName,
          companyName,
          role: selectedRole,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tabar-landing">
      {/* Hero */}
      <div className="tabar-hero" style={{ paddingBottom: "20px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--tb-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <h1 className="tabar-hero-title">
                <span style={{ color: "var(--tb-accent)" }}>TABAR</span>
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--tb-text-3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Financiamiento Agroindustrial
              </p>
            </div>
          </div>
          <p className="tabar-hero-desc">
            Plataforma institucional de financiamiento tabacalero.<br />
            {mode === "login" ? "Ingresá a tu cuenta para operar." : "Registrá tu entidad para participar."}
          </p>
        </div>
      </div>

      <div className="tabar-landing-main" style={{ maxWidth: "400px", margin: "0 auto", marginTop: "20px" }}>
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left", background: "#080c10", padding: "30px", borderRadius: "12px", border: "1px solid var(--tb-border)" }}>
          {error && <div style={{ color: "var(--tb-red)", fontSize: "13px", padding: "10px", background: "rgba(255, 102, 68, 0.1)", borderRadius: "6px" }}>{error}</div>}

          {mode === "register" && (
            <>
              <div>
                <label style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "6px", display: "block" }}>Nombre Completo</label>
                <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} type="text" className="tabar-input" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "6px", display: "block" }}>Organización / Empresa</label>
                <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} type="text" className="tabar-input" placeholder="Ej. AgroTech SA" />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "6px", display: "block" }}>Tipo de Perfil</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {ROLES_INFO_INLINE.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: `1px solid ${selectedRole === r.id ? ROLE_PALETTE_INLINE[r.id].color : "var(--tb-border)"}`,
                        background: selectedRole === r.id ? ROLE_PALETTE_INLINE[r.id].dim : "transparent",
                        color: "var(--tb-text)",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ color: ROLE_PALETTE_INLINE[r.id].color }}>{r.glyph}</span> {r.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "6px", display: "block" }}>Email</label>
            <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="tabar-input" placeholder="institucional@email.com" />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--tb-text-2)", marginBottom: "6px", display: "block" }}>Contraseña</label>
            <input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="tabar-input" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="tabar-btn tabar-btn-primary tabar-btn-full" style={{ marginTop: "10px" }}>
            {loading ? "Procesando..." : (mode === "login" ? "Ingresar al Sistema" : "Crear Cuenta")}
          </button>

          <div style={{ textAlign: "center", marginTop: "10px", fontSize: "13px" }}>
            <span style={{ color: "var(--tb-text-3)" }}>
              {mode === "login" ? "¿No tenés cuenta?" : "¿Ya estás registrado?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              style={{ background: "none", border: "none", color: "var(--tb-accent)", cursor: "pointer", fontWeight: 500 }}
            >
              {mode === "login" ? "Solicitar acceso" : "Iniciá sesión"}
            </button>
          </div>
        </form>
      </div>

      <footer className="tabar-footer" style={{ marginTop: "40px" }}>
        AgroTabaco Labs · TABAR v1.0 MVP
      </footer>
    </div>
  );
}
