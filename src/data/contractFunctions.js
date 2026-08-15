// src/data/contractFunctions.js
// Catálogo de las funciones del contrato TABAR (ver src/blockchain/TabarTokenABI.json),
// traducidas a la lógica de un banco central para la página institucional /protocolo.

export const CONTRACT_FUNCTIONS = [
  {
    key: "totalSupply",
    type: "read",
    signature: "totalSupply()",
    bankTitle: "Base Monetaria en Circulación",
    description:
      "Cuántos TABAR existen hoy en todo el sistema — 1 TABAR equivale a 1 fardo de tabaco certificado. Sube con cada emisión y baja cuando el Fideicomiso retira tokens al cerrar una campaña.",
  },
  {
    key: "fideicomisoAdmin",
    type: "read",
    signature: "fideicomisoAdmin()",
    bankTitle: "Autoridad Emisora",
    description:
      "La dirección que actúa como banco central del protocolo: la única wallet habilitada para emitir deuda y autorizar nuevas cuentas dentro del sistema.",
  },
  {
    key: "balanceOf",
    type: "read",
    signature: "balanceOf(address)",
    bankTitle: "Consulta de Cuenta",
    description:
      "Cuánto TABAR tiene una wallet puntual. Es de lectura pública: cualquiera puede auditar el saldo de cualquier dirección, igual que en un extracto público de blockchain.",
  },
  {
    key: "walletsAutorizadas",
    type: "read",
    signature: "walletsAutorizadas(address)",
    bankTitle: "Verificación de Cuenta Habilitada",
    description:
      "Indica si una wallet fue autorizada por el Fideicomiso para operar. Es el equivalente a confirmar que una cuenta pasó el proceso de apertura institucional (KYC).",
  },
  {
    key: "transfer",
    type: "write",
    signature: "transfer(to, amount)",
    bankTitle: "Transferencia entre Cuentas",
    description:
      "Mueve TABAR de una wallet a otra. Requiere sesión institucional activa y wallet autorizada — no es una operación pública, se ejecuta desde dentro de la plataforma.",
  },
  {
    key: "autorizarWallet",
    type: "write",
    signature: "autorizarWallet(wallet, estado)",
    bankTitle: "Apertura / Cierre de Cuenta",
    description:
      "Habilita o revoca a una wallet para operar en el sistema. Solo la Autoridad Emisora (fideicomisoAdmin) puede ejecutarla — es el KYC institucional del protocolo.",
  },
  {
    key: "emitirDeuda",
    type: "write",
    signature: "emitirDeuda(productor, cantidadFardos, idCertificado)",
    bankTitle: "Emisión Primaria",
    description:
      "El Fideicomiso emite nuevos TABAR a favor de un productor, respaldados por un certificado de tabaco físico ya validado. Es el único mecanismo de creación de tokens nuevos.",
  },
];
