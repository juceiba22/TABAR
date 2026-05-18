/**
 * PublicPresentation.jsx — TABAR Public Landing Page
 *
 * Página pública informativa institucional. No requiere autenticación.
 * Redirige usuarios autenticados con rol a su dashboard correspondiente.
 */

import { Link } from "react-router-dom";
import { useRole, ROLE_HOME } from "../modules/roles/RoleContext";

/* ─── Datos de perfiles ───────────────────────────────────────────────────── */
const PROFILES = [
  {
    icon: "🌿",
    color: "#3FB950",
    dim: "rgba(63,185,80,0.10)",
    border: "rgba(63,185,80,0.25)",
    title: "Productores Tabacaleros",
    subtitle: "Unión, Escala y Precio Justo para la Finca.",
    detail:
      "Históricamente, los productores sufren una fuerte asimetría de mercado al negociar de forma individual frente a los acopiadores. TABAR brinda la infraestructura tecnológica para asociarse digitalmente, consolidar la oferta en conjunto para acceder a verdaderos precios de mercado y certificar su tabaco físico en activos digitales para recibir financiamientos adelantados.",
  },
  {
    icon: "◈",
    color: "#E3B64F",
    dim: "rgba(227,182,79,0.10)",
    border: "rgba(227,182,79,0.25)",
    title: "Acopiadores / Exportadores",
    subtitle: "Centralización y Eficiencia Operativa Absoluta.",
    detail:
      "Digitalización de extremo a extremo para el negocio fiduciario en tiempo real. Permite registrar campañas, administrar solicitudes de acceso, supervisar balances globales de distribución y automatizar el flujo de compraventa bajo un registro de auditoría inalterable.",
  },
  {
    icon: "◉",
    color: "#F0883E",
    dim: "rgba(240,136,62,0.10)",
    border: "rgba(240,136,62,0.25)",
    title: "Estado Nacional / FET",
    subtitle: "Transparencia y Agilidad en la Distribución de Recursos.",
    detail:
      "Optimización en la gestión y el pago de los POAS (Planes Operativos Anuales) directamente a través de la plataforma, garantizando trazabilidad absoluta sobre el destino final de los recursos del Fondo Especial del Tabaco (FET).",
  },
  {
    icon: "◇",
    color: "#BC8CFF",
    dim: "rgba(188,140,255,0.10)",
    border: "rgba(188,140,255,0.25)",
    title: "Dealers y Vendedores",
    subtitle: "Liquidez, Arbitraje y Nuevos Mercados Globales.",
    detail:
      "Apertura de nuevos canales de exportación para colocar excedentes de tabaco en el exterior. Su intervención clave permite conseguir financiamiento privado externo, logrando adelantar los flujos de los POAS del Estado y proveyendo liquidez inmediata cuando los pagos estatales offline se encuentran demorados.",
  },
];

const CYCLE_STEPS = [
  {
    n: "01",
    title: "Certificación y Emisión",
    text: "El productor registra stock físico; el administrador inicia campaña y emite fardos digitales (TABAR).",
  },
  {
    n: "02",
    title: "Despliegue Contractual",
    text: "Se generan contratos en PDF y se firma digitalmente entre las partes vinculadas.",
  },
  {
    n: "03",
    title: "Financiamiento e Inversión",
    text: "La industria adquiere producción anticipada con descuento, el Estado adjudica recursos FET y los Dealers inyectan liquidez.",
  },
  {
    n: "04",
    title: "Liquidación y Canje",
    text: "Al cierre de campaña, los activos se canjean por tabaco físico consolidado para exportación o por los rendimientos acordados.",
  },
];

