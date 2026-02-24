-- ================================================================
-- SCRIPT MANUAL PARA ACTIVAR HISTORIAL DE EQUIPOS ELIMINADOS
-- ================================================================
-- IMPORTANTE: Los equipos eliminados ANTES de ejecutar este script
-- fueron borrados permanentemente y NO se pueden recuperar.
-- Este script prepara la base de datos para futuros equipos.
-- ================================================================

-- PASO 1: Verificar si los campos ya existen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'equipos_temporales'
AND column_name IN ('eliminado', 'fecha_eliminacion');

-- Si no ves resultados arriba, ejecuta lo siguiente:

-- ================================================================
-- PASO 2: Crear los campos necesarios
-- ================================================================

-- Agregar campo 'eliminado'
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE NOT NULL;

-- Agregar campo 'fecha_eliminacion'
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- ================================================================
-- PASO 3: Actualizar todos los equipos existentes
-- ================================================================

-- Marcar todos los equipos actuales como NO eliminados
UPDATE equipos_temporales 
SET eliminado = FALSE 
WHERE eliminado IS NULL;

-- ================================================================
-- PASO 4: Crear índices para mejorar rendimiento
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_equipos_eliminado 
ON equipos_temporales(eliminado);

CREATE INDEX IF NOT EXISTS idx_equipos_eliminado_fecha 
ON equipos_temporales(eliminado, fecha_eliminacion DESC);

-- ================================================================
-- PASO 5: VERIFICACIÓN - Ver todos los equipos actuales
-- ================================================================

SELECT 
    id,
    codigo_equipo,
    marca_modelo,
    cliente,
    eliminado,
    fecha_eliminacion,
    fecha_ingreso,
    fecha_salida
FROM equipos_temporales
ORDER BY fecha_ingreso DESC;

-- ================================================================
-- PASO 6: Verificar cuántos equipos eliminados hay
-- ================================================================

SELECT COUNT(*) as total_eliminados
FROM equipos_temporales
WHERE eliminado = true;

-- ================================================================
-- PASO 7: Ver solo equipos eliminados (si hay alguno)
-- ================================================================

SELECT 
    codigo_equipo,
    marca_modelo,
    cliente,
    motivo,
    fecha_ingreso,
    fecha_salida,
    fecha_eliminacion
FROM equipos_temporales
WHERE eliminado = true
ORDER BY fecha_eliminacion DESC;

-- ================================================================
-- 🧪 OPCIONAL: CREAR EQUIPO DE PRUEBA Y ELIMINARLO
-- ================================================================
-- Si quieres probar el historial, ejecuta estos comandos UNO POR UNO:

-- 1. Crear un equipo de prueba
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
    'TEST-001',
    'HP ProBook',
    'Cliente Prueba',
    'Temporales',
    'Admin',
    'IT',
    false,
    NOW(),
    false
);

-- 2. Ver el equipo creado
SELECT * FROM equipos_temporales WHERE codigo_equipo = 'TEST-001';

-- 3. Marcarlo como eliminado (simulando la eliminación desde la app)
UPDATE equipos_temporales
SET eliminado = true,
    fecha_eliminacion = NOW()
WHERE codigo_equipo = 'TEST-001';

-- 4. Verificar que aparece en equipos eliminados
SELECT * FROM equipos_temporales WHERE codigo_equipo = 'TEST-001';

-- 5. Ver todos los eliminados
SELECT 
    codigo_equipo,
    marca_modelo,
    eliminado,
    fecha_eliminacion
FROM equipos_temporales
WHERE eliminado = true;

-- ================================================================
-- 🗑️ OPCIONAL: Limpiar equipo de prueba
-- ================================================================
-- Si creaste el equipo de prueba y quieres eliminarlo permanentemente:

-- DELETE FROM equipos_temporales WHERE codigo_equipo = 'TEST-001';

-- ================================================================
-- ✅ VERIFICACIÓN FINAL
-- ================================================================

-- Ejecuta esto para verificar que todo está configurado:
SELECT 
    (SELECT COUNT(*) FROM equipos_temporales WHERE eliminado = false) as equipos_activos,
    (SELECT COUNT(*) FROM equipos_temporales WHERE eliminado = true) as equipos_eliminados,
    (SELECT COUNT(*) FROM equipos_temporales) as total_equipos;

-- ================================================================
-- 📝 NOTAS IMPORTANTES
-- ================================================================
-- 1. Los equipos eliminados ANTES de este script NO se pueden recuperar
-- 2. A partir de ahora, cuando elimines equipos desde la app,
--    se marcarán como eliminado=true en lugar de borrarse
-- 3. Aparecerán en "Ver Historial"
-- 4. Si ves 0 equipos eliminados, es normal. Elimina uno nuevo desde la app
-- ================================================================
