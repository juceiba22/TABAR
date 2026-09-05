import { Link } from "react-router-dom";
import { useRole, ROLE_HOME } from "../modules/roles/RoleContext";
import "./PublicPresentation.css";

const MODULES = [
  {
    role: "Módulo Acopiador",
    icon: "warehouse",
    badge: "Acopio & Warrants",
    desc: "Los acopiadores pueden solicitar financiamiento en el mercado financiero y/o cripto (por medio de Warrants) para afrontar la campaña o conseguir adelantos para las exportaciones.",
    cta: "Explorar Acopio",
    roleId: "industry"
  },
  {
    role: "Módulo Dealers",
    icon: "candlestick_chart",
    badge: "Mesa de Operaciones",
    desc: "Los dealers operan en el mercado, proveyendo financiamiento o comprando tabaco obteniendo una rentabilidad por ello.",
    cta: "Explorar Mercado Dealer",
    roleId: "dealer"
  },
  {
    role: "Tabar tokeniza",
    icon: "token",
    badge: "RWA & Blockchain",
    desc: "Tabar presta el servicio de tokenización del tabaco, convirtiendo el tabaco físico en un valor digital comercializable.",
    cta: "Explorar Tokenización",
    roleId: "producer"
  }
];

const METRICS = [
  {
    label: "Warrants Colateralizados (Simulado)",
    val: "$4.850.000",
    unit: "USD",
    trend: "Simulado",
    note: "estimación para demo",
    icon: "account_balance"
  },
  {
    label: "Tabaco en Custodia (Simulado)",
    val: "1.280",
    unit: "Tn",
    trend: "Simulado",
    note: "volumen proyectado",
    icon: "inventory_2"
  },
  {
    label: "TNA Promedio Colateral (Simulado)",
    val: "7.2%",
    unit: "USD",
    trend: "Simulado",
    note: "tasa indicativa demo",
    icon: "trending_up"
  },
  {
    label: "Tiempo de Liquidación",
    val: "< 48",
    unit: "Horas",
    trend: "T+2 Estimado",
    note: "objetivo operativo",
    icon: "bolt"
  }
];

const ROADMAP = [
  {
    phase: "Fase 1: Gobernanza Web2 & Warrants Digitales",
    status: "Operativa",
    detail: "Validación de identidad, emisión y endoso de warrants conforme a Ley 9.643, auditoría física en silos y liquidación T+2 garantizada por Fideicomiso."
  },
  {
    phase: "Fase 2: Expansión DeFi & Tokenización RWA",
    status: "En Desarrollo",
    detail: "Representación digital de lotes de tabaco mediante tokens nativos en Polygon, contratos inteligentes automatizados y mercado secundario abierto para inversores globales."
  }
];

