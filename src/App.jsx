// src/App.jsx
import React, { useContext } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Web3Context } from './context/Web3Context';
import { FideicomisoDashboard } from './views/FideicomisoDashboard';
import { ProductorDashboard } from './views/ProductorDashboard';

function App() {
  // Traemos el estado de autenticación directamente de Privy
  const { login, logout, authenticated, user } = usePrivy();
  const { currentRole, setCurrentRole } = useContext(Web3Context);

  return (
    <div style={styles.appContainer}>
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>TABAR Tech</span>
        </div>

        <div style={styles.navActions}>
          {authenticated ? (
            <div style={styles.userMenu}>
              <div style={styles.walletBadge}>
                <span style={styles.dot}>●</span>
                {/* Mostramos el mail del usuario o su wallet embebida */}
                <code>{user?.email?.address || `${user?.wallet?.address.substring(0, 6)}...`}</code>
              </div>
              <button onClick={logout} style={styles.logoutBtn}>Cerrar Sesión</button>
            </div>
          ) : (
            <button onClick={login} style={styles.connectBtn}>
              Iniciar Sesión (Mail/Google)
            </button>
          )}
        </div>
      </nav>

      {/* CONTROLADOR DE LA DEMO (SELECTOR DE ROLES) */}
      {authenticated && (
        <div style={styles.demoController}>
          <p style={styles.controllerLabel}>🕹️ Entorno de simulación para el Cliente (Selector de Rol):</p>
          <div style={styles.btnGroup}>
            <button 
              onClick={() => setCurrentRole('fideicomiso')} 
              style={currentRole === 'fideicomiso' ? styles.roleBtnActive : styles.roleBtn}
            >
              🏢 Ver como Fideicomiso (Admin)
            </button>
            <button 
              onClick={() => setCurrentRole('productor')} 
              style={currentRole === 'productor' ? styles.roleBtnActive : styles.roleBtn}
            >
              🚜 Ver como Productor Agrícola
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO DINÁMICO */}
      <main style={styles.mainContent}>
        {!authenticated ? (
          <div style={styles.loginWall}>
            <h2>Bienvenido a la Demo de Fideicomiso TABAR</h2>
            <p>Accede de forma segura usando tu correo electrónico o cuenta de Google sin necesidad de instalar extensiones cripto.</p>
            <button onClick={login} style={styles.largeConnectBtn}>
              Ingresar a la Plataforma
            </button>
          </div>
        ) : currentRole === 'fideicomiso' ? (
          <FideicomisoDashboard />
        ) : (
          <ProductorDashboard />
        )}
      </main>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  navbar: { display: 'flex', alignItems: 'center', padding: '16px 40px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', justifyContent: 'space-between' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '24px' },
  logoText: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a' },
  navActions: { display: 'flex', alignItems: 'center' },
  connectBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  userMenu: { display: 'flex', alignItems: 'center', gap: '12px' },
  walletBadge: { padding: '8px 16px', backgroundColor: '#f1f5f9', borderRadius: '20px', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { color: '#16a34a', fontSize: '12px' },
  logoutBtn: { padding: '8px 12px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  demoController: { maxWidth: '1200px', margin: '24px auto 0 auto', padding: '16px 24px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  controllerLabel: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e40af' },
  btnGroup: { display: 'flex', gap: '12px' },
  roleBtn: { padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#64748b' },
  roleBtnActive: { padding: '10px 16px', backgroundColor: '#1e40af', border: '1px solid #1e40af', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#fff' },
  mainContent: { minHeight: '60vh' },
  loginWall: { maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  largeConnectBtn: { marginTop: '24px', width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};

export default App;