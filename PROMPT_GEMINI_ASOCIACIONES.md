# Prompt para Gemini 3.1 Pro - Implementación de Asociaciones de Productores

## INSTRUCCIÓN PRINCIPAL

Implementa un sistema completo de **asociaciones de productores** en la plataforma TABAR que permita a múltiples productores agrupar sus kilos de tabaco para venta en bloque. El sistema debe incluir:

1. Nueva colección Firestore `producer_associations` con inventario consolidado
2. Vinculación de tokenizaciones a asociaciones
3. Nueva página de visualización para productores
4. Actualización de reglas de seguridad Firestore
5. Integración en el flujo de certificación existente

---

## ESPECIFICACIONES TÉCNICAS

### 1. ESTRUCTURA DE DATOS - Colección `producer_associations`

**Ubicación:** `/producer_associations/{associationId}`

```json
{
  "id": "ASSOC-1716108600000-abc123",
  "nombre": "Asociación Virginia - 2024",
  "productores": [
    {
      "uid": "user123",
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "rol": "coordinador"
    },
    {
      "uid": "user456",
      "nombre": "María García",
      "email": "maria@example.com",
      "rol": "miembro"
    }
  ],
  "inventario": {
    "totalKgs": 2500,
    "totalFardos": 50,
    "tipoTabaco": "Virginia",
    "calidades": ["T1F", "T1L", "B1F"],
    "precioPromedio": 2.25,
    "usdFinanciamientoTotal": 4250
  },
  "estado": "activa",
  "fechaCreacion": "timestamp",
  "fechaVenta": null,
  "numeroVenta": null,
  "creadoPor": "user123",
  "actualizadoEn": "timestamp"
}
```

### 2. ACTUALIZACIÓN - Colección `producer_tokenizations`

**Agregar estos campos a documentos existentes:**

```json
{
  "associationId": "ASSOC-1716108600000-abc123",
  "aporteFardos": 25,
  "aporteKgs": 1250,
  "aporteUSD": 2125
}
```

---

## CAMBIOS EN CÓDIGO

### CAMBIO 1: DataContext.jsx

**Ubicación:** `src/modules/roles/DataContext.jsx`

**Agregar estas tres nuevas funciones dentro del componente DataProvider:**

