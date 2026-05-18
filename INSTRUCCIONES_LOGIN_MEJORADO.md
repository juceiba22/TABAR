# Instrucciones - Login Mejorado con DNI y Nombre/Apellido

## 📋 Resumen de Cambios

Se ha mejorado el componente `LandingRole.jsx` con los siguientes campos nuevos:

### Nuevos Campos Agregados (en LOGIN y REGISTER):
1. ✅ **Nombre** - Input de texto separado
2. ✅ **Apellido** - Input de texto separado
3. ✅ **Tipo de Documento** - Dropdown (DNI / Pasaporte)
4. ✅ **Número de Documento** - Input de texto con validación simple

### Características:
- Los nuevos campos aparecen **en ambos modos: LOGIN y REGISTER**
- Validación simple: número de documento no vacío y que contenga números
- Los datos se guardan en **Firestore** y **localStorage**
- Compatibilidad con el flujo de verificación de email existente
- Responsive design (en móvil los campos se adaptan)

## 📦 Estructura de Datos

### En Firestore (usuarios)
```json
{
  "uid": "abc123...",
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "García",
  "documentType": "dni",
  "documentNumber": "12345678",
  "displayName": "Ing. Juan García",
  "companyName": "Cooperativa Tabacalera",
  "role": "industry",
  "createdAt": "2026-05-18T15:30:00Z",
  "updatedAt": "2026-05-18T15:30:00Z",
  "status": "approved",
  "emailVerified": true
}
```

### En localStorage (durante registro pendiente)
```json
{
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "García",
  "documentType": "dni",
  "documentNumber": "12345678",
  "displayName": "Ing. Juan García",
  "companyName": "Cooperativa Tabacalera",
  "role": "industry",
  "createdAt": "2026-05-18T15:30:00Z",
  "status": "pending_verification",
  "emailVerified": false
}
```

## 🔧 Pasos de Implementación

### 1. **Reemplazar el archivo**
```
Ruta actual: src/pages/LandingRole.jsx
Archivo nuevo: LandingRole_mejorado.jsx
```

**Pasos:**
- Abre `src/pages/LandingRole.jsx`
- Reemplaza todo el contenido con el del archivo `LandingRole_mejorado.jsx`
- Guarda el archivo

### 2. **No se requieren cambios adicionales**
- No requiere nuevas dependencias
- Los estilos CSS ya están incluidos
- Firebase ya está configurado
- RoleContext funciona igual

## 🎯 Flujo de Usuario

### LOGIN (Ahora con validación de documento):
```
1. Usuario ingresa: Nombre
2. Usuario ingresa: Apellido
3. Usuario selecciona: Tipo de documento (DNI/Pasaporte)
4. Usuario ingresa: Número de documento
5. Usuario ingresa: Email
6. Usuario ingresa: Contraseña
7. Click en "Ingresar al sistema"
   ↓
8. Validación de documento (no vacío + contiene números)
9. Autenticación con Firebase
10. Si email no verificado → pantalla de verificación
11. Si email verificado → perfil actualizado en Firestore
12. Redirect a dashboard de usuario
```

### REGISTRO (Ahora con documento):
```
1. Usuario ingresa: Nombre
2. Usuario ingresa: Apellido
3. Usuario selecciona: Tipo de documento
4. Usuario ingresa: Número de documento
5. Usuario ingresa: Nombre del responsable
6. Usuario ingresa: Organización/empresa
7. Usuario selecciona: Tipo de institución
8. Usuario ingresa: Email
9. Usuario ingresa: Contraseña
10. Usuario confirma: Contraseña
11. Click en "Solicitar alta"
    ↓
12. Validación completa (incluye documento)
13. Creación de usuario Firebase
14. Email de verificación enviado
15. Datos guardados en localStorage
16. Pantalla de verificación de email
17. Usuario verifica email
18. Primer login → perfil creado en Firestore
```

## 📝 Validaciones

### Validación de Documento
```javascript
- No vacío: obligatorio
- Contiene números: verificado
- Formato específico: NO (validación simple)
- DNI: acepta cualquier combinación con números
- Pasaporte: acepta cualquier combinación con números
```

### Otros campos
```
- Nombre: no vacío
- Apellido: no vacío
- Email: formato email válido
- Contraseña: mínimo 6 caracteres (login y register)
- Confirmación contraseña: debe coincidir (solo register)
```

## 🎨 Cambios Visuales

### En LOGIN:
- Ahora el usuario también ingresa: Nombre, Apellido, Tipo/Número de documento
- Se muestra un selector grid para tipo de documento + número en la misma fila

### En REGISTER:
- Los nuevos campos aparecen ANTES que los campos de organización
- El flujo es: Documento → Responsable → Organización → Tipo institución

