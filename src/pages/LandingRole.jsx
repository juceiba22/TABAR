/**
 * LandingRole.jsx — TABAR Role Hub (Stitch Agrarian Intelligence)
 *
 * Selección y acceso demo en 1 clic con diseño institucional Stitch.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRole, ROLE_HOME, DEMO_PROFILES } from "../modules/roles/RoleContext";

const ROLES_INFO = [
  {
    id: "producer",
    title: "Productor Tabacalero",
    badge: "Finca / Cultivo",
    desc: "Certificación digital de fardos, emisión de warrants, solicitud de adelantos y gestión de asociaciones en bloque.",
    icon: "psychiatry",
    tagCode: "PROD-AR-2026",
    color: "#132a1e",
    bgLight: "#edf6ef",
  },
  {
    id: "industry",
    title: "Acopiador / Industria",
    badge: "Entidad / Silo",
    desc: "Emisión y endoso de warrants digitales, compras a granel de tabaco Virginia/Criollo y financiamiento de campaña.",
    icon: "warehouse",
    tagCode: "ACOPIO-SAGYP",
    color: "#1a4329",
    bgLight: "#eef1e8",
  },
  {
    id: "dealer",
    title: "Dealer / Revendedor",
    badge: "Mesa de Operaciones",
    desc: "Mesa de operaciones comerciales, financiamiento de warrants, arbitraje y provisión de liquidez al sector.",
    icon: "candlestick_chart",
    tagCode: "DEALER-DESK",
    color: "#775a00",
    bgLight: "#fdf8eb",
  },
  {
    id: "admin",
    title: "Fideicomiso / Admin",
    badge: "Control Central",
    desc: "Gobernanza del protocolo TABAR, monitoreo de transacciones atómicas y administración general del sistema.",
    icon: "shield_lock",
    tagCode: "TRUST-ADMIN",
    color: "#00150a",
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
      background: "var(--tb-bg)",
      fontFamily: "var(--tb-font)",
      color: "var(--tb-text)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Telemetry Strip */}
      <div style={{
        background: "#102b19",
        color: "#ffffff",
        padding: "6px 20px",
        fontFamily: "var(--tb-mono)",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #1a4329"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fdc668", display: "inline-block" }} />
          <span>ENTORNO DEMO & EVALUACIÓN · LEY 9.643</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#c1c8c0" }}>
          <span>ACCESO DIRECTO 1-CLIC</span>
          <span style={{ color: "#ffdeac" }}>SIN REGISTRO PREVIO</span>
        </div>
      </div>

      {/* Top Navbar */}
      <nav style={{
        background: "#ffffff",
        borderBottom: "1px solid var(--tb-border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(19, 42, 30, 0.03)"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            background: "var(--tb-accent)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(19,42,30,0.2)"
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--tb-serif)", fontSize: "17px", fontWeight: "700", color: "var(--tb-accent)", lineHeight: 1.1 }}>TABAR Protocol</div>
            <div style={{ fontSize: "10px", color: "var(--tb-text-2)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>AgroTabaco Labs</div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/" style={{ fontSize: "13.5px", color: "var(--tb-text-2)", fontWeight: "600", textDecoration: "none" }}>
            ← Volver al Portal
          </Link>
          <span style={{
            background: "#edf6ef",
            color: "var(--tb-accent)",
            padding: "4px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "700",
            fontFamily: "var(--tb-mono)",
            border: "1px solid #d8e5dc"
          }}>
            MODO SIMULACIÓN ACTIVO
          </span>
        </div>
      </nav>

      {/* Header Banner Ejecutivo */}
      <div style={{
        background: "#132a1e",
        color: "#ffffff",
        padding: "48px 24px",
        textAlign: "center",
        borderBottom: "1px solid #00150a",
        boxShadow: "0 4px 20px rgba(0, 21, 10, 0.15)"
      }}>
        <div style={{ maxWidth: "840px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(197, 155, 39, 0.15)",
            border: "1px solid rgba(197, 155, 39, 0.3)",
            color: "#ffdeac",
            padding: "4px 14px",
            borderRadius: "4px",
            fontFamily: "var(--tb-mono)",
            fontSize: "11px",
            fontWeight: "700",
            marginBottom: "16px"
          }}>
            ✦ SELECCIÓN DE PERFIL OPERATIVO
          </div>
          <h1 style={{
            fontFamily: "var(--tb-serif)",
            fontSize: "34px",
            fontWeight: "700",
            margin: "0 0 14px",
            letterSpacing: "-0.015em",
            lineHeight: 1.2
          }}>
            Ingresá a la plataforma con tu rol institucional
          </h1>
          <p style={{
            fontSize: "15px",
            color: "#d7e0d2",
            margin: "0 auto",
            lineHeight: 1.65,
            maxWidth: "680px"
          }}>
            Elegí cualquiera de los perfiles disponibles para acceder instantáneamente con balances simulados, warrants activos y datos de mercado.
          </p>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div style={{
        maxWidth: "1140px",
        margin: "0 auto",
        padding: "44px 20px",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "36px"
        }}>
          {ROLES_INFO.map((r) => (
            <div
              key={r.id}
              onClick={() => handleQuickAccess(r.id)}
              style={{
                background: "#ffffff",
                border: "1px solid var(--tb-border)",
                borderRadius: "8px",
                padding: "26px 22px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "var(--tb-shadow-sm)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = r.color;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "var(--tb-shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--tb-border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--tb-shadow-sm)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  background: r.bgLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: r.color,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{r.icon}</span>
                </div>
                <span style={{
                  fontFamily: "var(--tb-mono)",
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: r.bgLight,
                  color: r.color,
                  border: `1px solid ${r.color}30`
                }}>
                  {r.tagCode}
                </span>
              </div>

              <h2 style={{
                fontFamily: "var(--tb-serif)",
                fontSize: "19px",
                fontWeight: "700",
                color: "var(--tb-accent)",
                margin: "0 0 8px"
              }}>
                {r.title}
              </h2>

              <p style={{
                fontSize: "13px",
                color: "var(--tb-text-2)",
                lineHeight: 1.55,
                margin: "0 0 22px",
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
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}
              >
                <span>Ingresar como {r.title.split(" ")[0]}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </button>
            </div>
          ))}
        </div>

        {/* Opción personalizada al pie */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--tb-border)",
          borderRadius: "8px",
          padding: "22px 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "var(--tb-shadow-sm)"
        }}>
          <div>
            <div style={{ fontFamily: "var(--tb-serif)", fontSize: "16px", fontWeight: "700", color: "var(--tb-accent)", marginBottom: "2px" }}>
              ¿Deseas personalizar tu nombre o entidad?
            </div>
            <div style={{ fontSize: "13px", color: "var(--tb-text-2)" }}>
              Asigna un nombre customizado al perfil para presentaciones y demos ejecutivas.
            </div>
          </div>
          <button
            onClick={() => setShowCustomModal(!showCustomModal)}
            style={{
              background: "var(--tb-surface-tint)",
              border: "1px solid #d8e5dc",
              color: "var(--tb-accent)",
              padding: "9px 18px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showCustomModal ? "Cerrar configuración" : "Personalizar acceso demo"}
          </button>
        </div>

        {/* Modal / Acordeón de Personalización */}
        {showCustomModal && (
          <form onSubmit={handleCustomLogin} style={{
            marginTop: "16px",
            background: "#ffffff",
            border: "1px solid #c2c8c2",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "var(--tb-shadow-md)"
          }}>
            <h3 style={{ margin: "0 0 16px", fontFamily: "var(--tb-serif)", fontSize: "18px", color: "var(--tb-accent)" }}>
              Configurar Nombre y Rol Demo
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--tb-text-2)", marginBottom: "6px" }}>
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--tb-text-2)", marginBottom: "6px" }}>
                  Rol a Asignar
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="tabar-select"
                >
                  <option value="producer">🌿 Productor Tabacalero</option>
                  <option value="industry">🏢 Acopiador / Industria</option>
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
        borderTop: "1px solid var(--tb-border)",
        background: "#ffffff",
        padding: "24px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--tb-text-2)"
      }}>
        <span>TABAR Protocol · Plataforma de Demostración y Evaluación · AgroTabaco Labs 2026</span>
      </footer>
    </div>
  );
}
