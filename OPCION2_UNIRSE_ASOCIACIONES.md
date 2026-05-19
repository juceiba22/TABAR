# Opción 2: Funcionalidad de Unirse a Asociaciones Existentes

## CAMBIO 1: DataContext.jsx

**Agregar esta nueva función DESPUÉS de `crearOUnirseAsociacion`:**

```javascript
// Nueva función para unirse a una asociación existente
const unirseAAsociacion = async (associationId, datosTokenizacion) => {
  try {
    const assocRef = doc(db, "producer_associations", associationId);
    const assocSnap = await getDoc(assocRef);
    
    if (!assocSnap.exists()) {
      return { ok: false, error: "Asociación no encontrada" };
    }
    
    const assoc = assocSnap.data();
    
    // Verificar si el usuario ya está en la asociación
    const yaEstá = assoc.productores.some(p => p.uid === user.uid);
    
    if (!yaEstá) {
      // Agregar el usuario a la asociación
      const nuevoProductor = {
        uid: user.uid,
        nombre: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        email: user.email,
        rol: "miembro"
      };
      
      await updateDoc(assocRef, {
        productores: arrayUnion(nuevoProductor),
        actualizadoEn: serverTimestamp()
      });
    }
    
    return { ok: true, associationId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
```

**IMPORTANTE:** Agregar esta importación en la cabecera si no está:
```javascript
import { arrayUnion } from "firebase/firestore";
```

**Exportar en el return del provider:**
```javascript
return (
  <DataContext.Provider value={{
    // ... valores existentes ...
    unirseAAsociacion,  // ← AGREGAR
    // ... resto de valores ...
  }}>
```

---

## CAMBIO 2: src/pages/producer/tokenizar.jsx

**REEMPLAZAR COMPLETAMENTE la sección de estados y efectos al inicio del componente:**

```javascript
export default function ProducerTokenizar() {
  const { tokenizarProducer, crearOUnirseAsociacion, unirseAAsociacion } = useData();
  const { user } = useRole();

  // Estados del formulario
  const [totalKgs, setTotalKgs] = useState("");
  const [tamanoFardo, setTamanoFardo] = useState("");
  const [tipoTabaco, setTipoTabaco] = useState("");
  const [calidad, setCalidad] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [productoresDisponibles, setProductoresDisponibles] = useState([]);
  const [productorAsociado, setProductorAsociado] = useState("");
  const [loadingProductores, setLoadingProductores] = useState(false);

  // NUEVO: Estados para asociaciones existentes
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState([]);
  const [asociacionSeleccionada, setAsociacionSeleccionada] = useState("");
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);
  const [modoAsociacion, setModoAsociacion] = useState("crear"); // "crear" o "unirse"

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");

  // Calcular cantidad de fardos basado en Kgs y tamaño
  const numTotalKgs = parseInt(totalKgs) || 0;
  const numTamanoFardo = parseInt(tamanoFardo) || 0;
  const cantidadFardos = numTamanoFardo > 0 ? Math.ceil(numTotalKgs / numTamanoFardo) : 0;
  const precioFinal = precioVenta ? parseFloat(precioVenta) : 85;
  const usdTotal = cantidadFardos * precioFinal;

  // NUEVO: Traer asociaciones disponibles para unirse
  useEffect(() => {
    if (user?.uid && tipoVenta === "asociada") {
      const fetchAsociaciones = async () => {
        setLoadingAsociaciones(true);
        try {
          const q = query(collection(db, "producer_associations"));
          const querySnapshot = await getDocs(q);
          const asociaciones = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const yaEstá = data.productores.some(p => p.uid === user.uid);
            
            // Mostrar asociaciones donde el usuario NO está aún
            if (!yaEstá) {
              asociaciones.push({
                id: doc.id,
                nombre: data.nombre,
                totalKgs: data.inventario?.totalKgs || 0,
                totalFardos: data.inventario?.totalFardos || 0,
                productores: data.productores.map(p => p.nombre).join(", ")
              });
            }
          });
          
          setAsociacionesDisponibles(asociaciones);
        } catch (err) {
          console.error("Error fetching asociaciones:", err);
        }
        setLoadingAsociaciones(false);
      };
      
      fetchAsociaciones();
    }
  }, [user, tipoVenta]);

  // Traer productores disponibles para la Venta Asociada
  useEffect(() => {
    if (user?.uid && tipoVenta === "asociada" && modoAsociacion === "crear") {
      const fetchProducers = async () => {
        setLoadingProductores(true);
        try {
          const q = query(collection(db, "users"), where("role", "==", "producer"));
          const querySnapshot = await getDocs(q);
          const producers = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.uid !== user.uid) {
              producers.push({
                uid: data.uid,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                documentNumber: data.documentNumber || "",
                email: data.email || ""
              });
            }
          });
          producers.sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));
          setProductoresDisponibles(producers);
        } catch (err) {
          console.error("Error fetching producers:", err);
        }
        setLoadingProductores(false);
      };
      fetchProducers();
    }
  }, [user, tipoVenta, modoAsociacion]);

  // Validar que todos los campos estén completos
  const isFormValid = totalKgs && tamanoFardo && tipoTabaco && calidad && tipoVenta && 
    (!precioVenta || parseFloat(precioVenta) > 0) && 
    (tipoVenta !== "asociada" || 
      (modoAsociacion === "unirse" && asociacionSeleccionada) || 
      (modoAsociacion === "crear" && productorAsociado));

  // ... resto del código igual (generarCodigoTransaccion, generarCertificadoPDF) ...
```