### Responsive:
- En móviles (< 768px), el selector de documento y número se apilan verticalmente
- En desktop, se muestran lado a lado

## 🔐 Seguridad

### Información almacenada:
- **firstName, lastName**: nombres del usuario
- **documentType**: tipo de documento (DNI o Pasaporte)
- **documentNumber**: número sin validar (aceptamos cualquier formato)
- **Email**: validado por Firebase
- **UID**: generado por Firebase (único y seguro)

### No se valida:
- Unicidad del DNI (puedes registrarte varias veces con el mismo DNI)
- Formato específico de DNI argentino
- Existencia real del documento

**Nota**: Si necesitas validar DNI argentino o hacer que sea único, consulta la sección "Mejoras Futuras"

## 📱 Dispositivos Soportados

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (< 768px)

Los campos se adaptan automáticamente según el tamaño de la pantalla.

## ✅ Testing Recomendado

### Caso 1: Registro exitoso
```
- Nombre: Juan
- Apellido: García
- Tipo Doc: DNI
- Número: 12345678
- Responsable: Ing. Juan García
- Organización: Cooperativa Tabacalera
- Institución: Productor
- Email: juan@example.com
- Contraseña: Test@123456 (fuerte)

Resultado esperado: Email de verificación enviado
```

### Caso 2: Login después de registro
```
- Nombre: Juan
- Apellido: García
- Tipo Doc: DNI
- Número: 12345678
- Email: juan@example.com
- Contraseña: Test@123456

Resultado esperado: Perfil actualizado en Firestore, redirect a dashboard
```

### Caso 3: Validación de documento vacío
```
- Dejar vacío el campo de número de documento
- Intentar enviar formulario

Resultado esperado: Error "El número de documento es obligatorio."
```

### Caso 4: Cambiar tipo de documento
```
- Seleccionar "Pasaporte" 
- Ingresar número: ABC123456
- Intentar enviar

Resultado esperado: Aceptado (contiene números)
```

## 🐛 Troubleshooting

### Problema: Los campos nuevos no aparecen
**Solución**: Asegúrate de reemplazar todo el archivo. Verifica que el modo sea "login" o "register".

### Problema: Los datos no se guardan en Firestore
**Solución**: Verifica que las reglas de seguridad de Firestore permiten escribir en la colección "users". Revisa la consola del navegador para errores.

### Problema: El localStorage no funciona
**Solución**: Comprueba que el usuario no tiene localStorage deshabilitado. Los datos temporales se guardan con clave: `pending_profile_[uid]`

### Problema: Email de verificación no se envía
**Solución**: Verifica que la configuración de Firebase Authentication está activa. Revisa los logs de Firebase.

## 🚀 Mejoras Futuras Recomendadas

### 1. Validación de DNI Argentino
```javascript
// Función para validar DNI argentino (8 dígitos)
function validateArgentineDNI(dni) {
  return /^\d{8}$/.test(dni);
}
```

### 2. Hacer DNI Único
```javascript
// Agregar en Firestore una colección "documents" indexada por número
// Verificar antes de crear usuario si el DNI ya existe
```

### 3. Validación de Pasaporte Internacional
```javascript
// Diferentes formatos según país
// Ej: Argentina: 1-8 caracteres alfanuméricos
```

### 4. Búsqueda de usuarios por DNI
```javascript
// Indexar Firestore por documentNumber para búsquedas rápidas
// Permitir al admin buscar usuarios por documento
```

### 5. API de validación externa
```javascript
// Integrar con API de validación de DNI
// Ej: https://www.argentina.gob.ar/
```

## 📞 Contacto y Soporte

Si encuentras problemas:
1. Revisa los logs de la consola del navegador (F12)
2. Verifica que Firebase está conectado correctamente
3. Comprueba que las reglas de seguridad son correctas
4. Consulta la sección de Troubleshooting arriba

## 🎓 Referencia API de Campos

### firstName
- **Tipo**: string
- **Requerido**: sí (en login y register)
- **Validación**: no vacío
- **Almacenamiento**: Firestore + localStorage

### lastName
- **Tipo**: string
- **Requerido**: sí (en login y register)
- **Validación**: no vacío
- **Almacenamiento**: Firestore + localStorage

### documentType
- **Tipo**: enum ("dni" | "passport")
- **Requerido**: sí
- **Validación**: debe ser uno de los valores permitidos
- **Default**: "dni"
- **Almacenamiento**: Firestore + localStorage

### documentNumber
- **Tipo**: string
- **Requerido**: sí
- **Validación**: no vacío + contiene números (regex: /\d/)
- **Almacenamiento**: Firestore + localStorage
- **Nota**: se guarda sin formatear

---
**Versión**: 1.0  
**Fecha**: 2026-05-18  
**Estado**: Listo para implementar