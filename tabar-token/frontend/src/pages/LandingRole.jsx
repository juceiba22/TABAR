import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../modules/roles/RoleContext";
import { CUENTAS, ROL_A_CUENTA } from "../modules/blockchain/useTabar";
import { privateKeyToAccount } from "viem/accounts";

const ROLE_PALETTE = {
  admin:    { color: "#E3B64F", dim: "rgba(227,182,79,0.10)" },
  industry: { color: "#58A6FF", dim: "rgba(88,166,255,0.10)" },
  state:    { color: "#F0883E", dim: "rgba(240,136,62,0.10)" },
  dealer:   { color: "#BC8CFF", dim: "rgba(188,140,255,0.10)" },
};

const ROLES_INFO = [
  {
    id: "admin",
    glyph: "◈",
    title: "Fideicomiso",
    subtitle: "Admin",
    desc: "Control total del sistema. Campañas, autorizaciones y emisión.",
    features: ["Iniciar campaña", "Autorizar participantes", "Emitir producción", "Control del sistema"],
  },
  {
    id: "industry",
    glyph: "⬡",
    title: "Industria",
    subtitle: "Exportador",
    desc: "Compra de producción tabacalera anticipada con descuento.",
    features: ["Comprar TABAR", "Ver posición", "Transferir", "Campaña"],
  },
  {
    id: "state",
    glyph: "◉",
    title: "Estado Nacional",
    subtitle: "FET",
    desc: "Participación institucional con rendimiento garantizado.",
    features: ["Invertir vía FET", "Rendimientos", "Proyecciones", "Reportes"],
  },
  {
    id: "dealer",
    glyph: "◇",
    title: "Dealer",
    subtitle: "Revendedor",
    desc: "Mercado secundario. Arbitraje y oportunidades de posición.",
    features: ["Operar TABAR", "Mercados", "Arbitraje", "Posiciones"],
  },
];

const ROUTE_MAP = { admin: "/admin", industry: "/industry", state: "/state", dealer: "/dealer" };

export default function LandingRole() {
  const { setRole, setWalletAddress, setContractAddress } = useRole();
  const navigate = useNavigate();

  const [step, setStep] = useState("select");
  const [selectedRole, setSelectedRole] = useState(null);
  const [contractInput, setContractInput] = useState("");
  const [contractError, setContractError] = useState("");

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setStep("connecting");
    setTimeout(() => {
      const cuentaKey = ROL_A_CUENTA[roleId];
      const pk = CUENTAS[cuentaKey];
      const account = privateKeyToAccount(pk);
      setWalletAddress(account.address);
      setRole(roleId);
      setStep("input_contract");
    }, 1200);
  };

  const handleContractSubmit = (e) => {
    e.preventDefault();
    const addr = contractInput.trim();
    if (addr && !addr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setContractError("Dirección inválida. Debe ser 0x seguido de 40 caracteres hex.");
      return;
    }
    setContractAddress(addr);
    navigate(ROUTE_MAP[selectedRole]);
  };

  const handleSkipContract = () => {
    setContractAddress("");
    navigate(ROUTE_MAP[selectedRole]);
  };

  const palette = selectedRole ? ROLE_PALETTE[selectedRole] : ROLE_PALETTE.admin;

  return (
    <div className="tabar-landing">
      {/* Hero */}
      <div className="tabar-hero">
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "60%", height: "100%",
          background: "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(227,182,79,0.08), transparent)",
          pointerEvents: "none",
        }} />
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
            Plataforma tokenizada de financiamiento tabacalero.<br />
            Conectá tu wallet y seleccioná tu perfil de participante.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="tabar-landing-main">

        {step === "select" && (
          <>
            <h2 className="tabar-section-title">Seleccioná tu perfil</h2>
            <div className="tabar-roles-grid">
              {ROLES_INFO.map((r) => {
                const p = ROLE_PALETTE[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    className="tabar-role-card"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = p.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--tb-border)"; }}
                  >
                    <span className="tabar-role-arrow">↗</span>
                    <div className="tabar-role-icon" style={{ background: p.dim, color: p.color }}>
                      {r.glyph}
                    </div>
                    <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 600, color: "var(--tb-text)" }}>
                      {r.title}
                    </h3>
                    <span style={{ fontSize: "11px", color: "var(--tb-text-3)", display: "block", marginBottom: "8px" }}>
                      {r.subtitle}
                    </span>
                    <p style={{ margin: "0 0 14px", fontSize: "13px", color: "var(--tb-text-2)", lineHeight: 1.5 }}>
                      {r.desc}
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {r.features.map((f) => (
                        <li key={f} style={{ fontSize: "12px", color: "var(--tb-text-3)", display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ color: p.color, fontSize: "10px" }}>●</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div style={{
                      border: "1px solid var(--tb-border)", borderRadius: "6px",
                      padding: "7px 14px", fontSize: "12px", fontWeight: 500,
                      color: "var(--tb-text-2)", display: "inline-block",
                    }}>
                      Conectar →
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "connecting" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", minHeight: "300px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: "2px solid var(--tb-surface-3)",
              borderTopColor: palette.color,
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 6px", color: "var(--tb-text)" }}>Conectando wallet</h2>
              <p style={{ color: "var(--tb-text-2)", fontSize: "13px", margin: 0 }}>
                Simulando conexión para {ROLES_INFO.find(r => r.id === selectedRole)?.title}
              </p>
            </div>
          </div>
        )}

        {step === "input_contract" && (
          <div className="tabar-contract-step">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "13px" }}>
              <span style={{ color: "var(--tb-green)" }}>●</span>
              <span style={{ color: "var(--tb-green)" }}>Wallet conectada</span>
            </div>
            <h2 className="tabar-section-title" style={{ marginBottom: "8px" }}>Dirección del contrato TABAR</h2>
            <p style={{ color: "var(--tb-text-3)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px" }}>
              Ingresá la dirección del contrato deployado en tu red local, o salteá este paso.
            </p>
            <form onSubmit={handleContractSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
              <input
                type="text"
                placeholder="0x..."
                value={contractInput}
                onChange={(e) => { setContractInput(e.target.value); setContractError(""); }}
                className="tabar-input tabar-input-mono"
                style={{ borderColor: contractError ? "var(--tb-red)" : undefined }}
              />
              {contractError && <p style={{ color: "var(--tb-red)", fontSize: "12px", margin: 0 }}>{contractError}</p>}
              <div className="tabar-contract-actions">
                <button type="submit" className="tabar-btn tabar-btn-primary tabar-btn-full" style={{ flex: 1 }}>
                  Ingresar al sistema
                </button>
                <button type="button" onClick={handleSkipContract} className="tabar-btn tabar-btn-ghost">
                  Saltear
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <footer className="tabar-footer">
        AgroTabaco Labs · TABAR v1.0 · Red Hardhat Local
      </footer>
    </div>
  );
}
