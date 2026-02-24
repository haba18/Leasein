# 📝 SQL EDITOR - OPERACIONES MANUALES

## 🎯 Cómo usar este documento

Este archivo contiene consultas SQL que puedes copiar y pegar directamente en el **SQL Editor de Supabase** para realizar operaciones manuales en tu base de datos.

---

## 🚀 ACCESO AL SQL EDITOR

1. Ve a tu proyecto en https://supabase.com
2. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"** (Nueva consulta)
4. Copia y pega la consulta que necesites
5. Haz clic en **"Run"** (Ejecutar) en la esquina inferior derecha
6. Revisa los resultados en la parte inferior

---

## 📊 CONSULTAS DE VISUALIZACIÓN

### Ver todos los equipos
```sql
SELECT 
  id,
  codigo_equipo,
  marca_modelo,
  cliente,
  motivo,
  area,
  estado_proceso,
  prioridad_alta,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as fecha_ingreso,
  TO_CHAR(fecha_salida AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as fecha_salida,
  entregado_a,
  EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias_en_custodia
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL
ORDER BY prioridad_alta DESC, fecha_ingreso DESC;
```

### Ver solo equipos ACTIVOS (sin salida marcada)
```sql
SELECT 
  id,
  codigo_equipo,
  cliente,
  motivo,
  estado_proceso,
  prioridad_alta,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias
FROM equipos_temporales
WHERE fecha_salida IS NULL
  AND (eliminado IS FALSE OR eliminado IS NULL)
ORDER BY prioridad_alta DESC, fecha_ingreso ASC;
```

### Ver equipos por estado de proceso
```sql
SELECT 
  estado_proceso,
  COUNT(*) as cantidad,
  STRING_AGG(codigo_equipo, ', ') as codigos
FROM equipos_temporales
WHERE (eliminado IS FALSE OR eliminado IS NULL)
GROUP BY estado_proceso
ORDER BY 
  CASE estado_proceso
    WHEN 'PENDIENTE' THEN 1
    WHEN 'EN_PROCESO' THEN 2
    WHEN 'TERMINADO' THEN 3
    ELSE 4
  END;
```

---

## ✏️ OPERACIONES DE ACTUALIZACIÓN

### Cambiar estado de proceso de un equipo
```sql
-- Cambiar a PENDIENTE
UPDATE equipos_temporales
SET estado_proceso = 'PENDIENTE'
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';

-- Cambiar a EN_PROCESO
UPDATE equipos_temporales
SET estado_proceso = 'EN_PROCESO'
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';

-- Verificar el cambio
SELECT codigo_equipo, estado_proceso, fecha_salida
FROM equipos_temporales
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Cambiar prioridad de un equipo
```sql
-- Marcar como URGENTE (prioridad alta)
UPDATE equipos_temporales
SET prioridad_alta = TRUE
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';

-- Quitar urgencia
UPDATE equipos_temporales
SET prioridad_alta = FALSE
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';

-- Ver el resultado
SELECT codigo_equipo, prioridad_alta
FROM equipos_temporales
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Marcar salida de un equipo manualmente
```sql
UPDATE equipos_temporales
SET 
  fecha_salida = NOW(),
  entregado_a = 'Nombre de la persona',
  observaciones_salida = 'Comentario de salida',
  estado_proceso = 'TERMINADO'
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Desmarcar salida (volver a poner en custodia)
```sql
UPDATE equipos_temporales
SET 
  fecha_salida = NULL,
  entregado_a = NULL,
  estado_proceso = 'EN_PROCESO'
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Cambiar fecha de ingreso a ayer (para pruebas)
```sql
UPDATE equipos_temporales
SET fecha_ingreso = NOW() - INTERVAL '1 day'
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';

-- Ver el resultado con días calculados
SELECT 
  codigo_equipo,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias
FROM equipos_temporales
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

---

## ➕ CREAR EQUIPOS DE PRUEBA

### Crear equipo de prueba con fecha de ayer
```sql
INSERT INTO equipos_temporales (
  codigo_equipo,
  marca_modelo,
  cliente,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  fecha_ingreso,
  observaciones_ingreso
) VALUES (
  'PRUEBA-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
  'HP EliteBook 840 G8',
  'Cliente de Prueba S.A.',
  'Instalación',
  'Usuario Test',
  'Soporte Técnico',
  FALSE,
  'PENDIENTE',
  NOW() - INTERVAL '1 day',  -- Ayer
  'Equipo creado para prueba'
);

