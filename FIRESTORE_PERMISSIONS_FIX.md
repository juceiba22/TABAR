# Solución: "Missing or insufficient permissions" Error

## Problema Identificado

Al intentar confirmar y generar certificado en la sección **producer/tokenizar** con "Venta Asociada", recibías un error de Firestore: **"Missing or insufficient permissions"**.

### Root Cause
Tu archivo `firestore.rules` **no tenía reglas de seguridad definidas** para las nuevas colecciones:
- `producer_tokenizations`
- `purchase_orders`
- `financing_requests`
- `poa_uploads`

Esto causaba que la regla "default deny" al final del archivo bloqueara todas las operaciones de escritura en estas colecciones.

## Solución Implementada

He actualizado el archivo `firestore.rules` para incluir reglas de seguridad apropiadas para todas las colecciones nuevas.

### Cambios realizados:

#### 1. Producer Tokenizations
```firestore
match /producer_tokenizations/{tokenId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.productorOwner;
  allow update: if isAdmin() || (isAuthenticated() && resource.data.productorOwner == request.auth.uid);
}
```
- Permite a cualquier usuario autenticado **leer** documentos
- Permite crear documentos solo si el UID del usuario autenticado coincide con `productorOwner`
- Permite actualizar solo si es Admin o el propietario original

#### 2. Purchase Orders (Acopiador)
```firestore
match /purchase_orders/{orderId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  allow update: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
}
```

#### 3. Financing Requests
```firestore
match /financing_requests/{requestId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  allow update: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
}
```

#### 4. POA Uploads (State)
```firestore
match /poa_uploads/{poaId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  allow update: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
}
```

## Pasos para Aplicar la Solución

### 1. En Firebase Console:
1. Ve a **Firestore Database → Rules**
2. Reemplaza todo el contenido con el archivo `firestore.rules` actualizado
3. Haz clic en **Publish** para aplicar los cambios

### 2. O usando Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## Verificación

Después de deployar las reglas, intenta nuevamente:

1. Navega a **producer/tokenizar**
2. Completa el formulario con:
   - Total Kgs: 500
   - Tamaño del Fardo: 50
   - Tipo de Tabaco: Virginia
   - Calidad: T1F
   - Tipo de Venta: **Venta Asociada**
   - Productor Asociado: Selecciona otro productor
   - Precio de Venta: 2.50

3. Haz clic en **"Confirmar y Generar Certificado"**

Ahora la operación debería completarse exitosamente sin errores de permisos.

## Notas Técnicas

### Por qué funcionan estas reglas:

1. **Autenticación**: `isAuthenticated()` verifica que `request.auth != null`
2. **Propiedad**: Las reglas `create` verifican que `request.auth.uid == request.resource.data.userId` (o `productorOwner`) para asegurar que solo el propietario pueda escribir
3. **Lectura abierta**: Cualquier usuario autenticado puede leer documentos (importante para visualizar órdenes, solicitudes, etc.)
4. **Admin override**: Los admins pueden actualizar cualquier documento sin restricción

### Campos requeridos en Firestore:

Para que las reglas funcionen, asegúrate que cada documento incluya el campo correcto:

- **producer_tokenizations**: Debe incluir `productorOwner: user.uid` ✅ (ya está en tokenizar.jsx)
- **purchase_orders**: Debe incluir `userId: user.uid` ✅ (ya está en buy.jsx)
- **financing_requests**: Debe incluir `userId: user.uid` ✅ (ya está en financing.jsx)
- **poa_uploads**: Debe incluir `userId: user.uid` ✅ (ya está en invest.jsx)

Todos tus componentes ya incluyen estos campos correctamente.

## Próximos Pasos Pendientes

Después de resolver este error de permisos, aún tienes estos tasks pendientes:

1. ✅ **Firestore Rules** - RESUELTO
2. ⏳ PDF auto-download en buy.jsx y financing.jsx (agregar `doc.save()`)
3. ⏳ Incluir datos del usuario (nombre, DNI) en PDFs
4. ⏳ Verificar cálculos de financiamiento con precio variable
5. ⏳ Generar PDF de "Certificado de Solicitud de Financiamiento"

¿Necesitás ayuda con alguno de estos pasos?
