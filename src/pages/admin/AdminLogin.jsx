import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, setDemoRole } = useRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        await signOut(auth);
        setError("Acceso denegado. Este portal es exclusivo para administradores.");
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Credenciales inválidas o error de conexión.");
      setLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    setDemoRole("admin");
    navigate("/admin", { replace: true });
  };

  if (authLoading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--tb-text-2)" }}>Cargando...</div>;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "var(--tb-bg)",
      fontFamily: "var(--tb-font)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        padding: "36px",
        background: "#ffffff",
        border: "1px solid var(--tb-border)",
        borderRadius: "8px",
        boxShadow: "var(--tb-shadow-md)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "6px",
            background: "var(--tb-accent)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 2px 8px rgba(19,42,30,0.2)"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>shield_lock</span>
          </div>
          <div style={{ fontFamily: "var(--tb-serif)", fontSize: "24px", fontWeight: "700", color: "var(--tb-accent)" }}>TABAR Admin</div>
          <p style={{ margin: "4px 0 0", color: "var(--tb-text-2)", fontSize: "13px" }}>Portal de Gobernanza y Fideicomiso</p>
        </div>

        {error && (
          <div style={{ padding: "12px", marginBottom: "20px", background: "#fdf2f2", border: "1px solid #f8d7da", borderRadius: "6px", color: "var(--tb-red)", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleDemoAdmin}
          className="tabar-btn tabar-btn-primary tabar-btn-full"
          style={{ marginBottom: "20px", padding: "12px" }}
        >
          Acceso Rápido Demo Administrador →
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--tb-text-3)", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--tb-border)" }} />
          <span style={{ padding: "0 10px" }}>O con credenciales</span>
          <div style={{ flex: 1, height: "1px", background: "var(--tb-border)" }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--tb-text-2)", fontSize: "12px", fontWeight: "600" }}>Correo electrónico</label>
            <input 
              type="email" 
              required
              className="tabar-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--tb-text-2)", fontSize: "12px", fontWeight: "600" }}>Contraseña</label>
            <input 
              type="password" 
              required
              className="tabar-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="tabar-btn tabar-btn-secondary tabar-btn-full"
            style={{ padding: "11px" }}
          >
            {loading ? "Verificando..." : "Iniciar Sesión Oficial"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link to="/" style={{ color: "var(--tb-text-2)", fontSize: "12px", textDecoration: "none" }}>
            ← Volver al Portal Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
