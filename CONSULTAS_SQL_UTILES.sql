-- =====================================================
-- CONSULTAS SQL ÚTILES PARA DIAGNÓSTICO Y PRUEBAS
-- =====================================================

-- 1. VER TODOS LOS EQUIPOS CON SU INFORMACIÓN COMPLETA
-- Muestra todos los campos incluyendo estados y fechas
SELECT 
  id,
  codigo_equipo,
  marca_modelo,
  cliente,
  motivo,
  area,
  estado_proceso,
  prioridad_alta,
  fecha_ingreso,
  fecha_salida,
  entregado_a,
  observaciones_ingreso,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso_lima,
  TO_CHAR(fecha_salida AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as salida_lima,
  EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias_calculados
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL
ORDER BY fecha_ingreso DESC;

-- =====================================================

-- 2. VER SOLO EQUIPOS ACTIVOS (EN CUSTODIA)
-- Equipos que todavía no han salido
SELECT 
  codigo_equipo,
  cliente,
  motivo,
  estado_proceso,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_en_custodia
FROM equipos_temporales
WHERE fecha_salida IS NULL
  AND (eliminado IS FALSE OR eliminado IS NULL)
ORDER BY prioridad_alta DESC, fecha_ingreso ASC;

-- =====================================================

-- 3. VER EQUIPOS CON PROBLEMAS DE ESTADO
-- Detecta equipos que deberían estar en TERMINADO pero no lo están
SELECT 
  id,
  codigo_equipo,
  estado_proceso as estado_actual,
  CASE 
    WHEN fecha_salida IS NOT NULL THEN 'TERMINADO'
    ELSE estado_proceso
  END as estado_esperado,
  fecha_salida,
  '⚠️ INCONSISTENCIA' as alerta
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL 
  AND estado_proceso != 'TERMINADO'
ORDER BY fecha_salida DESC;

-- =====================================================

-- 4. CORREGIR ESTADOS INCONSISTENTES
-- Actualiza equipos que tienen fecha_salida pero estado_proceso incorrecto
UPDATE equipos_temporales
SET estado_proceso = 'TERMINADO'
WHERE fecha_salida IS NOT NULL 
  AND estado_proceso != 'TERMINADO';

-- Ver cuántos se actualizaron
SELECT 
  'Equipos corregidos' as mensaje,
  COUNT(*) as cantidad
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL 
  AND estado_proceso = 'TERMINADO';

-- =====================================================

-- 5. ESTADÍSTICAS DEL DASHBOARD
-- Replica los cálculos que hace el sistema
WITH equipos_activos AS (
  SELECT 
    *,
    EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias
  FROM equipos_temporales
  WHERE fecha_salida IS NULL
    AND (eliminado IS FALSE OR eliminado IS NULL)
)
SELECT 
  COUNT(*) FILTER (WHERE NOT prioridad_alta) as total_preparacion,
  COUNT(*) FILTER (WHERE prioridad_alta) as total_urgentes,
  SUM(dias) as total_dias_custodia,
  ROUND(AVG(dias), 1) as promedio_dias,
  MAX(dias) as dias_maximo,
  COUNT(*) FILTER (WHERE dias > 3) as equipos_retrasados
FROM equipos_activos;

-- =====================================================

-- 6. CREAR EQUIPO DE PRUEBA CON FECHA DE AYER
-- Útil para probar el cálculo de días en custodia
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
  'Equipo creado para prueba de días en custodia'
);

-- Ver el equipo recién creado
SELECT 
  codigo_equipo,
  estado_proceso,
  TO_CHAR(fecha_ingreso AT TIME ZONE 'America/Lima', 'DD/MM/YYYY HH24:MI') as ingreso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_calculados
FROM equipos_temporales
WHERE codigo_equipo LIKE 'PRUEBA-%'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================

-- 7. CREAR VARIOS EQUIPOS DE PRUEBA CON DIFERENTES DÍAS
INSERT INTO equipos_temporales (
  codigo_equipo, motivo, recibido_por, area, estado_proceso, fecha_ingreso
)
SELECT 
  'TEST-' || dias.n || 'D',
  'Instalación',
  'Usuario Test',
  'Sistemas',
  CASE 
    WHEN dias.n <= 1 THEN 'PENDIENTE'
    WHEN dias.n <= 3 THEN 'EN_PROCESO'
    ELSE 'EN_PROCESO'
  END,
  NOW() - (dias.n || ' days')::INTERVAL
