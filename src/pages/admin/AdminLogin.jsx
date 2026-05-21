import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useRole } from "../../modules/roles/RoleContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useRole();

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

  if (authLoading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div>;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#080C10" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", background: "#161B22", border: "1px solid #30363D", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "24px", color: "#E3B64F", marginBottom: "8px" }}>◈ TABAR Admin</div>
          <p style={{ margin: 0, color: "#8B949E", fontSize: "14px" }}>Portal de Administración</p>
        </div>

        {error && (
          <div style={{ padding: "12px", marginBottom: "20px", background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: "6px", color: "#F85149", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#8B949E", fontSize: "12px", fontWeight: 500 }}>Correo electrónico</label>
            <input 
              type="email" 
              required
              style={{ width: "100%", padding: "10px", background: "#0D1117", border: "1px solid #30363D", borderRadius: "6px", color: "#F0F6FC" }} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "#8B949E", fontSize: "12px", fontWeight: 500 }}>Contraseña</label>
            <input 
              type="password" 
              required
              style={{ width: "100%", padding: "10px", background: "#0D1117", border: "1px solid #30363D", borderRadius: "6px", color: "#F0F6FC" }} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#E3B64F", color: "#000", border: "none", borderRadius: "6px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}
          >
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
