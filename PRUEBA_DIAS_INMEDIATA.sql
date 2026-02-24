-- ============================================================
-- PRUEBA INMEDIATA - DÍAS EN CUSTODIA
-- ============================================================
-- Copia y pega esta consulta completa en Supabase SQL Editor
-- ============================================================

-- PASO 1: Crear equipo de prueba con fecha de AYER
INSERT INTO equipos_temporales (
  codigo_equipo,
  motivo,
  recibido_por,
  area,
  prioridad_alta,
  estado_proceso,
  fecha_ingreso
) VALUES (
  'PRUEBA-URGENTE-' || TO_CHAR(NOW(), 'HH24MISS'),
  'Instalación',
  'Usuario Test',
  'Sistemas',
  FALSE,
  'PENDIENTE',
  NOW() - INTERVAL '1 day'  -- AYER
);

-- PASO 2: Ver el resultado con cálculo de días
SELECT 
  codigo_equipo,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as fecha_ingreso_lima,
  TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as fecha_actual_lima,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_calculados,
  CASE 
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) >= 1 THEN '✅ CORRECTO: Muestra 1 o más días'
    ELSE '❌ ERROR: Debe mostrar al menos 1 día'
  END as resultado
FROM equipos_temporales
WHERE codigo_equipo LIKE 'PRUEBA-URGENTE-%'
ORDER BY id DESC
LIMIT 1;

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- codigo_equipo        | fecha_ingreso_lima  | fecha_actual_lima   | dias_calculados | resultado
-- ---------------------|---------------------|---------------------|-----------------|---------------------------
-- PRUEBA-URGENTE-14302 | 12/02/2026 14:30    | 13/02/2026 14:30    | 1               | ✅ CORRECTO: Muestra 1 o más días
-- ============================================================

-- PASO 3: Ver TODOS los equipos activos con sus días
SELECT 
  codigo_equipo,
  estado_proceso,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias,
  CASE 
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) = 0 THEN '⚪ Hoy'
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) = 1 THEN '🟢 1 día'
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) <= 3 THEN '🟡 ' || EXTRACT(DAY FROM (NOW() - fecha_ingreso))::TEXT || ' días'
    ELSE '🔴 ' || EXTRACT(DAY FROM (NOW() - fecha_ingreso))::TEXT || ' días (RETRASADO)'
  END as estado_visual
FROM equipos_temporales
WHERE fecha_salida IS NULL
  AND (eliminado IS FALSE OR eliminado IS NULL)
ORDER BY dias DESC;

-- ============================================================
-- LIMPIEZA (opcional): Eliminar el equipo de prueba
-- ============================================================
-- DELETE FROM equipos_temporales WHERE codigo_equipo LIKE 'PRUEBA-URGENTE-%';
