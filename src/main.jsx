// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { Web3Provider } from './context/Web3Context'; 
import App from './App';
import './index.css'; // Tus estilos globales de Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmqqzase9000d0cjyq9ahukwg" // El ID real de tu dashboard de Privy
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
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