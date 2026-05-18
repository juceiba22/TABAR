# Instrucciones - Login Mejorado (Solo en REGISTRO)

## 📌 IMPORTANTE: Lo que cambió

Esta versión **CORRECTA** agrega los campos SOLO en REGISTRO, no en LOGIN.

### En LOGIN:
✅ Solo Email + Contraseña (SIN cambios)

### En REGISTRO:
✅ Agregados:
- Nombre
- Apellido  
- Tipo de Documento (DNI / Pasaporte)
- Número de Documento

## 🎯 Diferencias con la versión anterior

| Aspecto | Versión anterior (ERROR) | Versión correcta (ACTUAL) |
|---------|--------------------------|--------------------------|
| Campos en LOGIN | ❌ Sí (INCORRECTO) | ✅ No (CORRECTO) |
| Campos en REGISTRO | ✅ Sí | ✅ Sí |
| Diseño CSS | ❌ Roto | ✅ Perfecto |
| Estructura | ❌ Modificada | ✅ Original preservada |

## 🔧 Pasos de Instalación

### 1. Reemplazar el archivo
```
Ruta: src/pages/LandingRole.jsx
Archivo nuevo: LandingRole_CORRECTO.jsx
```

**Instrucciones:**
- Abre `src/pages/LandingRole.jsx`
- Borra TODO el contenido
- Copia y pega TODO el contenido de `LandingRole_CORRECTO.jsx`
- Guarda

### 2. Sin cambios adicionales necesarios
- No necesita cambios en CSS
- No necesita nuevas dependencias
- No necesita cambios en Firebase
- No necesita cambios en otras partes de la app

## 📋 Flujo de LOGIN (SIN CAMBIOS)

```
Email
    ↓
Contraseña
    ↓
¿Olvidaste tu contraseña? (link)
    ↓
Botón "Ingresar al sistema"
```

## 📋 Flujo de REGISTRO (CON NUEVOS CAMPOS)

```
↓ NUEVOS CAMPOS ↓
Nombre              ← NUEVO
    ↓
Apellido            ← NUEVO
    ↓
Tipo de Documento   ← NUEVO (DNI / Pasaporte)
Número de Documento ← NUEVO
    ↓
↓ CAMPOS ORIGINALES ↓
Nombre del responsable (original)
    ↓
Organización/empresa (original)
    ↓
Tipo de institución (original)
    ↓
Email
    ↓
Contraseña
    ↓
Confirmá la contraseña
    ↓
Botón "Solicitar alta"
```

## ✅ Validaciones

Los nuevos campos se validan así:

```javascript
// Si alguno de estos falla, muestra error
if (!firstName.trim())
  return "El nombre es obligatorio."

if (!lastName.trim())
  return "El apellido es obligatorio."

if (!documentNumber.trim())
  return "El número de documento es obligatorio."

if (!/\d/.test(documentNumber))
  return "El número de documento debe contener números."
```

## 💾 Datos Guardados

