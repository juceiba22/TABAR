import { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, limit, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "./RoleContext";

const DataContext = createContext(null);

const ESTADO_INICIAL_CAMPANA = {
  activa: false,
  fardosTotales: 0,
  fardosVendidos: 0,
  fardosDisponibles: 0,
  diasTotales: 180,
  diasTranscurridos: 0,
};

export function DataProvider({ children }) {
  const { user, profile } = useRole();
  const [campana, setCampana] = useState(ESTADO_INICIAL_CAMPANA);
  const [balances, setBalances] = useState({ industry: 0, state: 0, dealer: 0, producer: 0 });
  const [historial, setHistorial] = useState([]);

  // Listen to the active campaign (we assume doc ID 'active')
  useEffect(() => {
    if (!user) { setCampana(ESTADO_INICIAL_CAMPANA); return; }
    const unsub = onSnapshot(doc(db, "campaigns", "active"), (docSnap) => {
      if (docSnap.exists()) {
        setCampana(docSnap.data());
      } else {
        setCampana(ESTADO_INICIAL_CAMPANA);
      }
    });
    return () => unsub();
  }, [user]);

  // Listen to global balances (mock global balances for the MVP)
  useEffect(() => {
    if (!user) { setBalances({ industry: 0, state: 0, dealer: 0, producer: 0 }); return; }
    const unsub = onSnapshot(doc(db, "balances", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setBalances(docSnap.data());
      } else {
        setBalances({ industry: 0, state: 0, dealer: 0, producer: 0 });
      }
    });
    return () => unsub();
  }, [user]);

  // Listen to history
  useEffect(() => {
    if (!user) { setHistorial([]); return; }
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data(), hora: d.data().timestamp?.toDate().toLocaleTimeString("es-AR") || "" }));
      setHistorial(logs);
    });
    return () => unsub();
  }, [user]);

  const addHistorial = async (msg, tipo = "info") => {
    await addDoc(collection(db, "audit_logs"), {
      msg,
      tipo,
      timestamp: serverTimestamp(),
      user: profile?.displayName || user?.email || "Sistema"
    });
  };

  const iniciarCampana = async (fardosTotales, diasTotales = 180) => {
    await setDoc(doc(db, "campaigns", "active"), {
      activa: true,
      fardosTotales,
      fardosVendidos: 0,
      fardosDisponibles: fardosTotales,
      diasTotales,
      diasTranscurridos: 0,
      inicio: new Date().toISOString()
    });
    // Reset global balances when starting a new campaign
    await setDoc(doc(db, "balances", "global"), { industry: 0, state: 0, dealer: 0, producer: 0 });
    await addHistorial(`✅ Campaña iniciada: ${fardosTotales.toLocaleString("es-AR")} TABAR por ${diasTotales} días`, "success");
  };

  const cerrarCampana = async () => {
    await updateDoc(doc(db, "campaigns", "active"), { activa: false });
    await addHistorial("🔒 Campaña cerrada.", "warning");
  };

  // ========================================================================
  // FUNCIÓN ACTUALIZADA: comprarIndustry
  // Ahora acepta tanto números (antiguo) como objetos (nuevas órdenes)
  // ========================================================================
  const comprarIndustry = async (datos) => {
    try {
      // CASO 1: Si es un objeto (nueva orden de compra)
      if (typeof datos === "object" && datos.numeroOrden) {
        const ordenData = datos;

        // Guardar en colección purchase_orders
        const docRef = doc(db, "purchase_orders", `${Date.now()}`);
        await setDoc(docRef, {
          ...ordenData,
          estado: "emitida"
        });

        await addHistorial(`✅ Acopiador emitió orden de compra de ${ordenData.cantidadKgs} Kgs de ${ordenData.tipoTabaco}`, "success");
        return { ok: true };
      }

      // CASO 2: Si es un número (compatibilidad hacia atrás con inversiones antiguas)
      if (typeof datos === "number") {
        const cantidad = datos;

        if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
        if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };

        const campanaRef = doc(db, "campaigns", "active");
        const balancesRef = doc(db, "balances", "global");

        await runTransaction(db, async (t) => {
          const cSnap = await t.get(campanaRef);
          const bSnap = await t.get(balancesRef);

          if (!cSnap.exists() || !cSnap.data().activa) throw new Error("Campaña inactiva");
          if (cantidad > cSnap.data().fardosDisponibles) throw new Error("Stock insuficiente");

          const newVendidos = cSnap.data().fardosVendidos + cantidad;
          const newDisponibles = cSnap.data().fardosDisponibles - cantidad;
          t.update(campanaRef, { fardosVendidos: newVendidos, fardosDisponibles: newDisponibles });

          const currentIndustryBal = bSnap.exists() ? (bSnap.data().industry || 0) : 0;
          t.set(balancesRef, { ...bSnap.data(), industry: currentIndustryBal + cantidad }, { merge: true });
        });

        await addHistorial(`✅ Acopiador compró ${cantidad.toLocaleString("es-AR")} TABAR`, "success");
        return { ok: true };
      }

      // Si no es número ni objeto válido
      return { ok: false, error: "Formato de datos inválido" };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: requestFinancing
  // Para solicitudes de financiamiento con warrant
  // ========================================================================
  const requestFinancing = async (financingData) => {
    try {
      // Guardar en colección financing_requests
      const docRef = doc(db, "financing_requests", `${Date.now()}`);
      await setDoc(docRef, {
        ...financingData,
        estado: "pendiente_aprobacion"
      });

      await addHistorial(`✅ Acopiador solicitó financiamiento por ${financingData.motivoFinanciamiento}`, "success");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const invertirState = async (datos) => {
    try {
      // CASO 1: Si es un número (inversión FET antigua)
      if (typeof datos === "number") {
        const cantidad = datos;

        if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
        if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };

        const campanaRef = doc(db, "campaigns", "active");
        const balancesRef = doc(db, "balances", "global");

        await runTransaction(db, async (t) => {
          const cSnap = await t.get(campanaRef);
          const bSnap = await t.get(balancesRef);

          if (!cSnap.exists() || !cSnap.data().activa) throw new Error("Campaña inactiva");
          if (cantidad > cSnap.data().fardosDisponibles) throw new Error("Stock insuficiente");

          const newVendidos = cSnap.data().fardosVendidos + cantidad;
          const newDisponibles = cSnap.data().fardosDisponibles - cantidad;
          t.update(campanaRef, { fardosVendidos: newVendidos, fardosDisponibles: newDisponibles });

          const currentStateBal = bSnap.exists() ? (bSnap.data().state || 0) : 0;
          t.set(balancesRef, { ...bSnap.data(), state: currentStateBal + cantidad }, { merge: true });
        });

        await addHistorial(`✅ Estado Nacional invirtió ${cantidad.toLocaleString("es-AR")} TABAR vía FET`, "success");
        return { ok: true };
      }

      // CASO 2: Si es un objeto (POA nuevo)
      if (typeof datos === "object" && datos.entidad) {
        const poaData = datos;

        // Guardar en colección poa_uploads
        const docRef = doc(db, "poa_uploads", `${Date.now()}`);
        await setDoc(docRef, {
          ...poaData,
          estado: "pendiente_aprobacion"
        });

        await addHistorial(`✅ Se cargó POA de ${poaData.entidad} por $${poaData.monto.toLocaleString("es-AR")}`, "success");
        return { ok: true };
      }

      // Si no es número ni objeto, error
      return { ok: false, error: "Formato de datos inválido" };

    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const operarDealer = async (tipo, cantidad) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };

    const campanaRef = doc(db, "campaigns", "active");
    const balancesRef = doc(db, "balances", "global");

    try {
      await runTransaction(db, async (t) => {
        const cSnap = await t.get(campanaRef);
        const bSnap = await t.get(balancesRef);

        if (!cSnap.exists() || !cSnap.data().activa) throw new Error("Campaña inactiva");

        const currentDealerBal = bSnap.exists() ? (bSnap.data().dealer || 0) : 0;

        if (tipo === "buy") {
          if (cantidad > cSnap.data().fardosDisponibles) throw new Error("Stock insuficiente");
          t.update(campanaRef, {
            fardosVendidos: cSnap.data().fardosVendidos + cantidad,
            fardosDisponibles: cSnap.data().fardosDisponibles - cantidad
          });
          t.set(balancesRef, { ...bSnap.data(), dealer: currentDealerBal + cantidad }, { merge: true });
        } else {
          if (cantidad > currentDealerBal) throw new Error("Balance insuficiente");
          t.update(campanaRef, {
            fardosVendidos: cSnap.data().fardosVendidos - cantidad,
            fardosDisponibles: cSnap.data().fardosDisponibles + cantidad
          });
          t.set(balancesRef, { ...bSnap.data(), dealer: currentDealerBal - cantidad }, { merge: true });
        }
      });

      await addHistorial(`✅ Dealer ${tipo === "buy" ? "compró" : "vendió"} ${cantidad.toLocaleString("es-AR")} TABAR`, "success");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const tokenizarProducer = async (datos) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
    
    // Para soportar el formato antiguo (solo cantidad) y el nuevo (objeto)
    const cantidad = typeof datos === "object" ? datos.cantidadFardos : datos;
    
    if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };

    const campanaRef = doc(db, "campaigns", "active");
    const balancesRef = doc(db, "balances", "global");

    try {
      await runTransaction(db, async (t) => {
        const cSnap = await t.get(campanaRef);
        const bSnap = await t.get(balancesRef);

        if (!cSnap.exists() || !cSnap.data().activa) throw new Error("Campaña inactiva");
        if (cantidad > cSnap.data().fardosDisponibles) throw new Error("Stock insuficiente");

        const newVendidos = cSnap.data().fardosVendidos + cantidad;
        const newDisponibles = cSnap.data().fardosDisponibles - cantidad;
        t.update(campanaRef, { fardosVendidos: newVendidos, fardosDisponibles: newDisponibles });

        const currentProducerBal = bSnap.exists() ? (bSnap.data().producer || 0) : 0;
        t.set(balancesRef, { ...bSnap.data(), producer: currentProducerBal + cantidad }, { merge: true });
      });

      if (typeof datos === "object") {
        const docRef = doc(db, "producer_tokenizations", `${Date.now()}`);
        await setDoc(docRef, {
          ...datos,
          timestamp: serverTimestamp()
        });
      }

      await addHistorial(`🌿 Productor Tabacalero tokenizó ${cantidad.toLocaleString("es-AR")} fardos (TABAR)`, "success");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const resetDemo = async () => {
    await setDoc(doc(db, "campaigns", "active"), ESTADO_INICIAL_CAMPANA);
    await setDoc(doc(db, "balances", "global"), { industry: 0, state: 0, dealer: 0, producer: 0 });
    // Audit logs remain as historical records, or could be cleared if desired.
  };

  return (
    <DataContext.Provider value={{
      campana,
      balances,
      historial,
      iniciarCampana,
      cerrarCampana,
      comprarIndustry,      // Actualizada ✅
      requestFinancing,     // NUEVA ✅
      invertirState,
      operarDealer,
      tokenizarProducer,
      resetDemo,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