FROM (
  SELECT generate_series(1, 7) as n
) as dias;

-- Ver los equipos de prueba
SELECT 
  codigo_equipo,
  estado_proceso,
  EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias,
  CASE 
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) > 3 THEN '🔴 RETRASADO'
    WHEN EXTRACT(DAY FROM (NOW() - fecha_ingreso)) > 0 THEN '🟡 EN PREPARACIÓN'
    ELSE '⚪ REGISTRADO'
  END as estado_visual
FROM equipos_temporales
WHERE codigo_equipo LIKE 'TEST-%'
ORDER BY dias DESC;

-- =====================================================

-- 8. CAMBIAR ESTADO DE PROCESO DE UN EQUIPO
-- Cambiar a EN_PROCESO
UPDATE equipos_temporales
SET estado_proceso = 'EN_PROCESO'
WHERE codigo_equipo = 'TU-CODIGO-AQUI';

-- Cambiar a TERMINADO (sin marcar salida física)
UPDATE equipos_temporales
SET estado_proceso = 'TERMINADO'
WHERE codigo_equipo = 'TU-CODIGO-AQUI';

-- Verificar el cambio
SELECT codigo_equipo, estado_proceso, fecha_salida
FROM equipos_temporales
WHERE codigo_equipo = 'TU-CODIGO-AQUI';

-- =====================================================

-- 9. MARCAR SALIDA FÍSICA DE UN EQUIPO
-- (Esto hace que desaparezca de la vista comercial)
UPDATE equipos_temporales
SET 
  fecha_salida = NOW(),
  entregado_a = 'Nombre del destinatario',
  observaciones_salida = 'Equipo entregado en perfectas condiciones',
  estado_proceso = 'TERMINADO'
WHERE codigo_equipo = 'TU-CODIGO-AQUI';

-- =====================================================

-- 10. DESMARCAR SALIDA (VOLVER A PONER EN CUSTODIA)
-- Útil si marcaste salida por error
UPDATE equipos_temporales
SET 
  fecha_salida = NULL,
  entregado_a = NULL,
  observaciones_salida = NULL,
  estado_proceso = 'EN_PROCESO'
WHERE codigo_equipo = 'TU-CODIGO-AQUI';

-- =====================================================

-- 11. VER HISTORIAL DE CAMBIOS (requiere trigger adicional)
-- Si quieres implementar auditoría completa, necesitarías crear
-- una tabla de historial. Por ahora, puedes ver:
SELECT 
  codigo_equipo,
  created_at as fecha_creacion,
  updated_at as ultima_modificacion,
  EXTRACT(HOUR FROM (updated_at - created_at)) as horas_desde_creacion
FROM equipos_temporales
ORDER BY updated_at DESC
LIMIT 20;

-- =====================================================

-- 12. LIMPIAR EQUIPOS DE PRUEBA
-- ⚠️ CUIDADO: Esto elimina datos
DELETE FROM equipos_temporales
WHERE codigo_equipo LIKE 'TEST-%' 
   OR codigo_equipo LIKE 'PRUEBA-%';

-- Verificar que se eliminaron
SELECT COUNT(*) as equipos_restantes
FROM equipos_temporales;

-- =====================================================

-- 13. VERIFICAR INTEGRIDAD DE LA BASE DE DATOS
-- Detecta posibles problemas
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
  'Equipos con salida pero sin entregado_a',
  COUNT(*)
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL AND entregado_a IS NULL;

-- =====================================================

-- 14. RESETEAR TODOS LOS ESTADOS A PENDIENTE
-- Útil si quieres empezar de cero con los estados
UPDATE equipos_temporales
SET estado_proceso = 'PENDIENTE'
WHERE fecha_salida IS NULL;

SELECT 
  'Estados reseteados' as mensaje,
  COUNT(*) as cantidad_actualizada
FROM equipos_temporales
WHERE estado_proceso = 'PENDIENTE' AND fecha_salida IS NULL;

-- =====================================================

-- 15. BACKUP DE DATOS (EXPORTAR)
-- Copia esta query y guarda el resultado como backup
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

-- =====================================================

-- 16. VER EQUIPOS POR ESTADO DE PROCESO
SELECT 
  estado_proceso,
  COUNT(*) as cantidad,
  ARRAY_AGG(codigo_equipo) as codigos
FROM equipos_temporales
WHERE fecha_salida IS NULL
  AND (eliminado IS FALSE OR eliminado IS NULL)
