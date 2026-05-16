import { useState } from "react";
import { useData } from "../../modules/roles/DataContext";
import { Link } from "react-router-dom";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

export default function ProducerTokenizar() {
  const { tokenizarProducer, campana } = useData();
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const numCantidad = parseInt(cantidad) || 0;
  const kgTotal = numCantidad * 200;
  const usdTotal = numCantidad * 85;

  const handleTokenizar = async () => {
    setError("");
    setLoading(true);
    const res = await tokenizarProducer(numCantidad);
    if (res.ok) {
      setSuccess(true);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🌿</div>
        <h2 style={{ color: "#3FB950", marginBottom: "12px" }}>¡Tokenización Exitosa!</h2>
        <p style={{ color: "#8B949E", marginBottom: "30px" }}>
          Tus {numCantidad} fardos han sido certificados y tokenizados como activos TABAR. 
          El financiamiento se reflejará en tu balance en breve.
        </p>
        <Link to="/producer" className="tabar-btn tabar-btn-primary">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Certificación y Tokenización</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Transformá tu tabaco físico en activos digitales financieros</p>
      </div>

      <div className="tabar-card">
        <h3 className="tabar-card-title">Ingresar cantidad de fardos</h3>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px" }}>Fardos físicos a certificar (aprox. 50kg c/u)</label>
          <input 
            type="number" 
            className="tabar-input" 
            placeholder="Ej. 10" 
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "8px" }}>
            * Al tokenizar, certificás que el producto cumple con los estándares de calidad TABAR.
          </p>
        </div>

        {numCantidad > 0 && !showConfirm && (
          <div style={{ 
            background: "rgba(255,255,255,0.03)", 
            border: "1px solid var(--tb-border)", 
            borderRadius: "8px", 
            padding: "16px",
            marginBottom: "20px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--tb-text-2)" }}>Resumen de la operación</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Kilos equivalentes</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{kgTotal.toLocaleString("es-AR")} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Financiamiento adelantado (USD)</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>USD {usdTotal.toLocaleString("es-AR")}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: "#F85149", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px", border: "1px solid rgba(248,81,73,0.2)" }}>
            {error}
          </div>
        )}

        {!showConfirm ? (
          <button 
            className="tabar-btn tabar-btn-primary" 
            disabled={numCantidad <= 0 || loading}
            onClick={() => setShowConfirm(true)}
          >
            Tokenizar fardos
          </button>
        ) : (
          <div style={{ 
            background: "rgba(227,182,79,0.05)", 
            border: "1px solid rgba(227,182,79,0.2)", 
            borderRadius: "8px", 
            padding: "20px",
            textAlign: "center"
          }}>
            <h4 style={{ color: "#E3B64F", margin: "0 0 10px 0" }}>Confirmar Firma Digital</h4>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Estás por certificar legalmente la existencia de {numCantidad} fardos. Esta acción es irreversible en el registro fiduciario.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="tabar-btn tabar-btn-ghost" 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="tabar-btn tabar-btn-primary" 
                style={{ background: "#E3B64F", color: "#000" }}
                onClick={handleTokenizar}
                disabled={loading}
              >
                {loading ? "Firmando..." : "Confirmar Firma"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", padding: "14px", background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "#58A6FF", margin: 0 }}>
          ℹ️ Actualmente hay {campana.fardosDisponibles?.toLocaleString("es-AR")} TABAR disponibles en la campaña activa.
        </p>
      </div>
    </div>
  );
}
