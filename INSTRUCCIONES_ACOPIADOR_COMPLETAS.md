# Instrucciones - Módulo Acopiador (Antes Industria)

## 📌 CAMBIOS PRINCIPALES

Se han realizado los siguientes cambios en el módulo de **Industria → Acopiador**:

### 1. Cambio de Nombre de Rol
- **Antes:** "Industria" → **Ahora:** "Acopiador"

### 2. Modificación Pestaña TABAR
- **Antes:** "Comprar producción anticipada" → **Ahora:** "Emitir Orden de Compra"
- **Antes:** "Adquirí fardos digitales TABAR con descuento garantizado" → **Ahora:** "Configurá el precio que estás dispuesto a pagar"
- ✅ Nuevo formulario con 5 campos
- ✅ Generación de PDF con datos del acopiador
- ✅ Carga a Firebase Storage

### 3. Nueva Pestaña FINANCIAMIENTO
- ✅ Título: "Solicitá financiamiento"
- ✅ Subtítulo: "Poné en garantía tu tabaco y obtené liquidez ahora mismo"
- ✅ Nuevo formulario con 4 campos
- ✅ Carga de archivos de Warrant
- ✅ Carga a Firebase Storage

---

## 🔧 PASOS DE IMPLEMENTACIÓN

### PASO 1: Cambiar "Industria" a "Acopiador"

#### A. En LandingRole.jsx
Busca esta línea:
```javascript
{ id: "industry", title: "Industria", subtitle: "Exportador / Productor" },
```

Reemplázala por:
```javascript
{ id: "industry", title: "Acopiador", subtitle: "Acopiador / Exportador" },
```

#### B. En IndustryDashboard.jsx
Busca esta línea:
```javascript
<h1>Mi Dashboard — Industria</h1>
```

Reemplázala por:
```javascript
<h1>Mi Dashboard — Acopiador</h1>
```

#### C. En cualquier otro archivo que mencione "Industria"
- Busca con Ctrl+F "Industria" en todos los archivos
- Reemplaza por "Acopiador" donde sea relevante

---

### PASO 2: Reemplazar buy.jsx

**Ruta:** `src/pages/industry/buy.jsx`

1. Abre `src/pages/industry/buy.jsx`
2. Borra TODO su contenido
3. Copia TODO el contenido de `industry_buy_mejorado.jsx`
4. Guarda el archivo

---

### PASO 3: Crear nueva pestaña financing.jsx

**Ruta:** `src/pages/industry/financing.jsx`

1. Crea un archivo nuevo llamado `financing.jsx` en `src/pages/industry/`
2. Copia TODO el contenido de `industry_financing.jsx`
3. Guarda el archivo

---

### PASO 4: Actualizar App.jsx o rutas

Necesitas agregar la ruta para la nueva pestaña en tu archivo de rutas (probablemente `App.jsx`):

```javascript
// Importar el componente
import IndustryFinancing from "./pages/industry/financing";

// Agregar la ruta en el switch/routes
<Route path="/industry/financing" element={<IndustryFinancing />} />
```

---

### PASO 5: Actualizar DataContext

En `src/modules/roles/DataContext.jsx`, necesitas:

#### A. Agregar dos nuevas funciones (busca donde están las funciones async)

```javascript
// Para órdenes de compra
const requestPurchaseOrder = async (ordenData) => {
  try {
    const docRef = doc(db, "purchase_orders", `${Date.now()}`);
    await setDoc(docRef, {
      ...ordenData,
      estado: "emitida"
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// Para solicitudes de financiamiento
const requestFinancing = async (financingData) => {
  try {
    const docRef = doc(db, "financing_requests", `${Date.now()}`);
    await setDoc(docRef, {
      ...financingData,
      estado: "pendiente_aprobacion"
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
```

#### B. Exportar estas funciones en el return del provider

```javascript
return (
  <DataContext.Provider value={{
    // ... otras funciones ...
    comprarIndustry,
    requestPurchaseOrder,  // ← AGREGAR
    requestFinancing,      // ← AGREGAR
  }}>
```

#### C. Modificar la función comprarIndustry para aceptar objetos

Busca la función `const comprarIndustry = async (cantidad)` y reemplázala por:

