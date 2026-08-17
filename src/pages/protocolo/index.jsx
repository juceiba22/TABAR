// src/pages/protocolo/index.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole, ROLE_HOME } from "../../modules/roles/RoleContext";
import { usePublicTabarContract, TABAR_DECIMALS } from "../../hooks/usePublicTabarContract";
import { CONTRACT_FUNCTIONS } from "../../data/contractFunctions";
import CampaignStats from "../../modules/dashboard/CampaignStats";
import VideoEmbed from "../../modules/media/VideoEmbed";
import EmissionLedger from "./EmissionLedger";
import "./protocolo.css";

const READ_COLOR = "#58A6FF";
const WRITE_COLOR = "#F0883E";

// Diagnóstico estructural del sector — ver whitepaper "Problema estructural
// a resolver". No depende del modelo de roles, se mantiene estable.
const DIAGNOSIS = [
  {
    icon: "📉", color: "#E3B64F", dim: "rgba(227,182,79,0.10)", border: "rgba(227,182,79,0.3)",
    title: "Asimetría de Mercado",
    text: "Todos los años miles de acopiadores venden su tabaco a un mal precio. La estructura oligopólica de la industria y del mercado externo impone reglas de juego desfavorables.",
  },
  {
    icon: "⏳", color: "#F0883E", dim: "rgba(240,136,62,0.10)", border: "rgba(240,136,62,0.3)",
    title: "Retrasos y reducción sistemática del FET",
    text: "Los Planes Operativos Anuales (POA) del Fondo Especial del Tabaco sufren retrasos crónicos y discrecionalidad institucional que asfixian la liquidez en momentos clave de la campaña.",
  },
  {
    icon: "⚖", color: "#BC8CFF", dim: "rgba(188,140,255,0.10)", border: "rgba(188,140,255,0.3)",
    title: "Endeudamiento bancario",
    text: "El desfase entre gastos productivos e ingresos por exportación empuja al endeudamiento tradicional, limitando la expansión de capital de trabajo.",
  },
];

const ROADMAP = [
  {
    phase: "Fase Actual (Gobernanza Web2)",
    detail: "Validación de identidad, consistencia transaccional centralizada mediante Firebase y emisión de comprobantes contractuales en PDF (warrants) para interactuar con la matriz regulatoria vigente.",
  },
  {
    phase: "Próxima Fase (Migración DeFi)",
    detail: "Evolución nativa hacia un protocolo con mayor automatización on-chain: vínculo directo entre cada warrant y su token, y retiro/quema automático de tokens al cierre de campaña.",
  },
];