#### A) Función para crear o unirse a asociación
```javascript
// Agregar DESPUÉS de la función tokenizarProducer, antes del return del provider
const crearOUnirseAsociacion = async (productorAsociadoUID, datosAsociacion) => {
  try {
    // Verificar si existe asociación entre estos productores
    const q = query(
      collection(db, "producer_associations"),
      where("productores", "array-contains", { uid: user.uid })
    );
    
    const existentes = await getDocs(q);
    let associationId = null;
    
    // Si existe, usar esa; si no, crear nueva
    if (existentes.docs.length > 0) {
      // Buscar si el otro productor ya está en alguna de estas asociaciones
      let asociacionCompartida = null;
      for (const doc of existentes.docs) {
        const uids = doc.data().productores.map(p => p.uid);
        if (uids.includes(productorAsociadoUID)) {
          asociacionCompartida = doc.id;
          break;
        }
      }
      
      if (asociacionCompartida) {
        associationId = asociacionCompartida;
      } else {
        // Crear nueva asociación
        const newAssocRef = doc(collection(db, "producer_associations"));
        await setDoc(newAssocRef, {
          id: `ASSOC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          nombre: `Asociación ${datosAsociacion.tipoTabaco} - ${new Date().getFullYear()}`,
          productores: [
            { 
              uid: user.uid, 
              nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(), 
              email: user.email, 
              rol: "coordinador" 
            },
            { 
              uid: productorAsociadoUID, 
              nombre: datosAsociacion.productorAsociadoNombre, 
              email: datosAsociacion.productorAsociadoEmail, 
              rol: "miembro" 
            }
          ],
          inventario: {
            totalKgs: 0,
            totalFardos: 0,
            tipoTabaco: datosAsociacion.tipoTabaco,
            calidades: [datosAsociacion.calidad],
            precioPromedio: datosAsociacion.precioVenta,
            usdFinanciamientoTotal: 0
          },
          estado: "activa",
          creadoPor: user.uid,
          fechaCreacion: serverTimestamp(),
          actualizadoEn: serverTimestamp()
        });
        
        associationId = newAssocRef.id;
      }
    } else {
      // Crear nueva asociación (ninguna existente)
      const newAssocRef = doc(collection(db, "producer_associations"));
      await setDoc(newAssocRef, {
        id: `ASSOC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nombre: `Asociación ${datosAsociacion.tipoTabaco} - ${new Date().getFullYear()}`,
        productores: [
          { 
            uid: user.uid, 
            nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(), 
            email: user.email, 
            rol: "coordinador" 
          },
          { 
            uid: productorAsociadoUID, 
            nombre: datosAsociacion.productorAsociadoNombre, 
            email: datosAsociacion.productorAsociadoEmail, 
            rol: "miembro" 
          }
        ],
        inventario: {
          totalKgs: 0,
          totalFardos: 0,
          tipoTabaco: datosAsociacion.tipoTabaco,
          calidades: [datosAsociacion.calidad],
          precioPromedio: datosAsociacion.precioVenta,
          usdFinanciamientoTotal: 0
        },
        estado: "activa",
        creadoPor: user.uid,
        fechaCreacion: serverTimestamp(),
        actualizadoEn: serverTimestamp()
      });
      
      associationId = newAssocRef.id;
    }
    
    return { ok: true, associationId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
```

#### B) Modificar función `tokenizarProducer` existente
**REEMPLAZAR la función `tokenizarProducer` completa con esto:**

```javascript
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

      // NUEVO: Actualizar inventario de la asociación
      if (datos.associationId) {
        const { increment } = await import("firebase/firestore").then(m => ({ increment: m.increment }));
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
```

#### C) Nueva función para vender en bloque
```javascript
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
```

#### D) Exportar nuevas funciones en el return del provider
**ENCONTRAR el return del DataProvider y agregar estas funciones:**
```javascript
return (
  <DataContext.Provider value={{
    // ... valores existentes ...
    tokenizarProducer,
    crearOUnirseAsociacion,  // ← AGREGAR
    venderAsociacionEnBloque, // ← AGREGAR
    // ... resto de valores ...
  }}>
    {children}
  </DataContext.Provider>
);
```

---

### CAMBIO 2: src/pages/producer/tokenizar.jsx

**MODIFICAR la función `handleTokenizar`:**

```javascript
const handleTokenizar = async () => {
  if (tipoVenta === "asociada" && !productorAsociado) {
    setError("Debes seleccionar un productor asociado");
    return;
  }
  
  setError("");
  setLoading(true);

  const producerObj = tipoVenta === "asociada" ? JSON.parse(productorAsociado) : null;
  let associationId = null;
  
  // Si es venta asociada, crear/unirse a asociación primero
  if (tipoVenta === "asociada") {
    const assocRes = await crearOUnirseAsociacion(producerObj.uid, {
      tipoTabaco,
      calidad,
      precioVenta: precioFinal,
      productorAsociadoNombre: `${producerObj.firstName} ${producerObj.lastName}`,
      productorAsociadoEmail: producerObj.email
    });
    
    if (!assocRes.ok) {
      setError(assocRes.error);
      setLoading(false);
      return;
    }
    
    associationId = assocRes.associationId;
  }
  
  const tokenizationData = {
    cantidadFardos,
    totalKgs: parseInt(totalKgs),
    tamanoFardo: parseInt(tamanoFardo),
    tipoTabaco,
    calidad,
    tipoVenta,
    precioVenta: precioFinal,
    usdTotal,
    productorOwner: user.uid,
    associationId: associationId,
  };

  if (producerObj) {
    tokenizationData.productorAsociadoUID = producerObj.uid;
    tokenizationData.productorAsociadoNombre = `${producerObj.firstName} ${producerObj.lastName}`;
    tokenizationData.productorAsociadoDNI = producerObj.documentNumber;
    tokenizationData.productorAsociadoEmail = producerObj.email;
  }

  const res = await tokenizarProducer(tokenizationData);
  if (res.ok) {
    const codigo = generarCertificadoPDF(producerObj);
    setTransactionCode(codigo);
    setSuccess(true);
  } else {
    setError(res.error || "Error al tokenizar los fardos");
  }
  setLoading(false);
};
```

**AGREGAR la importación en la cabecera del archivo:**
```javascript
const { tokenizarProducer, crearOUnirseAsociacion } = useData();
```

---

### CAMBIO 3: CREAR NUEVO ARCHIVO - src/pages/producer/asociaciones.jsx

**Crear completamente el archivo con este contenido:**

```jsx
import { useState, useEffect } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

export default function ProducerAsociaciones() {
  const { user } = useRole();
  const [asociaciones, setAsociaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAsociaciones = async () => {
      try {
        if (!user?.uid) return;

        const q = query(
          collection(db, "producer_associations"),
          where("productores", "array-contains", { uid: user.uid })
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAsociaciones(data);
      } catch (err) {
        console.error("Error fetching asociaciones:", err);
        setError("Error al cargar asociaciones");
      }
      setLoading(false);
    };

    fetchAsociaciones();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Cargando...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "#F85149", textAlign: "center", padding: "40px" }}>
        {error}
      </div>
    );
  }

  if (asociaciones.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>📭</div>
        <h2 style={{ color: "#8B949E" }}>Sin asociaciones aún</h2>
        <p style={{ color: "#8B949E", marginBottom: "30px" }}>
          Cuando certifiques tabaco con "Venta Asociada", aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>👥</div>
          <h1>Mis Asociaciones de Venta</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>
          Visualiza y gestiona tus asociaciones de productores
        </p>
      </div>

      {asociaciones.map((asoc) => (
        <div key={asoc.id} className="tabar-card" style={{ marginBottom: "20px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{asoc.nombre}</h3>
            <span style={{
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              background: asoc.estado === "activa" ? "rgba(63,185,80,0.2)" : "rgba(248,81,73,0.2)",
              color: asoc.estado === "activa" ? "#3FB950" : "#F85149"
            }}>
              {asoc.estado.toUpperCase()}
            </span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#8B949E", margin: "0 0 8px 0" }}>
              Coordinador: <strong>{asoc.productores.find(p => p.rol === "coordinador")?.nombre}</strong>
            </p>
            <p style={{ fontSize: "12px", color: "#8B949E", margin: 0 }}>
              Miembros: {asoc.productores.map(p => p.nombre).join(", ")}
            </p>
          </div>

          <div style={{
            background: "rgba(63,185,80,0.05)",
            border: "1px solid rgba(63,185,80,0.2)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px"
          }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: C.accent }}>
              INVENTARIO CONSOLIDADO
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "#8B949E" }}>Total Kgs:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.totalKgs.toLocaleString("es-AR")} kg</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Total Fardos:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.totalFardos}</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Tipo de Tabaco:</span>
                <p style={{ margin: 0, fontWeight: 600 }}>{asoc.inventario.tipoTabaco}</p>
              </div>
              <div>
                <span style={{ color: "#8B949E" }}>Financiamiento USD:</span>
                <p style={{ margin: 0, fontWeight: 600, color: C.accent }}>USD ${asoc.inventario.usdFinanciamientoTotal.toLocaleString("es-AR")}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#8B949E" }}>MIS APORTES</h4>
            <AportesDetalle asociacionId={asoc.id} productorUID={user.uid} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="tabar-btn tabar-btn-ghost" style={{ fontSize: "12px" }}>
              Ver detalles completos
            </button>
            {asoc.estado === "vendida" && (
              <button className="tabar-btn tabar-btn-ghost" style={{ fontSize: "12px" }}>
                Ver comprobante de venta
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AportesDetalle({ asociacionId, productorUID }) {
  const [aportes, setAportes] = useState([]);

  useEffect(() => {
    const fetchAportes = async () => {
      try {
        const q = query(
          collection(db, "producer_tokenizations"),
          where("associationId", "==", asociacionId)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(doc => doc.data())
          .filter(d => d.productorOwner === productorUID);
        setAportes(data);
      } catch (err) {
        console.error("Error fetching aportes:", err);
      }
    };
    fetchAportes();
  }, [asociacionId, productorUID]);

  return (
    <div style={{ fontSize: "12px" }}>
      {aportes.length === 0 ? (
        <p style={{ color: "#8B949E", margin: 0 }}>Sin aportes registrados</p>
      ) : (
        aportes.map((aporte, idx) => (
          <div
            key={idx}
            style={{
              padding: "8px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "4px",
              marginBottom: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B949E" }}>Aporte {idx + 1}</span>
              <span style={{ fontWeight: 600 }}>{aporte.aporteKgs} kg en {aporte.aporteFardos} fardos</span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#8B949E", fontSize: "11px" }}>
              📅 {new Date(aporte.timestamp?.toDate?.() || aporte.timestamp).toLocaleDateString("es-AR")}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
```

---

### CAMBIO 4: src/modules/layout/AppLayout.jsx

**ENCONTRAR la configuración de ROLE_TABS y MODIFICAR la sección de producer:**

```javascript
const ROLE_TABS = {
  producer: [
    { path: "/producer", label: "Dashboard" },
    { path: "/producer/tokenizar", label: "Certificación y Cotización" },
    { path: "/producer/asociaciones", label: "Mis Asociaciones" },  // ← AGREGAR ESTA LÍNEA
  ],
  // ... resto de roles ...
};
```

---

### CAMBIO 5: src/AppShell.jsx

**AGREGAR import al inicio del archivo:**
```javascript
import ProducerAsociaciones from "./pages/producer/asociaciones";
```

**AGREGAR la ruta dentro de la sección de rutas (buscar donde están otras rutas de producer):**
```javascript
<Route 
  path="/producer/asociaciones" 
  element={
    <ProtectedRoute allowedRoles={["producer"]}>
      <ProducerAsociaciones />
    </ProtectedRoute>
  } 
/>
```

---

### CAMBIO 6: firestore.rules

**AGREGAR esta regla ANTES del "Default deny" (antes de las últimas líneas):**

```firestore
// Producer Associations
match /producer_associations/{associationId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.creadoPor || 
     request.auth.uid in resource.data.productores[*].uid);
  allow delete: if request.auth.uid == resource.data.creadoPor;
}
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Primero:** Actualizar `firestore.rules` (cambio 6) y deployar
2. **Segundo:** Modificar `DataContext.jsx` (cambio 1) - agregar las tres funciones
3. **Tercero:** Actualizar `tokenizar.jsx` (cambio 2)
4. **Cuarto:** Crear nuevo archivo `asociaciones.jsx` (cambio 3)
5. **Quinto:** Actualizar `AppLayout.jsx` (cambio 4)
6. **Sexto:** Actualizar `AppShell.jsx` (cambio 5)

---

## VALIDACIONES Y TESTING

### Después de implementar, verificar:

1. ✅ Un productor puede certificar tabaco con "Venta Asociada"
2. ✅ Se crea una asociación automáticamente
3. ✅ El inventario se consolida correctamente
4. ✅ La página "Mis Asociaciones" muestra todas las asociaciones
5. ✅ Los aportes se detallan correctamente
6. ✅ No hay errores de Firestore permissions

### Casos de prueba:
- Productor A certifica 500 kgs con Venta Asociada → Productor B
- Productor B certifica 750 kgs con Venta Asociada → Productor A
- Verificar que la asociación tiene 1250 kgs totales
- Verificar que ambos productores ven la asociación en "Mis Asociaciones"
- Verificar que cada uno ve solo sus aportes

---

## NOTAS IMPORTANTES

- **Firestore:** Desplegar reglas primero para evitar errores de permisos
- **DataContext:** El `increment()` se importa correctamente dentro de la función
- **Timestamps:** Usar `serverTimestamp()` siempre (ya está importado en DataContext)
- **Nombres:** Se concatenan automáticamente desde `profile.firstName` y `profile.lastName`
- **Diseño:** Las nuevas vistas respetan la paleta de colores verde (#3FB950) del rol producer

---

## CAMBIOS HECHOS EN RESUMEN

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `firestore.rules` | Agregar regla para `producer_associations` | Agregado |
| `DataContext.jsx` | 3 funciones nuevas + modificar `tokenizarProducer` | Modificado |
| `tokenizar.jsx` | Actualizar `handleTokenizar` + nuevo import | Modificado |
| `asociaciones.jsx` | Crear nuevo archivo completo | **Nuevo** |
| `AppLayout.jsx` | Agregar tab para "Mis Asociaciones" | Modificado |
| `AppShell.jsx` | Agregar import + ruta | Modificado |
