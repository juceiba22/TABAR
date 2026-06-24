// src/context/Web3Context.jsx
import React, { createContext, useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import TabarABI from '../blockchain/TabarTokenABI.json';
import { CONTRACT_ADDRESS } from '../blockchain/config';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets(); // Trae las wallets conectadas por Privy
  
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentRole, setCurrentRole] = useState('fideicomiso'); // Rol por defecto

  useEffect(() => {
    const initWeb3 = async () => {
      // Si el usuario está autenticado y Privy ya creó su billetera integrada
      if (authenticated && wallets.length > 0) {
        try {
          const embeddedWallet = wallets[0]; // Tomamos la billetera activa de Privy
          setAccount(embeddedWallet.address);

          // Obtenemos un proveedor de ethers usando la wallet de Privy
          const privyEthersProvider = await embeddedWallet.getEthersProvider();
          const signer = await privyEthersProvider.getSigner();

          // Inicializamos el contrato real apuntando a Polygon
          const tabarContract = new ethers.Contract(CONTRACT_ADDRESS, TabarABI, signer);
          setContract(tabarContract);
        } catch (error) {
          console.error("Error inicializando contrato con Privy:", error);
        }
      } else {
        setAccount(null);
        setContract(null);
      }
    };

    initWeb3();
  }, [authenticated, wallets]);

  return (
    <Web3Context.Provider value={{ account, contract, currentRole, setCurrentRole }}>
      {children}
    </Web3Context.Provider>
  );
};