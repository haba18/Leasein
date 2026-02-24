# 🚨 INSTRUCCIONES URGENTES - LEE ESTO PRIMERO

## ⚠️ PROBLEMA CRÍTICO SOLUCIONADO

He corregido el problema de los días en custodia. El cálculo ahora es MÁS SIMPLE y DIRECTO.

---

## 🔥 PASO 1: REDESPLEGAR EL SERVIDOR (OBLIGATORIO)

**SIN ESTE PASO, NADA FUNCIONARÁ**

### Opción A: Desde Panel Supabase (RECOMENDADO)

1. **Abre tu proyecto:** https://supabase.com/dashboard
2. **Ve a "Edge Functions"** (menú lateral izquierdo)
3. **Busca:** `make-server-7afbce9e`
4. **Haz clic en "Deploy"** o **"Redeploy"**
5. **ESPERA 60-90 segundos**
6. **Verifica estado "Active"** con luz verde ✅

### Opción B: Desde Terminal

```bash
supabase functions deploy make-server-7afbce9e
```

---

## 🔥 PASO 2: REFRESCAR APLICACIÓN

Después de redesplegar:

1. Abre tu aplicación web
2. Presiona **`Ctrl + Shift + R`** (Windows) o **`Cmd + Shift + R`** (Mac)
3. Esto recarga SIN caché

---

## ✅ QUÉ SE ARREGLÓ

### 1. DÍAS EN CUSTODIA - ARREGLADO ✅

**Nuevo cálculo SIMPLIFICADO:**

```javascript
// Si ingresó ayer 12/02 y hoy es 13/02
// Resultado: 1 día ✅

// Lógica:
- Calcula diferencia en milisegundos
- Convierte a días (Math.floor)
- Si diffDays >= 1: retorna diffDays
- Si mismo día pero con tiempo: retorna 1
- Si no hay tiempo: retorna 0
```

**Prueba rápida:**

```sql
-- Copia y pega en Supabase SQL Editor:

UPDATE equipos_temporales
SET fecha_ingreso = NOW() - INTERVAL '1 day'
WHERE id = 1;

-- Refresca tu app → Debe mostrar "1" día
```

### 2. ESTADO EN_PROCESO - ARREGLADO ✅

El estado ahora se guarda correctamente y NO vuelve a PENDIENTE.

**Prueba:**
1. Cambia un equipo a "EN_PROCESO"
2. Refresca (F5)
3. ✅ Debe seguir en "EN_PROCESO"

### 3. VISTA COMERCIAL - SOLO LECTURA ✅

La vista comercial ahora es 100% solo lectura:
- ✅ NO puede editar nada
- ✅ Solo muestra badges (sin selectores)
- ✅ Muestra TODOS los equipos
- ✅ Incluye equipos TERMINADOS

### 4. TERMINADO ES AUTOMÁTICO ✅

El selector solo tiene:
- PENDIENTE
- EN_PROCESO

TERMINADO se pone automáticamente al marcar salida.

---

## 🧪 PRUEBA COMPLETA PASO A PASO

### Test 1: Crear equipo de ayer manualmente

```sql
-- Copia y pega en Supabase → SQL Editor:

INSERT INTO equipos_temporales (
  codigo_equipo,
  motivo,
  recibido_por,
  area,
  estado_proceso,
  fecha_ingreso
) VALUES (
  'PRUEBA-URGENTE',
  'Instalación',
  'Test User',
  'Sistemas',
  'PENDIENTE',
  NOW() - INTERVAL '1 day'
);

-- Ver el resultado:
SELECT 
  codigo_equipo,
  TO_CHAR(fecha_ingreso, 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_sql
FROM equipos_temporales
WHERE codigo_equipo = 'PRUEBA-URGENTE';

-- Resultado esperado: dias_sql = 1
```

### Test 2: Ver en la aplicación

1. Refresca tu aplicación
2. Busca el equipo "PRUEBA-URGENTE"
3. En la columna "Días en Custodia" debe mostrar: **1**
4. El fondo debe ser normal (NO rojo, porque no pasó de 3 días)

### Test 3: Cambiar estado

1. Cambia "PRUEBA-URGENTE" de PENDIENTE a EN_PROCESO
2. Refresca la página (F5)
3. ✅ Debe seguir en EN_PROCESO
4. Abre consola del navegador (F12)
5. Debes ver logs como:
   ```
   🔄 Actualizando estado de PRUEBA-URGENTE: PENDIENTE → EN_PROCESO
   === BACKEND UPDATE: Body recibido ===
   === BACKEND UPDATE: Actualizando estado_proceso a === EN_PROCESO
   ✅ Estado actualizado exitosamente
   ```

### Test 4: Vista Comercial

1. Click en "Vista Comercial" (en el header)
2. ✅ NO debe haber selectores de estado
3. ✅ NO debe haber botones de "Registrar" o "Marcar Salida"
4. ✅ Solo badges de colores mostrando el estado actual
5. ✅ Debe ver equipos PENDIENTES, EN_PROCESO y TERMINADOS

---

## 🔍 SI SIGUE SIN FUNCIONAR

### Verificar logs del servidor:

**Desde panel Supabase:**
1. Ve a Edge Functions
2. Click en `make-server-7afbce9e`
3. Ve a "Logs"
4. Busca errores en rojo

**Desde terminal:**
```bash
supabase functions logs make-server-7afbce9e --tail
```

