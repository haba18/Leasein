# 🚨 INSTRUCCIONES URGENTES - DESPLIEGUE INMEDIATO

## ⚠️ PASO 1: REDESPLEGAR EL SERVIDOR (OBLIGATORIO)

Los cambios NO funcionarán hasta que hagas esto:

### Opción A: Desde el Panel de Supabase (MÁS FÁCIL)

1. **Ve a tu proyecto en Supabase:** https://supabase.com/dashboard/projects
2. **Haz clic en "Edge Functions"** (menú lateral izquierdo)
3. **Busca la función:** `make-server-7afbce9e`
4. **Haz clic en el botón "Deploy"** o **"Redeploy"**
5. **ESPERA 60 segundos** a que termine el deployment
6. **Verifica que diga "Active"** con una luz verde

### Opción B: Desde Terminal

```bash
# 1. Conéctate a tu proyecto (solo la primera vez)
supabase link --project-ref TU_PROJECT_ID

# 2. Despliega la función
supabase functions deploy make-server-7afbce9e

# 3. Espera el mensaje de éxito
```

---

## ⚠️ PASO 2: REFRESCAR APLICACIÓN

Después del deployment:

1. **Abre tu aplicación en el navegador**
2. **Presiona:** `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
3. **Esto recarga SIN caché** (importante)

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. DÍAS EN CUSTODIA ARREGLADO
**Antes:** No contaba días  
**Ahora:** Si ingresó ayer 12/02 y hoy es 13/02 = **1 día**

**Cálculo:**
```javascript
// Calcula diferencia en milisegundos
// Convierte a días
// Mínimo 1 día si está en custodia
```

### 2. ESTADO SE GUARDA CORRECTAMENTE
**Antes:** EN_PROCESO volvía a PENDIENTE  
**Ahora:** El estado se **mantiene** después de refrescar

**Con logs de depuración en consola:**
```
🔄 Actualizando estado: { codigo, de, a }
✅ Respuesta del servidor: { ... }
```

### 3. VISTA COMERCIAL SOLO LECTURA
**Antes:** Podía cambiar estados  
**Ahora:** 100% solo lectura, solo muestra badges

---

## 🧪 PRUEBAS RÁPIDAS

### Test 1: Días en custodia
```sql
-- Ejecuta en Supabase SQL Editor:
UPDATE equipos_temporales
SET fecha_ingreso = NOW() - INTERVAL '1 day'
WHERE id = 1;

-- Refresca app: Debe mostrar "1" día
```

### Test 2: Estado se mantiene
```
1. Cambia un equipo a "EN_PROCESO"
2. Refresca (F5)
3. ✅ Debe seguir en "EN_PROCESO"
```

### Test 3: Vista comercial
```
1. Cambia a "Vista Comercial"
2. ✅ NO debe haber selectores de estado
3. ✅ Solo badges de lectura
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### Abre la consola del navegador (F12):

**Logs esperados al cambiar estado:**
```
🔄 Actualizando estado: { codigo: "TEST-1", de: "PENDIENTE", a: "EN_PROCESO" }
=== BACKEND UPDATE: Body recibido ===
=== BACKEND UPDATE: Actualizando estado_proceso a === EN_PROCESO
=== BACKEND UPDATE: Resultado exitoso ===
✅ Respuesta del servidor: { equipo: { ... estado_proceso: "EN_PROCESO" } }
```

**Si no ves estos logs:**
- El servidor NO se redesplego
- Vuelve al PASO 1

---

## 📊 VERIFICAR DÍAS EN CUSTODIA

### Desde SQL Editor en Supabase:

```sql
-- Ver días calculados de todos los equipos
SELECT 
  codigo_equipo,
  TO_CHAR(fecha_ingreso, 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_calculados
FROM equipos_temporales
WHERE fecha_salida IS NULL
ORDER BY fecha_ingreso DESC
LIMIT 10;
```

**Resultado esperado:**
- Equipo de hoy = 0-1 días
- Equipo de ayer = 1 día
- Equipo de hace 3 días = 3 días

---

## ❌ SI SIGUE SIN FUNCIONAR

### 1. Verifica logs del servidor:

```bash
# Desde terminal
supabase functions logs make-server-7afbce9e --tail

# O desde panel Supabase:
# Edge Functions → make-server-7afbce9e → Logs
```

### 2. Busca estos mensajes:
```
=== BACKEND UPDATE: Body recibido ===
=== BACKEND UPDATE: Actualizando estado_proceso a ===
=== BACKEND UPDATE: Resultado exitoso ===
```

### 3. Si NO aparecen los logs:
- **El servidor NO fue redesplojado**
- **Repite el PASO 1**
- **Espera 60 segundos completos**

---

## 🆘 SOLUCIÓN DE EMERGENCIA

Si después de TODO sigue sin funcionar:

### Método 1: Redespliega MANUALMENTE

1. Descarga el archivo del servidor desde tu código
2. Ve a Supabase → Edge Functions
3. Elimina la función vieja
4. Crea una nueva con el código actualizado

### Método 2: Verifica en la base de datos

```sql
-- Crea equipo de prueba con fecha de ayer
INSERT INTO equipos_temporales (
  codigo_equipo,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  fecha_ingreso
) VALUES (
  'PRUEBA-DIAS',
  'Instalación',
  'Test User',
  'Sistemas',
  FALSE,
  'PENDIENTE',
  NOW() - INTERVAL '1 day'
);

-- Ver el equipo con días calculados
SELECT 
  codigo_equipo,
  fecha_ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias
FROM equipos_temporales
WHERE codigo_equipo = 'PRUEBA-DIAS';

-- Debe mostrar "1" en la columna dias
```

### Método 3: Crear nuevo equipo desde la app

```
1. Registra un equipo nuevo
2. Marca ingreso (hoy)
3. Debe mostrar "1" en días de custodia
4. Si muestra "0", el servidor NO está actualizado
```

---

## 📱 CONTACTO DE EMERGENCIA

Si nada funciona después de:
- ✅ Redesplegar servidor
- ✅ Esperar 60 segundos
- ✅ Refrescar con Ctrl+Shift+R
- ✅ Ver logs del servidor
- ✅ Probar en modo incógnito

**Entonces:**

1. Toma captura de pantalla de:
   - La tabla de equipos (con días en 0)
   - Los logs del servidor
   - La consola del navegador (F12)

2. Ejecuta esta consulta y comparte resultado:
   ```sql
   SELECT 
     codigo_equipo,
     fecha_ingreso,
     fecha_salida,
     estado_proceso,
     EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias
   FROM equipos_temporales
   LIMIT 5;
   ```

---

## ✅ CHECKLIST FINAL

Marca cada paso que completaste:

- [ ] Redespliegué el servidor Edge Function
- [ ] Esperé 60 segundos después del deployment
- [ ] Refresqué la app con Ctrl+Shift+R
- [ ] Abrí la consola (F12) para ver logs
- [ ] Probé crear un equipo nuevo
- [ ] Probé cambiar estado a EN_PROCESO
- [ ] Verifiqué que los días se calculan
- [ ] Revisé los logs del servidor en Supabase

---

**Fecha:** 13 de Febrero de 2026  
**Urgencia:** ALTA  
**Tiempo estimado:** 5 minutos

**¡El servidor DEBE redesplojarse para que funcione!**
