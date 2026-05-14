import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

  const [authInitialized, setAuthInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [contextError, setContextError] = useState(null);

  // FIX 1: useCallback para evitar recrear la función en cada render
  // FIX 2: Timeout aumentado a 15s para tolerar latencia de southamerica-east1
  // FIX 3: Usa auth.currentUser directamente para evitar estado stale
  const fetchProfileWithTimeout = useCallback(async (uid) => {
    setProfileLoading(true);
    setContextError(null);

    console.log("Fetching profile for UID:", uid);

    const fetchPromise = getDoc(doc(db, "users", uid));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT_FIRESTORE")), 15000)
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
        setContextError("Error de conexión: El servidor de datos no responde. Verificá tu conexión e intentá de nuevo.");
      } else {
        setContextError("Error al cargar el perfil institucional. Intentá de nuevo.");
      }
      setProfile(null);
      setRole(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // FIX 4: markEmailVerifiedInFirestore actualiza el campo en Firestore
  // cuando el usuario confirma su mail, para mantener consistencia
  const markEmailVerifiedInFirestore = useCallback(async (uid) => {
    try {
      await updateDoc(doc(db, "users", uid), { emailVerified: true });
      console.log("EMAIL_VERIFIED_UPDATED_IN_FIRESTORE");
    } catch (err) {
      // No es crítico si falla, el flujo continúa igual
      console.warn("Could not update emailVerified in Firestore:", err);
    }
  }, []);

  useEffect(() => {
    console.log("Auth listener started...");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AUTH_STATE_CHANGE:", currentUser ? `Logged in as ${currentUser.email}` : "Logged out");

      if (currentUser) {
        // FIX 5: reload() antes de cualquier chequeo para obtener el estado real de Firebase
        await currentUser.reload();
        const refreshedUser = auth.currentUser;

        // Actualizar el estado de user con el usuario refrescado
        setUser(refreshedUser);

        if (!refreshedUser?.emailVerified) {
          console.warn("EMAIL_NOT_VERIFIED");
          setProfile(null);
          setRole(null);
          setProfileLoading(false);
          setContextError(null);
          // FIX 6: setAuthInitialized SIEMPRE al final, sin importar la rama
          setAuthInitialized(true);
          return;
        }

        // FIX 7: Actualizar emailVerified en Firestore si el usuario acaba de verificar
        // (es seguro llamarlo siempre; updateDoc es idempotente en este caso)
        await markEmailVerifiedInFirestore(refreshedUser.uid);

        // Cargar perfil
        await fetchProfileWithTimeout(refreshedUser.uid);

      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setProfileLoading(false);
        setContextError(null);
      }

      // FIX 8: setAuthInitialized siempre al final del handler, en todas las ramas
      setAuthInitialized(true);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias: el listener se registra una sola vez

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setProfile(null);
      setContextError(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // FIX 9: retryProfile usa auth.currentUser (fresco) en lugar del estado user (puede ser stale)
  // y limpia el error antes de reintentar
  const retryProfile = useCallback(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setContextError(null);
      fetchProfileWithTimeout(currentUser.uid);
    } else {
      console.warn("retryProfile: no current user");
    }
  }, [fetchProfileWithTimeout]);

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
        retryProfile,
        markEmailVerifiedInFirestore,
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
