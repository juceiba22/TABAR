# Instrucciones - Módulo Cargar POA (Plan Operativo Anual)

## 📌 CAMBIOS PRINCIPALES

Se ha reemplazado completamente el formulario de inversión FET con un nuevo formulario para cargar Planes Operativos Anuales (POA) de entidades beneficiarias.

### Cambios de Títulos:
- **Antes:** "Invertir vía FET" → **Ahora:** "Crear asignación FET"
- **Antes:** "Nueva inversión FET" → **Ahora:** "Cargar POA (Plan Operativo Anual)"

### Nuevos Campos del Formulario:
1. ✅ **Entidad Beneficiaria** - Dropdown con 25 opciones
2. ✅ **Número de Resolución** - Input numérico
3. ✅ **Año de Resolución** - Input numérico (2000 hasta año actual)
4. ✅ **Monto** - Input numérico en pesos ($)
5. ✅ **Archivo POA** - Carga de PDF con validación

## 🔧 PASOS DE IMPLEMENTACIÓN

### Paso 1: Reemplazar el archivo
```
Ruta: src/pages/state/invest.jsx
Archivo nuevo: invest_mejorado.jsx
```

**Instrucciones:**
1. Abre `src/pages/state/invest.jsx`
2. Borra TODO el contenido
3. Copia TODO el contenido de `invest_mejorado.jsx`
4. Guarda el archivo

### Paso 2: Verificar importes de Firebase Storage

El archivo ya incluye los importes necesarios:
```javascript
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
```

**Verifica que tu `src/config/firebase.js` exporte `storage`:**
```javascript
// En firebase.js debe estar:
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

### Paso 3: Actualizar DataContext (IMPORTANTE)

El nuevo formulario llama a `invertirState(poaData)` pero ahora pasa un OBJETO completo en lugar de un número.

**En `src/modules/roles/DataContext.jsx`, busca la función `invertirState` y modifícala así:**

```javascript
// ANTES (viejo):
const invertirState = async (monto) => {
  // ... guardaba solo monto ...
}

