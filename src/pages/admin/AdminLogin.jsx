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

  if (authLoading) return <div style={{ padding: "40px", textAlign: "center", color: "#5c6b5e" }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f7f7f2", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "36px", background: "#ffffff", border: "1px solid #e3e6dc", borderRadius: "14px", boxShadow: "0 8px 30px rgba(26,67,41,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#1a4329", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginBottom: "12px" }}>
            🔑
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a4329", letterSpacing: "-0.5px" }}>TABAR Admin</div>
          <p style={{ margin: "4px 0 0", color: "#5c6b5e", fontSize: "13px" }}>Portal de Gobernanza y Fideicomiso</p>
        </div>

        {error && (
          <div style={{ padding: "12px", marginBottom: "20px", background: "#fdf2f2", border: "1px solid #f8d7da", borderRadius: "8px", color: "#a13f2e", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleDemoAdmin}
          style={{
            width: "100%",
            padding: "12px",
            background: "#1a4329",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(26,67,41,0.2)"
          }}
        >
          Acceso Rápido Demo Administrador →
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "#8c9a8e", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "#e3e6dc" }} />
          <span style={{ padding: "0 10px" }}>O con credenciales</span>
          <div style={{ flex: 1, height: "1px", background: "#e3e6dc" }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#5c6b5e", fontSize: "12px", fontWeight: "600" }}>Correo electrónico</label>
            <input 
              type="email" 
              required
              style={{ width: "100%", padding: "10px 12px", background: "#ffffff", border: "1px solid #e3e6dc", borderRadius: "8px", color: "#1b241d", fontSize: "13px", boxSizing: "border-box", outline: "none" }} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#5c6b5e", fontSize: "12px", fontWeight: "600" }}>Contraseña</label>
            <input 
              type="password" 
              required
              style={{ width: "100%", padding: "10px 12px", background: "#ffffff", border: "1px solid #e3e6dc", borderRadius: "8px", color: "#1b241d", fontSize: "13px", boxSizing: "border-box", outline: "none" }} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: "100%", padding: "11px", background: "#eef1e8", color: "#1a4329", border: "1px solid #ced3c5", borderRadius: "8px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", marginTop: "4px" }}
          >
            {loading ? "Verificando..." : "Iniciar Sesión Oficial"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link to="/" style={{ color: "#5c6b5e", fontSize: "12px", textDecoration: "none" }}>
            ← Volver al Portal Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
