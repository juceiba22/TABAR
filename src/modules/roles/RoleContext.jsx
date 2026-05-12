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
  
  // Advanced State Management
  const [authInitialized, setAuthInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [contextError, setContextError] = useState(null);

  // Helper to fetch profile with timeout
  const fetchProfileWithTimeout = async (uid) => {
    setProfileLoading(true);
    setContextError(null);
    
    console.log("Fetching profile for UID:", uid);

    const fetchPromise = getDoc(doc(db, "users", uid));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT_FIRESTORE")), 8000)
    );

    try {
      const userDoc = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("PROFILE LOADED:", data);
        setProfile(data);
        setRole(data.role || null);
      } else {
        console.warn("PROFILE_MISSING: No document in Firestore for UID:", uid);
        setRole(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("PROFILE_FETCH_ERROR:", err);
      if (err.message === "TIMEOUT_FIRESTORE") {
        setContextError("Error de conexión: El servidor de datos no responde.");
      } else {
        setContextError("Error al cargar el perfil institucional.");
      }
      // Fail gracefully: don't hang, just leave profile null
      setProfile(null);
      setRole(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    console.log("Auth listener started...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AUTH_STATE_CHANGE:", currentUser ? `Logged in as ${currentUser.email}` : "Logged out");
      
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfileWithTimeout(currentUser.uid);
      } else {
        setProfile(null);
        setRole(null);
        setProfileLoading(false);
        setContextError(null);
      }
      
      if (!authInitialized) setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [authInitialized]);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        profile,
        authInitialized,
        profileLoading,
        contextError,
        logout,
        retryProfile: () => user && fetchProfileWithTimeout(user.uid),
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
