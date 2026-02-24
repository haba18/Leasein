-- ============================================
-- 🚀 SCRIPT DE REPARACIÓN RÁPIDA
-- ============================================
-- Copia y pega TODO este archivo en Supabase SQL Editor
-- Luego haz clic en "Run"
-- ============================================

-- PASO 1: Agregar campos (si no existen)
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- PASO 2: Actualizar equipos existentes
UPDATE equipos_temporales 
SET eliminado = FALSE 
WHERE eliminado IS NULL;

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_equipos_eliminado 
ON equipos_temporales(eliminado);

-- PASO 4: Crear equipo de prueba
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
    'TEST-HISTORIAL-001',
    'HP ProBook 450 G8',
    'Prueba Sistema',
    'Temporales',
    'Administrador',
    'IT',
    false,
    NOW(),
    false
)
ON CONFLICT (id) DO NOTHING;

-- PASO 5: Obtener el ID del equipo de prueba
DO $$
DECLARE
    test_id INTEGER;
BEGIN
    SELECT id INTO test_id 
    FROM equipos_temporales 
    WHERE codigo_equipo = 'TEST-HISTORIAL-001';
    
    -- PASO 6: Marcar como eliminado
    UPDATE equipos_temporales
    SET 
        eliminado = true,
        fecha_eliminacion = NOW()
    WHERE id = test_id;
    
    RAISE NOTICE 'Equipo de prueba creado con ID: %', test_id;
END $$;

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================

-- Ver el equipo de prueba eliminado
SELECT 
    'EQUIPO DE PRUEBA ELIMINADO:' as info,
    codigo_equipo,
    marca_modelo,
    eliminado,
    fecha_eliminacion
FROM equipos_temporales
WHERE codigo_equipo = 'TEST-HISTORIAL-001';

-- Contar todos los eliminados
SELECT 
    COUNT(*) as total_eliminados,
    'equipos eliminados en el sistema' as descripcion
FROM equipos_temporales
WHERE eliminado = true;

-- Ver todos los equipos eliminados
SELECT 
    codigo_equipo,
    marca_modelo,
    cliente,
    fecha_ingreso,
    fecha_eliminacion,
    eliminado
FROM equipos_temporales
WHERE eliminado = true
ORDER BY fecha_eliminacion DESC;

-- ============================================
-- 📋 RESULTADO ESPERADO:
-- ============================================
-- Deberías ver al menos 1 equipo:
-- TEST-HISTORIAL-001 con eliminado = true
-- 
-- Ahora ve a tu aplicación:
-- 1. Recarga la página (F5)
-- 2. Haz clic en "Ver Historial"
-- 3. Deberías ver el equipo TEST-HISTORIAL-001
-- ============================================

-- 🧹 Para limpiar el equipo de prueba después:
-- DELETE FROM equipos_temporales WHERE codigo_equipo = 'TEST-HISTORIAL-001';
