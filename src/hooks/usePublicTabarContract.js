// src/hooks/usePublicTabarContract.js
import { useCallback } from "react";
import { ethers } from "ethers";
import { getReadOnlyContract } from "../blockchain/readOnlyContract";
import { CONTRACT_ADDRESS, BLOCK_EXPLORER_URL, NETWORK_CHAIN_ID } from "../blockchain/config";

// El ABI del contrato no expone decimals(): este valor es un supuesto de la
// plataforma (usado en todo el resto de la app, ver useTabarContract.js),
// no un dato verificado on-chain.
export const TABAR_DECIMALS = 2;

/**
 * Lecturas públicas del contrato TABAR, sin wallet conectada.
 * No maneja loading/error interno: cada llamado es un async plano para que
 * el componente que las usa pueda coordinar múltiples lecturas en paralelo
 * sin pisarse los estados entre sí.
 */
export function usePublicTabarContract() {
  const getTotalSupply = useCallback(async () => {
    const contract = getReadOnlyContract();
    const supply = await contract.totalSupply();
    return ethers.formatUnits(supply, TABAR_DECIMALS);
  }, []);

  const getFideicomisoAdmin = useCallback(async () => {
    const contract = getReadOnlyContract();
    return await contract.fideicomisoAdmin();
  }, []);

  const getBalanceOf = useCallback(async (address) => {
    const contract = getReadOnlyContract();
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, TABAR_DECIMALS);
  }, []);

  const isWalletAuthorized = useCallback(async (address) => {
    const contract = getReadOnlyContract();
    return await contract.walletsAutorizadas(address);
  }, []);

  return {
    getTotalSupply,
    getFideicomisoAdmin,
    getBalanceOf,
    isWalletAuthorized,
    contractAddress: CONTRACT_ADDRESS,
    blockExplorerUrl: BLOCK_EXPLORER_URL,
    chainId: NETWORK_CHAIN_ID,
  };
}
