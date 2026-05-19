# Prompt Completo para Gemini 3.1 Pro - Sistema de Asociaciones de Productores TABAR

## INSTRUCCIÓN PRINCIPAL

Implementa un **sistema completo de asociaciones de productores** en la plataforma TABAR que permita:

1. **Usuario A** crear una asociación al certificar tabaco con "Venta Asociada"
2. **Usuario B** unirse a la asociación existente creada por Usuario A
3. Ambos productores pueden consolidar sus kilos para venta en bloque
4. Visualizar todas las asociaciones y sus inventarios consolidados

El sistema debe incluir:
- Nueva colección Firestore `producer_associations`
- Vinculación de tokenizaciones a asociaciones
- Opción de crear nueva asociación O unirse a existente
- Nueva página de visualización "Mis Asociaciones"
- Actualización de reglas de seguridad Firestore

---

## ESPECIFICACIONES TÉCNICAS

### 1. ESTRUCTURA DE DATOS - Colección `producer_associations`

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

### CAMBIO 1: firestore.rules

**UBICACIÓN:** En Firebase Console → Firestore → Rules

**BUSCAR esta línea en tu archivo actual:**
```firestore
// Producer Tokenizations
match /producer_tokenizations/{document=**} {
```

**DESPUÉS de esa sección, AGREGAR esto:**

```firestore
// Producer Associations
match /producer_associations/{associationId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null && request.auth.uid == resource.data.creadoPor;
}
```

**IMPORTANTE:** Debe quedar antes del "Default deny" al final del archivo.

---

### CAMBIO 2: src/modules/roles/DataContext.jsx

**AGREGAR esta importación en la cabecera (si no está):**
```javascript
import { arrayUnion, getDoc } from "firebase/firestore";
```

**ENCONTRAR la función `tokenizarProducer` existente y MANTENERLA IGUAL.**

**AGREGAR DESPUÉS de `tokenizarProducer`, estas tres nuevas funciones:**

```javascript
// Función para crear o unirse a una asociación
const crearOUnirseAsociacion = async (productorAsociadoUID, datosAsociacion) => {
  try {
    // Verificar si existe asociación entre estos productores
    const q = query(
      collection(db, "producer_associations"),
      where("productores", "array-contains", { uid: user.uid })
    );
    
    const existentes = await getDocs(q);
    let associationId = null;
    
    if (existentes.docs.length > 0) {
      // Buscar si el otro productor ya está en alguna asociación
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

// Función para unirse a una asociación existente
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

// Función para vender en bloque
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

**MODIFICAR la función `tokenizarProducer` existente - REEMPLAZAR COMPLETAMENTE:**

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
```

**EXPORTAR las nuevas funciones en el return del provider:**

```javascript
return (
  <DataContext.Provider value={{
    // ... valores existentes ...
    tokenizarProducer,
    crearOUnirseAsociacion,      // ← AGREGAR
    unirseAAsociacion,            // ← AGREGAR
    venderAsociacionEnBloque,     // ← AGREGAR
    // ... resto de valores ...
  }}>
    {children}
  </DataContext.Provider>
);
```

---

### CAMBIO 3: src/pages/producer/tokenizar.jsx

**REEMPLAZAR completamente la sección de importaciones y estados iniciales:**

