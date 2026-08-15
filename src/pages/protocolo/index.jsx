// src/pages/protocolo/index.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { useRole, ROLE_HOME } from "../../modules/roles/RoleContext";
import { usePublicTabarContract, TABAR_DECIMALS } from "../../hooks/usePublicTabarContract";
import { CONTRACT_FUNCTIONS } from "../../data/contractFunctions";
import VideoEmbed from "../../modules/media/VideoEmbed";
import EmissionLedger from "./EmissionLedger";
import "./protocolo.css";

const READ_COLOR = "#58A6FF";
const WRITE_COLOR = "#F0883E";

function shortAddress(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ProtocoloPage() {
  const { user, role } = useRole();
  const { getTotalSupply, getFideicomisoAdmin, getBalanceOf, isWalletAuthorized, contractAddress, blockExplorerUrl, chainId } = usePublicTabarContract();

  const [emisor, setEmisor] = useState({ totalSupply: null, admin: null, loading: true, error: null });

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
        <span className="pr-hero-tag">Portal de Transparencia · Polygon Mainnet</span>
        <h1 className="pr-hero-title">Banco Central del Protocolo TABAR</h1>
        <p className="pr-hero-sub">
          Todo TABAR en circulación está respaldado por tabaco físico certificado y emitido bajo la
          autoridad de un único Fideicomiso. Esta página expone en vivo los mismos datos que cualquier
          auditor podría consultar directamente en la blockchain.
        </p>
        <div className="pr-hero-chips">
          <a href={blockExplorerUrl} target="_blank" rel="noopener noreferrer" className="pr-chip pr-chip--link">
            Contrato: {shortAddress(contractAddress)} ↗
          </a>
          <span className="pr-chip">Red: Polygon Mainnet (chainId {parseInt(chainId, 16)})</span>
        </div>
      </header>

      {/* ── DISCLAIMER METODOLÓGICO ── */}
      <div className="pr-disclaimer">
        <strong>Nota metodológica:</strong> los balances se muestran asumiendo {TABAR_DECIMALS} decimales
        por token, valor definido por la plataforma ya que el contrato no expone <code>decimals()</code>.
        El protocolo opera hoy en <strong>Fase Web2</strong>: este panel es el registro on-chain público;
        el estado operativo completo de cada campaña vive en el sistema interno del Fideicomiso.
      </div>

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

      <footer className="pr-footer">
        <span>TABAR Protocol · Portal de Transparencia</span>
        <span>Los datos on-chain son públicos y verificables por cualquiera en Polygonscan.</span>
      </footer>
    </div>
  );
}
