// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth'; // <--- CORREGIDO ACÁ
import { Web3Provider } from "./context/Web3Context";
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* El PrivyProvider es el que habilita el login con Mail y Google */}
    <PrivyProvider
      appId="cmqqzase9000d0cjyq9ahukwg" // Aquí va el ID que te da la consola de Privy (podes dejar este de prueba para maquetar)
      config={{
        loginMethods: ['email', 'google'],
        // Esto le crea la billetera automática a tu cliente cuando pone su mail
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configuramos para que por defecto opere en Polygon Mainnet
        supportedChains: [{
          id: 137,
          network: 'polygon',
          name: 'Polygon',
          nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
          rpcUrls: { default: { http: ['https://polygon-rpc.com'] } },
          blockExplorers: { default: { name: 'PolygonScan', url: 'https://polygonscan.com' } },
        }]
      }}
    >
      <Web3Provider>
        <App />
      </Web3Provider>
    </PrivyProvider>
  </React.StrictMode>
);