// DESPUÉS (nuevo):
const invertirState = async (poaData) => {
  try {
    // Si es un objeto (nuevo formato POA)
    if (typeof poaData === "object" && poaData.entidad) {
      const docRef = doc(db, "poa_uploads", `${Date.now()}`);
      await setDoc(docRef, {
        ...poaData,
        estado: "pendiente_aprobacion"
      });
      return { ok: true };
    }
    
    // Si es un número (compatibilidad hacia atrás con inversiones normales)
    if (typeof poaData === "number") {
      const newBalance = (balances.state || 0) + poaData;
      await updateDoc(userDocRef, { balances: { ...balances, state: newBalance } });
      return { ok: true };
    }
    
    return { ok: false, error: "Formato de datos inválido" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
```

### Paso 4: Crear colección en Firestore (opcional pero recomendado)

Si deseas, crea una nueva colección en Firestore para registros de POA:
- **Colección:** `poa_uploads`
- **Subcampos:** entidad, numeroResolucion, anioResolucion, monto, pdfUrl, pdfNombre, pdfTamaño, userId, estado, fechaCreacion

**Configurar reglas de seguridad en Firestore:**
```
match /poa_uploads/{document=**} {
  allow read: if request.auth != null && request.auth.uid != null;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.userId || isAdmin();
  allow delete: if isAdmin();
}
```

### Paso 5: Configurar Firebase Storage

**Reglas de seguridad en Firebase Storage (`storage.rules`):**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /poa_uploads/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.resource.contentType == "application/pdf" &&
                      request.resource.size < 100000000; // 100MB max
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 📦 ESTRUCTURA DE DATOS GUARDADA

### En Firestore (colección `poa_uploads`):
```json
{
  "entidad": "Cámara del Tabaco de Jujuy",
  "numeroResolucion": 12345,
  "anioResolucion": 2026,
  "monto": 50000,
  "pdfUrl": "https://firebasestorage.googleapis.com/...",
  "pdfNombre": "POA_2026.pdf",
  "pdfTamaño": "2.45",
  "userId": "abc123xyz",
  "estado": "pendiente_aprobacion",
  "fechaCreacion": "2026-05-18T15:30:00.000Z",
  "creadoPor": "usuario@example.com"
}
```

### En Firebase Storage:
```
gs://proyecto.appspot.com/poa_uploads/poa_1716046200000_a7b9c2d.pdf
```

## 🎯 FLUJO DE USUARIO

```
1. Usuario abre "Crear asignación FET"
   ↓
2. Selecciona entidad beneficiaria (dropdown)
   ↓
3. Ingresa número de resolución
   ↓
4. Ingresa año de resolución
   ↓
5. Ingresa monto en $
   ↓
6. Carga archivo PDF
   ↓
7. Sistema valida: ✓ PDF válido, ✓ todos campos completos
   ↓
8. Click en "Revisar información"
   ↓
9. Pantalla de confirmación mostrando:
   - Entidad
   - Resolución
   - Año
   - Monto
   - Archivo (nombre y tamaño)
   ↓
10. Click en "Confirmar carga"
    ↓
11. Sistema:
    - Carga PDF a Firebase Storage
    - Obtiene URL del PDF
    - Guarda datos en Firestore
    ↓
12. Pantalla de éxito mostrando:
    - "POA cargado exitosamente"
    - Datos del registro
    - Botón "Cargar otro POA"
```

## ✅ VALIDACIONES IMPLEMENTADAS

### Campo por campo:
```javascript
- Entidad beneficiaria: Requerido (dropdown)
- Número de Resolución: Requerido, mínimo 1
- Año de Resolución: Requerido, entre 2000 y año actual
- Monto: Requerido, mínimo $1
- Archivo PDF: Requerido, debe ser PDF válido (type === "application/pdf")
```

### Mensajes de error:
- "Selecciona una entidad beneficiaria"
- "Ingresa el número de resolución"
- "Ingresa el año de resolución"
- "Ingresa el monto"
- "Carga un archivo PDF"
- "El archivo debe ser un PDF válido"
- "Error al cargar el archivo. Intenta nuevamente."

## 🎨 INFORMACIÓN DEL PDF MOSTRADA

Cuando el usuario carga un PDF, se muestra:
```
✓ Archivo cargado
📄 nombre_del_archivo.pdf
💾 2.45 MB
```

Y en la pantalla de confirmación:
```
Archivo | nombre_del_archivo.pdf (2.45 MB)
```

## 🧪 TESTING RECOMENDADO

### Test 1: Carga exitosa
```
1. Entidad: "Cámara del Tabaco de Jujuy"
2. Resolución: 12345
3. Año: 2026
4. Monto: 50000
5. PDF: cualquier archivo PDF válido
6. Resultado esperado: ✓ Se carga exitosamente
```

### Test 2: Validación de PDF
```
1. Intentar cargar un archivo .docx o .txt
2. Resultado esperado: ❌ Error "El archivo debe ser un PDF válido"
```

### Test 3: Campo vacío
```
1. Completar todos excepto "Entidad"
2. Click en "Revisar información"
3. Resultado esperado: ❌ Error "Selecciona una entidad beneficiaria"
```

### Test 4: Cargar múltiples POA
```
1. Cargar primer POA exitosamente
2. Click en "Cargar otro POA"
3. Formulario se resetea
4. Cargar segundo POA
5. Resultado esperado: ✓ Ambos se guardan en Firestore
```

### Test 5: Verificar Firebase Storage
```
1. En Firebase Console → Storage → poa_uploads/
2. Verificar que aparece el PDF con nombre como: poa_1716046200000_a7b9c2d.pdf
3. Verificar que la URL es accesible
```

## 📋 CAMBIOS EN ARCHIVOS

| Archivo | Cambio |
|---------|--------|
| `src/pages/state/invest.jsx` | ✅ Completamente reemplazado |
| `src/modules/roles/DataContext.jsx` | ⚠️ REQUIERE ACTUALIZACIÓN (función `invertirState`) |
| `src/config/firebase.js` | ✓ Verificar que exporte `storage` |
| Firestore | ✓ Nueva colección `poa_uploads` (opcional) |
| Firebase Storage | ✓ Configurar reglas de seguridad |

## 🔐 SEGURIDAD IMPLEMENTADA

✅ **Validación de PDF**: Solo acepta `application/pdf`
✅ **Validación de campos**: Todos los campos son obligatorios
✅ **Firebase Storage**: Solo usuarios autenticados pueden subir
✅ **Metadata**: Se guarda userId, email, fecha creación
✅ **Estado**: Todos los POA quedan en "pendiente_aprobacion"

## 🐛 TROUBLESHOOTING

### Problema: "Error al cargar el archivo"
**Solución:** 
- Verifica que Firebase Storage esté configurado
- Verifica las reglas de seguridad en Storage
- Revisa la consola del navegador (F12) para más detalles

### Problema: El PDF no se carga
**Solución:**
- Asegúrate de que `storage` está exportado desde `firebase.js`
- Verifica que el archivo sea realmente un PDF válido
- Comprueba que el tamaño no exceda 100MB

### Problema: Los datos no se guardan en Firestore
**Solución:**
- Verifica que `invertirState` en DataContext está actualizada
- Revisa las reglas de seguridad de Firestore
- Comprueba que el usuario está autenticado

### Problema: El dropdown de entidades está vacío
**Solución:**
- Abre la consola del navegador (F12)
- Verifica que la constante `ENTIDADES` está correctamente definida
- No hay problemas, el array está hardcodeado en el componente

## 📝 NOTAS IMPORTANTES

1. **Compatibilidad**: Si tienes usuarios que usan la función `invertirState` con números, se mantiene compatibilidad hacia atrás
2. **Storage**: Los PDFs se guardan en carpeta `poa_uploads/` para organización
3. **Nombres únicos**: Los archivos PDF se renombran con timestamp + random para evitar conflictos
4. **Sin límite de tamaño**: Configurado a 100MB en Storage rules, pero el usuario no ve límite en la UI
5. **Entidades**: Están hardcodeadas en el componente - si necesitas hacerlas dinámicas desde Firestore, avisa

## 🚀 CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Leí todo este documento
- [ ] Tengo el archivo `invest_mejorado.jsx` listo
- [ ] Voy a reemplazar `src/pages/state/invest.jsx`
- [ ] Voy a actualizar `invertirState` en DataContext
- [ ] Voy a verificar que `storage` se exporta desde firebase.js
- [ ] Voy a configurar reglas de Firestore para `poa_uploads`
- [ ] Voy a configurar reglas de Storage para `poa_uploads`
- [ ] Voy a testear la carga de un PDF
- [ ] Voy a verificar que aparece en Firebase Storage
- [ ] Voy a verificar que se guarda en Firestore

---

**Versión**: 1.0
**Fecha**: 2026-05-18
**Estado**: Listo para implementar
**Responsable**: invest_mejorado.jsx

