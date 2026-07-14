// src/App.jsx
import React, { useState, useContext } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Web3Context } from './context/Web3Context';

// Importación de tus componentes de vista originales
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import Certificaciones from './components/Certificaciones';
import Fideicomiso from './components/Fideicomiso';
import Configuracion from './components/Configuracion';

function App() {
  // 1. Lógica de Autenticación con Privy
  const { login, logout, authenticated, user } = usePrivy();
  const { account } = useContext(Web3Context);

  // 2. Tus estados originales de navegación y roles
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('fideicomiso'); // 'fideicomiso', 'productor', 'acopiador'

  // Renderizado dinámico de tus vistas originales
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview userRole={userRole} />;
      case 'certificaciones':
        return <Certificaciones userRole={userRole} />;
      case 'fideicomiso':
        return <Fideicomiso userRole={userRole} />;
      case 'configuracion':
        return <Configuracion userRole={userRole} />;
      default:
        return <DashboardOverview userRole={userRole} />;
    }
  };

  // PASO A: Si el usuario NO está autenticado, mostramos la pantalla de entrada con tu estética
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <span className="text-4xl">🌾</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">TABAR Tech</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Plataforma de Tokenización Agrícola. Accedé de forma segura para certificar, auditar o gestionar contratos de fideicomiso de tabaco on-chain.
          </p>
          <button
            onClick={login}
            className="mt-8 w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-950 hover:bg-slate-900 transition-colors shadow-sm"
          >
            Ingresar con Mail o Google
          </button>
        </div>
      </div>
    );
  }

  // PASO B: Si está autenticado, se despliega tu Dashboard Real con Tailwind
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      
      {/* SIDEBAR ORIGINAL (Le pasamos los datos dinámicos de Privy) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
        userEmail={user?.email?.address || "Usuario Web3"}
        walletAddress={account}
        onLogout={logout}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* BANNER DE SIMULACIÓN (Herramienta para tu Demo con el Cliente) */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">🕹️</span>
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Entorno de Simulación:</span>
            <p className="text-xs text-blue-600 hidden sm:inline">Cambiá el rol para mostrarle el flujo completo a tu cliente.</p>
          </div>
          <div className="flex gap-1.5 bg-blue-100/60 p-1 rounded-lg border border-blue-200/40">
            {['fideicomiso', 'productor', 'acopiador'].map((role) => (
              <button
                key={role}
                onClick={() => setUserRole(role)}
                className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition-all ${
                  userRole === role 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO DE LA VISTA ACTIVA */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;