const TRUST_METRICS = [
  { label: "Tasa anual FET", value: "8.5%" },
  { label: "Respaldo", value: "Activos Reales Certificados" },
  { label: "Trazabilidad", value: "Auditoría e integridad On-chain" },
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
          <span className="pp-hero-tag">TABAR Protocol v1.0 · Acceso institucional restringido</span>
          <h1 className="pp-hero-title">
            Tokenización agroindustrial y financiamiento tabacalero en las mejores condiciones globales.
          </h1>
          <p className="pp-hero-sub">
            La plataforma multiusuario que conecta a productores, acopiadores, el Estado y mercados internacionales bajo un protocolo seguro y digital.
          </p>
          <Link to="/login" className="pp-cta">
            Ingresar al Sistema Institucional
            <span className="pp-cta-arrow">→</span>
          </Link>
          <div className="pp-trust-row">
            {TRUST_METRICS.map((m) => (
              <div key={m.label} className="pp-trust-item">
                <span className="pp-trust-value">{m.value}</span>
                <span className="pp-trust-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ INFRAESTRUCTURA LEGAL ══════════ */}
      <section className="pp-section">
        <div className="pp-section-inner">
          <div className="pp-infra-card">
            <div className="pp-infra-icon">⚖</div>
            <h2 className="pp-section-title">Infraestructura contractual automatizada sin fricciones.</h2>
            <p className="pp-section-desc">
              Cada operación de compraventa dentro de TABAR despliega de forma automática un Contrato Digital Inteligente. El sistema genera un documento PDF vinculante que las partes firman digitalmente, conectando de manera transparente a los actores del ecosistema. Esto asegura el cumplimiento estricto de los precios pactados, los plazos de entrega y las condiciones de calidad, eliminando la necesidad de intermediarios opacos o procesos burocráticos offline.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ BENEFICIOS POR PERFIL ══════════ */}
      <section className="pp-section">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "32px" }}>
            Beneficios por perfil de usuario
          </h2>
          <div className="pp-profiles-grid">
            {PROFILES.map((p) => (
              <div
                key={p.title}
                className="pp-profile-card"
                style={{ borderColor: p.border }}
              >
                <div className="pp-profile-icon" style={{ background: p.dim, color: p.color }}>
                  {p.icon}
                </div>
                <h3 className="pp-profile-title">{p.title}</h3>
                <h4 className="pp-profile-subtitle" style={{ color: p.color }}>{p.subtitle}</h4>
                <p className="pp-profile-detail">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CICLO TABAR ══════════ */}
      <section className="pp-section pp-section--dark">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "36px" }}>
            Cómo funciona el ciclo TABAR
          </h2>
          <div className="pp-cycle-grid">
            {CYCLE_STEPS.map((s) => (
              <div key={s.n} className="pp-cycle-step">
                <div className="pp-cycle-n">{s.n}</div>
                <h4 className="pp-cycle-title">{s.title}</h4>
                <p className="pp-cycle-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="pp-section" style={{ textAlign: "center", paddingBottom: "80px" }}>
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ marginBottom: "12px" }}>
            ¿Listo para operar?
          </h2>
          <p className="pp-section-desc" style={{ marginBottom: "28px", maxWidth: "500px", margin: "0 auto 28px" }}>
            Accedé a la plataforma institucional con tus credenciales autorizadas o registrá tu entidad para solicitar acceso.
          </p>
          <Link to="/login" className="pp-cta">
            Ingresar al Sistema Institucional
            <span className="pp-cta-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <span>TABAR Protocol v1.0 · AgroTabaco Labs</span>
          <span>Plataforma de uso institucional restringido</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: PP_STYLES }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Estilos — Public Presentation
   Prefijo pp- para evitar colisiones con el sistema existente
═══════════════════════════════════════════════════════════════════════════ */
const PP_STYLES = `
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
  margin: 0 0 20px; font-size: 30px; font-weight: 600;
  line-height: 1.15; letter-spacing: -1px; color: var(--tb-text);
}
@media (min-width: 640px) { .pp-hero-title { font-size: 40px; letter-spacing: -1.5px; } }
@media (min-width: 1025px) { .pp-hero-title { font-size: 48px; } }
.pp-hero-sub {
  margin: 0 0 32px; color: var(--tb-text-2);
  font-size: 15px; line-height: 1.65; max-width: 600px;
  margin-left: auto; margin-right: auto;
}
@media (min-width: 640px) { .pp-hero-sub { font-size: 16px; } }

/* ── CTA Button (Botón Brillante) ── */
.pp-cta {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--tb-accent); color: var(--tb-bg);
  font-size: 14px; font-weight: 600; font-family: var(--tb-font);
  padding: 14px 32px; border-radius: 8px;
  text-decoration: none; border: none; cursor: pointer;
  transition: filter 0.2s, box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 0 20px rgba(227,182,79,0.15), 0 1px 3px rgba(0,0,0,0.3);
  position: relative; overflow: hidden;
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
.pp-cta-arrow {
  font-size: 16px; transition: transform 0.2s;
}
.pp-cta:hover .pp-cta-arrow { transform: translateX(3px); }

/* ── Trust metrics ── */
.pp-trust-row {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 12px; margin-top: 40px;
}
@media (min-width: 640px) { .pp-trust-row { gap: 20px; margin-top: 48px; } }
.pp-trust-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: var(--tb-surface-1); border: 1px solid var(--tb-border);
  border-radius: 10px; padding: 14px 20px; min-width: 140px;
}
.pp-trust-value {
  font-size: 14px; font-weight: 600; color: var(--tb-accent);
  font-family: var(--tb-mono);
}
.pp-trust-label {
  font-size: 10px; color: var(--tb-text-3);
  text-transform: uppercase; letter-spacing: 0.6px;
}

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
.pp-section-desc {
  font-size: 14px; line-height: 1.7; color: var(--tb-text-2); margin: 0;
}
@media (min-width: 640px) { .pp-section-desc { font-size: 15px; } }

/* ── Infra card ── */
.pp-infra-card {
  background: var(--tb-surface-1); border: 1px solid var(--tb-border);
  border-radius: 16px; padding: 32px 24px; text-align: center;
  max-width: 720px; margin: 0 auto;
}
@media (min-width: 640px) { .pp-infra-card { padding: 48px 40px; } }
.pp-infra-icon {
  font-size: 32px; margin-bottom: 20px;
  width: 56px; height: 56px; border-radius: 12px;
  background: var(--tb-accent-dim);
  display: inline-flex; align-items: center; justify-content: center;
}

/* ── Profiles grid ── */
.pp-profiles-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
@media (min-width: 640px) {
  .pp-profiles-grid { grid-template-columns: 1fr 1fr; gap: 18px; }
}
.pp-profile-card {
  background: var(--tb-surface-1);
  border: 1px solid var(--tb-border); border-radius: 14px;
  padding: 24px; transition: border-color 0.2s, transform 0.2s;
}
.pp-profile-card:hover {
  transform: translateY(-2px);
  border-color: var(--tb-border-hover);
}
.pp-profile-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; margin-bottom: 14px;
}
.pp-profile-title {
  font-size: 15px; font-weight: 600; margin: 0 0 4px;
  color: var(--tb-text);
}
.pp-profile-subtitle {
  font-size: 13px; font-weight: 500; margin: 0 0 12px;
}
.pp-profile-detail {
  font-size: 13px; line-height: 1.65; color: var(--tb-text-2); margin: 0;
}

/* ── Cycle grid ── */
.pp-cycle-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px;
}
@media (min-width: 640px) {
  .pp-cycle-grid { grid-template-columns: 1fr 1fr; gap: 18px; }
}
@media (min-width: 1025px) {
  .pp-cycle-grid { grid-template-columns: repeat(4, 1fr); }
}
.pp-cycle-step {
  background: var(--tb-surface-2); border: 1px solid var(--tb-border);
  border-radius: 12px; padding: 24px;
  transition: border-color 0.2s;
}
.pp-cycle-step:hover { border-color: var(--tb-border-hover); }
.pp-cycle-n {
  font-family: var(--tb-mono); font-size: 24px; font-weight: 600;
  color: var(--tb-accent); margin-bottom: 12px; letter-spacing: -1px;
}
.pp-cycle-title {
  font-size: 14px; font-weight: 600; margin: 0 0 8px;
  color: var(--tb-text);
}
.pp-cycle-text {
  font-size: 13px; line-height: 1.6; color: var(--tb-text-2); margin: 0;
}

/* ── Footer ── */
.pp-footer {
  position: relative; z-index: 1;
  background: var(--tb-surface-1);
  border-top: 1px solid var(--tb-border);
  padding: 20px;
}
.pp-footer-inner {
  max-width: 1000px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; font-size: 11px; color: var(--tb-text-3);
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
`;
