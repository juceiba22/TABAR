// src/views/FideicomisoDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import { useTabarContract } from '../hooks/useTabarContract';
import { ethers } from 'ethers';
import { BLOCK_EXPLORER_URL } from '../blockchain/config';

export const FideicomisoDashboard = () => {
  const { account, contract } = useContext(Web3Context);
  const { autorizarWallet, emitirDeuda, txLoading } = useTabarContract();

  // Estados de carga del Dashboard
  const [globalStats, setGlobalStats] = useState({ totalSupply: '0', adminAddress: '' });
  const [statsLoading, setStatsLoading] = useState(true);

  // Estados de los formularios
  const [authForm, setAuthForm] = useState({ address: '', estado: true });
  const [emissionForm, setEmissionForm] = useState({ productor: '', fardos: '', idCertificado: '' });
  const [txSuccessHash, setTxSuccessHash] = useState(null);
  const [formError, setFormError] = useState(null);

  // Leer estado de la red al inicializar
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (!contract) return;
      try {
        setStatsLoading(true);
        const supply = await contract.totalSupply();
        const admin = await contract.fideicomisoAdmin();
        
        setGlobalStats({
          totalSupply: ethers.formatUnits(supply, 2), // 2 decimales para los fardos TABAR
          adminAddress: admin
        });
      } catch (err) {
        console.error("Error cargando estadísticas globales:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchBlockchainData();
  }, [contract, txLoading]);

  // Manejador: Autorizar / Revocar Wallet
  const handleAuthorization = async (e) => {
    e.preventDefault();
    setFormError(null);
    setTxSuccessHash(null);

    if (!ethers.isAddress(authForm.address)) {
      setFormError("La dirección Ethereum ingresada no es válida.");
      return;
    }

    try {
      await autorizarWallet(authForm.address, authForm.estado);
      setTxSuccessHash("Wallet actualizada con éxito on-chain.");
      setAuthForm({ address: '', estado: true });
    } catch (err) {
      setFormError(err.reason || err.message || "Error al procesar la autorización.");
    }
  };

  // Manejador: Emisión de Certificado de Fardos
  const handleEmission = async (e) => {
    e.preventDefault();
    setFormError(null);
    setTxSuccessHash(null);

    if (!ethers.isAddress(emissionForm.productor)) {
      setFormError("La dirección del productor no es válida.");
      return;
    }
    if (parseFloat(emissionForm.fardos) <= 0 || isNaN(emissionForm.fardos)) {
      setFormError("La cantidad de fardos debe ser un número mayor a cero.");
      return;
    }
    if (!emissionForm.idCertificado.trim()) {
      setFormError("Debe proveer un identificador único para el certificado.");
      return;
    }

    try {
      const hash = await emitirDeuda(
        emissionForm.productor,
        emissionForm.fardos,
        emissionForm.idCertificado
      );
      setTxSuccessHash(hash);
      setEmissionForm({ productor: '', fardos: '', idCertificado: '' });
    } catch (err) {
      setFormError(err.reason || err.message || "Error al emitir deuda en la red.");
    }
  };

  return (
    <div style={styles.container}>
      {/* Encabezado Principal */}
      <header style={styles.header}>
        <h1 style={styles.title}>Módulo de Administración — Fideicomiso TABAR</h1>
        <p style={styles.subtitle}>Consola centralizada para emisión de colaterales y gestión de identidades permitidas.</p>
      </header>

      {/* Alertas de Red Globals */}
      {formError && <div style={styles.alertError}><strong>Error:</strong> {formError}</div>}
      {txSuccessHash && (
        <div style={styles.alertSuccess}>
          <strong>Transacción Completada:</strong> 
          {txSuccessHash.startsWith('0x') ? (
            <a href={`https://polygonscan.com/tx/${txSuccessHash}`} target="_blank" rel="noreferrer" style={styles.link}>
              Verificar Hash de Emisión en PolygonScan ↗
            </a>
          ) : txSuccessHash}
        </div>
      )}

      {/* Sección 1: Estadísticas y Datos del Contrato */}
      <section style={styles.statsSection}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Masa de Deuda Emitida</h3>
          {statsLoading ? <p>Consultando ledger...</p> : <p style={styles.statNumber}>{globalStats.totalSupply} TABAR</p>}
          <small style={styles.smallText}>Total de fardos tokenizados bajo custodia legal.</small>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Información de Seguridad</h3>
          <p style={styles.addressText}><strong>Contrato:</strong> <code>0x594b...CE2F0</code></p>
          <p style={styles.addressText}><strong>Admin Wallet:</strong> <code>{globalStats.adminAddress || 'Cargando...'}</code></p>
          <a href={BLOCK_EXPLORER_URL} target="_blank" rel="noreferrer" style={styles.explorerLink}>
            Ver Contrato en Explorador de Bloques ↗
          </a>
        </div>
      </section>

      <div style={styles.gridFormularios}>
        {/* Formulario A: Registro e Inclusión de Wallets */}
        <section style={styles.formContainer}>
          <h2 style={styles.sectionTitle}>1. Control de Admisión (KYC / Lista de Permisos)</h2>
          <p style={styles.formDescription}>Habilita o revoca direcciones de productores y acopiadores para interactuar con el token.</p>
          
          <form onSubmit={handleAuthorization}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Dirección Pública de la Wallet (EVM Address)</label>
              <input
                type="text"
                placeholder="0x..."
                value={authForm.address}
                onChange={(e) => setAuthForm({ ...authForm, address: e.target.value })}
                disabled={txLoading}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estado de Autorización</label>
              <select
                value={authForm.estado}
                onChange={(e) => setAuthForm({ ...authForm, estado: e.target.value === 'true' })}
                disabled={txLoading}
                style={styles.select}
              >
                <option value="true">Autorizar acceso (Permitido)</option>
                <option value="false">Revocar acceso (Bloqueado)</option>
              </select>
            </div>
            <button type="submit" disabled={txLoading} style={styles.buttonPrimary}>
              {txLoading ? 'Actualizando Ledger Real...' : 'Ejecutar Cambio de Estado'}
            </button>
          </form>
        </section>

        {/* Formulario B: Emisión Originaria de Fardos */}
        <section style={styles.formContainer}>
          <h2 style={styles.sectionTitle}>2. Tokenización de Activos (Emisión de Deuda)</h2>
          <p style={styles.formDescription}>Convierte un recibo de depósito físico validado en tokens de deuda agrícola fungibles.</p>
          
          <form onSubmit={handleEmission}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Wallet del Productor Destinatario</label>
              <input
                type="text"
                placeholder="0x..."
                value={emissionForm.productor}
                onChange={(e) => setEmissionForm({ ...emissionForm, productor: e.target.value })}
                disabled={txLoading}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroupGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cantidad de Fardos</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={emissionForm.fardos}
                  onChange={(e) => setEmissionForm({ ...emissionForm, fardos: e.target.value })}
                  disabled={txLoading}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>ID Certificado de Depósito</label>
                <input
                  type="text"
                  placeholder="CD-2026-XXXX"
                  value={emissionForm.idCertificado}
                  onChange={(e) => setEmissionForm({ ...emissionForm, idCertificado: e.target.value })}
                  disabled={txLoading}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={txLoading} style={styles.buttonSecondary}>
              {txLoading ? 'Firmando Bloque en Polygon...' : 'Emitir Activos Tokenizados'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

// Estilos modulares limpios (puedes migrarlos a CSS Modules)
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333', backgroundColor: '#f9fbfd' },
  header: { marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
  title: { fontSize: '28px', color: '#1e293b', fontWeight: '700', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' },
  card: { padding: '24px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardTitle: { fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' },
  statNumber: { fontSize: '36px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' },
  smallText: { fontSize: '12px', color: '#94a3b8' },
  addressText: { fontSize: '13px', margin: '4px 0', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  explorerLink: { display: 'inline-block', marginTop: '12px', fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
  gridFormularios: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' },
  formContainer: { padding: '32px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: '18px', color: '#0f172a', fontWeight: '600', margin: '0 0 6px 0' },
  formDescription: { fontSize: '13px', color: '#64748b', marginBottom: '24px' },
  formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
  formGroupGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', '&:focus': { borderColor: '#2563eb' } },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' },
  buttonPrimary: { width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  buttonSecondary: { width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  alertError: { padding: '14px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' },
  alertSuccess: { padding: '14px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' },
  link: { color: '#15803d', fontWeight: '600', textDecoration: 'underline' }
};