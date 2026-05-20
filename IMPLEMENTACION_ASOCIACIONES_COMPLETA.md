# Implementación: Sistema de Asociaciones Redeseñado

## Objetivo General
Mover la creación de asociaciones a `/producer/asociaciones` con un botón "Crear Asociación" y permitir que productores ilimitados se unan a asociaciones existentes. La asociación debe estar disponible tanto en la página de asociaciones como en el dropdown de tokenizar.

---

## Cambios Necesarios

### 1. DataContext.jsx - Nuevas Funciones

Agregar estas funciones después de `tokenizarProducer`:

```javascript
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
    
    const q = query(
      collection(db, "producer_associations"),
      where("productores", "array-contains-any", []) // Este no funciona, ver alternativa abajo
    );
    
    // ALTERNATIVA: obtener todas y filtrar en cliente
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
```

### 2. Agregar imports en DataContext.jsx

```javascript
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
  getDocs,              // NUEVO
  where,               // NUEVO
  arrayUnion           // NUEVO
} from "firebase/firestore";
```

### 3. Agregar al return del DataProvider:

```javascript
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
    crearAsociacion,                           // NUEVO ✅
    obtenerAsociacionesDelProductor,           // NUEVO ✅
    obtenerAsociacionesDisponiblesParaUnirse,  // NUEVO ✅
    unirseAAsociacion,                         // NUEVO ✅
    resetDemo,
  }}>
    {children}
  </DataContext.Provider>
);
```

---

## 2. asociaciones.jsx - REEMPLAZAR COMPLETAMENTE