```javascript
const comprarIndustry = async (datos) => {
  try {
    // Si es un objeto (nueva orden de compra)
    if (typeof datos === "object" && datos.numeroOrden) {
      const docRef = doc(db, "purchase_orders", `${Date.now()}`);
      await setDoc(docRef, {
        ...datos,
        estado: "emitida"
      });
      await addHistorial(`✅ Acopiador emitió orden de compra de ${datos.cantidadKgs} Kgs de ${datos.tipoTabaco}`, "success");
      return { ok: true };
    }
    
    // Si es un número (compatibilidad anterior)
    if (typeof datos === "number") {
      const cantidad = datos;
      // ... resto del código anterior ...
    }
    
    return { ok: false, error: "Formato de datos inválido" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
```

---

### PASO 6: Actualizar AppShell o Navegación

En el componente donde muestres las pestañas del Acopiador, agrega la nueva pestaña:

```javascript
// Busca donde están las opciones de industry
<Link to="/industry/buy">Emitir Orden de Compra</Link>
<Link to="/industry/financing">Solicitar Financiamiento</Link>
```

---

### PASO 7: Configurar Firestore Rules

En Firebase Console → Firestore Database → Rules, agrega:

```javascript
// Órdenes de compra
match /purchase_orders/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.userId;
}

// Solicitudes de financiamiento
match /financing_requests/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.userId;
}

// Órdenes de compra (PDFs)
match /purchase_orders_pdfs/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}

// Warrants
match /financing_warrants/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### PASO 8: Configurar Storage Rules

En Firebase Console → Storage → Rules, agrega:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Órdenes de compra
    match /purchase_orders/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Warrants
    match /financing_warrants/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Denegar todo lo demás
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📦 ESTRUCTURA DE DATOS EN FIRESTORE

### Colección: purchase_orders (Órdenes de Compra)
```json
{
  "numeroOrden": "ORD-1716046200000-a7b9c2d",
  "tipoTabaco": "Virginia",
  "calidadSolicitada": "T1F",
  "cantidadKgs": 1000,
  "precioDisponible": 2.50,
  "montoTotal": "2500.00",
  "notaAdicional": "Texto opcional",
  "pdfUrl": "https://firebasestorage.googleapis.com/...",
  "pdfNombre": "orden_compra_1716046200000_a7b9c2d.pdf",
  "userId": "abc123xyz",
  "estado": "emitida",
  "fechaCreacion": "2026-05-18T15:30:00.000Z",
  "creadoPor": "acopiador@example.com"
}
```

### Colección: financing_requests (Solicitudes de Financiamiento)
```json
{
  "numeroSolicitud": "FIN-1716046200000-a7b9c2d",
  "motivoFinanciamiento": "Compra de Tabaco Verde",
  "tipoTabacoGarantia": "Burley",
  "warrantUrl": "https://firebasestorage.googleapis.com/...",
  "warrantNombre": "garantia.pdf",
  "warrantTamaño": "2.45",
  "plazo": 30,
  "userId": "abc123xyz",
  "estado": "pendiente_aprobacion",
  "fechaCreacion": "2026-05-18T15:30:00.000Z",
  "creadoPor": "acopiador@example.com"
}
```

---

## 🎯 FLUJOS DE USUARIO

### Flujo 1: Emitir Orden de Compra
```
1. Acopiador abre "Emitir Orden de Compra"
   ↓
2. Selecciona tipo de tabaco (Virginia, Burley, etc.)
   ↓
3. Selecciona calidad (T1F, B1L, etc.)
   ↓
4. Ingresa cantidad en Kgs
   ↓
5. Ingresa precio que está dispuesto a pagar
   ↓
6. (Opcional) Agrega nota adicional
   ↓
7. Click "Revisar orden"
   ↓
8. Confirmación con todos los datos
   ↓
9. Click "Emitir orden de compra"
   ↓
10. Sistema genera PDF con datos del acopiador
   ↓
11. Carga PDF a Firebase Storage
   ↓
12. Guarda en Firestore
   ↓
13. Pantalla de éxito
```

### Flujo 2: Solicitar Financiamiento
```
1. Acopiador abre "Solicitar Financiamiento"
   ↓