function shortAddress(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtFetDate(d) {
  if (d.fecha) return new Date(d.fecha);
  if (d.creadoEn?.toDate) return d.creadoEn.toDate();
  return new Date(0);
}

export default function ProtocoloPage() {
  const { user, role } = useRole();
  const { getTotalSupply, getFideicomisoAdmin, getBalanceOf, isWalletAuthorized, contractAddress, blockExplorerUrl, chainId } = usePublicTabarContract();

  const [emisor, setEmisor] = useState({ totalSupply: null, admin: null, loading: true, error: null });
  const [novedades, setNovedades] = useState({ items: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "novedades_fet"));
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => fmtFetDate(b) - fmtFetDate(a))
          .slice(0, 5);
        if (!cancelled) setNovedades({ items, loading: false });
      } catch (err) {
        console.error("[Protocolo] Error consultando novedades FET:", err);
        if (!cancelled) setNovedades({ items: [], loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [lookupInput, setLookupInput] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [totalSupply, admin] = await Promise.all([getTotalSupply(), getFideicomisoAdmin()]);
        if (!cancelled) setEmisor({ totalSupply, admin, loading: false, error: null });
      } catch (err) {
        console.error("[Protocolo] Error consultando el emisor:", err);
        if (!cancelled) setEmisor({ totalSupply: null, admin: null, loading: false, error: "No se pudo conectar con Polygon Mainnet en este momento." });
      }
    })();
    return () => { cancelled = true; };
  }, [getTotalSupply, getFideicomisoAdmin]);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError("");
    setLookupResult(null);

    if (!ethers.isAddress(lookupInput.trim())) {
      setLookupError("Esa no es una dirección de wallet válida en Polygon.");
      return;
    }

    setLookupLoading(true);
    try {
      const [balance, autorizada] = await Promise.all([
        getBalanceOf(lookupInput.trim()),
        isWalletAuthorized(lookupInput.trim()),
      ]);
      setLookupResult({ balance, autorizada });
    } catch (err) {
      console.error("[Protocolo] Error consultando la wallet:", err);
      setLookupError("No se pudo consultar esa wallet en este momento.");
    }
    setLookupLoading(false);
  };

  return (
    <div className="pr-root">
      <div className="pr-bg-grid" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className="pr-nav">
        <div className="pr-nav-inner">
          <Link to="/" className="pr-logo">
            <div className="pr-logo-mark">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
              </svg>
            </div>
            <span>TABAR</span>
          </Link>
          {user && role ? (
            <Link to={ROLE_HOME[role] ?? "/"} className="pr-nav-link">← Volver a mi panel</Link>
          ) : (
            <Link to="/login" className="pr-nav-link">Ingresar</Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="pr-hero">
        <span className="pr-hero-tag">Financiamiento agroindustrial tokenizado · Polygon Mainnet</span>
        <h1 className="pr-hero-title">1 Tabar = 1 fardo de tabaco argentino</h1>
        <p className="pr-hero-sub">
          Tokenización de producción tabacalera certificada para financiar la campaña y adelantar
          exportaciones — sin pasar por el banco. Todo TABAR en circulación está respaldado por tabaco
          físico certificado y emitido bajo la autoridad de un único Fideicomiso.
        </p>
        <div className="pr-hero-chips">
          <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer" className="pr-chip pr-chip--link">
            Contrato: {shortAddress(contractAddress)} ↗
          </a>
          <span className="pr-chip">Red: Polygon Mainnet (chainId {parseInt(chainId, 16)})</span>
        </div>
        {!(user && role) && (
          <div className="pr-hero-actions">
            <Link to="/login" className="pr-cta">Ingresar a la plataforma →</Link>
            <a href="#campana" className="pr-cta pr-cta-secondary">Ver campaña activa</a>
          </div>
        )}
      </header>

      {/* ── DISCLAIMER METODOLÓGICO ── */}
      <div className="pr-disclaimer">
        <strong>Nota metodológica:</strong> los balances se muestran asumiendo {TABAR_DECIMALS} decimales
        por token, valor definido por la plataforma ya que el contrato no expone <code>decimals()</code>.
        El protocolo opera hoy en <strong>Fase Web2</strong>: este panel es el registro on-chain público;
        el estado operativo completo de cada campaña vive en el sistema interno del Fideicomiso.
      </div>

      {/* ══════════ CAMPAÑA ACTIVA (público) ══════════ */}
      <section className="pr-section pr-section--dark" id="campana">
        <h2 className="pr-section-title">Campaña Activa</h2>
        <p className="pr-section-sub">
          Stock de tokens de la campaña en curso — navegable sin cuenta. La adquisición es de emisión
          primaria y cerrada (sin mercado secundario): se confirma recién al iniciar sesión.
        </p>
        <div className="pr-campaign-wrap">
          <CampaignStats />
          {!(user && role) && (
            <div className="pr-campaign-cta">
              <Link to="/login" className="pr-cta">Adquirir tokens TABAR →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ DIAGNÓSTICO ESTRUCTURAL ══════════ */}
      <section className="pr-section">
        <h2 className="pr-section-title">El Diagnóstico Estructural</h2>
        <p className="pr-section-sub">El problema del sector tabacalero que TABAR busca resolver.</p>
        <div className="pr-diagnosis-grid">
          {DIAGNOSIS.map((d) => (
            <div key={d.title} className="pr-diagnosis-card" style={{ borderColor: d.border }}>
              <div className="pr-diagnosis-icon" style={{ background: d.dim, color: d.color }}>{d.icon}</div>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ ESTADO DEL EMISOR ══════════ */}
      <section className="pr-section">
        <h2 className="pr-section-title">Estado del Emisor</h2>
        <div className="pr-emisor-grid">
          <div className="pr-stat-card">
            <span className="pr-stat-label">Base monetaria en circulación</span>
            <span className="pr-stat-value">
              {emisor.loading ? "Consultando…" : emisor.error ? "—" : `${Number(emisor.totalSupply).toLocaleString("es-AR")} TABAR`}
            </span>
          </div>
          <div className="pr-stat-card">
            <span className="pr-stat-label">Autoridad emisora (fideicomisoAdmin)</span>
            <span className="pr-stat-value pr-stat-value--mono">
              {emisor.loading ? "Consultando…" : emisor.error ? "—" : shortAddress(emisor.admin)}
            </span>
          </div>
        </div>
        {emisor.error && <p className="pr-error">{emisor.error}</p>}
      </section>

      {/* ══════════ CONSULTAR UNA CUENTA ══════════ */}
      <section className="pr-section pr-section--dark">
        <h2 className="pr-section-title">Consultá una cuenta</h2>
        <p className="pr-section-sub">Ingresá cualquier dirección de wallet en Polygon para ver su saldo TABAR y si está autorizada a operar.</p>
        <form className="pr-lookup-form" onSubmit={handleLookup}>
          <input
            type="text"
            className="pr-lookup-input"
            placeholder="0x…"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
          />
          <button type="submit" className="pr-lookup-btn" disabled={lookupLoading}>
            {lookupLoading ? "Consultando…" : "Consultar"}
          </button>
        </form>
        {lookupError && <p className="pr-error">{lookupError}</p>}
        {lookupResult && (
          <div className="pr-lookup-result">
            <div>
              <span className="pr-stat-label">Balance</span>
              <span className="pr-stat-value">{Number(lookupResult.balance).toLocaleString("es-AR")} TABAR</span>
            </div>
            <div>
              <span className="pr-stat-label">Cuenta habilitada</span>
              <span className={`pr-badge ${lookupResult.autorizada ? "pr-badge--ok" : "pr-badge--off"}`}>
                {lookupResult.autorizada ? "Autorizada" : "No autorizada"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ══════════ CÓMO FUNCIONA (2 roles) ══════════ */}
      <section className="pr-section pr-section--dark">
        <h2 className="pr-section-title">Cómo funciona para vos</h2>
        <p className="pr-section-sub">Solo hay dos formas de participar en el sistema.</p>
        <div className="pr-roles-grid">
          <div className="pr-role-card" style={{ borderColor: "rgba(88,166,255,0.3)" }}>
            <span className="pr-role-icon">🌿</span>
            <h3>Acopiador</h3>
            <p>Certificá tu producción, tokenizá tabaco respaldado por un warrant y solicitá financiamiento para la campaña o el adelanto de exportación.</p>
            <Link to="/login" className="pr-role-cta" style={{ color: "#58A6FF" }}>Registrarme como Acopiador →</Link>
          </div>
          <div className="pr-role-card" style={{ borderColor: "rgba(188,140,255,0.3)" }}>
            <span className="pr-role-icon">◇</span>
            <h3>Dealer</h3>
            <p>Adquirí tokens TABAR con descuento sobre compra de tabaco, o financiá por rendimiento vía FET. Vos elegís la intención al operar.</p>
            <Link to="/login" className="pr-role-cta" style={{ color: "#BC8CFF" }}>Registrarme como Dealer →</Link>
          </div>
        </div>
      </section>

      {/* ══════════ CATÁLOGO DE FUNCIONES ══════════ */}
      <section className="pr-section">
        <h2 className="pr-section-title">Catálogo de funciones del contrato</h2>
        <p className="pr-section-sub">Cada función traducida a su equivalente en la operatoria de un banco tradicional.</p>
        <div className="pr-functions-grid">
          {CONTRACT_FUNCTIONS.map((fn) => {
            const color = fn.type === "read" ? READ_COLOR : WRITE_COLOR;
            return (
              <div key={fn.key} className="pr-function-card" style={{ borderColor: `${color}40` }}>
                <div className="pr-function-head">
                  <span className={`pr-badge ${fn.type === "read" ? "pr-badge--ok" : "pr-badge--warn"}`}>
                    {fn.type === "read" ? "Lectura pública" : "Operación restringida"}
                  </span>
                </div>
                <h3 className="pr-function-title" style={{ color }}>{fn.bankTitle}</h3>
                <code className="pr-function-signature">{fn.signature}</code>
                <p className="pr-function-desc">{fn.description}</p>
                <VideoEmbed videoUrl={null} title={fn.bankTitle} icon="🎬" accentColor={color} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ NOVEDADES FET (público) ══════════ */}
      <section className="pr-section pr-section--dark">
        <h2 className="pr-section-title">Novedades del FET</h2>
        <p className="pr-section-sub">Precio de referencia, avisos de campaña y transferencias a provincias.</p>
        <div className="pr-novedades-list">
          {novedades.loading ? (
            <p className="pr-novedad-empty">Cargando novedades…</p>
          ) : novedades.items.length === 0 ? (
            <p className="pr-novedad-empty">Todavía no hay novedades publicadas.</p>
          ) : (
            novedades.items.map((n) => {
              const tipo = n.tipo ?? n.tipoA;
              const titulo = tipo === "A" ? "Precio FET actualizado" : tipo === "C" ? "Transferencia a provincia" : "Novedad de campaña";
              const detalle = tipo === "A"
                ? (n.comentarios ?? n.comentariosA ?? `Precio FET: ${n.precioFet ?? "—"}`)
                : tipo === "C"
                  ? `${n.provincia ?? "—"} · $${Number(n.monto ?? n.montoC ?? 0).toLocaleString("es-AR")}`
                  : (n.informacion ?? n.comentariosB ?? "Sin detalle");
              return (
                <div key={n.id} className="pr-ledger-row">
                  <div className="pr-ledger-main">
                    <span className="pr-ledger-cert">{titulo}</span>
                    <span className="pr-ledger-detail">{detalle}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ══════════ REGISTRO INSTITUCIONAL ══════════ */}
      <section className="pr-section pr-section--dark">
        <h2 className="pr-section-title">Registro institucional de emisiones</h2>
        {user ? (
          <EmissionLedger />
        ) : (
          <div className="pr-gate">
            <p>El registro detallado de emisiones (con hash de cada transacción on-chain) es visible para usuarios con sesión institucional activa.</p>
            <Link to="/login" className="pr-gate-cta">Iniciar sesión →</Link>
          </div>
        )}
      </section>

      {/* ══════════ ROADMAP TÉCNICO ══════════ */}
      <section className="pr-section">
        <h2 className="pr-section-title">Roadmap Técnico: De Web2 a Web3</h2>
        <div className="pr-roadmap-container">
          {ROADMAP.map((r) => (
            <div key={r.phase} className="pr-roadmap-block">
              <div className="pr-roadmap-phase">{r.phase}</div>
              <div className="pr-roadmap-detail">{r.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pr-footer">
        <span>TABAR Protocol · Portal de Transparencia</span>
        <span>Los datos on-chain son públicos y verificables por cualquiera en Polygonscan.</span>
      </footer>
    </div>
  );
}
