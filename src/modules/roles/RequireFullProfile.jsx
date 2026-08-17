import { Link } from "react-router-dom";
import { useRole } from "./RoleContext";

// Campos que constituyen el KYC "pesado" — con solo Google + elegir rol ya
// se puede navegar el dashboard, pero para tokenizar producción o firmar un
// warrant hace falta identificar a la persona y la organización responsable.
const REQUIRED_FIELDS = ["firstName", "lastName", "documentNumber", "companyName", "phone"];

function isProfileComplete(profile) {
  if (!profile) return false;
  return REQUIRED_FIELDS.every((field) => String(profile[field] || "").trim().length > 0);
}

export default function RequireFullProfile({ children }) {
  const { profile } = useRole();

  if (isProfileComplete(profile)) return children;

  return (
    <div className="tabar-section" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center" }}>
      <div style={{
        background: "rgba(227,182,79,0.05)",
        border: "1px solid rgba(227,182,79,0.2)",
        borderRadius: "12px",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}>
        <span style={{ fontSize: "28px" }}>📋</span>
        <h2 style={{ margin: 0, fontSize: "18px", color: "#F0F6FC" }}>Completá tu perfil para continuar</h2>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px", lineHeight: 1.6 }}>
          Para tokenizar producción o firmar warrants necesitamos algunos datos más de vos y tu organización.
          Es un paso único — el resto de la app queda igual de accesible.
        </p>
        <Link to="/miPerfil" className="tabar-btn tabar-btn-primary" style={{ marginTop: "8px" }}>
          Completar perfil
        </Link>
      </div>
    </div>
  );
}
