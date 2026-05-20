# Guía de Implementación Paso a Paso

## 📋 Checklist Completo

### Fase 1: DataContext.jsx (5-10 min)

- [ ] Abrir `src/modules/roles/DataContext.jsx`
- [ ] Localizar la sección de `import` al inicio del archivo
- [ ] Agregar 3 nuevos imports:
  ```javascript
  getDocs,        // Para obtener múltiples documentos
  where,          // Para consultas (aunque no lo usaremos en array-contains)
  arrayUnion      // Para agregar elementos a arrays sin sobrescribir
  ```
- [ ] Localizar la función `tokenizarProducer` (línea ~350)
- [ ] DESPUÉS de esa función, copiar las 4 nuevas funciones desde `DataContext_ASOCIACIONES_NUEVAS_FUNCIONES.jsx`:
  - `crearAsociacion`
  - `obtenerAsociacionesDelProductor`
  - `obtenerAsociacionesDisponiblesParaUnirse`
  - `unirseAAsociacion`
- [ ] Localizar el `return` del `DataProvider` (línea ~387)
- [ ] Agregar las 4 nuevas funciones al objeto `value` del Provider:
  ```javascript
  crearAsociacion,
  obtenerAsociacionesDelProductor,
  obtenerAsociacionesDisponiblesParaUnirse,
  unirseAAsociacion,
  ```
- [ ] **Verificar que no hay errores de sintaxis** (Ctrl+Shift+M en VS Code)

### Fase 2: asociaciones.jsx (2-5 min)

- [ ] Localizar `src/pages/producer/asociaciones.jsx`
- [ ] **REEMPLAZAR EL ARCHIVO COMPLETO** con el contenido de `NUEVO_asociaciones.jsx`
- [ ] Guardar el archivo (Ctrl+S)

### Fase 3: tokenizar.jsx (15-20 min)

Seguir la guía en `CAMBIOS_tokenizar_asociaciones.md`:

- [ ] **Paso 1:** Agregar imports
- [ ] **Paso 2:** Agregar 4 nuevos estados
- [ ] **Paso 3:** Agregar useEffect para cargar asociaciones
- [ ] **Paso 4:** Actualizar `isFormValid`
- [ ] **Paso 5:** Reemplazar `handleTokenizar`
- [ ] **Paso 6:** Agregar UI - radio buttons de modo
- [ ] **Paso 7:** Agregar UI - select de productor
- [ ] **Paso 8:** Agregar UI - select de asociación
- [ ] **Verificar que no hay errores** (Ctrl+Shift+M)

### Fase 4: Verificar Firestore Rules (2 min)

- [ ] Abrir `firestore.rules`
- [ ] Verificar que existe la sección para `producer_associations`
- [ ] Debería verse así:
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
- [ ] Si no está, copiar la sección anterior

---

## 🧪 Testing - Paso a Paso

### Test 1: Crear Asociación

**Usuario A:**
1. Loguear con credenciales de productor A
2. Ir a `/producer/asociaciones`
3. Ver sección "Crear Nueva Asociación"
4. Escribir nombre: "Asociación TABAR Test"
5. Clic en "Crear Asociación"
6. ✅ Debería aparecer en "Mis Asociaciones"
7. ✅ Debería verse en "Asociaciones Disponibles para Unirte" para otros usuarios

### Test 2: Unirse a Asociación

**Usuario B:**
1. Loguear con credenciales de productor B
2. Ir a `/producer/asociaciones`
3. Ver sección "Asociaciones Disponibles para Unirte"
4. Ver "Asociación TABAR Test" creada por Usuario A
5. Clic en "Unirse"
6. ✅ Debería desaparecer de "Disponibles"
7. ✅ Debería aparecer en "Mis Asociaciones"
8. ✅ Debería verse en "Mis Asociaciones" de Usuario A también

### Test 3: Crear Tokenización con Unión a Asociación

**Usuario B (con asociación):**
1. Ir a `/producer/tokenizar`
2. Llenar datos:
   - Total Kgs: 500
   - Tamaño del Fardo: 50
   - Tipo de Tabaco: Virginia
   - Calidad: T1F
   - Tipo de Venta: **Venta Asociada**
3. Debería haber radio button: "Unirme a asociación existente"
4. Seleccionar esa opción
5. Debería aparecer dropdown con "Asociación TABAR Test"
6. Seleccionar la asociación
7. Clic en "Confirmar y Generar Certificado"
8. ✅ Debería completarse sin errores
9. ✅ Los kgs y valores deberían sumarse en la asociación

### Test 4: Diferente Tipo de Tabaco

**Usuario C (produce diferente tabaco):**
1. Unirse a "Asociación TABAR Test"
2. Ir a `/producer/tokenizar`
3. Llenar datos:
   - Total Kgs: 300
   - Tamaño del Fardo: 30
   - Tipo de Tabaco: **Burley** (diferente)
   - Calidad: T1F
   - Tipo de Venta: Venta Asociada
   - Unirse a "Asociación TABAR Test"