export default function PublicPresentation() {
  const { user, role, loading } = useRole();

  if (!loading && user && role) {
    const dest = ROLE_HOME[role] || "/login";
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--tb-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--tb-text-2)", fontSize: "14px" }}>Redirigiendo a tu panel institucional…</p>
          <meta httpEquiv="refresh" content={`0;url=${dest}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="pp-root">
      {/* ── Top Bar ── */}
      <div className="pp-telemetry-bar">
        <div className="pp-telemetry-inner">
          <div className="pp-telemetry-left">
            <span className="pp-telemetry-badge">
              <span className="pp-pulse-dot" />
              ENTORNO DEMO
            </span>
            <div className="pp-telemetry-item">
              <span className="pp-bold">TABAR Protocol · Plataforma Digital en Fase de Demostración y Evaluación</span>
            </div>
          </div>
          <div className="pp-telemetry-right">
            <span>VERSIÓN DEMO v1.2</span>
            <span className="pp-gold">PROYECTO EN EVALUACIÓN</span>
          </div>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="pp-nav">
        <div className="pp-nav-inner">
          <div className="pp-logo">
            <div className="pp-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div className="pp-logo-title">TABAR Protocol</div>
              <div className="pp-logo-sub">AgroTabaco Labs Venture</div>
            </div>
          </div>

          <div className="pp-nav-links">
            <a href="#solucion-operativa" className="pp-nav-link">Propuesta & Warrants</a>
            <a href="#metricas" className="pp-nav-link">Datos Simulados de Mercado</a>
            <a href="#roadmap" className="pp-nav-link">Roadmap Técnico</a>
          </div>

          <div className="pp-nav-actions">
            <Link to="/login" className="pp-nav-btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
              Ingresar a la Plataforma
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-grid">
            <div className="pp-hero-left">
              <div className="pp-eyebrow">
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--tb-secondary)' }}>token</span>
                <span>MERCADO DIGITAL & TOKENIZACIÓN RWA · ENTORNO DEMO</span>
              </div>
              <h1 className="pp-hero-title">
                La solución a los problemas del sector tabacalero.
              </h1>
              <p className="pp-hero-desc">
                Creamos TABAR, una plataforma para digitalizar el tabaco argentino, y abrir nuevos canales de comercialización y financiamiento.
              </p>

              <div className="pp-hero-actions">
                <Link to="/login" className="pp-cta-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span>
                  <span>Ingresar a la Plataforma</span>
                  <span className="pp-arrow">→</span>
                </Link>
                <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="pp-cta-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                  <span>Conocer más la propuesta</span>
                </a>
              </div>

              {/* Sub-notes */}
              <div className="pp-subnotes" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div className="pp-subnote">
                  <span className="pp-subnote-label">Garantía Real</span>
                  <span className="pp-subnote-val">Tabaco en Acopio</span>
                </div>
                <div className="pp-subnote">
                  <span className="pp-subnote-label">Mitigación FET</span>
                  <span className="pp-subnote-val">Anticipo Operativo</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Card */}
            <div className="pp-hero-right">
              <div className="pp-warehouse-card">
                <div className="pp-warehouse-header">
                  <span className="pp-pulse-tag">
                    <span className="pp-pulse-dot-gold" />
                    PROYECTO EN FASE DEMO
                  </span>
                </div>
                <div className="pp-warehouse-body">
                  <div className="pp-wh-badge-row">
                    <div>
                      <div className="pp-wh-subtitle">Entorno de Demostración</div>
                      <div className="pp-wh-title">Simulación de Warrants & Acopio</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="pp-wh-code">WARRANT-DEMO-2026</div>
                      <div className="pp-wh-reg">Prototipo de Evaluación</div>
                    </div>
                  </div>
                </div>
                <div className="pp-warehouse-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#132a1e', fontSize: '18px' }}>inventory_2</span>
                    <span>Lote de Prueba: Virginia L1 / L2</span>
                  </div>
                  <span className="pp-audit-chip">100% SIMULADO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ LIVE METRICS BAR ══════════ */}
      <section id="metricas" className="pp-metrics-section">
        <div className="pp-section-inner">
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--tb-text-2)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--tb-mono)" }}>
              Métricas del Protocolo (Valores Estimados de Demostración)
            </span>
            <span style={{ fontSize: "11px", background: "var(--tb-surface-2)", border: "1px solid var(--tb-border)", padding: "2px 8px", borderRadius: "4px", color: "var(--tb-secondary)", fontWeight: 600 }}>
              Datos Simulados
            </span>
          </div>
          <div className="pp-metrics-grid">
            {METRICS.map((m, i) => (
              <div key={i} className="pp-metric-card">
                <div className="pp-metric-top">
                  <span className="pp-metric-lbl">{m.label}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--tb-secondary)', fontSize: '20px' }}>{m.icon}</span>
                </div>
                <div className="pp-metric-main">
                  <div className="pp-metric-num">
                    {m.val} <span className="pp-metric-unit">{m.unit}</span>
                  </div>
                  <div className="pp-metric-sub">
                    <span className="pp-metric-trend">{m.trend}</span>
                    <span>{m.note}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CORE MODULES SECTION ══════════ */}
      <section id="solucion-operativa" className="pp-section pp-section-modules">
        <div className="pp-section-inner">
          <div className="pp-section-header">
            <div>
              <span className="pp-eyebrow-sec">Ecosistema Institucional</span>
              <h2 className="pp-section-title">Digitalizá el tabaco y obtené beneficios</h2>
              <p className="pp-section-subtitle">
                Infraestructura digital que une la producción tabacalera con el mercado de capitales argentino.
              </p>
            </div>
            <div className="pp-audit-badge">
              PROYECTO DEMO · LEY 9.643
            </div>
          </div>

          <div className="pp-modules-grid">
            {MODULES.map((m, i) => (
              <div key={i} className="pp-module-card">
                <div>
                  <div className="pp-module-icon-wrap">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#132a1e' }}>{m.icon}</span>
                  </div>
                  <span className="pp-module-tag">{m.badge}</span>
                  <h3 className="pp-module-title">{m.role}</h3>
                  <p className="pp-module-desc">{m.desc}</p>
                </div>
                <Link to="/login" className="pp-module-link">
                  <span>{m.cta}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ROADMAP TÉCNICO ══════════ */}
      <section id="roadmap" className="pp-section pp-section-roadmap">
        <div className="pp-section-inner">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="pp-eyebrow-sec">Desarrollo e Innovación</span>
            <h2 className="pp-section-title">Roadmap Técnico: De Web2 a Web3</h2>
          </div>

          <div className="pp-roadmap-grid">
            {ROADMAP.map((r, i) => (
              <div key={i} className="pp-roadmap-card">
                <div className="pp-roadmap-header">
                  <span className="pp-roadmap-phase">{r.phase}</span>
                  <span className="pp-roadmap-status">{r.status}</span>
                </div>
                <p className="pp-roadmap-detail">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <div className="pp-footer-left">
            <div className="pp-logo">
              <div className="pp-logo-mark" style={{ width: '28px', height: '28px' }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
                </svg>
              </div>
              <span style={{ fontWeight: '700', color: 'var(--tb-accent)' }}>TABAR Protocol</span>
            </div>
            <p style={{ color: 'var(--tb-text-2)', fontSize: '13px', marginTop: '6px' }}>
              Infraestructura digital para la emisión de warrants y financiamiento del sector tabacalero argentino.
            </p>
          </div>
          <div className="pp-footer-right">
            <span>Conforme a Ley Nacional 9.643 de Warrants</span>
            <span>AgroTabaco Labs © 2026 · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