---

## CAMBIO 3: Reemplazar `handleTokenizar` en tokenizar.jsx

```javascript
const handleTokenizar = async () => {
  if (tipoVenta === "asociada") {
    if (modoAsociacion === "unirse" && !asociacionSeleccionada) {
      setError("Debes seleccionar una asociación");
      return;
    }
    if (modoAsociacion === "crear" && !productorAsociado) {
      setError("Debes seleccionar un productor asociado");
      return;
    }
  }
  
  setError("");
  setLoading(true);

  let associationId = null;
  let producerObj = null;

  try {
    if (tipoVenta === "asociada") {
      if (modoAsociacion === "unirse") {
        // Unirse a asociación existente
        const res = await unirseAAsociacion(asociacionSeleccionada, {
          tipoTabaco,
          calidad,
          precioVenta: precioFinal
        });
        
        if (!res.ok) {
          setError(res.error);
          setLoading(false);
          return;
        }
        
        associationId = res.associationId;
      } else {
        // Crear nueva asociación
        producerObj = JSON.parse(productorAsociado);
        
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
  } catch (err) {
    setError(err.message || "Error al procesar");
  }
  
  setLoading(false);
};
```

---

## CAMBIO 4: Agregar UI en tokenizar.jsx

**DESPUÉS de la sección de "Tipo de Venta" radio buttons, agregar esto:**

```jsx
{/* Modo de asociación */}
{tipoVenta === "asociada" && (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
      ¿Cómo deseas asociarte? *
    </label>
    <div style={{ display: "flex", gap: "16px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
        <input
          type="radio"
          name="modoAsociacion"
          value="crear"
          checked={modoAsociacion === "crear"}
          onChange={(e) => {
            setModoAsociacion(e.target.value);
            setAsociacionSeleccionada("");
          }}
          disabled={loading || showConfirm}
        />
        <span>Crear nueva asociación</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
        <input
          type="radio"
          name="modoAsociacion"
          value="unirse"
          checked={modoAsociacion === "unirse"}
          onChange={(e) => {
            setModoAsociacion(e.target.value);
            setProductorAsociado("");
          }}
          disabled={loading || showConfirm || asociacionesDisponibles.length === 0}
        />
        <span>Unirme a asociación existente {asociacionesDisponibles.length > 0 ? `(${asociacionesDisponibles.length} disponibles)` : "(ninguna disponible)"}</span>
      </label>
    </div>
  </div>
)}

{/* Productor Asociado - para crear nueva */}
{tipoVenta === "asociada" && modoAsociacion === "crear" && (
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
      <option value="">{loadingProductores ? "Cargando productores..." : "Seleccionar productor asociado"}</option>
      {productoresDisponibles.map(p => (
        <option key={p.uid} value={JSON.stringify(p)}>{p.firstName} {p.lastName} ({p.documentNumber}) - {p.email}</option>
      ))}
    </select>
  </div>
)}

{/* Asociación Existente - para unirse */}
{tipoVenta === "asociada" && modoAsociacion === "unirse" && (
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
      <option value="">{loadingAsociaciones ? "Cargando asociaciones..." : "Seleccionar asociación"}</option>
      {asociacionesDisponibles.map(asoc => (
        <option key={asoc.id} value={asoc.id}>
          {asoc.nombre} - {asoc.totalKgs} Kgs, {asoc.totalFardos} fardos ({asoc.productores})
        </option>
      ))}
    </select>
  </div>
)}
```

---

## RESUMEN DE CAMBIOS

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `DataContext.jsx` | Agregar función `unirseAAsociacion` | Agregado |
| `tokenizar.jsx` | Agregar importación `unirseAAsociacion` | Modificado |
| `tokenizar.jsx` | Nuevos estados para asociaciones | Modificado |
| `tokenizar.jsx` | Nuevo `useEffect` para cargar asociaciones | Agregado |
| `tokenizar.jsx` | Nuevo estado `modoAsociacion` | Agregado |
| `tokenizar.jsx` | Reemplazar `handleTokenizar` | Modificado |
| `tokenizar.jsx` | Agregar UI para modo de asociación | Agregado |

---

## FLUJO RESULTANTE

**Usuario A:**
1. Certifica con "Venta Asociada"
2. Selecciona "Crear nueva asociación"
3. Selecciona Usuario B
4. ✅ Crea la asociación

**Usuario B:**
1. Va a certificar
2. Selecciona "Venta Asociada"
3. Selecciona "Unirme a asociación existente"
4. Ve la asociación creada por Usuario A
5. La selecciona
6. ✅ Se une automáticamente y certifica

---

## ¿Necesitás que lo agregue todo a un prompt para Gemini?
