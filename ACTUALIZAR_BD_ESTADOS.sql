-- Script para agregar columna de estado de proceso y vista comercial
-- Copia y pega esto en el Editor SQL de Supabase

-- 1. Agregar columna estado_proceso
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS estado_proceso text DEFAULT 'PENDIENTE';

-- 2. Actualizar registros existentes
-- Si ya tiene fecha de salida, está TERMINADO
UPDATE equipos_temporales 
SET estado_proceso = 'TERMINADO' 
WHERE fecha_salida IS NOT NULL;

-- Si no tiene fecha de salida, por defecto es PENDIENTE (o podrías poner EN_PROCESO si prefieres)
UPDATE equipos_temporales 
SET estado_proceso = 'PENDIENTE' 
WHERE fecha_salida IS NULL;

-- 3. Crear índice para mejorar rendimiento de filtros
CREATE INDEX IF NOT EXISTS idx_equipos_estado_proceso ON equipos_temporales(estado_proceso);