GROUP BY estado_proceso
ORDER BY 
  CASE estado_proceso
    WHEN 'PENDIENTE' THEN 1
    WHEN 'EN_PROCESO' THEN 2
    WHEN 'TERMINADO' THEN 3
    ELSE 4
  END;

-- =====================================================

-- 17. VERIFICAR ZONA HORARIA DEL SERVIDOR
SELECT 
  NOW() as hora_utc,
  NOW() AT TIME ZONE 'America/Lima' as hora_lima,
  CURRENT_SETTING('TIMEZONE') as zona_horaria_servidor;

-- =====================================================

-- 18. CONSULTA COMPLETA DE DIAGNÓSTICO
-- Ejecuta esta para obtener un reporte completo del estado del sistema
SELECT 
  '📊 ESTADÍSTICAS GENERALES' as seccion,
  '' as detalle,
  0 as valor
UNION ALL
SELECT 
  '  Total equipos',
  '',
  COUNT(*)::INTEGER
FROM equipos_temporales
WHERE eliminado IS FALSE OR eliminado IS NULL

UNION ALL
SELECT 
  '  Equipos activos (en custodia)',
  '',
  COUNT(*)::INTEGER
FROM equipos_temporales
WHERE fecha_salida IS NULL AND (eliminado IS FALSE OR eliminado IS NULL)

UNION ALL
SELECT 
  '  Equipos con salida marcada',
  '',
  COUNT(*)::INTEGER
FROM equipos_temporales
WHERE fecha_salida IS NOT NULL

UNION ALL
SELECT 
  '',
  '',
  0

UNION ALL
SELECT 
  '📈 POR ESTADO DE PROCESO',
  '',
  0

UNION ALL
SELECT 
  '  ' || COALESCE(estado_proceso, 'SIN ESTADO'),
  '',
  COUNT(*)::INTEGER
FROM equipos_temporales
WHERE fecha_salida IS NULL AND (eliminado IS FALSE OR eliminado IS NULL)
GROUP BY estado_proceso

UNION ALL
SELECT 
  '',
  '',
  0

UNION ALL
SELECT 
  '⏰ POR DÍAS EN CUSTODIA',
  '',
  0

UNION ALL
SELECT 
  CASE 
    WHEN dias = 0 THEN '  Hoy (0 días)'
    WHEN dias = 1 THEN '  Ayer (1 día)'
    WHEN dias <= 3 THEN '  2-3 días'
    WHEN dias <= 7 THEN '  4-7 días'
    ELSE '  Más de 7 días'
  END,
  '',
  COUNT(*)::INTEGER
FROM (
  SELECT 
    EXTRACT(DAY FROM (NOW() - fecha_ingreso))::INTEGER as dias
  FROM equipos_temporales
  WHERE fecha_salida IS NULL AND (eliminado IS FALSE OR eliminado IS NULL)
) sub
GROUP BY 
  CASE 
    WHEN dias = 0 THEN 1
    WHEN dias = 1 THEN 2
    WHEN dias <= 3 THEN 3
    WHEN dias <= 7 THEN 4
    ELSE 5
  END,
  CASE 
    WHEN dias = 0 THEN '  Hoy (0 días)'
    WHEN dias = 1 THEN '  Ayer (1 día)'
    WHEN dias <= 3 THEN '  2-3 días'
    WHEN dias <= 7 THEN '  4-7 días'
    ELSE '  Más de 7 días'
  END
ORDER BY 
  CASE seccion
    WHEN '📊 ESTADÍSTICAS GENERALES' THEN 1
    WHEN '📈 POR ESTADO DE PROCESO' THEN 2
    WHEN '⏰ POR DÍAS EN CUSTODIA' THEN 3
    ELSE 4
  END,
  valor DESC;

-- =====================================================
-- FIN DE LAS CONSULTAS ÚTILES
-- =====================================================
--
-- CÓMO USAR ESTAS CONSULTAS:
-- 1. Abre Supabase → SQL Editor
-- 2. Copia la consulta que necesites
-- 3. Pega en el editor
-- 4. Haz clic en "Run"
-- 5. Revisa los resultados
--
-- TIPS:
-- - Guarda las consultas que uses frecuentemente
-- - Crea backups antes de hacer UPDATE o DELETE masivos
-- - Usa WHERE para limitar las actualizaciones
-- - Prueba primero con SELECT antes de hacer UPDATE
--
-- =====================================================
