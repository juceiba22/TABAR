// src/blockchain/readOnlyContract.js
// Instancia de solo lectura del contrato TABAR, sin depender de Privy ni de
// una wallet conectada. Pensada para páginas públicas (ej. /protocolo) donde
// cualquier visitante debe poder auditar el estado del emisor.
import { ethers } from "ethers";
import TabarABI from "./TabarTokenABI.json";
import { CONTRACT_ADDRESS, PUBLIC_RPC_URL } from "./config";

let _contract = null;

export function getReadOnlyContract() {
  if (!_contract) {
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC_URL);
    _contract = new ethers.Contract(CONTRACT_ADDRESS, TabarABI, provider);
  }
  return _contract;
}