-- Ver el equipo creado
SELECT * FROM equipos_temporales
WHERE codigo_equipo LIKE 'PRUEBA-%'
ORDER BY created_at DESC
LIMIT 1;
```

### Crear equipo urgente
```sql
INSERT INTO equipos_temporales (
  codigo_equipo,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  fecha_ingreso
) VALUES (
  'URGENTE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
  'Reparación',
  'Admin',
  'Sistemas',
  TRUE,  -- Marca como urgente
  'PENDIENTE',
  NOW()
);
```

### Crear varios equipos con diferentes días
```sql
-- Crear equipos de 1 a 7 días atrás
INSERT INTO equipos_temporales (
  codigo_equipo, motivo, recibido_por, area, estado_proceso, fecha_ingreso, prioridad_alta
)
SELECT 
  'TEST-' || dias.n || 'D',
  'Instalación',
  'Usuario Test',
  'Sistemas',
  CASE 
    WHEN dias.n = 1 THEN 'PENDIENTE'
    WHEN dias.n <= 3 THEN 'EN_PROCESO'
    ELSE 'EN_PROCESO'
  END,
  NOW() - (dias.n || ' days')::INTERVAL,
  CASE WHEN dias.n > 5 THEN TRUE ELSE FALSE END  -- Urgente si es más de 5 días
FROM (
  SELECT generate_series(1, 7) as n
) as dias;

-- Ver los equipos creados
SELECT 
  codigo_equipo,
  estado_proceso,
  prioridad_alta,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias
FROM equipos_temporales
WHERE codigo_equipo LIKE 'TEST-%'
ORDER BY dias DESC;
```

---

## 🗑️ OPERACIONES DE ELIMINACIÓN

### Eliminar un equipo específico (soft delete)
```sql
UPDATE equipos_temporales
SET 
  eliminado = TRUE,
  fecha_eliminacion = NOW()
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Eliminar permanentemente un equipo (hard delete) ⚠️
```sql
-- ⚠️ CUIDADO: Esto elimina permanentemente el registro
DELETE FROM equipos_temporales
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

### Eliminar todos los equipos de prueba
```sql
DELETE FROM equipos_temporales
WHERE codigo_equipo LIKE 'TEST-%' 
   OR codigo_equipo LIKE 'PRUEBA-%'
   OR codigo_equipo LIKE 'URGENTE-%';

-- Ver cuántos equipos quedaron
SELECT COUNT(*) as total_equipos
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL;
```

### Limpiar TODA la tabla (resetear) ⚠️⚠️⚠️
```sql
-- ⚠️⚠️⚠️ PELIGRO: Esto borra TODOS los datos
-- Solo usa esto si quieres empezar de cero
TRUNCATE TABLE equipos_temporales RESTART IDENTITY CASCADE;

-- Verificar que está vacía
SELECT COUNT(*) as total FROM equipos_temporales;
```

---

## 🔧 OPERACIONES MASIVAS

### Cambiar todos los equipos activos a PENDIENTE
```sql
UPDATE equipos_temporales
SET estado_proceso = 'PENDIENTE'
WHERE fecha_salida IS NULL
  AND (eliminado IS FALSE OR eliminado IS NULL);

