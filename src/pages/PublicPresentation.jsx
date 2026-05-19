import { Link } from "react-router-dom";
import { useRole, ROLE_HOME } from "../modules/roles/RoleContext";

/* ─── Datos del Diagnóstico y Solución ────────────────────────────────────── */

const DIAGNOSIS = [
  {
    icon: "📉",
    color: "#E3B64F",
    dim: "rgba(227,182,79,0.10)",
    border: "rgba(227,182,79,0.25)",
    title: "Asimetría de Mercado",
    text: "Base productiva altamente atomizada (16.000-18.000 productores) frente a un eslabón de acopio e industria manufacturera altamente concentrado que impone las reglas de juego y determina los precios sin competencia real.",
  },
  {
    icon: "⏳",
    color: "#F0883E",
    dim: "rgba(240,136,62,0.10)",
    border: "rgba(240,136,62,0.25)",
    title: "Retrasos y reducción sistemática del FET",
    text: "Los Planes Operativos Anuales (POA) del Fondo Especial del Tabaco sufren retrasos crónicos y barreras burocráticas que asfixian económicamente al minifundista, licuando su rentabilidad por inflación y devaluación.",
  },
  {
    icon: "⚖",
    color: "#BC8CFF",
    dim: "rgba(188,140,255,0.10)",
    border: "rgba(188,140,255,0.25)",
    title: "Desplazamiento del Valor",
    text: "Regulaciones complejas y un marco legal obsoleto transforman el precio de sustentación en una disputa política territorial, desplazando el incentivo real para el agro hacia estructuras de intermediación ineficientes.",
  }
];

const MODULES = [
  {
    role: "Módulo Productor",
    desc: "Tokenización de fardos físicos en unidades digitales líquidas para acceder a financiamiento adelantado sin intermediación política.",
  },
  {
    role: "Módulo Industria / Acopiador",
    desc: "Emisión de órdenes de compra estandarizadas y gestión de garantías físicas (Warrants) con trazabilidad absoluta.",
  },
  {
    role: "Módulo Gestión Estatal (FET)",
    desc: "Digitalización y auditoría en tiempo real de los Planes Operativos Anuales para acelerar la transferencia directa de recursos.",
  }
];

