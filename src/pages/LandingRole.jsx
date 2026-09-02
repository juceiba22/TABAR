/**
 * LandingRole.jsx — TABAR Demo & Role Access Hub (AgroTabaco Clean Edition)
 *
 * Permite acceso demo directo en 1 clic para explorar todos los perfiles de la plataforma
 * sin fricciones de registro, sin validación obligatoria de correo ni CUITs.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole, ROLE_HOME, ROLE_LABELS, ROLE_COLORS, DEMO_PROFILES } from "../modules/roles/RoleContext";

const ROLES_INFO = [
  {
    id: "producer",
    title: "Productor Tabacalero",
    badge: "Finca / Cultivo",
    desc: "Certificación digital de fardos de tabaco, emisión de warrants, solicitud de adelantos y gestión de asociaciones.",
    icon: "🌿",
    color: "#2f6844",
    bgLight: "#eef5f0",
  },
  {
    id: "industry",
    title: "Acopiador / Industria",
    badge: "Entidad / Acopio",
    desc: "Emisión y endoso de warrants digitales, compras a granel de tabaco y solicitud de financiamiento de campaña.",
    icon: "🏢",
    color: "#1a4329",
    bgLight: "#eef1e8",
  },
  {
    id: "state",
    title: "Estado Nacional (FET)",
    badge: "Ente Regulador",
    desc: "Supervisión de POAs, distribución del Fondo Especial del Tabaco y trazabilidad de la producción nacional.",
    icon: "🏛️",
    color: "#6b7a3a",
    bgLight: "#f4f6ec",
  },
  {
    id: "dealer",
    title: "Dealer / Revendedor",
    badge: "Mercado Secundario",
    desc: "Mesa de operaciones comerciales, financiamiento de warrants, arbitraje y provisión de liquidez al sector.",
    icon: "💼",
    color: "#8a5a2e",
    bgLight: "#f9f4ed",
  },
  {
    id: "admin",
    title: "Fideicomiso / Admin",
    badge: "Control Central",
    desc: "Gobernanza del protocolo TABAR, monitoreo de transacciones atómicas y administración general del sistema.",
    icon: "🔑",
    color: "#1b241d",
    bgLight: "#f1f2ed",
  },
];

export default function LandingRole() {
  const navigate = useNavigate();
  const { setDemoRole } = useRole();
  const [customName, setCustomName] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("producer");

  const handleQuickAccess = (roleId) => {
    setDemoRole(roleId);
    const dest = ROLE_HOME[roleId] || "/";
    navigate(dest, { replace: true });
  };

  const handleCustomLogin = (e) => {
    e.preventDefault();
    const roleId = selectedRole;
    const name = customName.trim() || DEMO_PROFILES[roleId].displayName;
    setDemoRole(roleId, { displayName: name, firstName: name });
    const dest = ROLE_HOME[roleId] || "/";
    navigate(dest, { replace: true });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f7f2",
      fontFamily: "var(--tb-font)",
      color: "#1b241d",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Navbar */}
      <nav style={{
        background: "#ffffff",
        borderBottom: "1px solid #e3e6dc",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(26, 67, 41, 0.03)"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#1a4329",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold"
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a4329", letterSpacing: "0.5px" }}>TABAR</div>
            <div style={{ fontSize: "10px", color: "#5c6b5e", textTransform: "uppercase", fontWeight: "600" }}>AgroTabaco Labs</div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/" style={{ fontSize: "13px", color: "#5c6b5e", fontWeight: "600", textDecoration: "none" }}>
            ← Volver a la Presentación
          </Link>
          <span style={{
            background: "#eef1e8",
            color: "#1a4329",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            border: "1px solid #ced3c5"
          }}>
            🟢 Entorno Demo Libre
          </span>
        </div>
      </nav>

      {/* Hero Banner Ejecutivo */}
      <div style={{
        background: "linear-gradient(135deg, #102b19 0%, #1a4329 55%, #2f6844 100%)",
        color: "#ffffff",
        padding: "44px 24px",
        textAlign: "center",
        borderBottom: "1px solid #1a4329",
        boxShadow: "0 4px 20px rgba(16, 43, 25, 0.15)"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            marginBottom: "16px"
          }}>
            ✨ Acceso Inmediato sin Registros ni Verificaciones
          </div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "800",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
            lineHeight: 1.2
          }}>
            Seleccioná tu perfil para explorar TABAR
          </h1>
          <p style={{
            fontSize: "15px",
            color: "#d7e0d2",
            margin: "0",
            lineHeight: 1.6,
            maxWidth: "640px",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Hacé clic en cualquiera de los roles a continuación para ingresar al instante con datos de simulación reales precargados.
          </p>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "40px 20px",
        width: "100%",
        boxBox: "border-box"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "32px"
        }}>
          {ROLES_INFO.map((r) => (
            <div
              key={r.id}
              onClick={() => handleQuickAccess(r.id)}
              style={{
                background: "#ffffff",
                border: "1px solid #e3e6dc",
                borderRadius: "14px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(26, 67, 41, 0.04)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = r.color;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(26, 67, 41, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e3e6dc";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(26, 67, 41, 0.04)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: r.bgLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  {r.icon}
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: r.bgLight,
                  color: r.color,
                  border: `1px solid ${r.color}30`
                }}>
                  {r.badge}
                </span>
              </div>

              <h2 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1b241d",
                margin: "0 0 8px"
              }}>
                {r.title}
              </h2>

              <p style={{
                fontSize: "13px",
                color: "#5c6b5e",
                lineHeight: 1.5,
                margin: "0 0 20px",
                flex: 1
              }}>
                {r.desc}
              </p>

              <button
                type="button"
                style={{
                  width: "100%",
                  background: r.color,
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "filter 0.15s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                }}
              >
                Ingresar como {r.title.split(" ")[0]} →
              </button>
            </div>
          ))}
        </div>

        {/* Opción personalizada al pie */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e3e6dc",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
        }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a4329", marginBottom: "2px" }}>
              ¿Querés ingresar con tu nombre propio?
            </div>
            <div style={{ fontSize: "13px", color: "#5c6b5e" }}>
              Podés personalizar el nombre visible de tu usuario de prueba.
            </div>
          </div>
          <button
            onClick={() => setShowCustomModal(!showCustomModal)}
            style={{
              background: "#eef1e8",
              border: "1px solid #ced3c5",
              color: "#1a4329",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showCustomModal ? "Cerrar personalización" : "Personalizar acceso demo"}
          </button>
        </div>

        {/* Modal / Acordeón de Personalización */}
        {showCustomModal && (
          <form onSubmit={handleCustomLogin} style={{
            marginTop: "16px",
            background: "#ffffff",
            border: "1px solid #ced3c5",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(26,67,41,0.06)"
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1a4329" }}>
              Configurar Nombre y Rol Demo
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5c6b5e", marginBottom: "6px" }}>
                  Tu Nombre o Razón Social
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cooperativa Tabacalera San Vicente"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="tabar-input"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5c6b5e", marginBottom: "6px" }}>
                  Rol a Asignar
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="tabar-select"
                >
                  <option value="producer">🌿 Productor Tabacalero</option>
                  <option value="industry">🏢 Acopiador / Industria</option>
                  <option value="state">🏛️ Estado Nacional (FET)</option>
                  <option value="dealer">💼 Dealer / Revendedor</option>
                  <option value="admin">🔑 Fideicomiso / Administrador</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="tabar-btn tabar-btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              Comenzar Demostración Personalizada →
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid #e3e6dc",
        background: "#ffffff",
        padding: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "#5c6b5e"
      }}>
        <span>TABAR Tech · Plataforma de Demostración y Evaluación · AgroTabaco 2026</span>
      </footer>
    </div>
  );
}