### En Firestore (después de verificar email):
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "documentType": "dni",
  "documentNumber": "12345678",
  "displayName": "Ing. Juan García",
  "companyName": "Cooperativa Tabacalera",
  "role": "producer",
  "email": "juan@example.com",
  // ... más campos
}
```

### En localStorage (durante registro pendiente):
```json
{
  "firstName": "Juan",
  "lastName": "García",
  "documentType": "dni",
  "documentNumber": "12345678",
  // ... resto de datos
}
```

## 🧪 Testing

### Test 1: Login sin nuevos campos
1. Ir a LOGIN
2. Verificar que NO aparecen: Nombre, Apellido, Documento
3. Ingresar solo Email y Contraseña
4. ✅ Debe funcionar

### Test 2: Registro con nuevos campos
1. Ir a REGISTRO (click en "Registrar entidad")
2. Verificar que aparecen TODOS:
   - Nombre ← NUEVO
   - Apellido ← NUEVO
   - Tipo de Documento ← NUEVO
   - Número de Documento ← NUEVO
   - Nombre del responsable (original)
   - Organización (original)
   - Tipo institución (original)
3. Completar todos los campos
4. ✅ Debe funcionar

### Test 3: Validación de documento
1. En REGISTRO, dejar vacío "Número de Documento"
2. Intentar "Solicitar alta"
3. ✅ Debe mostrar error: "El número de documento es obligatorio."

### Test 4: Validación números
1. En REGISTRO, ingresar "ABC" en Número de Documento
2. Intentar "Solicitar alta"
3. ✅ Debe mostrar error: "El número de documento debe contener números."

### Test 5: Diseño intacto
1. Comparar el login actual con la captura anterior
2. ✅ Panel izquierdo (branding) debe verse igual
3. ✅ Panel derecho (formulario) debe verse igual
4. ✅ Colores, espacios, tipografía deben ser idénticos

## 🎨 Estructura Preservada

✅ **Panel izquierdo (branding)** - SIN CAMBIOS
- Logo TABAR
- Título "Tokenización agroindustrial tabacalera"
- Descripción
- Estadísticas (8.5%, Real, On-chain)

✅ **Panel derecho (formulario)** - SOLO AGREGADOS CAMPOS EN REGISTRO
- Headers
- Campos según modo (login/register/forgot)
- Alertas de error/éxito
- Botones
- Footer

✅ **CSS completo** - IDÉNTICO AL ORIGINAL
- 150+ líneas de estilos sin modificación

## 📝 Comparación Linea a Linea

### Cambios realizados:

1. **Línea 2:** Comentario actualizado
   ```jsx
   // Antes: Fixes aplicados vs versión anterior
   // Ahora: Cambios realizados
   ```

2. **Líneas 102-109:** Nuevos estados agregados
   ```jsx
   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [documentType, setDocumentType] = useState("dni");
   const [documentNumber, setDocumentNumber] = useState("");
   ```

3. **Líneas 175-185:** Validación expandida (solo en registro)
   ```jsx
   if (!firstName.trim()) return "El nombre es obligatorio."
   // ... etc
   ```

4. **Líneas 250-261:** localStorage actualizado
   ```jsx
   firstName: firstName.trim(),
   lastName: lastName.trim(),
   documentType,
   documentNumber: documentNumber.trim(),
   ```

5. **Líneas 1040-1077:** Nuevos campos agregados SOLO en `{mode === "register"}`
   ```jsx
   {mode === "register" && (
     <>
       {/* Nuevos campos AQUÍ */}
     </>
   )}
   ```

**TODO LO DEMÁS:** 100% idéntico al original

## ✨ Resultado Final

```
Login (SIN CAMBIOS)
  Email      ✅
  Contraseña ✅

Registro (CON CAMBIOS)
  Nombre                ← NUEVO
  Apellido              ← NUEVO
  Tipo Doc              ← NUEVO
  Número Doc            ← NUEVO
  Nombre responsable    ✅
  Organización          ✅
  Tipo institución      ✅
  Email                 ✅
  Contraseña            ✅
  Confirmar Contraseña  ✅
```

## 🚀 Verificación Post-Instalación

Después de reemplazar el archivo, verifica:

1. ✅ El login se ve IDÉNTICO a antes
2. ✅ El registro muestra los 4 nuevos campos
3. ✅ El login funciona (email + contraseña)
4. ✅ El registro funciona (con nuevos campos)
5. ✅ La validación del documento funciona
6. ✅ Los datos se guardan en Firestore

Si algo no funciona, verifica que:
- Copiaste TODO el contenido (no solo partes)
- Firebase sigue configurado igual
- Los estilos se ven iguales

---
**Versión**: CORRECTA v1.0  
**Fecha**: 2026-05-18  
**Estado**: Listo para implementar (RECOMENDADO)