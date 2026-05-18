# Instrucciones de Implementación - Formulario Mejorado de Tokenización

## 📋 Resumen de Cambios

Se ha mejorado el componente `tokenizar.jsx` en la sección "producer" con los siguientes cambios:

### Nuevos Campos Agregados:
1. ✅ **Total Kgs a Certificar** - Input manual para ingresar kilos totales
2. ✅ **Tamaño del Fardo** - Input numérico para especificar peso por fardo
3. ✅ **Tipo de Tabaco** - Dropdown con opciones: Virginia, Burley, Criollo
4. ✅ **Calidad** - Dropdown con 30+ opciones de clasificación (T1F, T1L, B1F, B1L, etc.)
5. ✅ **Tipo de Venta** - Radio buttons: Venta Individual / Venta Asociada
6. ✅ **Generar Certificado PDF** - Genera un PDF descargable con:
   - Datos del productor (nombre, email, ID)
   - Detalles del lote (Kgs, tamaño, cantidad, tipo, calidad, venta)
   - Código de transacción único (TABAR-[timestamp]-[random])
   - Timestamp y firma digital
   - Financiamiento en USD

## 🔧 Dependencias Necesarias

### Instalar jsPDF para generación de PDFs:

```bash
npm install jspdf
```

O si usas yarn:
```bash
yarn add jspdf
```

## 📝 Pasos de Implementación

### 1. **Reemplazar el archivo original**
   ```
   Ruta actual: src/pages/producer/tokenizar.jsx
   Archivo nuevo: tokenizar_mejorado.jsx
   ```
   - Reemplaza el contenido de `src/pages/producer/tokenizar.jsx` con el del archivo `tokenizar_mejorado.jsx`

### 2. **Verificar dependencias en package.json**
   Asegúrate de que `jspdf` esté en las dependencias:
   ```json
   {
     "dependencies": {
       "jspdf": "^2.5.1"
     }
   }
   ```

### 3. **No se requieren cambios en otros archivos**
   - Los estilos utilizan las clases CSS existentes: `tabar-input`, `tabar-btn`, etc.
   - Las funciones `tokenizarProducer` y `campana` del contexto funcionan igual
   - Se agregó import de `useRole` para acceder a datos del usuario

## 🎯 Características Principales

### Cálculo Automático:
- **Cantidad de Fardos** = `Math.ceil(Total Kgs / Tamaño del Fardo)`
- **Financiamiento USD** = `Cantidad de Fardos × 85`

### Validación:
- El botón "Generar Certificado" se activa solo cuando TODOS los campos están completos
- Muestra mensaje "Completa todos los campos" si falta información

### Generación de PDF:
- Se genera automáticamente al confirmar la tokenización
- Nombre de archivo: `TABAR_Certificado_[CODIGO_TRANSACCION].pdf`
- Descarga automática al navegador del usuario
- Contiene todos los datos del lote y código único para auditoría

### Pantalla de Éxito:
- Muestra el código de transacción generado
- Confirma la cantidad de fardos y kilos certificados
- Muestra el monto en USD del financiamiento
- Botón para volver al dashboard

## 🎨 Cambios Visuales

- Los nuevos campos mantienen la consistencia visual con el resto de la app
- Se agregaron labels más descriptivos
- El resumen de operación ahora muestra más detalles (Kgs, tamaño, cantidad)
- El mensaje de confirmación menciona el tipo de tabaco seleccionado

## 📦 Estructura de Datos del PDF

El PDF generado contiene:

```
┌─ CERTIFICADO DE TOKENIZACIÓN TABAR ─┐
│                                       │
│ DATOS DEL PRODUCTOR                 │
│  • Nombre: [del usuario]            │
│  • Email: [del usuario]             │
│  • ID Productor: [uid truncado]     │
│                                       │
│ DETALLES DEL LOTE                   │
│  • Total Kgs: [valor ingresado]     │
│  • Tamaño del Fardo: [valor ingr.]  │
│  • Cantidad de Fardos: [calculado]  │
│  • Tipo de Tabaco: [seleccionado]   │
│  • Calidad: [seleccionada]          │
│  • Tipo de Venta: [seleccionado]    │
│                                       │
│ FINANCIAMIENTO ADELANTADO            │
│  • Monto USD: [calculado]           │
│  • Activos TABAR: [cantidad fardos] │
│                                       │
│ INFORMACIÓN DE TRANSACCIÓN           │
│  • Código: TABAR-[timestamp]-[rnd]  │
│  • Fecha y Hora: [timestamp]        │
│  • Estado: Certificado y Tokenizado │
│                                       │
└─────────────────────────────────────┘
```

## ⚙️ Configuración de jsPDF (si necesitas ajustes)

Si quieres personalizar la apariencia del PDF:

```javascript
// En el archivo tokenizar.jsx, en la función generarCertificadoPDF()
const doc = new jsPDF({
  orientation: 'portrait',  // O 'landscape'
  unit: 'mm',
  format: 'a4'
});
```

## ✅ Testing Recomendado

1. **Prueba de campos vacíos**: El botón debe estar deshabilitado
2. **Prueba de cálculo**: Ingresa Kgs=500 y Tamaño=50, debe dar 10 fardos
3. **Prueba de PDF**: Genera un certificado y verifica que el PDF contenga todos los datos
4. **Prueba de generación de API**: Asegúrate que `tokenizarProducer` siga funcionando correctamente

## 🚀 Próximos Pasos Recomendados

1. Probar en ambiente de desarrollo
2. Validar que los PDFs se generan correctamente
3. Verificar que la integración con Firebase funciona sin problemas
4. Realizar testing de usuario
5. Desplegar a producción

## 📞 Soporte

Si encuentras algún problema:
- Verifica que `jspdf` está instalado correctamente
- Revisa la consola del navegador para errores
- Asegúrate que los datos del usuario (`useRole()`) están disponibles
- Valida que las funciones del contexto `useData()` funcionan como se espera

---
**Versión**: 1.0  
**Fecha**: 2026-05-18  
**Estado**: Listo para implementar