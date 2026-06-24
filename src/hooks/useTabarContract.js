// src/hooks/useTabarContract.js
import { useContext, useState } from 'react';
import { Web3Context } from '../context/Web3Context';
import { ethers } from 'ethers';

// Agregamos el export directo al inicio de la constante para solucionar el SyntaxError
export const useTabarContract = () => {
  const { contract, account } = useContext(Web3Context);
  const [txLoading, setTxLoading] = useState(false);

  // 1. Consultar balance de fardos de una dirección
  const getBalanceOf = async (address) => {
    if (!contract) return '0';
    try {
      const balance = await contract.balanceOf(address);
      return ethers.formatUnits(balance, 2);
    } catch (error) {
      console.error("Error al consultar balance:", error);
      return '0';
    }
  };

  // 2. Autorizar una billetera (Solo Admin / Fideicomiso)
  const autorizarWallet = async (walletAddress, estado) => {
    if (!contract) throw new Error("Contrato no inicializado");
    try {
      setTxLoading(true);
      const tx = await contract.autorizarWallet(walletAddress, estado);
      await tx.wait(); 
      return true;
    } catch (error) {
      console.error("Error al autorizar wallet:", error);
      throw error;
    } finally {
      setTxLoading(false);
    }
  };

  // 3. Emitir Deuda / Fardos a un Productor (Solo Admin / Fideicomiso)
  const emitirDeuda = async (productorAddress, cantidadFardos, idCertificado) => {
    if (!contract) throw new Error("Contrato no inicializado");
    try {
      setTxLoading(true);
      const cantidadConDecimales = ethers.parseUnits(cantidadFardos.toString(), 2);
      const tx = await contract.emitirDeuda(productorAddress, cantidadConDecimales, idCertificado);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error al emitir deuda:", error);
      throw error;
    } finally {
      setTxLoading(false);
    }
  };

  return {
    getBalanceOf,
    autorizarWallet,
    emitirDeuda,
    txLoading
  };
};