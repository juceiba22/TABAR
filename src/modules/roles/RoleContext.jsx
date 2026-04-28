import { createContext, useContext, useState } from "react";

const RoleContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  INDUSTRY: "industry",
  STATE: "state",
  DEALER: "dealer",
};

export const ROLE_LABELS = {
  admin: "Fideicomiso / Admin",
  industry: "Industria / Exportador",
  state: "Estado Nacional",
  dealer: "Dealer / Revendedor",
};

export const ROLE_COLORS = {
  admin: "#ccff66",
  industry: "#44aaff",
  state: "#ff9944",
  dealer: "#cc44ff",
};

export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState("");

  const logout = () => {
    setRole(null);
    setWalletAddress(null);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        walletAddress,
        setWalletAddress,
        contractAddress,
        setContractAddress,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