```javascript
import { useState, useEffect } from "react";
import { useData } from "../../modules/roles/DataContext";
import { useRole } from "../../modules/roles/RoleContext";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

const C = { accent: "#3FB950", dim: "rgba(63,185,80,0.10)" };

// Opciones de Tipo de Tabaco
const TIPOS_TABACO = [
  { value: "virginia", label: "Virginia" },
  { value: "burley", label: "Burley" },
  { value: "criollo", label: "Criollo" }
];

// Opciones de Calidad
const OPCIONES_CALIDAD = [
  "T1F", "T1L", "B1F", "B1L", "C1F", "C1L", "X1F", "X1L",
  "T2F", "T2L", "T2KL", "T2KF", "B2F", "B2L", "B2KL", "B2KF",
  "C2F", "C2L", "C2K", "X2F", "X2L", "X2K",
  "B3F", "B3L", "B3KL", "B3KF", "C3F", "C3L", "C3K", "X3F", "X3L", "X3K",
  "B4F", "B4L"
];

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

  // Estados para asociaciones existentes
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

  // Traer asociaciones disponibles para unirse
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

  // Generar código de transacción único
  const generarCodigoTransaccion = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TABAR-${timestamp}-${random}`;
  };

  // Generar PDF con datos del certificado
  const generarCertificadoPDF = (producerObj) => {
    const doc = new jsPDF();
    const codigo = generarCodigoTransaccion();
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CERTIFICADO DE CERTIFICACIÓN Y COTIZACIÓN TABAR", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Certificación y Digitalización de Activos Tabacaleros", 20, 28);

    // Línea divisoria
    doc.setDrawColor(63, 185, 80);
    doc.line(20, 32, 190, 32);

    // Sección: Datos del Productor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL PRODUCTOR", 20, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${user?.displayName || "No disponible"}`, 20, 50);
    doc.text(`Email: ${user?.email || "No disponible"}`, 20, 57);
    doc.text(`ID Productor: ${user?.uid?.substring(0, 12) || "No disponible"}`, 20, 64);

    // Sección: Detalles del Lote
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DETALLES DEL LOTE", 20, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Kgs a Certificar: ${totalKgs} kg`, 20, 83);
    doc.text(`Tamaño del Fardo: ${tamanoFardo} kg`, 20, 90);
    doc.text(`Cantidad de Fardos: ${cantidadFardos}`, 20, 97);
    doc.text(`Tipo de Tabaco: ${TIPOS_TABACO.find(t => t.value === tipoTabaco)?.label || tipoTabaco}`, 20, 104);
    doc.text(`Calidad: ${calidad}`, 20, 111);
    doc.text(`Tipo de Venta: ${tipoVenta === "individual" ? "Venta Individual" : "Venta Asociada"}`, 20, 118);

    // Sección: Precios
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PRECIOS", 20, 129);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Precio USD Financing (acopiador): $85`, 20, 137);
    doc.text(`Precio de Venta (productor): $${precioVenta ? precioVenta : "No especificado"}`, 20, 144);

    let yPos = 155;

    // Sección: Financiamiento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FINANCIAMIENTO ADELANTADO", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Monto USD: USD ${usdTotal.toLocaleString("es-AR")}`, 20, yPos);
    yPos += 7;
    doc.text(`Activos TABAR Generados: ${cantidadFardos.toLocaleString("es-AR")}`, 20, yPos);
    yPos += 11;

    // Sección Productor Asociado si existe
    if (producerObj) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("PRODUCTOR ASOCIADO", 20, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Nombre: ${producerObj.firstName} ${producerObj.lastName}`, 20, yPos);
        yPos += 7;
        doc.text(`DNI: ${producerObj.documentNumber}`, 20, yPos);
        yPos += 7;
        doc.text(`Email: ${producerObj.email}`, 20, yPos);
        yPos += 11;
    }

    // Sección: Información de Transacción
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMACIÓN DE TRANSACCIÓN", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Código de Transacción: ${codigo}`, 20, yPos);
    yPos += 7;
    doc.text(`Fecha y Hora: ${fechaHora}`, 20, yPos);
    yPos += 7;
    doc.text(`Estado: Certificado y Tokenizado`, 20, yPos);

    // Pie de página
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(139, 148, 158);
    doc.text("Este certificado es un comprobante digital de la certificación realizada en la plataforma TABAR.", 20, 250);
    doc.text("La existencia de este documento implica la aceptación de los términos y condiciones del financiamiento tabacalero.", 20, 256);

    // Guardar el PDF
    doc.save(`TABAR_Certificado_${codigo}.pdf`);

    return codigo;
  };

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

  if (success) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🌿</div>
        <h2 style={{ color: "#3FB950", marginBottom: "12px" }}>¡Certificación Exitosa!</h2>
        <p style={{ color: "#8B949E", marginBottom: "12px", fontSize: "12px" }}>
          Tus {cantidadFardos} fardos ({totalKgs} kg) han sido certificados y ya están a la venta.
        </p>
        <div style={{
          background: "rgba(63,185,80,0.1)",
          border: "1px solid rgba(63,185,80,0.3)",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          fontSize: "11px"
        }}>
          <p style={{ margin: "0 0 8px 0", color: "#8B949E" }}>Código de Transacción:</p>
          <p style={{ margin: 0, color: "#3FB950", fontFamily: "monospace", fontWeight: "bold", fontSize: "13px" }}>
            {transactionCode}
          </p>
        </div>
        <p style={{ color: "#8B949E", marginBottom: "30px", fontSize: "12px" }}>
          Tu tabaco ha sido cotizado exitosamente por nuestro sistema.
          <br />
          Se ha generado un PDF con los detalles del certificado.
        </p>
        <Link to="/producer" className="tabar-btn tabar-btn-primary">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Certificación y Cotización</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Transformá tu tabaco físico en activos digitales financieros</p>
      </div>

      <div className="tabar-card">
        <h3 className="tabar-card-title">Información del Lote</h3>

        {/* Total Kgs a Certificar */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Total Kgs a Certificar *
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej. 500"
            value={totalKgs}
            onChange={(e) => setTotalKgs(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
            Cantidad total de kilos de tabaco a certificar
          </p>
        </div>

        {/* Tamaño del Fardo */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tamaño del Fardo (kg) *
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej. 50"
            value={tamanoFardo}
            onChange={(e) => setTamanoFardo(e.target.value)}
            disabled={loading || showConfirm}
          />
          <p style={{ fontSize: "11px", color: "#484F58", marginTop: "6px" }}>
            Peso de cada fardo individual
          </p>
        </div>

        {/* Precio de venta */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Precio de venta ($)
          </label>
          <input
            type="number"
            className="tabar-input"
            placeholder="Ej: 2.50"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            disabled={loading || showConfirm}
          />
        </div>

        {/* Tipo de Tabaco */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tipo de Tabaco *
          </label>
          <select
            className="tabar-input"
            value={tipoTabaco}
            onChange={(e) => setTipoTabaco(e.target.value)}
            disabled={loading || showConfirm}
            style={{ cursor: "pointer" }}
          >
            <option value="">Seleccionar tipo de tabaco</option>
            {TIPOS_TABACO.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </div>

        {/* Calidad */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Calidad *
          </label>
          <select
            className="tabar-input"
            value={calidad}
            onChange={(e) => setCalidad(e.target.value)}
            disabled={loading || showConfirm}
            style={{ cursor: "pointer" }}
          >
            <option value="">Seleccionar calidad</option>
            {OPCIONES_CALIDAD.map(opcion => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        </div>

        {/* Tipo de Venta */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "8px", fontWeight: 500 }}>
            Tipo de Venta *
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="radio"
                name="tipoVenta"
                value="individual"
                checked={tipoVenta === "individual"}
                onChange={(e) => { setTipoVenta(e.target.value); setProductorAsociado(""); setAsociacionSeleccionada(""); }}
                disabled={loading || showConfirm}
              />
              <span>Venta Individual</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="radio"
                name="tipoVenta"
                value="asociada"
                checked={tipoVenta === "asociada"}
                onChange={(e) => setTipoVenta(e.target.value)}
                disabled={loading || showConfirm}
              />
              <span>Venta Asociada</span>
            </label>
          </div>
        </div>

        {/* Modo de asociación - para crear o unirse */}
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

        {/* Resumen de la operación */}
        {cantidadFardos > 0 && !showConfirm && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--tb-border)",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--tb-text-2)" }}>Resumen de la operación</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Total Kgs a certificar</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{totalKgs} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Tamaño por fardo</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>{tamanoFardo} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Cantidad de fardos</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>{cantidadFardos}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Precio USD Financing</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>$85</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Precio de Venta</span>
              <span style={{ color: "var(--tb-text)", fontFamily: "var(--tb-mono)" }}>${precioVenta ? precioVenta : "85"}</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#8B949E" }}>Financiamiento adelantado (USD)</span>
              <span style={{ color: "#3FB950", fontWeight: 600, fontFamily: "var(--tb-mono)" }}>USD {usdTotal.toLocaleString("es-AR")}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: "#F85149", fontSize: "12px", marginBottom: "16px", padding: "10px", background: "rgba(248,81,73,0.1)", borderRadius: "6px", border: "1px solid rgba(248,81,73,0.2)" }}>
            {error}
          </div>
        )}

        {!showConfirm ? (
          <button
            className="tabar-btn tabar-btn-primary"
            disabled={!isFormValid || loading}
            onClick={() => setShowConfirm(true)}
            style={{ opacity: !isFormValid ? 0.5 : 1, cursor: !isFormValid ? "not-allowed" : "pointer" }}
          >
            {!isFormValid ? "Completa todos los campos" : "Generar Certificado"}
          </button>
        ) : (
          <div style={{
            background: "rgba(227,182,79,0.05)",
            border: "1px solid rgba(227,182,79,0.2)",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center"
          }}>
            <h4 style={{ color: "#E3B64F", margin: "0 0 10px 0" }}>Confirmar Firma Digital</h4>
            <p style={{ fontSize: "12px", color: "#8B949E", marginBottom: "20px" }}>
              Estás por certificar legalmente {cantidadFardos} fardos ({totalKgs} kg) de {tipoTabaco === "virginia" ? "Virginia" : tipoTabaco === "burley" ? "Burley" : "Criollo"}.
              <br />
              Esta acción es irreversible en el registro fiduciario y generará un PDF con el código de transacción.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="tabar-btn tabar-btn-ghost"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="tabar-btn tabar-btn-primary"
                style={{ background: "#E3B64F", color: "#000" }}
                onClick={handleTokenizar}
                disabled={loading}
              >
                {loading ? "Certificando..." : "Confirmar y Generar Certificado"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", padding: "14px", background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", color: "#58A6FF", margin: 0 }}>
          ℹ️ Actualmente hay disponibles TABAR en la campaña activa.
        </p>
      </div>
    </div>
  );
}
```

---

### CAMBIO 4: CREAR NUEVO ARCHIVO - src/pages/producer/asociaciones.jsx

**Crear completamente este archivo:**

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

### CAMBIO 5: src/modules/layout/AppLayout.jsx

**ENCONTRAR la configuración de ROLE_TABS (buscar "const ROLE_TABS"):**

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

### CAMBIO 6: src/AppShell.jsx

**AGREGAR esta importación al inicio del archivo:**

```javascript
import ProducerAsociaciones from "./pages/producer/asociaciones";
```

**ENCONTRAR dónde están las rutas de producer (buscar "Route path="/producer") y AGREGAR esto:**

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

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Primero:** Actualizar `firestore.rules` (cambio 1) y deployar en Firebase
2. **Segundo:** Modificar `DataContext.jsx` (cambio 2)
3. **Tercero:** Reemplazar `tokenizar.jsx` (cambio 3)
4. **Cuarto:** Crear nuevo archivo `asociaciones.jsx` (cambio 4)
5. **Quinto:** Actualizar `AppLayout.jsx` (cambio 5)
6. **Sexto:** Actualizar `AppShell.jsx` (cambio 6)

---

## VALIDACIONES Y TESTING

### Después de implementar, verificar:

✅ Usuario A puede certificar tabaco con "Venta Asociada"  
✅ Se crea una asociación automáticamente  
✅ El inventario se consolida correctamente  
✅ Usuario B ve la asociación disponible en el dropdown  
✅ Usuario B puede seleccionar "Unirme a asociación existente"  
✅ Usuario B se une correctamente a la asociación  
✅ Ambos ven la asociación en "Mis Asociaciones"  
✅ Cada uno ve solo sus aportes (kgs, fardos)  
✅ El inventario se actualiza cuando ambos aportarán

### Casos de prueba:

**Caso 1:**
1. Usuario A certifica 500 kgs (10 fardos) con Venta Asociada
2. Selecciona "Crear nueva asociación"
3. Selecciona Usuario B
4. ✅ Se crea la asociación con 500 kgs

**Caso 2:**
1. Usuario B va a certificar
2. Selecciona "Venta Asociada"
3. Selecciona "Unirme a asociación existente"
4. Ve la asociación creada por Usuario A
5. ✅ Se une y certifica 750 kgs
6. ✅ La asociación ahora tiene 1250 kgs totales (500 + 750)

**Caso 3:**
1. Ambos usuarios van a "Mis Asociaciones"
2. ✅ Ven la misma asociación
3. Usuario A ve su aporte de 500 kgs
4. Usuario B ve su aporte de 750 kgs

---

## NOTAS IMPORTANTES

- **Firestore:** Desplegar reglas primero en Firebase Console
- **Importaciones:** `arrayUnion` debe estar importado en DataContext
- **Timestamps:** Usar `serverTimestamp()` siempre
- **Nombres:** Se concatenan automáticamente desde `profile.firstName` y `profile.lastName`
- **Diseño:** Las nuevas vistas respetan la paleta verde (#3FB950)
- **Dropdowns:** Se cargan dinámicamente, muestran solo asociaciones donde el usuario NO está

---

## CAMBIOS EN RESUMEN

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `firestore.rules` | Agregar regla para `producer_associations` | Agregado |
| `DataContext.jsx` | 3 funciones nuevas + modificar `tokenizarProducer` | Modificado |
| `tokenizar.jsx` | Reemplazar completamente (agregar opciones de asociación) | Modificado |
| `asociaciones.jsx` | Crear nuevo archivo completo | **Nuevo** |
| `AppLayout.jsx` | Agregar tab para "Mis Asociaciones" | Modificado |
| `AppShell.jsx` | Agregar import + ruta | Modificado |

---

## RESULTADO FINAL

- ✅ Usuario A crea una asociación
- ✅ Usuario B ve y se une a la asociación existente
- ✅ Ambos ven el inventario consolidado
- ✅ Ambos ven sus aportes individuales
- ✅ Pueden vender en bloque posteriormente
