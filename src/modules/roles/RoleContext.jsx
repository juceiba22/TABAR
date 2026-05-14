import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

  // Use a ref to track if a profile fetch is in progress to avoid overlapping
  const fetchInProgress = useRef(false);

  /**
   * FIX: retry logic with exponential backoff for Firestore
   * Latency in southamerica-east1 can be high.
   */
  const fetchProfileWithRetry = useCallback(async (uid, maxRetries = 3) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    
    setProfileLoading(true);
    setContextError(null);

    let attempt = 0;
    let lastError = null;

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    while (attempt < maxRetries) {
      try {
        console.log(`FETCH_PROFILE Attempt ${attempt + 1}/${maxRetries} for UID:`, uid);
        
        // Firestore call with a 15s internal race if needed, but Firestore SDK usually handles timeouts
        const fetchPromise = getDoc(doc(db, "users", uid));
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT_FIRESTORE")), 15000)
        );

        const userDoc = await Promise.race([fetchPromise, timeoutPromise]);

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("PROFILE_LOADED_SUCCESS:", data);
          setProfile(data);
          setRole(data.role || null);
          setProfileLoading(false);
          fetchInProgress.current = false;
          return; // Success!
        } else {
          console.warn("PROFILE_MISSING: UID", uid);
          setRole(null);
          setProfile(null);
          setProfileLoading(false);
          fetchInProgress.current = false;
          return; // No document exists yet (common during registration race)
        }
      } catch (err) {
        attempt++;
        lastError = err;
        console.error(`PROFILE_FETCH_ERROR Attempt ${attempt}:`, err.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (1s, 2s, 4s...)
          await delay(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    // If we reach here, all retries failed
    console.error("PROFILE_FETCH_FAILED_ALL_RETRIES");
    if (lastError?.message === "TIMEOUT_FIRESTORE") {
      setContextError("El servidor de datos no responde. Verificá tu conexión e intentá de nuevo.");
    } else {
      setContextError("Error al sincronizar el perfil institucional. Por favor reintentá.");
    }
    setProfile(null);
    setRole(null);
    setProfileLoading(false);
    fetchInProgress.current = false;
  }, []);

  const markEmailVerifiedInFirestore = useCallback(async (uid) => {
    try {
      // FIX: use setDoc with merge:true to ensure it works even if doc is being created
      await setDoc(doc(db, "users", uid), { emailVerified: true }, { merge: true });
      console.log("FIRESTORE_EMAIL_SYNC_COMPLETE");
    } catch (err) {
      console.warn("Could not sync emailVerified to Firestore:", err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AUTH_STATE_EVENT:", currentUser ? `Logged in (${currentUser.email})` : "Logged out");

      if (currentUser) {
        // ALWAYS reload to get fresh emailVerified status
        try {
          await currentUser.reload();
        } catch (e) {
          console.warn("Auth reload failed (possible sign out during init):", e.message);
        }
        
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);

        // FIX: setAuthInitialized immediately after knowing the Auth status.
        // The AppShell will handle the loading state via profileLoading.
        setAuthInitialized(true);

        if (refreshedUser?.emailVerified) {
          // Sync to firestore (fire and forget)
          markEmailVerifiedInFirestore(refreshedUser.uid);
          // Load profile
          await fetchProfileWithRetry(refreshedUser.uid);
        } else {
          // Reset profile/role if not verified
          setProfile(null);
          setRole(null);
          setProfileLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setProfileLoading(false);
        setContextError(null);
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [fetchProfileWithRetry, markEmailVerifiedInFirestore]);

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

  const retryProfile = useCallback(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      fetchProfileWithRetry(currentUser.uid);
    }
  }, [fetchProfileWithRetry]);

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

