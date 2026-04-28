import hre from "hardhat";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  console.log("Deployando TabarToken...\n");

  // Cuentas de prueba que Hardhat genera por defecto
  const accounts = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b",
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  ].map((pk) => privateKeyToAccount(pk as `0x${string}`));

  const [admin, fideicomiso, acopiador, exportador, dealer, estadoNacional] =
    accounts;

  console.log("=== ACTORES DEL SISTEMA ===");
  console.log("Admin:          ", admin.address);
  console.log("Fideicomiso:    ", fideicomiso.address);
  console.log("Acopiador:      ", acopiador.address);
  console.log("Exportador:     ", exportador.address);
  console.log("Dealer:         ", dealer.address);
  console.log("Estado Nacional:", estadoNacional.address);

  // Clientes de viem
  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const walletAdmin = createWalletClient({
    account: admin,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const walletFideicomiso = createWalletClient({
    account: fideicomiso,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  const walletAcopiador = createWalletClient({
    account: acopiador,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  // Leemos el ABI y bytecode del artefacto compilado
  const artifact = await hre.artifacts.readArtifact("TabarToken");

  // Deploy
  const hash = await walletAdmin.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [fideicomiso.address],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress as `0x${string}`;

  console.log("\n=== CONTRATO DEPLOYADO ===");
  console.log("TabarToken address:", contractAddress);

  // Helper para escribir en el contrato
  const escribir = async (walletClient: any, functionName: string, args: any[]) => {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName,
      args,
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  };

  // Helper para leer del contrato
  const leer = async (functionName: string, args: any[] = []) => {
    return await publicClient.readContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName,
      args,
    });
  };

  // Asignamos rol ACOPIADOR
  const ACOPIADOR_ROLE = hre.ethers
    ? undefined
    : ("0x" +
      Buffer.from("ACOPIADOR_ROLE")
        .toString("hex")
        .padStart(64, "0")) as `0x${string}`;

  // Usamos keccak256 del ABI para el rol
  const { keccak256, stringToHex } = await import("viem");
  const acopiadorRole = keccak256(stringToHex("ACOPIADOR_ROLE"));

  await escribir(walletAdmin, "grantRole", [acopiadorRole, acopiador.address]);
  console.log("\n✓ Rol ACOPIADOR asignado");

  // Autorizamos wallets
  await escribir(walletFideicomiso, "autorizarWallet", [exportador.address, 1]);
  await escribir(walletFideicomiso, "autorizarWallet", [dealer.address, 3]);
  await escribir(walletFideicomiso, "autorizarWallet", [estadoNacional.address, 4]);
  console.log("✓ Wallets autorizadas");

  // Registramos lote físico
  await escribir(walletAcopiador, "registrarLote", [50n, "Deposito Jujuy - Galpon 3"]);
  console.log("✓ Lote registrado: 50 fardos en Jujuy");

  // Iniciamos campaña
  await escribir(walletFideicomiso, "iniciarCampana", [10000n, 180n]);
  console.log("✓ Campaña iniciada: 10.000 TABAR emitidos");

  // Distribuimos tokens
  await escribir(walletAcopiador, "entregarTokens", [exportador.address, 3000n]);
  await escribir(walletAcopiador, "entregarTokens", [dealer.address, 2000n]);
  await escribir(walletAcopiador, "entregarTokens", [estadoNacional.address, 1000n]);
  console.log("✓ Tokens distribuidos");

  // Estado de la campaña
  const campana = await leer("consultarCampana") as any[];
  console.log("\n=== ESTADO DE LA CAMPAÑA ===");
  console.log("Activa:         ", campana[0]);
  console.log("Total emitidos: ", campana[1].toString(), "TABAR");
  console.log("En circulación: ", campana[2].toString(), "TABAR");

  // Balances
  const balExportador = await leer("balanceOf", [exportador.address]);
  const balDealer = await leer("balanceOf", [dealer.address]);
  const balEstado = await leer("balanceOf", [estadoNacional.address]);

  console.log("\n=== BALANCES FINALES ===");
  console.log("Exportador:      ", balExportador?.toString(), "TABAR");
  console.log("Dealer:          ", balDealer?.toString(), "TABAR");
  console.log("Estado Nacional: ", balEstado?.toString(), "TABAR");
  console.log("\n✅ Deploy y simulación completados exitosamente");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});