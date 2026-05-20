import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDoc,
  runTransaction,
  getDocs,
  where,
  arrayUnion
} from "firebase/firestore";
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

  // Listen to the active campaign
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

  // Listen to global balances
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
    await setDoc(doc(db, "balances", "global"), { industry: 0, state: 0, dealer: 0, producer: 0 });
    await addHistorial(`✅ Campaña iniciada: ${fardosTotales.toLocaleString("es-AR")} TABAR por ${diasTotales} días`, "success");
  };

  const cerrarCampana = async () => {
    await updateDoc(doc(db, "campaigns", "active"), { activa: false });
    await addHistorial("🔒 Campaña cerrada.", "warning");
  };

  const comprarIndustry = async (datos) => {
    try {
      if (typeof datos === "object" && datos.numeroOrden) {
        const ordenData = datos;
        const docRef = doc(db, "purchase_orders", `${Date.now()}`);
        await setDoc(docRef, {
          ...ordenData,
          estado: "emitida"
        });
        await addHistorial(`✅ Acopiador emitió orden de compra de ${ordenData.cantidadKgs} Kgs de ${ordenData.tipoTabaco}`, "success");
        return { ok: true };
      }

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

      return { ok: false, error: "Formato de datos inválido" };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const requestFinancing = async (financingData) => {
    try {
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

      if (typeof datos === "object" && datos.entidad) {
        const poaData = datos;
        const docRef = doc(db, "poa_uploads", `${Date.now()}`);
        await setDoc(docRef, {
          ...poaData,
          estado: "pendiente_aprobacion"
        });
        await addHistorial(`✅ Se cargó POA de ${poaData.entidad} por $${poaData.monto.toLocaleString("es-AR")}`, "success");
        return { ok: true };
      }

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

  const tokenizarProducer = async (tokenizationData) => {
    try {
      if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

      const docRef = doc(db, "producer_tokenizations", `${Date.now()}`);
      await setDoc(docRef, {
        ...tokenizationData,
        productorOwner: user.uid,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      });

      await addHistorial(`🌿 Productor tokenizó ${tokenizationData.cantidadFardos} fardos (TABAR)`, "success");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: crearAsociacion
  // ========================================================================
  const crearAsociacion = async (nombreAsociacion) => {
    try {
      if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

      const newAssociationRef = doc(collection(db, "producer_associations"));

      await setDoc(newAssociationRef, {
        nombre: nombreAsociacion,
        productores: [{
          uid: user.uid,
          nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user.email || "Productor",
          email: user.email,
          rol: "coordinador"
        }],
        productoresUIDs: [user.uid],
        inventario: {
          totalKgs: 0,
          totalFardos: 0,
          usdFinanciamientoTotal: 0,
          tipoTabaco: "Ninguno",
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
      console.error("Error creating asociación:", e);
      return { ok: false, error: e.message };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: obtenerAsociacionesDelProductor
  // ========================================================================
  const obtenerAsociacionesDelProductor = async () => {
    try {
      if (!user?.uid) return { ok: false, asociaciones: [] };

      const q = query(
        collection(db, "producer_associations"),
        where("productoresUIDs", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const miasAsociaciones = [];

      querySnapshot.forEach((doc) => {
        miasAsociaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { ok: true, asociaciones: miasAsociaciones };
    } catch (e) {
      console.error("Error fetching producer asociaciones:", e);
      return { ok: false, error: e.message, asociaciones: [] };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: obtenerAsociacionesDisponiblesParaUnirse
  // ========================================================================
  const obtenerAsociacionesDisponiblesParaUnirse = async () => {
    try {
      if (!user?.uid) return { ok: false, asociaciones: [] };

      const allAssoc = await getDocs(collection(db, "producer_associations"));
      const asociacionesDisponibles = [];

      allAssoc.forEach((doc) => {
        const data = doc.data();
        const yaEsMiembro = data.productoresUIDs?.includes(user.uid);

        if (!yaEsMiembro && data.estado === "activa") {
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
      console.error("Error fetching available asociaciones:", e);
      return { ok: false, error: e.message, asociaciones: [] };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: obtenerTodasLasAsociaciones
  // ========================================================================
  const obtenerTodasLasAsociaciones = async () => {
    try {
      const snap = await getDocs(collection(db, "producer_associations"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { ok: true, asociaciones: data };
    } catch (e) {
      console.error("Error fetching all asociaciones:", e);
      return { ok: false, error: e.message, asociaciones: [] };
    }
  };

  // ========================================================================
  // NUEVA FUNCIÓN: unirseAAsociacion
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

      // 1. Manejar membresía de productores
      let nuevosProductores = [...(assoc.productores || [])];
      let nuevosProductoresUIDs = assoc.productoresUIDs
        ? [...assoc.productoresUIDs]
        : nuevosProductores.map(p => p.uid).filter(Boolean);
      
      const yaEsta = nuevosProductoresUIDs.includes(user.uid);
      if (!yaEsta) {
        nuevosProductores.push({
          uid: user.uid,
          nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user.email || "Productor",
          email: user.email,
          rol: "miembro"
        });
        nuevosProductoresUIDs.push(user.uid);
      }

      // 2. Actualizar inventario según tipo de tabaco (siempre)
      let nuevoInventario = assoc.inventario ? { ...assoc.inventario } : {
        totalKgs: 0,
        totalFardos: 0,
        usdFinanciamientoTotal: 0,
        tipoTabaco: "",
        tiposTabaco: []
      };

      const tipoTabacoInput = datosTokenizacion.tipoTabaco;
      const tiposTabaco = nuevoInventario.tiposTabaco ? [...nuevoInventario.tiposTabaco] : [];

      let tabacoEncontrado = tiposTabaco.find(t => t.tipo === tipoTabacoInput);
      if (tabacoEncontrado) {
        tabacoEncontrado.kgs = (tabacoEncontrado.kgs || 0) + (datosTokenizacion.kgs || 0);
        tabacoEncontrado.fardos = (tabacoEncontrado.fardos || 0) + (datosTokenizacion.cantidadFardos || 0);
        tabacoEncontrado.usdTotal = (tabacoEncontrado.usdTotal || 0) + (datosTokenizacion.usdTotal || 0);
        if (datosTokenizacion.calidad && !tabacoEncontrado.calidades.includes(datosTokenizacion.calidad)) {
          tabacoEncontrado.calidades.push(datosTokenizacion.calidad);
        }
      } else {
        tiposTabaco.push({
          tipo: tipoTabacoInput,
          calidades: [datosTokenizacion.calidad],
          kgs: datosTokenizacion.kgs || 0,
          fardos: datosTokenizacion.cantidadFardos || 0,
          usdTotal: datosTokenizacion.usdTotal || 0
        });
      }

      nuevoInventario.tiposTabaco = tiposTabaco;
      nuevoInventario.totalKgs = (nuevoInventario.totalKgs || 0) + (datosTokenizacion.kgs || 0);
      nuevoInventario.totalFardos = (nuevoInventario.totalFardos || 0) + (datosTokenizacion.cantidadFardos || 0);
      nuevoInventario.usdFinanciamientoTotal = (nuevoInventario.usdFinanciamientoTotal || 0) + (datosTokenizacion.usdTotal || 0);

      // Actualizar el string general de tipo de tabaco para compatibilidad
      const nombresTabacos = tiposTabaco.map(t => t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1));
      nuevoInventario.tipoTabaco = nombresTabacos.join(", ");

      await updateDoc(assocRef, {
        productores: nuevosProductores,
        productoresUIDs: nuevosProductoresUIDs,
        inventario: nuevoInventario,
        actualizadoEn: serverTimestamp()
      });

      await addHistorial(`🌿 Productor aportó ${datosTokenizacion.cantidadFardos} fardos a la asociación "${assoc.nombre}"`, "success");
      return { ok: true, associationId };
    } catch (e) {
      console.error("Error in unirseAAsociacion:", e);
      return { ok: false, error: e.message };
    }
  };

  // ========================================================================
  // FUNCIÓN ANTIGUA: crearOUnirseAsociacion (para compatibilidad con tokenizar)
  // ========================================================================
  const crearOUnirseAsociacion = async (productorAsociadoUID, datosTokenizacion) => {
    try {
      if (!user?.uid) return { ok: false, error: "Usuario no autenticado" };

      const newAssociationRef = doc(collection(db, "producer_associations"));
      const nombreAsociacion = `Asociación ${user?.displayName || "Productores"}`;

      await setDoc(newAssociationRef, {
        nombre: nombreAsociacion,
        productores: [
          {
            uid: user.uid,
            nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
            email: user.email,
            rol: "coordinador"
          },
          {
            uid: productorAsociadoUID,
            nombre: datosTokenizacion.productorAsociadoNombre || "",
            email: datosTokenizacion.productorAsociadoEmail || "",
            rol: "miembro"
          }
        ],
        productoresUIDs: [user.uid, productorAsociadoUID],
        inventario: {
          totalKgs: datosTokenizacion.kgs || 0,
          totalFardos: datosTokenizacion.cantidadFardos || 0,
          usdFinanciamientoTotal: datosTokenizacion.usdTotal || 0,
          tipoTabaco: datosTokenizacion.tipoTabaco.charAt(0).toUpperCase() + datosTokenizacion.tipoTabaco.slice(1),
          tiposTabaco: [{
            tipo: datosTokenizacion.tipoTabaco,
            calidades: [datosTokenizacion.calidad],
            kgs: datosTokenizacion.kgs || 0,
            fardos: datosTokenizacion.cantidadFardos || 0,
            usdTotal: datosTokenizacion.usdTotal || 0
          }]
        },
        estado: "activa",
        creadoPor: user.uid,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      });

      await addHistorial(`✅ Productor creó asociación con ${datosTokenizacion.productorAsociadoNombre}`, "success");
      return { ok: true, associationId: newAssociationRef.id };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const resetDemo = async () => {
    await setDoc(doc(db, "campaigns", "active"), ESTADO_INICIAL_CAMPANA);
    await setDoc(doc(db, "balances", "global"), { industry: 0, state: 0, dealer: 0, producer: 0 });
  };

  return (
    <DataContext.Provider value={{
      campana,
      balances,
      historial,
      iniciarCampana,
      cerrarCampana,
      comprarIndustry,
      requestFinancing,
      invertirState,
      operarDealer,
      tokenizarProducer,
      crearAsociacion,
      obtenerAsociacionesDelProductor,
      obtenerAsociacionesDisponiblesParaUnirse,
      obtenerTodasLasAsociaciones,
      unirseAAsociacion,
      crearOUnirseAsociacion,
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
