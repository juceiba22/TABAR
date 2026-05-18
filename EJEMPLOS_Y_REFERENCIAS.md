# Ejemplos y Referencias - Formulario de Tokenización

## 📊 Ejemplos de Uso

### Ejemplo 1: Lote Pequeño Individual
```
Total Kgs a Certificar: 100 kg
Tamaño del Fardo: 50 kg
Tipo de Tabaco: Virginia
Calidad: T1F
Tipo de Venta: Venta Individual

RESULTADO:
- Cantidad de Fardos: 2
- Financiamiento: USD 170 (2 × 85)
- Código Transacción: TABAR-1716043200000-A7B2C9K1
```

### Ejemplo 2: Lote Mediano Asociado
```
Total Kgs a Certificar: 500 kg
Tamaño del Fardo: 50 kg
Tipo de Tabaco: Burley
Calidad: B2KL
Tipo de Venta: Venta Asociada

RESULTADO:
- Cantidad de Fardos: 10
- Financiamiento: USD 850 (10 × 85)
- Código Transacción: TABAR-1716043245000-K3L5M2N9
```

### Ejemplo 3: Lote Grande Criollo
```
Total Kgs a Certificar: 2000 kg
Tamaño del Fardo: 60 kg
Tipo de Tabaco: Criollo
Calidad: C3K
Tipo de Venta: Venta Individual

RESULTADO:
- Cantidad de Fardos: 34 (redondeado hacia arriba)
- Financiamiento: USD 2890 (34 × 85)
- Código Transacción: TABAR-1716043290000-X9Z1P2Q4
```

## 📋 Opciones de Calidad - Referencia Completa

### Clasificación T (Tipo 1)
- **T1F**: Tipo 1 Fino
- **T1L**: Tipo 1 Largo

### Clasificación T (Tipo 2)
- **T2F**: Tipo 2 Fino
- **T2L**: Tipo 2 Largo
- **T2KL**: Tipo 2 Klas Largo
- **T2KF**: Tipo 2 Klas Fino

### Clasificación B (Tipo 1-4)
- **B1F**: Burley 1 Fino
- **B1L**: Burley 1 Largo
- **B2F**: Burley 2 Fino
- **B2L**: Burley 2 Largo
- **B2KL**: Burley 2 Klas Largo
- **B2KF**: Burley 2 Klas Fino
- **B3F**: Burley 3 Fino
- **B3L**: Burley 3 Largo
- **B3KL**: Burley 3 Klas Largo
- **B3KF**: Burley 3 Klas Fino
- **B4F**: Burley 4 Fino
- **B4L**: Burley 4 Largo

### Clasificación C (Tipo 1-3)
- **C1F**: Criollo 1 Fino
- **C1L**: Criollo 1 Largo
- **C2F**: Criollo 2 Fino
- **C2L**: Criollo 2 Largo
- **C2K**: Criollo 2 Klas
- **C3F**: Criollo 3 Fino
- **C3L**: Criollo 3 Largo
- **C3K**: Criollo 3 Klas

### Clasificación X (Tipos 1-3)
- **X1F**: Tipo X 1 Fino
- **X1L**: Tipo X 1 Largo
- **X2F**: Tipo X 2 Fino
- **X2L**: Tipo X 2 Largo
- **X2K**: Tipo X 2 Klas
- **X3F**: Tipo X 3 Fino
- **X3L**: Tipo X 3 Largo
- **X3K**: Tipo X 3 Klas

**Total de opciones de calidad**: 30

## 🔄 Flujo de Interacción

```
┌─ INICIO ─────────────────────────────────┐
│                                           │
│ 1. Usuario ingresa Total Kgs             │
│    (Ej: 500)                            │
│              ↓                           │
│ 2. Usuario ingresa Tamaño del Fardo      │
│    (Ej: 50)                             │
│              ↓                           │
│ 3. Sistema calcula automáticamente:      │
│    Cantidad Fardos = 500 / 50 = 10      │
│    Financiamiento = 10 × 85 = USD 850   │
│              ↓                           │
│ 4. Usuario selecciona Tipo de Tabaco     │
│    (Virginia, Burley, Criollo)          │
│              ↓                           │
│ 5. Usuario selecciona Calidad            │
│    (30+ opciones disponibles)            │
│              ↓                           │
│ 6. Usuario selecciona Tipo de Venta      │
│    (Individual o Asociada)               │
│              ↓                           │
│ 7. Botón "Generar Certificado"          │
│    se activa (todos campos llenos)      │
│              ↓                           │
│ 8. Usuario hace click en botón           │
│              ↓                           │
│ 9. Aparece pantalla de confirmación      │
│    (resumen con advertencia legal)       │
│              ↓                           │
│ 10. Usuario confirma                    │
│              ↓                           │
│ 11. Se genera código de transacción:    │
│     TABAR-[timestamp]-[random]          │
│              ↓                           │
│ 12. Se llama a tokenizarProducer()      │
│              ↓                           │
│ 13. Se genera PDF automáticamente        │
│     con todos los datos                  │
│              ↓                           │
│ 14. Se descarga PDF al navegador        │
│              ↓                           │
│ 15. Pantalla de éxito con:              │
│     - Cantidad de fardos                │
│     - Código de transacción             │
│     - Monto en USD                      │
│     - Botón volver a Dashboard           │
│                                           │
└──────────────────────────────────────────┘
```

