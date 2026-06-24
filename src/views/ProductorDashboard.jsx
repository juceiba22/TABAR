// src/views/ProductorDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useTabarContract } from '../hooks/useTabarContract';
import { ethers } from 'ethers';

export const ProductorDashboard = () => {
  const { account, contract } = useContext(Web3Context);
  const { getBalanceOf, txLoading } = useTabarContract();

  // Estados del Productor
  const [balance, setBalance] = useState('0');
  const [isAutorizado, setIsAutorizado] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estado del formulario de transferencia
  const [transferForm, setTransferForm] = useState({ dest: '', cantidad: '' });
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Cargar datos on-chain del productor conectado
  useEffect(() => {
    const fetchProductorData = async () => {
      if (!contract || !account) return;
      try {
        setLoadingData(true);
        setError(null);
        
        // 1. Obtener balance usando el hook
        const miBalance = await getBalanceOf(account);
        setBalance(miBalance);

        // 2. Verificar si está autorizado en el mapping del contrato
        const autorizado = await contract.walletsAutorizadas(account);
        setIsAutorizado(autorizado);
      } catch (err) {
        console.error("Error al cargar datos del productor:", err);
        setError("No se pudo sincronizar con Polygon. Revisa tu conexión.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProductorData();
  }, [account, contract, txLoading]);

  // Manejar la transferencia de tokens TABAR
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);

    if (!ethers.isAddress(transferForm.dest)) {
      setError("La dirección de destino no es una wallet EVM válida.");
      return;
    }
    if (parseFloat(transferForm.cantidad) <= 0 || isNaN(transferForm.cantidad)) {
      setError("La cantidad a transferir debe ser mayor a cero.");
      return;
    }
    if (parseFloat(transferForm.cantidad) > parseFloat(balance)) {
      setError("No tienes suficientes fardos tokenizados para transferir esa cantidad.");
      return;
    }

    try {
      // Llamada directa a la función transfer del contrato pasando las unidades con 2 decimales
      const cantidadConDecimales = ethers.parseUnits(transferForm.cantidad.toString(), 2);
      
      const tx = await contract.transfer(transferForm.dest, cantidadConDecimales);
      setTxHash("Procesando transacción en el bloque...");
      
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setTransferForm({ dest: '', cantidad: '' });
    } catch (err) {
      // Capturar razones de revert como "Wallet no autorizada" del modifier
      setError(err.reason || err.message || "La transacción fue rechazada por la blockchain.");
    }
  };

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <header style={styles.header}>
        <h1 style={styles.title}>Panel del Productor — TABAR</h1>
        <p style={styles.subtitle}>Consulta tus fardos en custodia digital y gestiona tus transferencias comerciales de deuda.</p>
      </header>

      {/* Alertas */}
      {error && <div style={styles.alertError}><strong>Atención:</strong> {error}</div>}
      {txHash && (
        <div style={styles.alertSuccess}>
          <strong>Estado de transferencia:</strong> {txHash.startsWith('0x') ? (
            <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" style={styles.link}>
              Ver recibo de transferencia en PolygonScan ↗
            </a>
          ) : txHash}
        </div>
      )}

      {/* Grid Superior: Estado Actual */}
      <section style={styles.statsSection}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tus Fardos Tokenizados</h3>
          {loadingData ? <p>Consultando balance...</p> : <p style={styles.statNumber}>{balance} <span style={styles.tokenTicker}>TABAR</span></p>}
          <small style={styles.smallText}>Equivalente físico directo depositado en el fideicomiso.</small>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Estado de Cumplimiento (KYC)</h3>
          {loadingData ? (
            <p>Verificando estatus...</p>
          ) : isAutorizado ? (
            <div style={styles.badgeSuccess}>● Wallet Habilitada Comercial</div>
          ) : (
            <div style={styles.badgeDanger}>● Suspendido / No Autorizado</div>
          )}
          <p style={styles.addressText}>Tu wallet activa: <code>{account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Desconectada'}</code></p>
        </div>
      </section>

      {/* Sección Inferior: Formulario de Operación */}
      <div style={styles.mainGrid}>
        <section style={styles.formContainer}>
          <h2 style={styles.sectionTitle}>Transferir Fardos / Liquidar Posición</h2>
          <p style={styles.formDescription}>Envía fardos tokenizados a un Acopiador, Inversor o al propio Fideicomiso. Recuerda que el destinatario debe estar previamente autorizado en el sistema.</p>

          <form onSubmit={handleTransfer}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Wallet del Destinatario (EVM Address)</label>
              <input
                type="text"
                placeholder="0x..."
                value={transferForm.dest}
                onChange={(e) => setTransferForm({ ...transferForm, dest: e.target.value })}
                disabled={txLoading || !isAutorizado}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Cantidad de Fardos a Transferir</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transferForm.cantidad}
                onChange={(e) => setTransferForm({ ...transferForm, cantidad: e.target.value })}
                disabled={txLoading || !isAutorizado}
                style={styles.input}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={txLoading || !isAutorizado || balance === '0'} 
              style={isAutorizado ? styles.buttonPrimary : styles.buttonDisabled}
            >
              {txLoading ? 'Firmando transferencia...' : 'Transferir Activos'}
            </button>
          </form>
        </section>

        {/* Sección Informativa Legal */}
        <section style={styles.infoContainer}>
          <h3 style={styles.infoTitle}>Garantías On-Chain</h3>
          <p style={styles.infoText}>Cada unidad de <strong>TABAR Token</strong> representa un fardo físico custodiado bajo las normativas contractuales del Fideicomiso.</p>
          <ul style={styles.list}>
            <li>Las transferencias son inmediatas y definitivas.</li>
            <li>Si intentas enviar fondos a una entidad no autorizada, la red de Polygon rechazará automáticamente la transacción protegiendo tus activos.</li>
            <li>Para retiros físicos o quema de deuda, acércate a un acopiador central regulado para procesar la función <code>retirarDeuda</code>.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

// Estilos modulares consistentes con la estética limpia anterior
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333', backgroundColor: '#f9fbfd' },
  header: { marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
  title: { fontSize: '28px', color: '#1e293b', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' },
  card: { padding: '24px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardTitle: { fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' },
  statNumber: { fontSize: '36px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' },
  tokenTicker: { fontSize: '18px', color: '#64748b', fontWeight: 'normal' },
  smallText: { fontSize: '12px', color: '#94a3b8' },
  addressText: { fontSize: '12px', margin: '12px 0 0 0', color: '#64748b' },
  badgeSuccess: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgeDanger: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' },
  formContainer: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: '18px', color: '#0f172a', fontWeight: '600', margin: '0 0 8px 0' },
  formDescription: { fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.4' },
  formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  buttonPrimary: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  buttonDisabled: { width: '100%', padding: '12px', backgroundColor: '#cbd5e1', color: '#94a3b8', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  infoContainer: { padding: '32px', backgroundColor: '#f1f5f9', borderRadius: '16px', border: '1px solid #e2e8f0' },
  infoTitle: { fontSize: '16px', color: '#1e293b', fontWeight: '600', margin: '0 0 12px 0' },
  infoText: { fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '16px' },
  list: { fontSize: '13px', color: '#475569', paddingLeft: '20px', lineHeight: '1.6' },
  alertError: { padding: '14px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' },
  alertSuccess: { padding: '14px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' },
  link: { color: '#15803d', fontWeight: '600', textDecoration: 'underline' }
};