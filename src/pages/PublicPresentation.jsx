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
    label: "Warrants Colateralizados",
    val: "$4.850.000",
    unit: "USD",
    trend: "↑ 18.4%",
    note: "vs. ciclo previo",
    icon: "account_balance"
  },
  {
    label: "Tabaco en Custodia",
    val: "1.280",
    unit: "Tn",
    trend: "Virginia Grado 1",
    note: "en silos certificados",
    icon: "inventory_2"
  },
  {
    label: "TNA Promedio Colateral",
    val: "7.2%",
    unit: "USD",
    trend: "Rendimiento fijo",
    note: "tasa institucional",
    icon: "trending_up"
  },
  {
    label: "Tiempo de Liquidación",
    val: "< 48",
    unit: "Horas",
    trend: "Desembolso T+2",
    note: "vs 90 días tradicionales",
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
      {/* ── Top Telemetry Bar ── */}
      <div className="pp-telemetry-bar">
        <div className="pp-telemetry-inner">
          <div className="pp-telemetry-left">
            <span className="pp-telemetry-badge">
              <span className="pp-pulse-dot" />
              AUDITORÍA EN VIVO
            </span>
            <div className="pp-telemetry-item">
              <span className="pp-dim">VALLE DE LERMA HUB:</span>
              <span className="pp-bold">99.4% HUMEDAD ÓPTIMA</span>
            </div>
            <span className="pp-sep">•</span>
            <div className="pp-telemetry-item">
              <span className="pp-dim">PERICO HUB:</span>
              <span className="pp-bold">CUSTODIA ACTIVA</span>
            </div>
            <span className="pp-sep">•</span>
            <div className="pp-telemetry-item">
              <span className="pp-dim">SAGyP MATRIZ:</span>
              <span className="pp-bold text-green">LEY 9.643 CONFORME</span>
            </div>
          </div>
          <div className="pp-telemetry-right">
            <span>RED TABAR v1.2</span>
            <span className="pp-gold">SALTA & JUJUY CORREDOR</span>
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
            <a href="#metricas" className="pp-nav-link">Telemetría de Mercado</a>
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
                <span>MERCADO DIGITAL & TOKENIZACIÓN RWA · AGROTABACO LABS</span>
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
                <a href="#solucion-operativa" className="pp-cta-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                  <span>Conocer más la propuesta</span>
                </a>
              </div>

              {/* Sub-notes */}
              <div className="pp-subnotes">
                <div className="pp-subnote">
                  <span className="pp-subnote-label">Garantía Real</span>
                  <span className="pp-subnote-val">Tabaco en Acopio</span>
                </div>
                <div className="pp-subnote">
                  <span className="pp-subnote-label">Mitigación FET</span>
                  <span className="pp-subnote-val">Anticipo Operativo</span>
                </div>
                <div className="pp-subnote">
                  <span className="pp-subnote-label">Trazabilidad</span>
                  <span className="pp-subnote-val">IoT & Telemetría</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Card */}
            <div className="pp-hero-right">
              <div className="pp-warehouse-card">
                <div className="pp-warehouse-header">
                  <span className="pp-pulse-tag">
                    <span className="pp-pulse-dot-gold" />
                    CUSTODIA FÍSICA HOMOLOGADA
                  </span>
                </div>
                <div className="pp-warehouse-body">
                  <div className="pp-wh-badge-row">
                    <div>
                      <div className="pp-wh-subtitle">Depósito Matriz #04</div>
                      <div className="pp-wh-title">Valle de Lerma & Perico</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="pp-wh-code">WARRANT-AR-2026</div>
                      <div className="pp-wh-reg">SAGyP Reg. 9643/24</div>
                    </div>
                  </div>
                </div>
                <div className="pp-warehouse-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#132a1e', fontSize: '18px' }}>inventory_2</span>
                    <span>Lote Balizado: Virginia L1 / L2 Standard</span>
                  </div>
                  <span className="pp-audit-chip">100% AUDITADO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ LIVE METRICS BAR ══════════ */}
      <section id="metricas" className="pp-metrics-section">
        <div className="pp-section-inner">
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
                Infraestructura técnica que unifica la fiscalización física agronómica con el mercado de capitales argentino e internacional.
              </p>
            </div>
            <div className="pp-audit-badge">
              SISTEMA AUDITADO · LEY 9.643
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
