# Solución Firestore Rules - productoresUIDs

## 🔴 Problema Original

```firestore
❌ request.auth.uid in resource.data.productores[*].uid
```

**Error:** Firestore Rules no soporta la sintaxis `array[*].field`

---

## ✅ Solución Implementada

Agregamos un **array separado `productoresUIDs`** que contiene solo los UIDs de los productores. Esto permite que Firestore Rules valide correctamente.

---

## 📝 Cambios Requeridos

### 1. DataContext.jsx - Función `crearAsociacion`

**CAMBIO:** Agregar `productoresUIDs: [user.uid]` al documento

```javascript
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
      productoresUIDs: [user.uid],  // ← NUEVO: Array solo de UIDs
      inventario: {
        totalKgs: 0,
        totalFardos: 0,
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
    return { ok: false, error: e.message };
  }
};
```

---

### 2. DataContext.jsx - Función `unirseAAsociacion`

**CAMBIO:** Agregar `productoresUIDs: arrayUnion(user.uid)` al updateDoc

Busca esta línea:
```javascript
await updateDoc(assocRef, {
  productores: arrayUnion(nuevoProductor),
  inventario: nuevoInventario,
  actualizadoEn: serverTimestamp()
});
```

Cámbiala a:
```javascript
await updateDoc(assocRef, {
  productores: arrayUnion(nuevoProductor),
  productoresUIDs: arrayUnion(user.uid),  // ← NUEVO
  inventario: nuevoInventario,
  actualizadoEn: serverTimestamp()
});
```

---

### 3. firestore.rules

**YA ESTÁ CORREGIDO** ✅

La sección de `producer_associations` ahora usa `productoresUIDs`:

```firestore
// Producer Associations
match /producer_associations/{associationId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    (request.auth.uid == resource.data.creadoPor ||
     request.auth.uid in resource.data.productoresUIDs);  // ← CAMBIADO
  allow delete: if request.auth.uid == resource.data.creadoPor;
}
```

---

## 📊 Estructura de Documento Resultante

Después de estos cambios, un documento en `producer_associations` se vería así:

```javascript
{
  id: "assoc123",
  nombre: "Asociación TABAR",
  
  // Array de objetos con info completa
  productores: [
    {
      uid: "user_a_uid",
      nombre: "Productor A",
      email: "a@example.com",
      rol: "creador"
    },
    {
      uid: "user_b_uid",
      nombre: "Productor B",
      email: "b@example.com",
      rol: "miembro"
    }
  ],
  
  // Array simple de UIDs (PARA FIRESTORE RULES)
  productoresUIDs: ["user_a_uid", "user_b_uid"],  // ← NUEVO
  
  inventario: { ... },
  estado: "activa",
  creadoPor: "user_a_uid",
  creadoEn: "2026-05-20T...",
  actualizadoEn: "2026-05-20T..."
}
```

---

## ✅ Pasos para Implementar

### Fase 1: Actualizar DataContext.jsx
1. Abrir `src/modules/roles/DataContext.jsx`
2. Buscar función `crearAsociacion`
3. Agregar `productoresUIDs: [user.uid],` (línea después de `productores: [...]`)
4. Buscar función `unirseAAsociacion`
5. Buscar el `updateDoc` dentro de esa función
6. Agregar `productoresUIDs: arrayUnion(user.uid),` (línea después de `productores:`)
7. Guardar archivo

### Fase 2: Verificar firestore.rules
1. Abrir `firestore.rules`
2. Verificar que la sección `producer_associations` tiene `productoresUIDs` (no `productores[*].uid`)
3. ✅ Ya está hecho

### Fase 3: Publicar Rules
```bash
firebase deploy --only firestore:rules
```

O en Firebase Console:
1. **Firestore Database → Rules**
2. Copia el contenido del archivo actualizado
3. **Publish**

---

## 🧪 Testing

Después de los cambios, verifica:

1. **Crear asociación:**
   ```javascript
   const res = await crearAsociacion("Test");
   // En Firestore, debería haber:
   // productores: [{ uid: "...", nombre: "...", ... }]
   // productoresUIDs: ["..."]
   ```

2. **Unirse a asociación:**
   ```javascript
   const res = await unirseAAsociacion(assocId, datos);
   // En Firestore, productoresUIDs debería tener 2 UIDs
   ```

3. **Firestore Rules funcionan:**
   - ✅ El creador puede actualizar
   - ✅ Los miembros (en productoresUIDs) pueden actualizar
   - ✅ Solo el creador puede eliminar

---

## 🔐 Por Qué Funciona Ahora

**Antes:**
```firestore
❌ request.auth.uid in resource.data.productores[*].uid
   // productores es array de OBJETOS: [{ uid: "...", nombre: "..." }]
   // No se puede hacer [*].uid en Firestore Rules
```

**Después:**
```firestore
✅ request.auth.uid in resource.data.productoresUIDs
   // productoresUIDs es array de STRINGS: ["uid1", "uid2", "uid3"]
   // Funciona perfectamente
```

---

## 📋 Resumen de Cambios

| Archivo | Cambio | Línea(s) |
|---------|--------|----------|
| **DataContext.jsx** | Agregar `productoresUIDs: [user.uid],` en `crearAsociacion` | En `setDoc` |
| **DataContext.jsx** | Agregar `productoresUIDs: arrayUnion(user.uid),` en `unirseAAsociacion` | En `updateDoc` |
| **firestore.rules** | ✅ YA HECHO - cambio de `productores[*].uid` a `productoresUIDs` | Línea 85 |

---

## ✨ ¿Necesitas Algo Más?

- ¿Ayuda para hacer los cambios en DataContext?
- ¿Verificación de que todo está correcto?
- ¿Testing?

¡Avísame! 🚀
