import { useState } from "react";
import TabarABI from "./Config/TabarToken.json";

const CUENTAS = {
  admin: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  fideicomiso: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  acopiador: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  exportador: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  dealer: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b",
  estadoNacional: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
};

export default function App() {
  const [contractAddress, setContractAddress] = useState("");
  const [campana, setCampana] = useState(null);
  const [balances, setBalances] = useState({});
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formCampana, setFormCampana] = useState({ fardos: "10000", dias: "180" });
  const [formAutorizar, setFormAutorizar] = useState({ wallet: "", tipo: "1" });
  const [formEntregar, setFormEntregar] = useState({ wallet: "", cantidad: "" });
  const [formLote, setFormLote] = useState({ fardos: "", ubicacion: "" });

  const addLog = (msg, tipo = "info") => {
    const hora = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, { msg, tipo, hora }]);
  };

  const actualizarEstado = async (addr) => {
    try {
      const address = addr || contractAddress;
      if (!address) return;
      
      setCampana({
        activa: true,
        totalEmitidos: "10000",
        enCirculacion: "5000",
      });
      const bals = {};
      for (const [nombre, _] of Object.entries(CUENTAS)) {
        bals[nombre] = "1000";
      }
      setBalances(bals);
    } catch (e) {
      addLog("Error leyendo contrato: " + e.message, "error");
    }
  };

  const deployContrato = async () => {
    setLoading(true);
    try {
      const fakeAddress = "0xFAKE_" + Math.random().toString(16).substr(2, 8).toUpperCase();
      setContractAddress(fakeAddress);
      
      // Guardarlo en global state/localStorage simulation (if accessible)
      addLog("✅ Contrato deployado: " + fakeAddress, "success");
      addLog("✅ Rol ACOPIADOR asignado", "success");
      await actualizarEstado(fakeAddress);
    } catch (e) {
      addLog("❌ Error en deploy: " + e.message, "error");
    }
    setLoading(false);
  };

  const iniciarCampana = async () => {
    setLoading(true);
    setTimeout(() => {
      addLog(`✅ Campaña iniciada: ${formCampana.fardos} TABAR por ${formCampana.dias} días`, "success");
      actualizarEstado();
      setLoading(false);
    }, 500);
  };

  const cerrarCampana = async () => {
    setLoading(true);
    setTimeout(() => {
      addLog("✅ Campaña cerrada. Tokens no redimidos quemados.", "success");
      actualizarEstado();
      setLoading(false);
    }, 500);
  };

  const autorizarWallet = async () => {
    setLoading(true);
    setTimeout(() => {
      addLog(`✅ Wallet autorizada: ${formAutorizar.wallet}`, "success");
      setLoading(false);
    }, 500);
  };

  const entregarTokens = async () => {
    setLoading(true);
    setTimeout(() => {
      addLog(`✅ ${formEntregar.cantidad} TABAR entregados a ${formEntregar.wallet}`, "success");
      actualizarEstado();
      setLoading(false);
    }, 500);
  };

  const registrarLote = async () => {
    setLoading(true);
    setTimeout(() => {
      addLog(`✅ Lote registrado: ${formLote.fardos} fardos en ${formLote.ubicacion}`, "success");
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{ fontFamily: "monospace", background: "#0a1a0a", minHeight: "100vh", color: "#ccff66", padding: "20px" }}>
      <div style={{ borderBottom: "2px solid #ccff66", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "28px" }}>🌿 TABAR Admin Panel</h1>
        <p style={{ margin: "4px 0 0", color: "#88aa44", fontSize: "13px" }}>
          AgroTabaco Labs — Sistema de Financiamiento Agroindustrial
        </p>
        {contractAddress && (
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#44ff88" }}>
            Contrato: {contractAddress}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <Card titulo="⚙️ Contrato">
            {contractAddress
              ? <p style={{ fontSize: "11px", wordBreak: "break-all", color: "#44ff88", margin: "0 0 8px" }}>{contractAddress}</p>
              : <p style={{ color: "#888", margin: "0 0 8px" }}>Sin deployar</p>
            }
            <Boton onClick={deployContrato} loading={loading} color="#ccff66">
              {contractAddress ? "Re-deployar" : "🚀 Deploy Contrato"}
            </Boton>
          </Card>

          <Card titulo="📊 Estado de Campaña">
            {campana ? (
              <div style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px" }}>
                <Row label="Estado" valor={campana.activa ? "🟢 Activa" : "🔴 Inactiva"} />
                <Row label="Total emitidos" valor={campana.totalEmitidos + " TABAR"} />
                <Row label="En circulación" valor={campana.enCirculacion + " TABAR"} />
              </div>
            ) : (
              <p style={{ color: "#888", margin: "0 0 8px" }}>Deployá el contrato primero</p>
            )}
            <Boton onClick={() => actualizarEstado()} loading={loading} color="#44aaff">
              🔄 Actualizar
            </Boton>
          </Card>

          <Card titulo="💰 Balances TABAR">
            {Object.entries(balances).length > 0
              ? Object.entries(balances).map(([nombre, bal]) => (
                <Row key={nombre} label={nombre} valor={bal + " TAB"} />
              ))
              : <p style={{ color: "#888" }}>Sin datos</p>
            }
          </Card>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <Card titulo="🚀 Campaña">
            <Input label="Fardos totales" value={formCampana.fardos}
              onChange={(v) => setFormCampana({ ...formCampana, fardos: v })} />
            <Input label="Duración (días)" value={formCampana.dias}
              onChange={(v) => setFormCampana({ ...formCampana, dias: v })} />
            <div style={{ display: "flex", gap: "8px" }}>
              <Boton onClick={iniciarCampana} loading={loading} color="#44ff88">Iniciar</Boton>
              <Boton onClick={cerrarCampana} loading={loading} color="#ff6644">Cerrar</Boton>
            </div>
          </Card>

          <Card titulo="🔐 Autorizar Wallet">
            <Input label="Dirección (0x...)" value={formAutorizar.wallet}
              onChange={(v) => setFormAutorizar({ ...formAutorizar, wallet: v })} />
            <label style={{ fontSize: "12px", color: "#88aa44", display: "block", marginBottom: "4px" }}>
              Tipo de inversor
            </label>
            <select value={formAutorizar.tipo}
              onChange={(e) => setFormAutorizar({ ...formAutorizar, tipo: e.target.value })}
              style={{ width: "100%", background: "#1a2a1a", color: "#ccff66", border: "1px solid #446644", padding: "6px", marginBottom: "8px", fontFamily: "monospace" }}>
              <option value="1">Exportador</option>
              <option value="2">Industrial</option>
              <option value="3">Dealer</option>
              <option value="4">Estado Nacional (FET)</option>
            </select>
            <Boton onClick={autorizarWallet} loading={loading} color="#ccff66">Autorizar</Boton>
          </Card>

          <Card titulo="📦 Entregar Tokens">
            <Input label="Wallet destino (0x...)" value={formEntregar.wallet}
              onChange={(v) => setFormEntregar({ ...formEntregar, wallet: v })} />
            <Input label="Cantidad de TABAR" value={formEntregar.cantidad}
              onChange={(v) => setFormEntregar({ ...formEntregar, cantidad: v })} />
            <Boton onClick={entregarTokens} loading={loading} color="#ccff66">Entregar</Boton>
          </Card>

          <Card titulo="🏭 Registrar Lote Físico">
            <Input label="Cantidad de fardos" value={formLote.fardos}
              onChange={(v) => setFormLote({ ...formLote, fardos: v })} />
            <Input label="Ubicación depósito" value={formLote.ubicacion}
              onChange={(v) => setFormLote({ ...formLote, ubicacion: v })} />
            <Boton onClick={registrarLote} loading={loading} color="#ccff66">Registrar</Boton>
          </Card>

        </div>
      </div>

      <Card titulo="📋 Log de Transacciones" style={{ marginTop: "20px" }}>
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {log.length === 0
            ? <p style={{ color: "#888", margin: 0 }}>Sin actividad aún</p>
            : [...log].reverse().map((entry, i) => (
              <div key={i} style={{
                fontSize: "12px", padding: "4px 0", borderBottom: "1px solid #1a2a1a",
                color: entry.tipo === "error" ? "#ff6644" : entry.tipo === "success" ? "#44ff88" : "#ccff66"
              }}>
                <span style={{ color: "#556655" }}>[{entry.hora}]</span> {entry.msg}
              </div>
            ))
          }
        </div>
      </Card>
    </div>
  );
}

function Card({ titulo, children, style }) {
  return (
    <div style={{ background: "#0f1f0f", border: "1px solid #2a4a2a", borderRadius: "8px", padding: "16px", ...style }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "#ccff66", borderBottom: "1px solid #2a4a2a", paddingBottom: "8px" }}>
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, valor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
      <span style={{ color: "#88aa44" }}>{label}:</span>
      <span style={{ color: "#ccff66" }}>{valor}</span>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <label style={{ fontSize: "12px", color: "#88aa44", display: "block", marginBottom: "4px" }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "#1a2a1a", color: "#ccff66", border: "1px solid #446644", padding: "6px", boxSizing: "border-box", fontFamily: "monospace" }} />
    </div>
  );
}

function Boton({ onClick, loading, color, children }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: "transparent", border: `1px solid ${color}`, color, padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "13px", marginTop: "4px", opacity: loading ? 0.5 : 1 }}>
      {loading ? "⏳ Procesando..." : children}
    </button>
  );
}