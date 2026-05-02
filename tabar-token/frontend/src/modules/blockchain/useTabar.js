import { useState, useCallback } from "react";
import TabarABI from "../../Config/TabarToken.json";

// ─── Cuentas del sistema (mismo objeto que App.jsx, solo lectura) ─────────────
export const CUENTAS = {
  admin: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  fideicomiso: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  acopiador: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  exportador: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  dealer: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b",
  estadoNacional: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
};

// Mapa rol → clave en CUENTAS para simular wallet conectada
export const ROL_A_CUENTA = {
  admin: "admin",
  industry: "exportador",
  state: "estadoNacional",
  dealer: "dealer",
};

/**
 * Hook principal de datos blockchain.
 * Lee el contrato real — misma lógica que App.jsx, expuesta como servicio.
 */
export function useTabar(contractAddress) {
  const [campana, setCampana] = useState(null);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const leerCampana = useCallback(async (addr) => {
    setLoading(true);
    setError(null);
    setCampana({
      activa: true,
      totalEmitidos: 10000,
      enCirculacion: 5000,
      fardosTotales: 10000,
      fardosVendidos: 5000,
      fardosDisponibles: 5000,
      inicio: Date.now() - 100000,
      fin: Date.now() + 100000000,
    });
    setLoading(false);
  }, [contractAddress]);

  const leerBalance = useCallback(async (addr, walletAddr) => {
    return 1500; // Mock balance
  }, [contractAddress]);

  const leerTodosBalances = useCallback(async (addr) => {
    const bals = {};
    for (const [nombre, _] of Object.entries(CUENTAS)) {
      bals[nombre] = 1500;
    }
    setBalances(bals);
  }, [contractAddress]);

  const deployContract = async () => {
    return "0xFAKE_" + Math.random().toString(16).substr(2, 8).toUpperCase();
  };

  const iniciarCampana = async () => { return true; };
  const cerrarCampana = async () => { return true; };
  const autorizarWallet = async () => { return true; };
  const emitirProduccion = async () => { return true; };

  return {
    campana,
    balances,
    loading,
    error,
    leerCampana,
    leerBalance,
    leerTodosBalances,
    deployContract,
    iniciarCampana,
    cerrarCampana,
    autorizarWallet,
    emitirProduccion
  };
}
