/**
 * RoleContext.jsx — AgroTabaco Demo & Auth Engine v3
 * 
 * Permite acceso demo inmediato sin restricciones para explorar la plataforma,
 * manteniendo compatibilidad transparente con Firebase Auth.
 */

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

const RoleContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  INDUSTRY: "industry",
  STATE: "state",
  DEALER: "dealer",
  PRODUCER: "producer",
};

export const ROLE_LABELS = {
  admin: "Fideicomiso / Admin",
  industry: "Acopiador",
  state: "Estado Nacional",
  dealer: "Dealer / Revendedor",
  producer: "Productor Tabacalero",
};

export const ROLE_COLORS = {
  admin: "#1a4329",
  industry: "#2f6844",
  state: "#6b7a3a",
  dealer: "#8a5a2e",
  producer: "#3fb950",
};

export const ROLE_HOME = {
  admin: "/admin",
  industry: "/industry",
  state: "/state",
  dealer: "/dealer",
  producer: "/producer",
};

export const DEMO_PROFILES = {
  producer: {
    uid: "demo-producer-tabar",
    firstName: "Carlos",
    lastName: "Mendoza",
    displayName: "Carlos Mendoza (Productor)",
    email: "productor@tabar.agro",
    role: "producer",
    status: "approved",
    emailVerified: true,
    documentType: "dni",
    documentNumber: "28491023",
    cuit: "20-28491023-4",
    finca: "Finca El Tabacal - Misiones",
    hasRole: true
  },
  industry: {
    uid: "demo-industry-tabar",
    firstName: "Acopiadora",
    lastName: "Nordeste",
    displayName: "Acopiadora Nordeste S.A.",
    email: "acopio@tabar.agro",
    role: "industry",
    status: "approved",
    emailVerified: true,
    documentType: "cuit",
    documentNumber: "30-71829304-8",
    cuit: "30-71829304-8",
    razonSocial: "Acopiadora Nordeste S.A.",
    hasRole: true
  },
  state: {
    uid: "demo-state-tabar",
    firstName: "Delegación",
    lastName: "Nacional FET",
    displayName: "Fondo Especial del Tabaco (FET)",
    email: "estado@tabar.agro",
    role: "state",
    status: "approved",
    emailVerified: true,
    documentType: "cuit",
    documentNumber: "30-99999999-1",
    cuit: "30-99999999-1",
    entidad: "Secretaría de Agricultura - FET",
    hasRole: true
  },
  dealer: {
    uid: "demo-dealer-tabar",
    firstName: "Martín",
    lastName: "Villarreal",
    displayName: "Martín Villarreal (Dealer)",
    email: "dealer@tabar.agro",
    role: "dealer",
    status: "approved",
    emailVerified: true,
    documentType: "dni",
    documentNumber: "33102948",
    cuit: "20-33102948-2",
    mesa: "Mesa de Operaciones Dealer",
    hasRole: true
  },
  admin: {
    uid: "demo-admin-tabar",
    firstName: "Admin",
    lastName: "Fideicomiso",
    displayName: "Fideicomiso Central TABAR",
    email: "admin@tabar.agro",
    role: "admin",
    status: "approved",
    emailVerified: true,
    documentType: "cuit",
    documentNumber: "30-55443322-9",
    cuit: "30-55443322-9",
    fideicomiso: "Fideicomiso TABAR Protocol",
    hasRole: true
  }
};

export function RoleProvider({ children }) {
  // Inicialización rápida desde demo session si existe
  const savedDemoRole = typeof window !== "undefined" ? localStorage.getItem("tabar_demo_role") : null;
  const initialDemoProfile = savedDemoRole && DEMO_PROFILES[savedDemoRole] ? DEMO_PROFILES[savedDemoRole] : null;

  const [user, setUser] = useState(
    initialDemoProfile
      ? { uid: initialDemoProfile.uid, email: initialDemoProfile.email, emailVerified: true, isDemo: true }
      : null
  );
  const [role, setRole] = useState(savedDemoRole || null);
  const [profile, setProfile] = useState(initialDemoProfile);

  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const fetchAbort = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      fetchAbort.current = true;
      const thisGen = {};
      fetchAbort.current = thisGen;

      setLoading(true);

      if (currentUser && currentUser.emailVerified) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (fetchAbort.current !== thisGen) return;

          if (userSnap.exists()) {
            const data = userSnap.data();

            if (data.status === "pending_verification") {
              try {
                await updateDoc(userRef, {
                  emailVerified: true,
                  status: "approved",
                });
              } catch {
                // No crítico
              }
            }

            setUser(currentUser);
            setProfile(data);
            setRole(data.role || null);
            localStorage.removeItem("tabar_demo_role");
          } else {
            setUser(currentUser);
            setProfile(null);
            setRole(null);
          }
        } catch (error) {
          console.error("[RoleContext] Error fetching profile:", error);
          if (fetchAbort.current !== thisGen) return;
          setUser(currentUser);
          setProfile(null);
          setRole(null);
        }
      } else {
        if (fetchAbort.current !== thisGen) return;
        // Si no hay usuario de Firebase autenticado, verificar si hay demo en localStorage
        const storedDemo = localStorage.getItem("tabar_demo_role");
        if (storedDemo && DEMO_PROFILES[storedDemo]) {
          const p = DEMO_PROFILES[storedDemo];
          setUser({ uid: p.uid, email: p.email, emailVerified: true, isDemo: true });
          setProfile(p);
          setRole(storedDemo);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }

      setLoading(false);
      setAuthReady(true);
    });

    return () => {
      unsubscribe();
      fetchAbort.current = {};
    };
  }, []);

  const setDemoRole = (roleKey, customProfile = {}) => {
    const base = DEMO_PROFILES[roleKey] || DEMO_PROFILES.producer;
    const finalProfile = { ...base, ...customProfile, role: roleKey, emailVerified: true };
    const demoUser = {
      uid: finalProfile.uid || `demo-${roleKey}-${Date.now()}`,
      email: finalProfile.email,
      emailVerified: true,
      isDemo: true
    };

    localStorage.setItem("tabar_demo_role", roleKey);
    setUser(demoUser);
    setProfile(finalProfile);
    setRole(roleKey);
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem("tabar_demo_role");
    setUser(null);
    setProfile(null);
    setRole(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("[RoleContext] Logout error:", error);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    if (user.isDemo) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : updates));
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : updates));
    } catch (err) {
      console.error("[RoleContext] updateProfile error:", err);
    }
  };

  return (
    <RoleContext.Provider value={{
      user,
      role,
      profile,
      loading,
      authReady,
      setDemoRole,
      logout,
      updateProfile,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