const ROADMAP = [
  {
    phase: "Fase Actual (Gobernanza Web2)",
    detail: "Validación de identidad, consistencia transaccional atómica centralizada mediante Firebase (runTransaction) y emisión de comprobantes contractuales en PDF para interactuar con la matriz regulatoria vigente."
  },
  {
    phase: "Próxima Fase (Migración DeFi)",
    detail: "Evolución nativa hacia un protocolo descentralizado. Sustitución de balances centralizados por contratos inteligentes y tokens de valor estables para automatizar el mercado secundario."
  }
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function PublicPresentation() {
  const { user, role, loading } = useRole();

  // Si el usuario ya tiene sesión activa con rol, redirigir
  if (!loading && user && role) {
    const dest = ROLE_HOME[role] || "/login";
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--tb-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="pp-spinner" />
          <p style={{ color: "var(--tb-text-3)", fontSize: "13px", marginTop: "16px" }}>Redirigiendo…</p>
          <meta httpEquiv="refresh" content={`0;url=${dest}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="pp-root">
      {/* Fondo decorativo */}
      <div className="pp-bg-grid" aria-hidden="true" />
      <div className="pp-bg-glow" aria-hidden="true" />
      <div className="pp-bg-glow pp-bg-glow--right" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className="pp-nav">
        <div className="pp-nav-inner">
          <div className="pp-logo">
            <div className="pp-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
              </svg>
            </div>
            <span className="pp-logo-text">TABAR</span>
            <span className="pp-logo-badge">Protocol v1.0</span>
          </div>
          <Link to="/login" className="pp-nav-login">Ingresar</Link>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <span className="pp-hero-tag">SISTEMA FIDUCIARIO Y SIMULADOR DE MERCADO</span>
          <h1 className="pp-hero-title">
            La infraestructura digital para el saneamiento del sector tabacalero.
          </h1>
          <p className="pp-hero-sub">
            De 132.000 a 80.000 toneladas anuales: la contracción del 39.4% en la producción formal demuestra que el sistema tradicional está agotado. TABAR es la respuesta institucional y de mercado.
          </p>
          
          <div className="pp-hero-actions">
            <Link to="/login" className="pp-cta">
              [ Ingresar a la Plataforma ]
              <span className="pp-cta-arrow">→</span>
            </Link>
            <a href="#" className="pp-cta pp-cta-secondary" onClick={(e) => { e.preventDefault(); alert('Descarga de Ensayo de Diagnóstico no disponible temporalmente.'); }}>
              [ Descargar Ensayo de Diagnóstico (PDF) ]
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ DIAGNÓSTICO ESTRUCTURAL ══════════ */}
      <section className="pp-section pp-section--dark">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "40px" }}>
            El Diagnóstico Estructural
          </h2>
          <div className="pp-profiles-grid">
            {DIAGNOSIS.map((d, i) => (
              <div
                key={i}
                className="pp-profile-card"
                style={{ borderColor: d.border }}
              >
                <div className="pp-profile-icon" style={{ background: d.dim, color: d.color }}>
                  {d.icon}
                </div>
                <h3 className="pp-profile-title" style={{ marginBottom: '12px' }}>{d.title}</h3>
                <p className="pp-profile-detail" style={{ fontSize: '14px' }}>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SOLUCIÓN OPERATIVA ══════════ */}
      <section className="pp-section">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "40px" }}>
            La Solución Operativa
          </h2>
          <div className="pp-solution-grid">
            {MODULES.map((m, i) => (
              <div key={i} className="pp-solution-item">
                <div className="pp-solution-marker"></div>
                <div>
                  <h4 className="pp-solution-role">{m.role}</h4>
                  <p className="pp-solution-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ROADMAP TÉCNICO ══════════ */}
      <section className="pp-section pp-section--dark">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "40px" }}>
            Roadmap Técnico: De Web2 a Web3
          </h2>
          <div className="pp-roadmap-container">
            {ROADMAP.map((r, i) => (
              <div key={i} className="pp-roadmap-block">
                <div className="pp-roadmap-phase">{r.phase}</div>
                <div className="pp-roadmap-detail">{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <span>TABAR Protocol v1.0 · Infraestructura Tecnológica</span>
          <span>Plataforma de uso institucional restringido</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: PP_STYLES }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Estilos — Public Presentation
═══════════════════════════════════════════════════════════════════════════ */
const PP_STYLES = \`
/* ── Root ── */
.pp-root {
  min-height: 100vh;
  background: var(--tb-bg);
  color: var(--tb-text);
  font-family: var(--tb-font);
  position: relative;
  overflow-x: hidden;
}

/* ── Backgrounds ── */
.pp-bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none; z-index: 0;
}
.pp-bg-glow {
  position: fixed; top: -300px; left: -200px;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(227,182,79,0.05) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.pp-bg-glow--right {
  left: auto; right: -300px; top: 200px;
  background: radial-gradient(circle, rgba(88,166,255,0.04) 0%, transparent 70%);
}

/* ── Nav ── */
.pp-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(8,12,16,0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--tb-border);
}
.pp-nav-inner {
  max-width: 1100px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px;
}
.pp-logo { display: flex; align-items: center; gap: 10px; }
.pp-logo-mark {
  width: 30px; height: 30px; border-radius: 6px;
  background: var(--tb-accent);
  display: flex; align-items: center; justify-content: center;
}
.pp-logo-text {
  font-weight: 600; font-size: 15px; letter-spacing: 0.5px;
  color: var(--tb-text);
}
.pp-logo-badge {
  font-size: 10px; color: var(--tb-text-3);
  border: 1px solid var(--tb-border); border-radius: 4px;
  padding: 2px 6px; display: none;
}
@media (min-width: 640px) { .pp-logo-badge { display: inline; } }
.pp-nav-login {
  font-size: 13px; font-weight: 500; color: var(--tb-bg);
  background: var(--tb-accent); border-radius: 6px;
  padding: 7px 18px; text-decoration: none;
  transition: filter 0.15s, box-shadow 0.15s;
}
.pp-nav-login:hover {
  filter: brightness(1.15); text-decoration: none;
  box-shadow: 0 0 14px rgba(227,182,79,0.25);
}

/* ── Hero ── */
.pp-hero {
  position: relative; z-index: 1;
  padding: 60px 20px 48px; text-align: center;
  border-bottom: 1px solid var(--tb-border);
}
@media (min-width: 640px) { .pp-hero { padding: 80px 24px 60px; } }
@media (min-width: 1025px) { .pp-hero { padding: 100px 40px 72px; } }
.pp-hero-inner { max-width: 780px; margin: 0 auto; }
.pp-hero-tag {
  display: inline-block; font-size: 11px; color: var(--tb-accent);
  border: 1px solid rgba(227,182,79,0.2); border-radius: 20px;
  padding: 5px 14px; margin-bottom: 24px;
  letter-spacing: 0.5px; font-weight: 500;
}
.pp-hero-title {
  margin: 0 0 20px; font-size: 28px; font-weight: 600;
  line-height: 1.15; letter-spacing: -1px; color: var(--tb-text);
}
@media (min-width: 640px) { .pp-hero-title { font-size: 38px; letter-spacing: -1.5px; } }
@media (min-width: 1025px) { .pp-hero-title { font-size: 46px; } }
.pp-hero-sub {
  margin: 0 0 32px; color: var(--tb-text-2);
  font-size: 15px; line-height: 1.65; max-width: 640px;
  margin-left: auto; margin-right: auto;
}
@media (min-width: 640px) { .pp-hero-sub { font-size: 16px; } }

/* ── Actions / CTAs ── */
.pp-hero-actions {
  display: flex; flex-direction: column; gap: 16px;
  align-items: center; justify-content: center; margin-top: 32px;
}
@media (min-width: 640px) {
  .pp-hero-actions { flex-direction: row; }
}
.pp-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--tb-accent); color: var(--tb-bg);
  font-size: 14px; font-weight: 600; font-family: var(--tb-font);
  padding: 14px 28px; border-radius: 8px;
  text-decoration: none; border: none; cursor: pointer;
  transition: filter 0.2s, box-shadow 0.2s, transform 0.2s, background 0.2s, color 0.2s;
  box-shadow: 0 0 20px rgba(227,182,79,0.15), 0 1px 3px rgba(0,0,0,0.3);
  position: relative; overflow: hidden; width: 100%; max-width: 360px;
}
.pp-cta::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}
.pp-cta:hover::before { transform: translateX(100%); }
.pp-cta:hover {
  filter: brightness(1.15); text-decoration: none;
  box-shadow: 0 0 30px rgba(227,182,79,0.3), 0 4px 12px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}
.pp-cta-secondary {
  background: transparent; color: var(--tb-text);
  border: 1px solid var(--tb-border);
  box-shadow: none;
}
.pp-cta-secondary::before { display: none; }
.pp-cta-secondary:hover {
  background: var(--tb-surface-2); color: var(--tb-text);
  filter: none; box-shadow: none;
}
.pp-cta-arrow { font-size: 16px; transition: transform 0.2s; }
.pp-cta:hover .pp-cta-arrow { transform: translateX(3px); }

/* ── Sections ── */
.pp-section {
  position: relative; z-index: 1;
  padding: 48px 20px;
  border-bottom: 1px solid var(--tb-border);
}
@media (min-width: 640px) { .pp-section { padding: 64px 24px; } }
@media (min-width: 1025px) { .pp-section { padding: 80px 40px; } }
.pp-section--dark { background: var(--tb-surface-1); }
.pp-section-inner { max-width: 1000px; margin: 0 auto; }
.pp-section-title {
  font-size: 22px; font-weight: 600; margin: 0 0 16px;
  letter-spacing: -0.5px; color: var(--tb-text);
}
@media (min-width: 640px) { .pp-section-title { font-size: 26px; } }

/* ── Profiles / Diagnosis Grid ── */
.pp-profiles-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
@media (min-width: 640px) {
  .pp-profiles-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; }
}
.pp-profile-card {
  background: var(--tb-surface-2);
  border: 1px solid var(--tb-border); border-radius: 14px;
  padding: 24px; transition: border-color 0.2s, transform 0.2s;
  display: flex; flex-direction: column;
}
.pp-profile-card:hover {
  transform: translateY(-2px);
  border-color: var(--tb-border-hover);
}
.pp-profile-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; margin-bottom: 16px;
}
.pp-profile-title {
  font-size: 16px; font-weight: 600; margin: 0 0 12px;
  color: var(--tb-text); line-height: 1.3;
}
.pp-profile-detail {
  font-size: 14px; line-height: 1.65; color: var(--tb-text-2); margin: 0;
}

/* ── Solution Grid ── */
.pp-solution-grid {
  display: flex; flex-direction: column; gap: 16px;
  max-width: 800px; margin: 0 auto;
}
.pp-solution-item {
  display: flex; gap: 16px; align-items: flex-start;
  background: var(--tb-surface-1); border: 1px solid var(--tb-border);
  border-radius: 12px; padding: 24px; transition: border-color 0.2s;
}
.pp-solution-item:hover { border-color: var(--tb-border-hover); }
.pp-solution-marker {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--tb-accent); flex-shrink: 0;
  margin-top: 5px; box-shadow: 0 0 8px rgba(227,182,79,0.4);
}
.pp-solution-role {
  font-size: 16px; font-weight: 600; color: var(--tb-text); margin: 0 0 8px;
}
.pp-solution-desc {
  font-size: 14px; line-height: 1.6; color: var(--tb-text-2); margin: 0;
}

/* ── Roadmap Container ── */
.pp-roadmap-container {
  display: flex; flex-direction: column; gap: 24px;
  max-width: 800px; margin: 0 auto;
}
.pp-roadmap-block {
  background: #0D1117; border: 1px solid #30363D;
  border-radius: 8px; padding: 20px 24px;
  font-family: var(--tb-mono), monospace;
}
.pp-roadmap-phase {
  font-size: 13px; font-weight: 600; color: var(--tb-accent);
  margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
}
.pp-roadmap-detail {
  font-size: 13px; line-height: 1.6; color: #8B949E;
}

/* ── Footer ── */
.pp-footer {
  position: relative; z-index: 1;
  background: var(--tb-surface-1);
  border-top: 1px solid var(--tb-border);
  padding: 24px 20px;
}
.pp-footer-inner {
  max-width: 1000px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; font-size: 12px; color: var(--tb-text-3); text-align: center;
}
@media (min-width: 640px) {
  .pp-footer-inner { flex-direction: row; justify-content: space-between; }
}

/* ── Spinner ── */
.pp-spinner {
  width: 28px; height: 28px; margin: 0 auto;
  border: 2px solid rgba(227,182,79,0.2);
  border-top-color: var(--tb-accent);
  border-radius: 50%;
  animation: pp-spin 0.9s linear infinite;
}
@keyframes pp-spin { to { transform: rotate(360deg); } }
\`