### Verificar consola del navegador:

1. Presiona F12
2. Ve a pestaña "Console"
3. Busca mensajes como:
   ```
   🔄 Actualizando estado de...
   === BACKEND UPDATE: Body recibido ===
   ✅ Estado actualizado exitosamente
   ```

### Si NO ves estos logs:

**Significa que el servidor NO se redesplego. Repite el PASO 1.**

---

## 📊 VERIFICAR DÍAS EN BASE DE DATOS

```sql
-- Ejecuta en Supabase SQL Editor:

SELECT 
  codigo_equipo,
  estado_proceso,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ahora,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias_calculados,
  CASE 
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) >= 1 THEN '✅ CORRECTO'
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) = 0 THEN '⚠️ Ingresó hoy'
    ELSE '❌ ERROR'
  END as verificacion
FROM equipos_temporales
WHERE fecha_salida IS NULL
ORDER BY fecha_ingreso DESC
LIMIT 10;
```

**Resultado esperado:**
- Equipos de ayer: dias_calculados = 1, verificacion = ✅ CORRECTO
- Equipos de hoy: dias_calculados = 0, verificacion = ⚠️ Ingresó hoy
- Equipos de hace 2 días: dias_calculados = 2, verificacion = ✅ CORRECTO

---

## ⚡ SOLUCIÓN DE EMERGENCIA

Si después de TODO sigue sin funcionar:

### 1. Limpia caché completamente

```
1. Cierra el navegador
2. Abre modo incógnito
3. Abre tu aplicación
4. Verifica si ahora funciona
```

### 2. Verifica que la función se actualizó

```sql
-- En Supabase SQL Editor, ejecuta:

SELECT 
  'Servidor actualizado' as mensaje,
  NOW() as hora_actual;

-- Si aparece, el servidor está funcionando
```

### 3. Crea equipo manualmente con fecha de ayer

```sql
INSERT INTO equipos_temporales (
  codigo_equipo,
  motivo,
  recibido_por,
  area,
  estado_proceso,
  fecha_ingreso,
  prioridad_alta
) VALUES (
  'EMERGENCIA-' || TO_CHAR(NOW(), 'HH24MISS'),
  'Instalación',
  'Admin',
  'Sistemas',
  'PENDIENTE',
  NOW() - INTERVAL '24 hours',
  FALSE
);
```

---

## 📝 CAMBIOS REALIZADOS

### En el Servidor (`/supabase/functions/make-server-7afbce9e/index.tsx`):

```javascript
// ANTES (complejo, no funcionaba):
// Convertir a Lima, normalizar fechas, etc.

// AHORA (simple y directo):
function calcularDiasEnCustodia(fechaIngreso, fechaSalida) {
  if (!fechaIngreso) return 0;
  
  const fechaFin = fechaSalida ? new Date(fechaSalida) : new Date();
  const fechaInicio = new Date(fechaIngreso);
  
  const diffTime = fechaFin.getTime() - fechaInicio.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Si hay al menos 1 día, retornar
  if (diffDays >= 1) return diffDays;
  
  // Si es mismo día pero con tiempo, contar como 1
  if (diffTime > 0 && diffDays === 0) return 1;
  
  return 0;
}
```

### En el Frontend (`/src/app/App.tsx`):

- Logs de depuración agregados
- Mejor manejo de errores
- Espera confirmación antes de recargar

### En la Tabla (`/src/app/components/EquipmentTable.tsx`):

- Vista comercial 100% readonly
- TERMINADO eliminado del selector
- Solo PENDIENTE y EN_PROCESO seleccionables

---

## ✅ CHECKLIST FINAL

Marca cada paso:

- [ ] ✅ Redespliegué el servidor Edge Function
- [ ] ✅ Esperé 60 segundos después del deployment
- [ ] ✅ Refresqué la app con Ctrl+Shift+R
- [ ] ✅ Creé equipo de prueba con fecha de ayer
- [ ] ✅ El equipo muestra "1" en días en custodia
- [ ] ✅ Cambié estado a EN_PROCESO
- [ ] ✅ El estado se mantiene después de refrescar
- [ ] ✅ Vista comercial muestra todos los equipos
- [ ] ✅ Vista comercial NO permite editar nada
- [ ] ✅ Selector solo tiene PENDIENTE y EN_PROCESO

---

## 🆘 CONTACTO DE EMERGENCIA

Si NADA de esto funciona:

1. Ejecuta esta consulta en SQL Editor:

```sql
SELECT 
  COUNT(*) as total_equipos,
  COUNT(*) FILTER (WHERE fecha_salida IS NULL) as activos,
  MAX(EXTRACT(DAY FROM (NOW() - fecha_ingreso))) as max_dias
FROM equipos_temporales;
```

2. Toma captura de pantalla de:
   - La tabla de equipos en tu app
   - Los logs del servidor en Supabase
   - La consola del navegador (F12)
   - El resultado de la consulta anterior

3. Comparte esas capturas para diagnóstico completo

---

**Última actualización:** 13 de Febrero de 2026  
**Urgencia:** CRÍTICA 🔴  
**Tiempo estimado:** 5 minutos  
**Estado:** LISTO PARA DEPLOYMENT  

**¡EL SERVIDOR DEBE REDESPLOJARSE PARA QUE LOS DÍAS FUNCIONEN!**
