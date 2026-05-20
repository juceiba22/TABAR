import { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, limit, getDoc, getDocs, where, runTransaction, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getDocs, where, arrayUnion } from "firebase/firestore";
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

  // ========================================================================
  // NUEVAS FUNCIONES PARA ASOCIACIONES DE PRODUCTORES
  // ========================================================================
const unirseAAsociacion = async (associationId, datosTokenizacion) => {
  try {
    if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

    const assocRef = doc(db, "producer_associations", associationId);
    const assocSnap = await getDoc(assocRef);

    if (!assocSnap.exists()) {
      return { ok: false, error: "Asociación no encontrada" };
    }

    const assoc = assocSnap.data();

    // Verificar si el usuario ya está en la asociación
    const yaEstá = assoc.productores.some(p => p.uid === user.uid);

    if (!yaEstá) {
      const nuevoProductor = {
        uid: user.uid,
        nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        email: user.email,
        rol: "miembro"
      };

      // Actualizar inventario según tipo de tabaco
      let nuevoInventario = { ...assoc.inventario };
      const tipoTabaco = datosTokenizacion.tipoTabaco;
      const tiposTabaco = nuevoInventario.tiposTabaco || [];

      let tabacoencontrado = tiposTabaco.find(t => t.tipo === tipoTabaco);
      if (tabacoencontrado) {
        tabacoencontrado.kgs += datosTokenizacion.kgs || 0;
        tabacoencontrado.fardos += datosTokenizacion.cantidadFardos || 0;
        tabacoencontrado.usdTotal += datosTokenizacion.usdTotal || 0;
      } else {
        tiposTabaco.push({
          tipo: tipoTabaco,
          calidades: [datosTokenizacion.calidad],
          kgs: datosTokenizacion.kgs || 0,
          fardos: datosTokenizacion.cantidadFardos || 0,
          usdTotal: datosTokenizacion.usdTotal || 0
        });
      }

      nuevoInventario.tiposTabaco = tiposTabaco;
      nuevoInventario.totalKgs = (nuevoInventario.totalKgs || 0) + (datosTokenizacion.kgs || 0);
      nuevoInventario.totalFardos = (nuevoInventario.totalFardos || 0) + (datosTokenizacion.cantidadFardos || 0);

      await updateDoc(assocRef, {
        productores: arrayUnion(nuevoProductor),
        productoresUIDs: arrayUnion(user.uid),  // ← AGREGADO
        inventario: nuevoInventario,
        actualizadoEn: serverTimestamp()
      });
    }

    return { ok: true, associationId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
  const venderAsociacionEnBloque = async (associationId, precioVenta) => {
    try {
      const assocRef = doc(db, "producer_associations", associationId);
      const assocSnap = await getDoc(assocRef);
      
      if (!assocSnap.exists()) return { ok: false, error: "Asociación no encontrada" };
      
      const assoc = assocSnap.data();
      const numeroVenta = `VENTA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const montoTotal = assoc.inventario.totalKgs * precioVenta;

      await updateDoc(assocRef, {
        estado: "vendida",
        numeroVenta: numeroVenta,
        "inventario.precioVenta": precioVenta,
        fechaVenta: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      });

      await addHistorial(
        `✅ Asociación vendida en bloque: ${assoc.inventario.totalKgs.toLocaleString("es-AR")} Kgs por $${montoTotal.toLocaleString("es-AR")}`,
        "success"
      );
      
      return { ok: true, numeroVenta };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const tokenizarProducer = async (datos) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
    
    const cantidad = typeof datos === "object" ? datos.cantidadFardos : datos;
    if (cantidad > campana.fardosDisponibles) 
      return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };

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
          associationId: datos.associationId || null,
          aporteFardos: datos.tipoVenta === "asociada" ? datos.cantidadFardos : null,
          aporteKgs: datos.tipoVenta === "asociada" ? datos.totalKgs : null,
          aporteUSD: datos.tipoVenta === "asociada" ? datos.usdTotal : null,
          timestamp: serverTimestamp()
        });

        // Actualizar inventario de la asociación
        if (datos.associationId) {
          const { increment } = require("firebase/firestore");
          const assocRef = doc(db, "producer_associations", datos.associationId);
          await updateDoc(assocRef, {
            "inventario.totalKgs": increment(datos.totalKgs),
            "inventario.totalFardos": increment(datos.cantidadFardos),
            actualizadoEn: serverTimestamp()
          });
        }
      }

      await addHistorial(`🌿 Productor tokenizó ${cantidad.toLocaleString("es-AR")} fardos (TABAR)`, "success");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
// ========================================================================
// PASTE ESTAS FUNCIONES EN DataContext.jsx DESPUÉS DE tokenizarProducer
// ========================================================================

// ========================================================================
// NUEVA FUNCIÓN: crearAsociacion
// Permite crear una nueva asociación sin pasar por tokenizar
// ========================================================================
const crearAsociacion = async (nombreAsociacion) => {
  try {
    if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

    const newAssociationRef = doc(collection(db, "producer_associations"));

    await setDoc(newAssociationRef, {
      nombre: nombreAsociacion,
      productores: [{
        uid: user.uid,
        nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        email: user.email,
        rol: "creador"
      }],
      productoresUIDs: [user.uid],  // ← AGREGADO para Firestore Rules
      inventario: {
        totalKgs: 0,
        totalFardos: 0,
        tiposTabaco: []
      },
      estado: "activa",
      creadoPor: user.uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    });

    await addHistorial(`✅ Productor creó asociación: "${nombreAsociacion}"`, "success");
    return { ok: true, associationId: newAssociationRef.id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
// ========================================================================
// NUEVA FUNCIÓN: obtenerAsociacionesDelProductor
// Obtiene todas las asociaciones a las que pertenece el productor
// ========================================================================
const obtenerAsociacionesDelProductor = async () => {
  try {
    if (!user?.uid) return { ok: false, asociaciones: [] };

    // Obtener todas las asociaciones y filtrar en cliente
    const allAssoc = await getDocs(collection(db, "producer_associations"));
    const miasAsociaciones = [];

    allAssoc.forEach((doc) => {
      const data = doc.data();
      const esMiembro = data.productores?.some(p => p.uid === user.uid);
      if (esMiembro) {
        miasAsociaciones.push({
          id: doc.id,
          ...data
        });
      }
    });

    return { ok: true, asociaciones: miasAsociaciones };
  } catch (e) {
    return { ok: false, error: e.message, asociaciones: [] };
  }
};

// ========================================================================
// NUEVA FUNCIÓN: obtenerAsociacionesDisponiblesParaUnirse
// Obtiene asociaciones que el productor AÚN NO ha unido
// ========================================================================
const obtenerAsociacionesDisponiblesParaUnirse = async () => {
  try {
    if (!user?.uid) return { ok: false, asociaciones: [] };

    const allAssoc = await getDocs(collection(db, "producer_associations"));
    const asociacionesDisponibles = [];

    allAssoc.forEach((doc) => {
      const data = doc.data();
      const yaEsMiembro = data.productores?.some(p => p.uid === user.uid);

      if (!yaEsMiembro) {
        asociacionesDisponibles.push({
          id: doc.id,
          nombre: data.nombre,
          cantidadProductores: data.productores?.length || 0,
          productores: data.productores?.map(p => p.nombre).join(", ") || "",
          inventario: data.inventario || {},
          estado: data.estado
        });
      }
    });

    return { ok: true, asociaciones: asociacionesDisponibles };
  } catch (e) {
    return { ok: false, error: e.message, asociaciones: [] };
  }
};

// ========================================================================
// NUEVA FUNCIÓN: unirseAAsociacion
// Permite que un productor se una a una asociación existente
// ========================================================================
const unirseAAsociacion = async (associationId, datosTokenizacion) => {
  try {
    if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

    const assocRef = doc(db, "producer_associations", associationId);
    const assocSnap = await getDoc(assocRef);

    if (!assocSnap.exists()) {
      return { ok: false, error: "Asociación no encontrada" };
    }

    const assoc = assocSnap.data();

    // Verificar si el usuario ya está en la asociación
    const yaEstá = assoc.productores.some(p => p.uid === user.uid);

    if (!yaEstá) {
      const nuevoProductor = {
        uid: user.uid,
        nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        email: user.email,
        rol: "miembro"
      };

      // Actualizar inventario según tipo de tabaco
      let nuevoInventario = { ...assoc.inventario };
      const tipoTabaco = datosTokenizacion.tipoTabaco;
      const tiposTabaco = nuevoInventario.tiposTabaco || [];

      let tabacoencontrado = tiposTabaco.find(t => t.tipo === tipoTabaco);
      if (tabacoencontrado) {
        // Mismo tipo: sumar valores
        tabacoencontrado.kgs += datosTokenizacion.kgs || 0;
        tabacoencontrado.fardos += datosTokenizacion.cantidadFardos || 0;
        tabacoencontrado.usdTotal += datosTokenizacion.usdTotal || 0;
      } else {
        // Tipo diferente: crear entrada nueva
        tiposTabaco.push({
          tipo: tipoTabaco,
          calidades: [datosTokenizacion.calidad],
          kgs: datosTokenizacion.kgs || 0,
          fardos: datosTokenizacion.cantidadFardos || 0,
          usdTotal: datosTokenizacion.usdTotal || 0
        });
      }

      nuevoInventario.tiposTabaco = tiposTabaco;
      nuevoInventario.totalKgs = (nuevoInventario.totalKgs || 0) + (datosTokenizacion.kgs || 0);
      nuevoInventario.totalFardos = (nuevoInventario.totalFardos || 0) + (datosTokenizacion.cantidadFardos || 0);

      await updateDoc(assocRef, {
        productores: arrayUnion(nuevoProductor),
        inventario: nuevoInventario,
        actualizadoEn: serverTimestamp()
      });
    }

    return { ok: true, associationId };
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
      tokenizarProducer,    // Actualizada ✅
      crearOUnirseAsociacion, // NUEVA ✅
      unirseAAsociacion,    // NUEVA ✅
      venderAsociacionEnBloque, // NUEVA ✅
      crearAsociacion,                           // ← NUEVO
      obtenerAsociacionesDelProductor,           // ← NUEVO
      obtenerAsociacionesDisponiblesParaUnirse,  // ← NUEVO
      unirseAAsociacion,
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
