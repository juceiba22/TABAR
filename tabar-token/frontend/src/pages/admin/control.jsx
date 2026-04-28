import { useState } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useTabar } from "../../modules/blockchain/useTabar";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function AdminControl() {
  const { contractAddress, setContractAddress } = useRole();
  const { deployContract, leerCampana, iniciarCampana, cerrarCampana, autorizarWallet, emitirProduccion, leerBalance, campana } = useTabar(contractAddress);

  const [tab, setTab] = useState("deploy");
  const [deployStatus, setDeployStatus] = useState("");
  const [fardosTotales, setFardosTotales] = useState("10000");
  const [duracionDias, setDuracionDias] = useState("180");
  const [walletToAuth, setWalletToAuth] = useState("");
  const [walletType, setWalletType] = useState("1");
  const [emitirAmount, setEmitirAmount] = useState("");
  const [campanaStatus, setCampanaStatus] = useState("");
  const [balances, setBalances] = useState(null);

  const handleDeploy = async () => {
    try {
      setDeployStatus("Deployando...");
      const addr = await deployContract();
      if (addr) { setContractAddress(addr); setDeployStatus(`Deployado: ${addr}`); }
      else setDeployStatus("Error en deploy");
    } catch { setDeployStatus("Error en deploy"); }
  };

  const handleIniciarCampana = async () => {
    try { await iniciarCampana(contractAddress, parseInt(fardosTotales), parseInt(duracionDias)); setCampanaStatus("Campaña iniciada"); } catch { setCampanaStatus("Error al iniciar"); }
  };

  const handleCerrarCampana = async () => {
    try { await cerrarCampana(contractAddress); setCampanaStatus("Campaña cerrada"); } catch { setCampanaStatus("Error al cerrar"); }
  };

  const handleAutorizar = async () => {
    try { await autorizarWallet(contractAddress, walletToAuth, parseInt(walletType)); setWalletToAuth(""); } catch (e) { console.error(e); }
  };

  const handleEmitir = async () => {
    try { await emitirProduccion(contractAddress, parseInt(emitirAmount)); setEmitirAmount(""); } catch (e) { console.error(e); }
  };

  const handleRefreshCampana = async () => {
    try { await leerCampana(contractAddress); } catch (e) { console.error(e); }
  };

  const handleRefreshBalances = async () => {
    try {
      const cuentas = await import("../../modules/blockchain/useTabar.js").then(m => m.CUENTAS);
      const pvka = (await import("viem")).privateKeyToAccount;
      const keys = Object.values(cuentas);
      const results = {};
      for (const k of keys) {
        const acc = pvka(k);
        const b = await leerBalance(contractAddress, acc.address);
        results[acc.address.slice(0, 10)] = b ?? 0;
      }
      setBalances(results);
    } catch (e) { console.error(e); }
  };

  const TABS = [
    { id: "deploy", label: "Deploy" },
    { id: "campana", label: "Campaña" },
    { id: "wallets", label: "Wallets" },
    { id: "emision", label: "Emisión" },
    { id: "estado", label: "Estado" },
  ];

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Control del Sistema</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Gestión directa del contrato TABAR</p>
      </div>

      <div className="tabar-tabs">
        {TABS.map((t) => (
          <button key={t.id} className="tabar-tab" style={tab === t.id ? { borderColor: C.accent, color: C.accent } : {}} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "deploy" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Contrato TABAR</h3>
          {contractAddress ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ color: "#3FB950", fontSize: "10px" }}>●</span>
                <span style={{ color: "#3FB950", fontSize: "13px" }}>Contrato activo</span>
              </div>
              <div className="tabar-wallet-box">
                <span style={{ color: "#484F58", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Dirección</span>
                <span>{contractAddress}</span>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: "#8B949E", fontSize: "13px", marginBottom: "16px" }}>No hay contrato deployado. Deployá uno nuevo en la red local Hardhat.</p>
              <button onClick={handleDeploy} className="tabar-btn tabar-btn-primary">Deploy contrato</button>
              {deployStatus && <p style={{ color: "#8B949E", fontSize: "12px", marginTop: "10px" }}>{deployStatus}</p>}
            </div>
          )}
        </div>
      )}

      {tab === "campana" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Gestión de campaña</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Fardos totales</label>
              <input type="number" value={fardosTotales} onChange={(e) => setFardosTotales(e.target.value)} className="tabar-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Duración (días)</label>
              <input type="number" value={duracionDias} onChange={(e) => setDuracionDias(e.target.value)} className="tabar-input" />
            </div>
            <div className="tabar-btn-row">
              <button onClick={handleIniciarCampana} disabled={!contractAddress} className="tabar-btn tabar-btn-primary">Iniciar</button>
              <button onClick={handleCerrarCampana} disabled={!contractAddress} className="tabar-btn tabar-btn-ghost" style={{ borderColor: "rgba(248,81,73,0.3)", color: "#F85149" }}>Cerrar</button>
            </div>
            {campanaStatus && <p style={{ fontSize: "12px", color: "#8B949E" }}>{campanaStatus}</p>}
          </div>
        </div>
      )}

      {tab === "wallets" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Autorizar wallet</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Dirección (0x...)</label>
              <input type="text" value={walletToAuth} onChange={(e) => setWalletToAuth(e.target.value)} placeholder="0x..." className="tabar-input tabar-input-mono" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Tipo de inversor</label>
              <select value={walletType} onChange={(e) => setWalletType(e.target.value)} className="tabar-select">
                <option value="1">Exportador</option>
                <option value="2">FET</option>
                <option value="3">Dealer</option>
              </select>
            </div>
            <button onClick={handleAutorizar} disabled={!contractAddress || !walletToAuth} className="tabar-btn tabar-btn-primary">Autorizar</button>
          </div>
        </div>
      )}

      {tab === "emision" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Emitir producción</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Cantidad de TABAR a emitir</label>
              <input type="number" value={emitirAmount} onChange={(e) => setEmitirAmount(e.target.value)} placeholder="Ej: 5000" className="tabar-input" />
            </div>
            <button onClick={handleEmitir} disabled={!contractAddress || !emitirAmount} className="tabar-btn tabar-btn-primary">Emitir producción</button>
          </div>
        </div>
      )}

      {tab === "estado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="tabar-card">
            <h3 className="tabar-card-title">Estado de campaña</h3>
            <button onClick={handleRefreshCampana} disabled={!contractAddress} className="tabar-btn tabar-btn-secondary" style={{ marginBottom: "12px" }}>Actualizar</button>
            {campana ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <InfoRow label="Activa" value={campana.activa ? "Sí" : "No"} valueColor={campana.activa ? "#3FB950" : "#F85149"} />
                <InfoRow label="Fardos totales" value={campana.fardosTotales?.toString() || "—"} />
                <InfoRow label="Fardos vendidos" value={campana.fardosVendidos?.toString() || "—"} />
                <InfoRow label="Fardos disponibles" value={campana.fardosDisponibles?.toString() || "—"} />
              </div>
            ) : <p style={{ color: "#484F58", fontSize: "13px" }}>Deployá el contrato primero</p>}
          </div>
          <div className="tabar-card">
            <h3 className="tabar-card-title">Balances TABAR</h3>
            <button onClick={handleRefreshBalances} disabled={!contractAddress} className="tabar-btn tabar-btn-secondary" style={{ marginBottom: "12px" }}>Consultar balances</button>
            {balances ? (
              <div className="tabar-table-wrap">
                <table className="tabar-table">
                  <thead><tr><th>Wallet</th><th>Balance</th></tr></thead>
                  <tbody>
                    {Object.entries(balances).map(([addr, bal]) => (
                      <tr key={addr}>
                        <td className="mono">{addr}...</td>
                        <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: bal > 0 ? "#E3B64F" : "#484F58" }}>{bal.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p style={{ color: "#484F58", fontSize: "13px" }}>Sin datos</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: "4px" }}>
      <span style={{ fontSize: "12px", color: "#484F58" }}>{label}</span>
      <span style={{ fontSize: "12px", color: valueColor || "#8B949E", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
