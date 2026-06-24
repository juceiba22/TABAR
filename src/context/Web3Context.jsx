// src/context/Web3Context.jsx
import React, { createContext, useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import TabarABI from '../blockchain/TabarTokenABI.json';
import { CONTRACT_ADDRESS } from '../blockchain/config';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (authenticated && wallets.length > 0) {
        try {
          const embeddedWallet = wallets[0];
          setAccount(embeddedWallet.address);

          // Ethers v6 + Privy Wallet Provider
          const privyEthersProvider = await embeddedWallet.getEthersProvider();
          const signer = await privyEthersProvider.getSigner();

          const tabarContract = new ethers.Contract(CONTRACT_ADDRESS, TabarABI, signer);
          setContract(tabarContract);
        } catch (error) {
          console.error("Error en la conexión del contrato:", error);
        }
      } else {
        setAccount(null);
        setContract(null);
      }
    };

    initWeb3();
  }, [authenticated, wallets]);

  return (
    <Web3Context.Provider value={{ account, contract }}>
      {children}
    </Web3Context.Provider>
  );
};