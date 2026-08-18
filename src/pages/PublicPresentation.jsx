import { Link } from "react-router-dom";
import { useRole, ROLE_HOME, ROLE_LABELS, ROLE_COLORS } from "../modules/roles/RoleContext";
import VideoEmbed from "../modules/media/VideoEmbed";
import { ROLE_VIDEOS } from "../data/roleVideos";
import "./PublicPresentation.css";

/* ─── Datos del Diagnóstico y Solución ────────────────────────────────────── */

const DIAGNOSIS = [
  {
    icon: "📉",
    color: "#E3B64F",
    dim: "rgba(227,182,79,0.10)",
    border: "rgba(227,182,79,0.25)",
    title: "Asimetría de Mercado",
    text: "Todos los años miles de productores venden su tabaco a un mal precio. Las grandes tabacaleras y las Cooperativas aliadas imponen  reglas de juego que perjudican al productor tabacalero.",
  },
  {
    icon: "⏳",
    color: "#F0883E",
    dim: "rgba(240,136,62,0.10)",
    border: "rgba(240,136,62,0.25)",
    title: "Retrasos y reducción sistemática del FET",
    text: "Los Planes Operativos Anuales (POA) del Fondo Especial del Tabaco sufren retrasos crónicos y barreras burocráticas que asfixian económicamente al productor, licuando su rentabilidad por inflación y devaluación.",
  },
  {
    icon: "⚖",
    color: "#BC8CFF",
    dim: "rgba(188,140,255,0.10)",
    border: "rgba(188,140,255,0.25)",
    title: "Desplazamiento del Valor",
    text: "Regulaciones complejas y un marco legal obsoleto distorsionan el mercado a una disputa política territorial, desplazando el incentivo de la producción hacia estructuras de intermediación ineficientes.",
  }
];

const MODULES = [
  {
    role: "Módulo Acopiador",
    desc: "Los acopiadores pueden solicitar financiamiento en el mercado financiero y/o cripto (por medio de Warrants) para afrontar la campaña o conseguir adelantos para las exportaciones",
  },
  {
    role: "Módulo Dealers",
    desc: "Los dealers operan en el mercado, proveyendo financiamiento o comprando tabaco obteniendo una rentabilidad por ello.",
  },
  {
    role: "Tabar tokeniza",
    desc: "Tabar presta el servicio de tokenización del tabaco, convirtiendo el tabaco físico en un valor digital comercializable.",
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
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link to="/login" className="pp-nav-login">Ingresar</Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <span className="pp-hero-tag"> MERCADO DIGITAL DE TABACO ARGENTINO  </span>
          <h1 className="pp-hero-title">
            La solución a los problemas del sector tabacalero.
          </h1>
          <p className="pp-hero-sub">
            Creamos TABAR, una plataforma para digitalizar el tabaco argentino, y abrir nuevos canales de comercialización y financiamiento.
          </p>

          <div className="pp-hero-actions">
            <Link to="/login" className="pp-cta">
              [ Ingresar a la Plataforma ]
              <span className="pp-cta-arrow">→</span>
            </Link>
            <a href="#solucion-operativa" className="pp-cta pp-cta-secondary">
              [ Conocer más la propuesta ]
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ SOLUCIÓN OPERATIVA ══════════ */}
      <section id="solucion-operativa" className="pp-section">
        <div className="pp-section-inner">
          <h2 className="pp-section-title" style={{ textAlign: "center", marginBottom: "40px" }}>
            Digitalizá el tabaco y obtené beneficios
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
          <span>TABAR · Infraestructura Tecnológica</span>
          <span>Plataforma de uso institucional restringido</span>
        </div>
      </footer>
    </div>
  );
}
