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
      inventario: {
        totalKgs: 0,
        totalFardos: 0,
        tiposTabaco: [] // Array de {tipo, calidades: [...], kgs, fardos, usdTotal}
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

// ========================================================================
// IMPORTANTE: Agregar estos imports al inicio de DataContext.jsx:
// ========================================================================
// import {
//   collection,
//   doc,
//   onSnapshot,
//   setDoc,
//   updateDoc,
//   addDoc,
//   serverTimestamp,
//   query,
//   orderBy,
//   limit,
//   getDoc,
//   runTransaction,
//   getDocs,        // ← NUEVO
//   where,          // ← NUEVO
//   arrayUnion      // ← NUEVO
// } from "firebase/firestore";

// ========================================================================
// IMPORTANTE: Agregar al return del DataProvider:
// ========================================================================
// return (
//   <DataContext.Provider value={{
//     campana,
//     balances,
//     historial,
//     iniciarCampana,
//     cerrarCampana,
//     comprarIndustry,
//     requestFinancing,
//     invertirState,
//     operarDealer,
//     tokenizarProducer,
//     crearAsociacion,                           // ← NUEVO
//     obtenerAsociacionesDelProductor,           // ← NUEVO
//     obtenerAsociacionesDisponiblesParaUnirse,  // ← NUEVO
//     unirseAAsociacion,                         // ← NUEVO
//     resetDemo,
//   }}>
//     {children}
//   </DataContext.Provider>
// );