## 🔐 Seguridad y Auditoría

### Código de Transacción
- **Formato**: `TABAR-[timestamp]-[random]`
- **Ejemplo**: `TABAR-1716043200000-A7B2C9K1`
- **Timestamp**: Milisegundos desde epoch (1970)
- **Random**: 7 caracteres alfanuméricos
- **Propósito**: Identificación única y auditoría

### Datos Almacenados en PDF
- Información del productor (sin datos sensibles innecesarios)
- Detalles técnicos del lote
- Código de transacción único
- Timestamp exacto de la operación
- Firma digital confirmada

## 📱 Validaciones de Campo

### Total Kgs a Certificar
- ✅ Tipo: Número entero o decimal
- ✅ Mínimo: > 0
- ✅ Máximo: Sin límite (pero recomendado < 100,000)
- ✅ Formato: Acepta hasta 2 decimales

### Tamaño del Fardo
- ✅ Tipo: Número entero o decimal
- ✅ Mínimo: > 0
- ✅ Máximo: Sin límite (usualmente 20-100kg)
- ✅ Nota: Se usa para calcular cantidad de fardos

### Tipo de Tabaco
- ✅ Requerido: Sí
- ✅ Opciones: 3 (Virginia, Burley, Criollo)
- ✅ Tipo: Dropdown

### Calidad
- ✅ Requerido: Sí
- ✅ Opciones: 30 clasificaciones
- ✅ Tipo: Dropdown
- ✅ Nota: Valores predefinidos y validados

### Tipo de Venta
- ✅ Requerido: Sí
- ✅ Opciones: 2 (Individual, Asociada)
- ✅ Tipo: Radio Buttons

## 🎯 Estados de Botón "Generar Certificado"

| Estado | Condición | Apariencia |
|--------|-----------|-----------|
| **Deshabilitado** | Algún campo vacío | Gris oscuro, opacidad 0.5, cursor not-allowed |
| **Habilitado** | Todos los campos completos | Verde (#3FB950), cursor pointer |
| **Cargando** | Procesando transacción | Spinner, texto "Certificando..." |
| **Procesado** | Transacción completada | Pantalla de éxito |

## 📄 Estructura del PDF Generado

```
┌─────────────────────────────────────────┐
│    CERTIFICADO DE TOKENIZACIÓN TABAR    │
│  Certificación y Digitalización de AA  │
│───────────────────────────────────────  │
│                                         │
│ DATOS DEL PRODUCTOR                   │
│ ├─ Nombre: Juan Pérez                 │
│ ├─ Email: juan@example.com            │
│ └─ ID Productor: a7f3b9c2d5e1        │
│                                         │
│ DETALLES DEL LOTE                     │
│ ├─ Total Kgs: 500 kg                  │
│ ├─ Tamaño del Fardo: 50 kg            │
│ ├─ Cantidad de Fardos: 10             │
│ ├─ Tipo de Tabaco: Virginia           │
│ ├─ Calidad: T1F                       │
│ └─ Tipo de Venta: Venta Individual    │
│                                         │
│ FINANCIAMIENTO ADELANTADO              │
│ ├─ Monto USD: USD 850                 │
│ └─ Activos TABAR Generados: 10        │
│                                         │
│ INFORMACIÓN DE TRANSACCIÓN             │
│ ├─ Código: TABAR-1716-A7B2C9K1       │
│ ├─ Fecha y Hora: 18/05/2026 15:29:30 │
│ └─ Estado: Certificado y Tokenizado   │
│                                         │
│ [Pie de página con términos]           │
└─────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Problema: El PDF no se descarga
**Solución**: Revisa la consola del navegador. Asegúrate que jsPDF está importado correctamente.

### Problema: Los datos del usuario no aparecen
**Solución**: Verifica que `useRole()` está devolviendo datos. Revisa que el usuario está autenticado.

### Problema: El cálculo de fardos es incorrecto
**Solución**: Usa `Math.ceil()` para redondear hacia arriba. Ejemplo: 100kg ÷ 50kg = 2 fardos exactos.

### Problema: El dropdown de calidad no muestra todas las opciones
**Solución**: Verifica que el array `OPCIONES_CALIDAD` contiene los 30 valores.

---

**Última actualización**: 18/05/2026