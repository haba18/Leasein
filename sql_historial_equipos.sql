-- ================================================================
-- SCRIPT SQL PARA SISTEMA DE HISTORIAL DE EQUIPOS ELIMINADOS
-- ================================================================
-- Instrucciones: 
-- 1. Abre Supabase Dashboard
-- 2. Ve a "SQL Editor"
-- 3. Copia y pega todo este script
-- 4. Haz clic en "Run" o presiona Ctrl+Enter
-- ================================================================

-- Agregar campo 'eliminado' (marca si el equipo fue eliminado)
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE NOT NULL;

-- Agregar campo 'fecha_eliminacion' (guarda cuándo fue eliminado)
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar el rendimiento de las consultas de historial
CREATE INDEX IF NOT EXISTS idx_equipos_eliminado 
ON equipos_temporales(eliminado);

-- Crear índice compuesto para consultas más eficientes
CREATE INDEX IF NOT EXISTS idx_equipos_eliminado_fecha 
ON equipos_temporales(eliminado, fecha_eliminacion DESC);

-- Actualizar todos los equipos existentes para marcarlos como NO eliminados
UPDATE equipos_temporales 
SET eliminado = FALSE 
WHERE eliminado IS NULL;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN equipos_temporales.eliminado IS 'Indica si el equipo fue eliminado (soft delete)';
COMMENT ON COLUMN equipos_temporales.fecha_eliminacion IS 'Fecha y hora en que el equipo fue eliminado del sistema';

-- Verificar que los campos se crearon correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equipos_temporales'
AND column_name IN ('eliminado', 'fecha_eliminacion')
ORDER BY column_name;

-- ================================================================
-- VERIFICACIÓN: Consulta para ver equipos eliminados (si hay alguno)
-- ================================================================
-- Descomenta la siguiente línea para ver si hay equipos eliminados
-- SELECT * FROM equipos_temporales WHERE eliminado = true ORDER BY fecha_eliminacion DESC;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
-- ✅ Si ves resultados en la verificación, los campos se crearon correctamente
-- ✅ Ahora puedes usar el sistema de historial desde la aplicación
-- ================================================================
