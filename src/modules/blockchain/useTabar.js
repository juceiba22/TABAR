import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { useState, useCallback } from "react";
import TabarABI from "/Config/TabarToken.json";

// ─── Cliente blockchain compartido (mismo que App.jsx) ───────────────────────
export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
});

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
    const address = addr || contractAddress;
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await publicClient.readContract({
        address,
        abi: TabarABI.abi,
        functionName: "consultarCampana",
      });
      // res = [activa, totalEmitidos, enCirculacion, inicio, fin]
      setCampana({
        activa: res[0],
        totalEmitidos: Number(res[1]),
        enCirculacion: Number(res[2]),
        inicio: Number(res[3]),
        fin: Number(res[4]),
      });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [contractAddress]);

  const leerBalance = useCallback(async (addr, walletAddr) => {
    const address = addr || contractAddress;
    if (!address || !walletAddr) return null;
    try {
      const bal = await publicClient.readContract({
        address,
        abi: TabarABI.abi,
        functionName: "balanceOf",
        args: [walletAddr],
      });
      return Number(bal);
    } catch {
      return null;
    }
  }, [contractAddress]);

  const leerTodosBalances = useCallback(async (addr) => {
    const address = addr || contractAddress;
    if (!address) return;
    const bals = {};
    for (const [nombre, pk] of Object.entries(CUENTAS)) {
      const account = privateKeyToAccount(pk);
      try {
        const bal = await publicClient.readContract({
          address,
          abi: TabarABI.abi,
          functionName: "balanceOf",
          args: [account.address],
        });
        bals[nombre] = Number(bal);
      } catch {
        bals[nombre] = 0;
      }
    }
    setBalances(bals);
  }, [contractAddress]);

  return {
    campana,
    balances,
    loading,
    error,
    leerCampana,
    leerBalance,
    leerTodosBalances,
  };
}