2. Selecciona motivo (Inicio campaña, Compra Tabaco, etc.)
   ↓
3. Si selecciona "Otro", completa campo de texto
   ↓
4. Selecciona tipo de tabaco en garantía
   ↓
5. Carga archivo de Warrant
   ↓
6. Selecciona plazo (15, 30, 60 o 90 días)
   ↓
7. Click "Revisar solicitud"
   ↓
8. Confirmación con todos los datos
   ↓
9. Click "Solicitar financiamiento"
   ↓
10. Carga archivo a Firebase Storage
   ↓
11. Guarda en Firestore
   ↓
12. Pantalla de éxito
```

---

## 🧪 TESTING RECOMENDADO

### Test 1: Cambio de nombre
```
1. Ir a login/registro
2. Verificar que dice "Acopiador" en lugar de "Industria"
3. ✅ Debe verse el cambio
```

### Test 2: Orden de Compra
```
1. Iniciar sesión como Acopiador
2. Ir a "Emitir Orden de Compra"
3. Completar:
   - Tipo: Virginia
   - Calidad: T1F
   - Cantidad: 1000
   - Precio: 2.50
   - Nota: (opcional)
4. Click "Revisar orden"
5. Click "Emitir orden de compra"
6. ✅ Debe mostrar éxito
7. Verificar en Firebase Storage que aparece el PDF
8. Verificar en Firestore que se guardó en "purchase_orders"
```

### Test 3: Financiamiento
```
1. Ir a "Solicitar Financiamiento"
2. Completar:
   - Motivo: Compra de Tabaco Verde
   - Tabaco: Burley
   - Warrant: Cargar archivo
   - Plazo: 30 días
3. Click "Revisar solicitud"
4. Click "Solicitar financiamiento"
5. ✅ Debe mostrar éxito
6. Verificar en Firebase Storage que aparece en "financing_warrants"
7. Verificar en Firestore que se guardó en "financing_requests"
```

### Test 4: Motivo Personalizado
```
1. En Solicitar Financiamiento
2. Motivo: Seleccionar "Otro"
3. Debe aparecer campo de texto
4. Completar el campo
5. ✅ Debe permitir continuar
```

---

## 📋 CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Leí todo este documento
- [ ] Tengo los 2 archivos JSX listos (buy_mejorado.jsx y financing.jsx)
- [ ] Voy a cambiar "Industria" a "Acopiador" en LandingRole.jsx
- [ ] Voy a cambiar "Industria" a "Acopiador" en IndustryDashboard.jsx
- [ ] Voy a reemplazar buy.jsx con el mejorado
- [ ] Voy a crear financing.jsx
- [ ] Voy a agregar la ruta /industry/financing en App.jsx
- [ ] Voy a actualizar DataContext con las nuevas funciones
- [ ] Voy a configurar las reglas de Firestore
- [ ] Voy a configurar las reglas de Storage
- [ ] Voy a testear Orden de Compra
- [ ] Voy a testear Solicitar Financiamiento
- [ ] Voy a verificar PDFs en Firebase Storage
- [ ] Voy a verificar datos en Firestore

---

## 🎨 NOTAS IMPORTANTES

1. **Colores**: Los colores siguen el tema azul del Acopiador (#58A6FF)
2. **Diseño**: Mantiene la estructura y estilos existentes
3. **PDF**: Se genera automáticamente con datos del acopiador
4. **Warrant**: Acepta cualquier formato de archivo
5. **Plazo**: Tiene 4 opciones predefinidas (15, 30, 60, 90 días)
6. **Motivo personalizado**: Si selecciona "Otro", aparece campo de texto

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE IMPLEMENTAR

1. Crear interfaz de admin para revisar órdenes de compra
2. Crear interfaz de admin para revisar solicitudes de financiamiento
3. Agregar notificaciones cuando se emite una orden
4. Integrar con sistema de pagos para financiamientos
5. Agregar dashboard de estadísticas

---

**Versión**: 1.0
**Fecha**: 2026-05-18
**Estado**: Listo para implementar
**Responsables**: industry_buy_mejorado.jsx, industry_financing.jsx