4. ✅ Confirmar
5. Ir a `/producer/asociaciones`
6. Abrir "Asociación TABAR Test"
7. ✅ Debería mostrar:
   - Virginia: 500 Kgs (Usuario B)
   - Burley: 300 Kgs (Usuario C)
   - Listados por separado

---

## 🐛 Troubleshooting

### Error: "Cannot read property 'map' of undefined"
**Solución:** Asegúrate de que los arrays están inicializados:
```javascript
misAsociaciones: setMisAsociaciones([])  // Debe ser array, no undefined
```

### Error: "obtenerAsociacionesDelProductor is not a function"
**Solución:** Verificar que se agregó al return del DataProvider en DataContext.jsx

### Error: "Missing or insufficient permissions"
**Solución:** Verificar que las Firestore Rules incluyen `producer_associations`:
```bash
firebase deploy --only firestore:rules
```

### Las asociaciones no cargan en el dropdown
**Solución:** Agregar console.log para debugging:
```javascript
useEffect(() => {
  if (user?.uid && tipoVenta === "asociada" && modoAsociacion === "unirse") {
    const fetchAsociaciones = async () => {
      console.log("Cargando asociaciones...");
      const res = await obtenerAsociacionesDelProductor();
      console.log("Resultado:", res);
      if (res.ok) {
        setAsociacionesDelProductor(res.asociaciones || []);
      }
    };
    fetchAsociaciones();
  }
}, [user, tipoVenta, modoAsociacion]);
```

### Los valores no se suman correctamente
**Solución:** Verificar que `datosTokenizacion` tiene los campos correctos:
```javascript
{
  tipoTabaco,
  calidad,
  kgs: parseInt(totalKgs),           // Debe ser número
  cantidadFardos,                    // Debe ser número
  usdTotal                           // Debe ser número
}
```

---

## 📊 Estructura de Datos en Firestore

Después de la implementación, tu colección `producer_associations` debe tener documentos así:

```javascript
{
  id: "abc123",
  nombre: "Asociación TABAR Test",
  productores: [
    {
      uid: "user_a_uid",
      nombre: "Productor A",
      email: "producer_a@example.com",
      rol: "creador"
    },
    {
      uid: "user_b_uid",
      nombre: "Productor B",
      email: "producer_b@example.com",
      rol: "miembro"
    },
    {
      uid: "user_c_uid",
      nombre: "Productor C",
      email: "producer_c@example.com",
      rol: "miembro"
    }
  ],
  inventario: {
    totalKgs: 800,
    totalFardos: 52,
    tiposTabaco: [
      {
        tipo: "Virginia",
        calidades: ["T1F"],
        kgs: 500,
        fardos: 25,
        usdTotal: 1250.00
      },
      {
        tipo: "Burley",
        calidades: ["T1F"],
        kgs: 300,
        fardos: 27,
        usdTotal: 750.00
      }
    ]
  },
  estado: "activa",
  creadoPor: "user_a_uid",
  creadoEn: "2026-05-20T...",
  actualizadoEn: "2026-05-20T..."
}
```

---

## ✅ Verificación Final

Antes de reportar completado:

- [ ] DataContext.jsx compila sin errores
- [ ] asociaciones.jsx reemplazado y compila
- [ ] tokenizar.jsx modificado y compila
- [ ] Test 1 (Crear): Usuario A crea asociación ✅
- [ ] Test 2 (Unirse): Usuario B se une ✅
- [ ] Test 3 (Tokenizar con unión): Usuario B certifica y se suma a asociación ✅
- [ ] Test 4 (Diferente tabaco): Valores listados por separado ✅
- [ ] Firestore Rules publicadas ✅
- [ ] Console sin errores en DevTools ✅

---

## 🚀 Próximos Pasos (Opcionales)

Una vez implementado, podrías considerar:

1. **UI mejorada:** Agregar gráficos de inventario por tipo de tabaco
2. **Reportes:** Descargar resumen de asociación en PDF
3. **Permisos:** Solo el creador puede disolver la asociación
4. **Notificaciones:** Avisar cuando alguien se une
5. **Búsqueda:** Filtrar asociaciones por nombre, tipo de tabaco, etc.

---

## 📞 Soporte Rápido

Si algo no funciona:

1. **Revisar la consola** (F12 → Console)
2. **Buscar la palabra "error"** en los logs
3. **Verificar Firestore Rules** son públicas y correctas
4. **Deshacer ultimo cambio** y re-aplicar paso a paso
5. **Limpiar cache del navegador** (Ctrl+Shift+Delete)

¡Éxito en la implementación! 🎉
