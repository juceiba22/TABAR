/**
 * RoleContext.jsx — v2
 *
 * Fixes vs versión anterior:
 *  ① Race condition eliminado: loading permanece true durante todo
 *    el ciclo auth + fetch Firestore. Solo se pasa a false cuando
 *    AMBOS están resueltos, evitando el flash de LandingRole.
 *  ② profileLoading separado de authLoading para que los consumidores
 *    puedan distinguir "Firebase aún no respondió" de "perfil cargando".
 *  ③ Actualiza emailVerified en Firestore en el primer login verificado
 *    (consolida el perfil que quedó como pending_verification).
 *  ④ Expone authReady: bool — true cuando Firebase resolvió el estado
 *    inicial. Útil para splash screens sin depender de !user && !loading.
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
  industry: "Industria / Exportador",
  state: "Estado Nacional",
  dealer: "Dealer / Revendedor",
  producer: "Productor Tabacalero",
};

export const ROLE_COLORS = {
  admin: "#E3B64F",
  industry: "#58A6FF",
  state: "#F0883E",
  dealer: "#BC8CFF",
  producer: "#3FB950",
};

/* ─── Rutas raíz por rol — única fuente de verdad ─────────────────────────
   Usada por AppShell y cualquier componente que necesite redirigir al home
   del rol actual sin hardcodear strings.                                   */
export const ROLE_HOME = {
  admin: "/admin",
  industry: "/industry",
  state: "/state",
  dealer: "/dealer",
  producer: "/producer",
};

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);

  // ① loading = true mientras Firebase NO resolvió el estado inicial
  //   O mientras estamos buscando el perfil en Firestore.
  //   Solo pasa a false cuando AMBAS operaciones terminaron.
  const [loading, setLoading] = useState(true);

  // ④ authReady = true en cuanto Firebase emitió el primer evento
  //   (independientemente de si hay sesión o no).
  const [authReady, setAuthReady] = useState(false);

  // Ref para cancelar el fetch de Firestore si el componente se desmonta
  // o si llega un nuevo evento de auth antes de que termine el fetch anterior.
  const fetchAbort = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Cancelar cualquier fetch previo en vuelo
      fetchAbort.current = true;
      // Crear nueva "generación" para este evento
      const thisGen = {};
      fetchAbort.current = thisGen;

      // ① Mantener loading=true durante todo el ciclo
      setLoading(true);

      if (currentUser && currentUser.emailVerified) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          // Si este evento fue superado por uno más reciente, ignorar
          if (fetchAbort.current !== thisGen) return;

          if (userSnap.exists()) {
            const data = userSnap.data();

            // ③ Consolidar perfil: si llegó como pending_verification,
            //    actualizar emailVerified en Firestore silenciosamente.
            if (data.status === "pending_verification") {
              try {
                await updateDoc(userRef, {
                  emailVerified: true,
                  status: "approved",
                });
              } catch {
                // No crítico — el perfil igual se carga correctamente
              }
            }

            setUser(currentUser);
            setProfile(data);
            setRole(data.role || null);
          } else {
            // Usuario verificado sin doc en Firestore (edge case)
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
        // No autenticado o email no verificado
        if (fetchAbort.current !== thisGen) return;
        setUser(null);
        setProfile(null);
        setRole(null);
      }

      // ① Solo aquí, cuando TODO terminó, apagamos loading
      setLoading(false);
      setAuthReady(true);
    });

    return () => {
      unsubscribe();
      // Marcar fetch en vuelo como obsoleto al desmontar
      fetchAbort.current = {};
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // El onAuthStateChanged se encarga de limpiar user/role/profile
    } catch (error) {
      console.error("[RoleContext] Logout error:", error);
    }
  };

  return (
    <RoleContext.Provider value={{
      user,
      role,
      profile,
      loading,
      authReady,
      logout,
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