-- Ver el resultado
SELECT estado_proceso, COUNT(*) as cantidad
FROM equipos_temporales
WHERE fecha_salida IS NULL
GROUP BY estado_proceso;
```

### Marcar todos los equipos sin prioridad como urgentes si tienen +5 días
```sql
UPDATE equipos_temporales
SET prioridad_alta = TRUE
WHERE fecha_salida IS NULL
  AND prioridad_alta = FALSE
  AND EXTRACT(DAY FROM (NOW() - fecha_ingreso)) > 5;

-- Ver cuántos se actualizaron
SELECT 
  COUNT(*) as equipos_marcados_urgentes
FROM equipos_temporales
WHERE prioridad_alta = TRUE AND fecha_salida IS NULL;
```

### Corregir estados inconsistentes (equipos con salida pero no TERMINADO)
```sql
-- Primero ver cuáles tienen inconsistencia
SELECT 
  id,
  codigo_equipo,
  estado_proceso,
  fecha_salida
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL 
  AND estado_proceso != 'TERMINADO';

-- Corregir
UPDATE equipos_temporales
SET estado_proceso = 'TERMINADO'
WHERE fecha_salida IS NOT NULL 
  AND estado_proceso != 'TERMINADO';

-- Verificar
SELECT COUNT(*) as corregidos
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL AND estado_proceso = 'TERMINADO';
```

---

## 📈 ESTADÍSTICAS Y REPORTES

### Resumen completo del sistema
```sql
SELECT 
  'Total de equipos' as metrica,
  COUNT(*)::TEXT as valor
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL

UNION ALL

SELECT 
  'Equipos activos (sin salida)',
  COUNT(*)::TEXT
FROM equipos_temporales
WHERE fecha_salida IS NULL AND (eliminado IS FALSE OR eliminado IS NULL)

UNION ALL

SELECT 
  'Equipos urgentes',
  COUNT(*)::TEXT
FROM equipos_temporales
WHERE prioridad_alta = TRUE AND fecha_salida IS NULL

UNION ALL

SELECT 
  'Equipos retrasados (+3 días)',
  COUNT(*)::TEXT
FROM equipos_temporales
WHERE fecha_salida IS NULL 
  AND EXTRACT(DAY FROM (NOW() - fecha_ingreso)) > 3

UNION ALL

SELECT 
  'Promedio días en custodia',
  ROUND(AVG(EXTRACT(DAY FROM (NOW() - fecha_ingreso))))::TEXT
FROM equipos_temporales
WHERE fecha_salida IS NULL;
```

### Top 10 equipos con más días en custodia
```sql
SELECT 
  codigo_equipo,
  cliente,
  motivo,
  estado_proceso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY') as ingreso
FROM equipos_temporales
WHERE fecha_salida IS NULL
ORDER BY dias DESC
LIMIT 10;
```

### Equipos por motivo
```sql
SELECT 
  motivo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE fecha_salida IS NULL) as activos,
  COUNT(*) FILTER (WHERE prioridad_alta = TRUE) as urgentes
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL
GROUP BY motivo
ORDER BY total DESC;
```

---

## 🔍 DIAGNÓSTICO Y VERIFICACIÓN

### Verificar cálculo de días en custodia
```sql
SELECT 
  codigo_equipo,
  fecha_ingreso,
  fecha_salida,
  -- Método 1: Diferencia simple
  EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias_metodo1,
  -- Método 2: Redondeo
  ROUND(EXTRACT(EPOCH FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) / 86400) as dias_metodo2
FROM equipos_temporales
WHERE (eliminado IS FALSE OR eliminado IS NULL)
ORDER BY fecha_ingreso DESC
LIMIT 10;
```

### Detectar problemas de datos
```sql
SELECT 
  'Equipos sin motivo' as problema,
  COUNT(*) as cantidad
FROM equipos_temporales
WHERE motivo IS NULL

UNION ALL

SELECT 
  'Equipos sin área',
  COUNT(*)
FROM equipos_temporales
WHERE area IS NULL

UNION ALL

SELECT 
  'Equipos sin recibido_por',
  COUNT(*)
