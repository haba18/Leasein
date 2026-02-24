# 🔍 Diagnóstico del Historial de Equipos Eliminados

## ⚠️ Problema Reportado
Los equipos eliminados no aparecen en el historial.

## 🎯 Causa Principal
Los equipos que eliminaste **ANTES** de ejecutar el script SQL fueron **borrados permanentemente** de la base de datos y **NO se pueden recuperar**.

---

## ✅ Solución Paso a Paso

### 📌 Paso 1: Ejecutar el Script SQL Completo

Abre `SCRIPT_SQL_MANUAL_HISTORIAL.sql` y ejecuta TODO el contenido en Supabase SQL Editor.

Este script:
- ✅ Crea los campos `eliminado` y `fecha_eliminacion`
- ✅ Crea índices para mejorar el rendimiento
- ✅ Actualiza equipos existentes
- ✅ Incluye consultas de verificación

---

### 📌 Paso 2: Verificar que los Campos se Crearon

En Supabase SQL Editor, ejecuta:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'equipos_temporales'
AND column_name IN ('eliminado', 'fecha_eliminacion');
```

**Resultado esperado:**
```
column_name        | data_type
-------------------|---------------------------
eliminado          | boolean
fecha_eliminacion  | timestamp with time zone
```

Si NO ves estos 2 campos, **ejecuta el script nuevamente**.

---

### 📌 Paso 3: Ver Todos tus Equipos Actuales

```sql
SELECT 
    id,
    codigo_equipo,
    marca_modelo,
    eliminado,
    fecha_eliminacion
FROM equipos_temporales
ORDER BY id DESC
LIMIT 10;
```

**Esto te muestra:**
- Los equipos que tienes actualmente
- Si tienen el campo `eliminado` (debe ser `false`)
- Si tienen `fecha_eliminacion` (debe ser `NULL` para equipos activos)

---

### 📌 Paso 4: Crear un Equipo de Prueba

Ejecuta este SQL para crear un equipo de prueba:

```sql
-- Crear equipo de prueba
INSERT INTO equipos_temporales (
    codigo_equipo,
    marca_modelo,
    cliente,
    motivo,
    recibido_por,
    area,
    prioridad_alta,
    fecha_ingreso,
    eliminado
) VALUES (
    'PRUEBA-HISTORIAL-001',
    'Laptop HP Test',
    'Cliente Test',
    'Temporales',
    'Admin',
    'IT',
    false,
    NOW(),
    false
) RETURNING *;
```

**Deberías ver el equipo creado con todos sus campos.**

---

### 📌 Paso 5: Marcar el Equipo como Eliminado (simulando la app)

```sql
UPDATE equipos_temporales
SET 
    eliminado = true,
    fecha_eliminacion = NOW()
WHERE codigo_equipo = 'PRUEBA-HISTORIAL-001'
RETURNING *;
```

**Verifica que:**
- `eliminado` = `true`
- `fecha_eliminacion` = fecha y hora actual

---

### 📌 Paso 6: Consultar Equipos Eliminados

```sql
SELECT 
    codigo_equipo,
    marca_modelo,
    cliente,
    eliminado,
    fecha_eliminacion
FROM equipos_temporales
WHERE eliminado = true
ORDER BY fecha_eliminacion DESC;
```

**Deberías ver el equipo "PRUEBA-HISTORIAL-001".**

Si lo ves aquí, ¡el historial funciona en la base de datos! ✅

---

### 📌 Paso 7: Probar desde la Aplicación

1. **Recarga la aplicación** (F5 o Ctrl+R)
2. Abre la consola del navegador (F12 → Console)
3. Haz clic en **"Ver Historial"**
4. **Deberías ver el equipo "PRUEBA-HISTORIAL-001"**

---

## 🐛 Si NO aparece en la aplicación pero SÍ en SQL:

### Opción A: Verificar la Consola del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Haz clic en **"Ver Historial"**
4. Busca errores en rojo

**Posibles errores:**
- ❌ `404 Not Found` = El endpoint no existe (problema del servidor)
- ❌ `401 Unauthorized` = Problema de autenticación
- ❌ `500 Internal Server Error` = Error en el backend

### Opción B: Verificar la Red (Network)

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Haz clic en **"Ver Historial"**
4. Busca la petición a `/equipos?incluir_eliminados=true`
5. Haz clic en ella
6. Ve a la pestaña **Response**

**Deberías ver algo como:**
```json
{
  "equipos": [
    {
      "id": 123,
      "codigo_equipo": "PRUEBA-HISTORIAL-001",
      "eliminado": true,
      "fecha_eliminacion": "2025-02-12T..."
    }
  ]
}
```

Si ves `"equipos": []` (array vacío), el backend no está devolviendo equipos eliminados.

---

## 🔧 Soluciones Comunes

### Problema 1: Los campos no existen
**Solución:** Ejecuta el script SQL completo nuevamente.

### Problema 2: Los campos existen pero están vacíos (NULL)
**Solución:** Los equipos anteriores fueron eliminados permanentemente. Crea equipos nuevos de prueba.

### Problema 3: El backend devuelve array vacío
**Solución:** 
1. Verifica que ejecutaste el script SQL
2. Verifica que hay equipos con `eliminado = true` en la base de datos
3. Re-deploy del backend si es necesario

### Problema 4: Error 404 en el endpoint
**Solución:** El backend no está desplegado o la URL es incorrecta.

---

## 📊 Consulta de Diagnóstico Completo

Ejecuta esta consulta para ver el estado completo de tu base de datos:

```sql
SELECT 
    'Total de equipos' as metrica,
    COUNT(*) as valor
FROM equipos_temporales
UNION ALL
SELECT 
    'Equipos activos',
    COUNT(*)
FROM equipos_temporales
WHERE eliminado = false OR eliminado IS NULL
UNION ALL
SELECT 
    'Equipos eliminados',
    COUNT(*)
FROM equipos_temporales
WHERE eliminado = true
UNION ALL
SELECT 
    'Equipos con campo eliminado NULL',
    COUNT(*)
FROM equipos_temporales
WHERE eliminado IS NULL;
```

**Resultado esperado:**
```
metrica                           | valor
----------------------------------|------
Total de equipos                  | 15
Equipos activos                   | 14
Equipos eliminados                | 1
Equipos con campo eliminado NULL  | 0
```

---

## 🧹 Limpiar Equipo de Prueba

Una vez que confirmes que funciona, elimina el equipo de prueba:

```sql
DELETE FROM equipos_temporales 
WHERE codigo_equipo = 'PRUEBA-HISTORIAL-001';
```

---

## ✨ Confirmación Final

El historial funciona correctamente cuando:

1. ✅ Los campos `eliminado` y `fecha_eliminacion` existen en la tabla
2. ✅ Puedes ejecutar consultas SQL y ver equipos con `eliminado = true`
3. ✅ La aplicación muestra equipos en "Ver Historial"
4. ✅ Cuando eliminas un equipo desde la app, aparece inmediatamente en el historial

---

## 🆘 Si Nada Funciona

Copia y pega los resultados de estas consultas:

```sql
-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'equipos_temporales'
ORDER BY ordinal_position;

-- 2. Ver primeros 5 equipos
SELECT * FROM equipos_temporales ORDER BY id DESC LIMIT 5;

-- 3. Contar equipos eliminados
SELECT COUNT(*) as total_eliminados
FROM equipos_temporales
WHERE eliminado = true;
```

Comparte estos resultados para diagnosticar el problema exacto.
