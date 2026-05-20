# Cambios en tokenizar.jsx para Asociaciones

## Paso 1: Agregar imports

Al inicio del archivo, en la sección de imports, asegúrate que `obtenerAsociacionesDelProductor` esté importado:

```javascript
const { 
  tokenizarProducer, 
  crearOUnirseAsociacion, 
  obtenerAsociacionesDelProductor,  // ← AGREGAR
  unirseAAsociacion                 // ← AGREGAR
} = useData();
```

---

## Paso 2: Agregar estados

En la sección de `useState` al inicio del componente, DESPUÉS de los estados existentes, agregar:

```javascript
// Estados para asociaciones existentes
const [asociacionesDelProductor, setAsociacionesDelProductor] = useState([]);
const [asociacionSeleccionada, setAsociacionSeleccionada] = useState("");
const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);
const [modoAsociacion, setModoAsociacion] = useState("crear"); // "crear" o "unirse"
```

---

## Paso 3: Agregar useEffect para cargar asociaciones

Agregar este `useEffect` DESPUÉS del useEffect existente que carga productores:

```javascript
// Cargar asociaciones cuando el usuario elige venta asociada
useEffect(() => {
  if (user?.uid && tipoVenta === "asociada" && modoAsociacion === "unirse") {
    const fetchAsociaciones = async () => {
      setLoadingAsociaciones(true);
      try {
        const res = await obtenerAsociacionesDelProductor();
        if (res.ok) {
          setAsociacionesDelProductor(res.asociaciones || []);
        }
      } catch (err) {
        console.error("Error fetching asociaciones:", err);
      }
      setLoadingAsociaciones(false);
    };

    fetchAsociaciones();
  }
}, [user, tipoVenta, modoAsociacion]);
```

---

## Paso 4: Actualizar validación del formulario

Busca donde está `isFormValid` y reemplazalo con:

```javascript
// Validar que todos los campos estén completos
const isFormValid = totalKgs && tamanoFardo && tipoTabaco && calidad && tipoVenta && 
  (!precioVenta || parseFloat(precioVenta) > 0) && 
  (tipoVenta !== "asociada" || 
    (modoAsociacion === "unirse" && asociacionSeleccionada) || 
    (modoAsociacion === "crear" && productorAsociado));
```

---

## Paso 5: Actualizar handleTokenizar

Busca la función `handleTokenizar` y reemplázala con esta versión mejorada:

```javascript
const handleTokenizar = async () => {
  // Validaciones
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
        // OPCIÓN 1: Unirse a asociación existente
        const res = await unirseAAsociacion(asociacionSeleccionada, {
          tipoTabaco,
          calidad,
          kgs: parseInt(totalKgs),
          cantidadFardos,
          usdTotal
        });

        if (!res.ok) {
          setError(res.error);
          setLoading(false);
          return;
        }

        associationId = res.associationId;
      } else {
        // OPCIÓN 2: Crear nueva asociación
        producerObj = JSON.parse(productorAsociado);

        const assocRes = await crearOUnirseAsociacion(producerObj.uid, {
          tipoTabaco,
          calidad,
          kgs: parseInt(totalKgs),
          cantidadFardos,
          usdTotal,
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

    // Preparar datos de tokenización
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

    // Llamar a tokenizarProducer
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

## Paso 6: Agregar UI para modo de asociación

Busca donde están los radio buttons de "Tipo de Venta" y DESPUÉS de ellos, agregar esto:

```jsx
{/* Modo de asociación - NUEVO */}
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
          disabled={loading || showConfirm || asociacionesDelProductor.length === 0}
        />
        <span>Unirme a asociación existente {asociacionesDelProductor.length > 0 ? `(${asociacionesDelProductor.length})` : "(ninguna)"}</span>
      </label>
    </div>
  </div>
)}
```

---

## Paso 7: Agregar UI para productor (crear nueva)

DESPUÉS del código anterior, agregar:

```jsx
{/* Productor Asociado - para crear nueva asociación */}
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
        <option key={p.uid} value={JSON.stringify(p)}>
          {p.firstName} {p.lastName} ({p.documentNumber})
        </option>
      ))}
    </select>
  </div>
)}
```

---

## Paso 8: Agregar UI para asociación (unirse)

DESPUÉS del código anterior, agregar:

```jsx
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
      {asociacionesDelProductor.map(asoc => (
        <option key={asoc.id} value={asoc.id}>
          {asoc.nombre} - {asoc.productores?.length || 0} miembros, {asoc.inventario?.totalKgs || 0} Kgs
        </option>
      ))}
    </select>
  </div>
)}
```

---

## Resumen de Cambios en tokenizar.jsx

| Sección | Cambio | Tipo |
|---------|--------|------|
| Imports | Agregar `obtenerAsociacionesDelProductor` | Modificado |
| useState | Agregar 4 estados nuevos | Agregado |
| useEffect | Agregar carga de asociaciones | Agregado |
| isFormValid | Actualizar validación | Modificado |
| handleTokenizar | Agregar lógica de unirse | Modificado |
| JSX | Agregar radio buttons de modo | Agregado |
| JSX | Agregar select de productor | Agregado |
| JSX | Agregar select de asociación | Agregado |

---

## Orden de Inserción Recomendado

1. ✅ Agregar imports
2. ✅ Agregar estados
3. ✅ Agregar useEffect
4. ✅ Actualizar isFormValid
5. ✅ Reemplazar handleTokenizar
6. ✅ Agregar UI en orden: radio buttons → productor → asociación

---

## Notas Importantes

- El `modoAsociacion` por defecto es "crear" para mantener compatibilidad hacia atrás
- Las asociaciones se cargan solo cuando `tipoVenta === "asociada"` y `modoAsociacion === "unirse"`
- Los productores se cargan cuando `modoAsociacion === "crear"`
- La validación del formulario ahora requiere una asociación seleccionada si se elige "unirse"
- El `handleTokenizar` ahora maneja ambos casos: crear nueva o unirse a existente