FROM equipos_temporales
WHERE recibido_por IS NULL

UNION ALL

SELECT 
  'Equipos con salida sin entregado_a',
  COUNT(*)
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL AND entregado_a IS NULL

UNION ALL

SELECT 
  'Equipos con salida no TERMINADO',
  COUNT(*)
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL AND estado_proceso != 'TERMINADO';
```

### Verificar zona horaria del servidor
```sql
SELECT 
  NOW() as hora_utc,
  NOW() AT TIME ZONE 'America/Lima' as hora_lima,
  CURRENT_SETTING('TIMEZONE') as zona_horaria_servidor,
  TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI:SS TZ') as formato_completo;
```

---

## 💾 BACKUP Y EXPORTACIÓN

### Exportar todos los datos (copiar resultado)
```sql
SELECT 
  id,
  codigo_equipo,
  marca_modelo,
  cliente,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  TO_CHAR(fecha_ingreso, 'YYYY-MM-DD HH24:MI:SS') as fecha_ingreso,
  TO_CHAR(fecha_salida, 'YYYY-MM-DD HH24:MI:SS') as fecha_salida,
  entregado_a,
  observaciones_ingreso,
  observaciones_salida
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL
ORDER BY id;

-- Después puedes copiar estos datos a Excel o CSV
```

---

## 🎯 CASOS DE USO COMUNES

### 1. Crear equipo manualmente con todos los campos
```sql
INSERT INTO equipos_temporales (
  codigo_equipo,
  marca_modelo,
  cliente,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  fecha_ingreso,
  observaciones_ingreso
) VALUES (
  'MI-CODIGO-123',                    -- Código del equipo
  'Dell Latitude 7420',               -- Marca/Modelo
  'Empresa XYZ S.A.',                 -- Cliente
  'Instalación',                      -- Motivo
  'Juan Pérez',                       -- Recibido por
  'Soporte Técnico',                  -- Área/Especialista
  FALSE,                              -- ¿Es urgente? (TRUE/FALSE)
  'PENDIENTE',                        -- Estado: PENDIENTE, EN_PROCESO
  NOW(),                              -- Fecha de ingreso (NOW() = ahora)
  'Instalar Windows 11 y Office'     -- Observaciones
);

-- Ver el equipo creado
SELECT * FROM equipos_temporales WHERE codigo_equipo = 'MI-CODIGO-123';
```

### 2. Buscar equipo por código
```sql
SELECT * FROM equipos_temporales 
WHERE codigo_equipo ILIKE '%CODIGO-A-BUSCAR%';
```

### 3. Ver historial completo de un equipo
```sql
SELECT 
  codigo_equipo,
  estado_proceso,
  prioridad_alta,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  TO_CHAR(fecha_salida AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as salida,
  EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias_total,
  recibido_por,
  entregado_a,
  observaciones_ingreso,
  observaciones_salida
FROM equipos_temporales
WHERE codigo_equipo = 'REEMPLAZA-CON-TU-CODIGO';
```

---

## ⚠️ IMPORTANTE

- **SIEMPRE** verifica con SELECT antes de hacer UPDATE o DELETE
- **NUNCA** ejecutes TRUNCATE o DELETE masivo sin hacer backup primero
- Usa `WHERE` para limitar las operaciones a los registros específicos
- Guarda las consultas que uses frecuentemente
- En producción, considera tener permisos limitados para evitar accidentes

---

## 📞 AYUDA ADICIONAL

Si necesitas más consultas personalizadas o tienes dudas:

1. Revisa `/CONSULTAS_SQL_UTILES.sql` para más ejemplos
2. Consulta la documentación de PostgreSQL: https://www.postgresql.org/docs/
3. Revisa los logs del servidor en Supabase para debugging

---

**Última actualización:** 13 de Febrero de 2026  
**Compatibilidad:** PostgreSQL 15+ / Supabase  
**Zona horaria:** America/Lima (UTC-5)