```jsx
import { useState, useEffect } from "react";
import { useData } from "../modules/roles/DataContext";
import { useRole } from "../modules/roles/RoleContext";

export default function ProducerAssociaciones() {
  const { crearAsociacion, obtenerAsociacionesDelProductor, obtenerAsociacionesDisponiblesParaUnirse, unirseAAsociacion } = useData();
  const { user } = useRole();

  // Estados para crear asociación
  const [nombreAsociacion, setNombreAsociacion] = useState("");
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");
  const [successCrear, setSuccessCrear] = useState(false);

  // Estados para mis asociaciones
  const [misAsociaciones, setMisAsociaciones] = useState([]);
  const [loadingMias, setLoadingMias] = useState(true);

  // Estados para unirse
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(true);
  const [errorUnirse, setErrorUnirse] = useState("");
  const [successUnirse, setSuccessUnirse] = useState("");

  // Cargar asociaciones al montar
  useEffect(() => {
    cargarAsociaciones();
  }, [user]);

  const cargarAsociaciones = async () => {
    if (!user?.uid) return;

    setLoadingMias(true);
    setLoadingDisponibles(true);

    try {
      // Cargar mis asociaciones
      const resMias = await obtenerAsociacionesDelProductor();
      if (resMias.ok) {
        setMisAsociaciones(resMias.asociaciones || []);
      }

      // Cargar asociaciones disponibles para unirse
      const resDisp = await obtenerAsociacionesDisponiblesParaUnirse();
      if (resDisp.ok) {
        setAsociacionesDisponibles(resDisp.asociaciones || []);
      }
    } catch (err) {
      console.error("Error al cargar asociaciones:", err);
    } finally {
      setLoadingMias(false);
      setLoadingDisponibles(false);
    }
  };

  const handleCrearAsociacion = async () => {
    if (!nombreAsociacion.trim()) {
      setErrorCrear("El nombre de la asociación no puede estar vacío");
      return;
    }

    setLoadingCrear(true);
    setErrorCrear("");
    setSuccessCrear(false);

    try {
      const res = await crearAsociacion(nombreAsociacion);
      if (res.ok) {
        setSuccessCrear(true);
        setNombreAsociacion("");
        setTimeout(() => setSuccessCrear(false), 3000);
        // Recargar lista
        cargarAsociaciones();
      } else {
        setErrorCrear(res.error || "Error al crear la asociación");
      }
    } catch (err) {
      setErrorCrear(err.message || "Error desconocido");
    } finally {
      setLoadingCrear(false);
    }
  };

  const handleUnirseAsociacion = async (associationId) => {
    setLoadingDisponibles(true);
    setErrorUnirse("");
    setSuccessUnirse("");

    try {
      // Unirse con datos mínimos (sin tokenización)
      const res = await unirseAAsociacion(associationId, {
        tipoTabaco: "Por definir",
        calidad: "Por definir",
        kgs: 0,
        cantidadFardos: 0,
        usdTotal: 0
      });

      if (res.ok) {
        setSuccessUnirse("¡Te has unido correctamente a la asociación!");
        setTimeout(() => setSuccessUnirse(""), 3000);
        cargarAsociaciones();
      } else {
        setErrorUnirse(res.error || "Error al unirse a la asociación");
      }
    } catch (err) {
      setErrorUnirse(err.message || "Error desconocido");
    } finally {
      setLoadingDisponibles(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "30px" }}>
        Asociaciones de Productores
      </h1>

      {/* SECCIÓN 1: CREAR ASOCIACIÓN */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Crear Nueva Asociación
        </h2>

        {errorCrear && (
          <div
            style={{
              backgroundColor: "#da3633",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ❌ {errorCrear}
          </div>
        )}

        {successCrear && (
          <div
            style={{
              backgroundColor: "#238636",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ✅ ¡Asociación creada exitosamente!
          </div>
        )}

        <input
          type="text"
          className="tabar-input"
          placeholder="Nombre de la asociación"
          value={nombreAsociacion}
          onChange={(e) => setNombreAsociacion(e.target.value)}
          disabled={loadingCrear}
          style={{ marginBottom: "12px" }}
        />

        <button
          onClick={handleCrearAsociacion}
          disabled={loadingCrear || !nombreAsociacion.trim()}
          style={{
            backgroundColor: "#238636",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loadingCrear ? "not-allowed" : "pointer",
            opacity: loadingCrear || !nombreAsociacion.trim() ? 0.6 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {loadingCrear ? "Creando..." : "Crear Asociación"}
        </button>
      </div>

      {/* SECCIÓN 2: MIS ASOCIACIONES */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Mis Asociaciones ({misAsociaciones.length})
        </h2>

        {loadingMias ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>Cargando...</p>
        ) : misAsociaciones.length === 0 ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>
            Aún no perteneces a ninguna asociación. Crea una o únete a una existente.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {misAsociaciones.map((asoc) => (
              <div
                key={asoc.id}
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "13px"
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                  {asoc.nombre}
                </div>
                <div style={{ color: "#8B949E", fontSize: "12px" }}>
                  Miembros: {asoc.productores?.length || 0}
                </div>
                <div style={{ color: "#8B949E", fontSize: "12px" }}>
                  Total Kgs: {asoc.inventario?.totalKgs || 0}
                </div>
                <div style={{ color: "#8B949E", fontSize: "12px" }}>
                  Total Fardos: {asoc.inventario?.totalFardos || 0}
                </div>
                {asoc.inventario?.tiposTabaco && asoc.inventario.tiposTabaco.length > 0 && (
                  <div style={{ color: "#8B949E", fontSize: "12px", marginTop: "8px" }}>
                    <strong>Tipos de tabaco:</strong>
                    {asoc.inventario.tiposTabaco.map((tipo, idx) => (
                      <div key={idx} style={{ marginLeft: "16px" }}>
                        {tipo.tipo}: {tipo.kgs} Kgs ({tipo.fardos} fardos) - ${tipo.usdTotal}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: UNIRSE A ASOCIACIONES */}
      <div
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "20px"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Asociaciones Disponibles para Unirte ({asociacionesDisponibles.length})
        </h2>

        {errorUnirse && (
          <div
            style={{
              backgroundColor: "#da3633",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ❌ {errorUnirse}
          </div>
        )}

        {successUnirse && (
          <div
            style={{
              backgroundColor: "#238636",
              color: "#fff",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              fontSize: "13px"
            }}
          >
            ✅ {successUnirse}
          </div>
        )}

        {loadingDisponibles ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>Cargando...</p>
        ) : asociacionesDisponibles.length === 0 ? (
          <p style={{ color: "#8B949E", fontSize: "13px" }}>
            No hay asociaciones disponibles para unirse en este momento.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {asociacionesDisponibles.map((asoc) => (
              <div
                key={asoc.id}
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "13px" }}>
                    {asoc.nombre}
                  </div>
                  <div style={{ color: "#8B949E", fontSize: "12px" }}>
                    {asoc.cantidadProductores} miembro{asoc.cantidadProductores !== 1 ? "s" : ""} • {asoc.inventario?.totalKgs || 0} Kgs
                  </div>
                </div>
                <button
                  onClick={() => handleUnirseAsociacion(asoc.id)}
                  disabled={loadingDisponibles}
                  style={{
                    backgroundColor: "#238636",
                    color: "#fff",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: loadingDisponibles ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Unirse
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 3. tokenizar.jsx - CAMBIOS EN EL DROPDOWN

Busca la sección donde carga productores asociados y agrégale esto para asociaciones:

```javascript
// Agregar al inicio del componente (en estados):
const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
const [asociacionSeleccionada, setAsociacionSeleccionada] = useState("");
const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);
const [mostrarOpcionAsociacion, setMostrarOpcionAsociacion] = useState("crear"); // "crear" o "unirse"

