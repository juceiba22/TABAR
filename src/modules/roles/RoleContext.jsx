import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user profile to get role
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile(data);
            setRole(data.role || null);
          } else {
            console.warn("User document not found for uid:", currentUser.uid);
            setProfile(null);
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        profile,
        loading,
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
