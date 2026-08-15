// src/pages/protocolo/EmissionLedger.jsx
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { BLOCK_EXPLORER_URL } from "../../blockchain/config";

const fmtFardos = (n) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function txExplorerUrl(hash) {
  // BLOCK_EXPLORER_URL apunta a la dirección del contrato; para una tx puntual
  // se arma con el mismo dominio de Polygonscan.
  const base = new URL(BLOCK_EXPLORER_URL);
  return `${base.origin}/tx/${hash}`;
}

export default function EmissionLedger() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = query(
          collection(db, "producer_tokenizations"),
          where("estado", "==", "aprobado_fideicomiso"),
          orderBy("fechaAprobacionOnChain", "desc"),
          limit(25)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("[EmissionLedger] Error consultando emisiones:", err);
        if (!cancelled) setError("No se pudo cargar el registro de emisiones en este momento.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="pr-section-sub">Cargando registro…</p>;
  if (error) return <p className="pr-error">{error}</p>;
  if (items.length === 0) return <p className="pr-section-sub">Todavía no hay emisiones on-chain confirmadas.</p>;

  return (
    <div className="pr-ledger">
      {items.map((it) => (
        <div key={it.id} className="pr-ledger-row">
          <div className="pr-ledger-main">
            <span className="pr-ledger-cert">{it.numeroCertificado || it.id}</span>
            <span className="pr-ledger-detail">
              {fmtFardos(it.cantidadFardos)} fardos · {it.tipoTabaco}{it.calidad ? ` ${it.calidad}` : ""}
            </span>
          </div>
          {it.onChainTxHash ? (
            <a href={txExplorerUrl(it.onChainTxHash)} target="_blank" rel="noopener noreferrer" className="pr-ledger-hash">
              {it.onChainTxHash.slice(0, 10)}… ↗
            </a>
          ) : (
            <span className="pr-ledger-hash pr-ledger-hash--pending">sin hash</span>
          )}
        </div>
      ))}
    </div>
  );
}