// Agregar nuevo useEffect para cargar asociaciones del productor:
useEffect(() => {
  if (user?.uid && tipoVenta === "asociada") {
    const fetchAsociaciones = async () => {
      setLoadingAsociaciones(true);
      try {
        const res = await obtenerAsociacionesDelProductor();
        if (res.ok) {
          setAsociacionesDisponibles(res.asociaciones || []);
        }
      } catch (err) {
        console.error("Error fetching asociaciones:", err);
      }
      setLoadingAsociaciones(false);
    };
    
    fetchAsociaciones();
  }
}, [user, tipoVenta]);
```

Luego reemplaza la sección de "Productor Asociado" con:

```jsx
{/* Opciones de asociación */}
{tipoVenta === "asociada" && (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
      ¿Cómo deseas vender? *
    </label>
    <div style={{ display: "flex", gap: "16px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
        <input
          type="radio"
          name="mostrarOpcionAsociacion"
          value="crear"
          checked={mostrarOpcionAsociacion === "crear"}
          onChange={(e) => {
            setMostrarOpcionAsociacion(e.target.value);
            setAsociacionSeleccionada("");
          }}
          disabled={loading || showConfirm}
        />
        <span>Crear nueva asociación</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
        <input
          type="radio"
          name="mostrarOpcionAsociacion"
          value="unirse"
          checked={mostrarOpcionAsociacion === "unirse"}
          onChange={(e) => {
            setMostrarOpcionAsociacion(e.target.value);
            setProductorAsociado("");
          }}
          disabled={loading || showConfirm || asociacionesDisponibles.length === 0}
        />
        <span>Unirme a asociación existente {asociacionesDisponibles.length > 0 ? `(${asociacionesDisponibles.length})` : "(ninguna)"}</span>
      </label>
    </div>
  </div>
)}

{/* Productor para crear nueva asociación */}
{tipoVenta === "asociada" && mostrarOpcionAsociacion === "crear" && (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
      Productor Asociado *
    </label>
    <select
      className="tabar-input"
      value={productorAsociado}
      onChange={(e) => setProductorAsociado(e.target.value)}
      disabled={loading || showConfirm || loadingProductores}
      style={{ cursor: "pointer" }}
    >
      <option value="">{loadingProductores ? "Cargando..." : "Seleccionar productor"}</option>
      {productoresDisponibles.map(p => (
        <option key={p.uid} value={JSON.stringify(p)}>
          {p.firstName} {p.lastName}
        </option>
      ))}
    </select>
  </div>
)}

{/* Asociación existente para unirse */}
{tipoVenta === "asociada" && mostrarOpcionAsociacion === "unirse" && (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
      Seleccionar Asociación *
    </label>
    <select
      className="tabar-input"
      value={asociacionSeleccionada}
      onChange={(e) => setAsociacionSeleccionada(e.target.value)}
      disabled={loading || showConfirm || loadingAsociaciones}
      style={{ cursor: "pointer" }}
    >
      <option value="">{loadingAsociaciones ? "Cargando..." : "Seleccionar asociación"}</option>
      {asociacionesDisponibles.map(asoc => (
        <option key={asoc.id} value={asoc.id}>
          {asoc.nombre} ({asoc.productores?.length || 0} miembros)
        </option>
      ))}
    </select>
  </div>
)}
```

---

## 4. Firestore Rules - VERIFICAR

Tu archivo `firestore.rules` ya tiene las reglas correctas para `producer_associations`:

```firestore
match /producer_associations/{associationId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.creadoPor || 
     request.auth.uid in resource.data.productores[*].uid);
  allow delete: if request.auth.uid == resource.data.creadoPor;
}
```

✅ **No necesitas cambios en firestore.rules**

---

## Resumen de Cambios

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `DataContext.jsx` | 4 nuevas funciones para asociaciones | Agregado |
| `DataContext.jsx` | 3 nuevos imports (getDocs, where, arrayUnion) | Modificado |
| `asociaciones.jsx` | **REEMPLAZAR COMPLETAMENTE** | Reescrito |
| `tokenizar.jsx` | Agregar dropdown de asociaciones | Modificado |
| `firestore.rules` | ✅ YA ESTÁ CORRECTO | - |

---

## Flujo Resultante

**Usuario A:**
1. Va a `/producer/asociaciones`
2. Crea "Asociación TABAR1" con botón "Crear Asociación"
3. ✅ La asociación se crea

**Usuario B:**
1. Va a `/producer/asociaciones`
2. Ve "Asociación TABAR1" en "Asociaciones Disponibles"
3. Clica "Unirse"
4. ✅ Se une a la asociación

**Ambos al tokenizar:**
1. Seleccionan "Venta Asociada"
2. Seleccionan "Unirme a asociación existente"
3. Ven "Asociación TABAR1" en el dropdown
4. Si los dos venden Virginia T1F: se suman los valores
5. Si venden tipos diferentes: se listan por separado

---

## Pasos de Implementación

1. **Actualizar DataContext.jsx** con las 4 nuevas funciones
2. **Reemplazar asociaciones.jsx** completamente
3. **Modificar tokenizar.jsx** para agregar dropdown de asociaciones
4. **Verificar firestore.rules** (✅ ya está correcto)
5. **Probar con dos usuarios**
6. **Verificar tobacco type matching**

¿Comenzamos con la implementación?
