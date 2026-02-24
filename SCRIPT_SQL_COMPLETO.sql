-- =====================================================
-- SCRIPT SQL COMPLETO PARA SISTEMA DE GESTIÓN DE EQUIPOS TEMPORALES
-- Sistema de Control de Laptops en Preparación
-- =====================================================
-- 
-- INSTRUCCIONES DE USO:
-- 1. Abre tu proyecto en Supabase (https://supabase.com)
-- 2. Ve al menú lateral izquierdo → "SQL Editor"
-- 3. Haz clic en "New query" (Nueva consulta)
-- 4. Copia y pega TODO este script completo
-- 5. Haz clic en "Run" (Ejecutar) en la esquina inferior derecha
-- 6. Espera a que aparezca el mensaje de confirmación
-- 7. ¡Listo! Tu base de datos está configurada
--
-- NOTA: Si la tabla ya existe y quieres empezar de cero,
--       descomenta la siguiente línea (quita los guiones --):
-- DROP TABLE IF EXISTS equipos_temporales CASCADE;
--
-- =====================================================

-- CREAR LA TABLA PRINCIPAL: equipos_temporales
CREATE TABLE IF NOT EXISTS equipos_temporales (
  -- Identificador único del registro (se genera automáticamente)
  id BIGSERIAL PRIMARY KEY,
  
  -- INFORMACIÓN DEL EQUIPO
  codigo_equipo TEXT NOT NULL,           -- Código del equipo (obligatorio, ej: "LAPTOP-001")
  marca_modelo TEXT,                     -- Marca y modelo del equipo (ej: "HP EliteBook 840")
  cliente TEXT,                          -- Nombre del cliente o empresa
  
  -- INFORMACIÓN DEL PROCESO
  motivo TEXT NOT NULL,                  -- Motivo del ingreso (obligatorio)
                                         -- Valores: "Instalación", "Configuración", "Reparación", 
                                         --          "Revisión Técnica", "Mantenimientos", "Otros"
  
  recibido_por TEXT NOT NULL,            -- Nombre de quien recibió el equipo (obligatorio)
  area TEXT NOT NULL,                    -- Área o especialista responsable (obligatorio)
  
  -- ESTADO Y PRIORIDAD
  prioridad_alta BOOLEAN DEFAULT FALSE,  -- Marca si es urgente (true/false)
  estado_proceso TEXT DEFAULT 'PENDIENTE', -- Estado del proceso
                                         -- Valores: "PENDIENTE", "EN_PROCESO", "TERMINADO"
  
  -- FECHAS Y TIMESTAMPS (se llenan automáticamente)
  fecha_ingreso TIMESTAMPTZ,             -- Fecha y hora de ingreso
  fecha_salida TIMESTAMPTZ,              -- Fecha y hora de salida
  
  -- INFORMACIÓN DE ENTREGA
  entregado_a TEXT,                      -- Persona a quien se entrega el equipo al salir
  
  -- OBSERVACIONES
  observaciones_ingreso TEXT,            -- Comentarios al momento del ingreso
  observaciones_salida TEXT,             -- Comentarios al momento de la salida
  
  -- CONTROL DE ELIMINACIÓN (soft delete)
  eliminado BOOLEAN DEFAULT FALSE,       -- Marca lógica de eliminación
  fecha_eliminacion TIMESTAMPTZ,         -- Fecha de eliminación (si aplica)
  
  -- AUDITORÍA AUTOMÁTICA
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de creación del registro
  updated_at TIMESTAMPTZ DEFAULT NOW()   -- Fecha de última actualización
);

-- =====================================================
-- CREAR ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =====================================================
-- Los índices hacen que las búsquedas sean más rápidas

-- Índice para buscar por código de equipo (lo más común)
CREATE INDEX IF NOT EXISTS idx_equipos_codigo 
  ON equipos_temporales(codigo_equipo);

-- Índice para filtrar equipos activos (sin salida)
CREATE INDEX IF NOT EXISTS idx_equipos_activos 
  ON equipos_temporales(fecha_salida) 
  WHERE fecha_salida IS NULL;

-- Índice para filtrar por prioridad alta (urgentes)
CREATE INDEX IF NOT EXISTS idx_equipos_urgentes 
  ON equipos_temporales(prioridad_alta) 
  WHERE prioridad_alta = TRUE;

-- Índice para filtrar equipos no eliminados
CREATE INDEX IF NOT EXISTS idx_equipos_no_eliminados 
  ON equipos_temporales(eliminado) 
  WHERE eliminado = FALSE OR eliminado IS NULL;

-- Índice para ordenar por fecha de ingreso
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_ingreso 
  ON equipos_temporales(fecha_ingreso DESC);

-- Índice para buscar por motivo
CREATE INDEX IF NOT EXISTS idx_equipos_motivo 
  ON equipos_temporales(motivo);

-- Índice para buscar por estado de proceso
CREATE INDEX IF NOT EXISTS idx_equipos_estado_proceso 
  ON equipos_temporales(estado_proceso);

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR AUTOMÁTICAMENTE "updated_at"
-- =====================================================
-- Esta función actualiza la fecha de modificación cada vez que se edita un registro

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA EJECUTAR LA FUNCIÓN ANTERIOR
-- =====================================================
-- Se ejecuta automáticamente antes de cada actualización

DROP TRIGGER IF EXISTS trigger_update_equipos_timestamp ON equipos_temporales;

CREATE TRIGGER trigger_update_equipos_timestamp
  BEFORE UPDATE ON equipos_temporales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) - SEGURIDAD
-- =====================================================
-- Esto protege los datos y permite control de acceso

ALTER TABLE equipos_temporales ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- =====================================================
-- Define quién puede ver, crear, actualizar y eliminar registros

-- POLÍTICA 1: Permitir que todos puedan LEER (SELECT) los equipos
DROP POLICY IF EXISTS "Permitir lectura pública de equipos" ON equipos_temporales;

CREATE POLICY "Permitir lectura pública de equipos"
  ON equipos_temporales
  FOR SELECT
  USING (true);  -- Todos pueden leer

-- POLÍTICA 2: Permitir que todos puedan CREAR (INSERT) equipos
DROP POLICY IF EXISTS "Permitir creación pública de equipos" ON equipos_temporales;

CREATE POLICY "Permitir creación pública de equipos"
  ON equipos_temporales
  FOR INSERT
  WITH CHECK (true);  -- Todos pueden crear

-- POLÍTICA 3: Permitir que todos puedan ACTUALIZAR (UPDATE) equipos
DROP POLICY IF EXISTS "Permitir actualización pública de equipos" ON equipos_temporales;

CREATE POLICY "Permitir actualización pública de equipos"
  ON equipos_temporales
  FOR UPDATE
  USING (true)  -- Todos pueden actualizar
  WITH CHECK (true);

-- POLÍTICA 4: Permitir que todos puedan ELIMINAR (DELETE) equipos
DROP POLICY IF EXISTS "Permitir eliminación pública de equipos" ON equipos_temporales;

CREATE POLICY "Permitir eliminación pública de equipos"
  ON equipos_temporales
  FOR DELETE
  USING (true);  -- Todos pueden eliminar

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - PARA PRUEBAS)
-- =====================================================
-- Puedes descomentar las siguientes líneas para insertar datos de prueba
-- (quita los guiones -- de las líneas que empiezan con INSERT INTO)

/*
INSERT INTO equipos_temporales 
  (codigo_equipo, marca_modelo, cliente, motivo, recibido_por, area, prioridad_alta, estado_proceso, fecha_ingreso, observaciones_ingreso)
VALUES
  ('LAPTOP-001', 'HP EliteBook 840', 'Empresa ABC S.A.', 'Instalación', 'Juan Pérez', 'Soporte Técnico', FALSE, 'EN_PROCESO', NOW() - INTERVAL '2 days', 'Equipo requiere instalación de Windows 11'),
  ('LAPTOP-002', 'Dell Latitude 5420', 'Corporación XYZ', 'Configuración', 'María García', 'Sistemas', TRUE, 'PENDIENTE', NOW() - INTERVAL '1 day', 'Urgente - Cliente VIP'),
  ('LAPTOP-003', 'Lenovo ThinkPad X1', 'Tech Solutions', 'Reparación', 'Carlos López', 'Mantenimiento', FALSE, 'TERMINADO', NOW() - INTERVAL '5 days', 'Pantalla dañada');

-- Marcar la salida del equipo LAPTOP-003 (ya está terminado)
UPDATE equipos_temporales 
SET 
  fecha_salida = NOW() - INTERVAL '1 day',
  entregado_a = 'Roberto Sánchez',
  observaciones_salida = 'Equipo reparado y entregado en perfectas condiciones',
  estado_proceso = 'TERMINADO'
WHERE codigo_equipo = 'LAPTOP-003';
*/

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
-- Consulta para verificar que todo se creó correctamente

SELECT 
  'Tabla creada exitosamente' AS mensaje,
  COUNT(*) AS total_equipos
FROM equipos_temporales;

-- =====================================================
-- ¡SCRIPT COMPLETADO CON ÉXITO!
-- =====================================================
-- 
-- Tu base de datos está lista para usar.
-- 
-- PRÓXIMOS PASOS:
-- 1. Ve a tu aplicación web
-- 2. Haz clic en "Actualizar" para cargar los datos
-- 3. Empieza a registrar equipos
--
-- CONSULTAS ÚTILES PARA ADMINISTRACIÓN:
--
-- Ver todos los equipos:
-- SELECT * FROM equipos_temporales ORDER BY fecha_ingreso DESC;
--
-- Ver solo equipos activos (sin salida):
-- SELECT * FROM equipos_temporales WHERE fecha_salida IS NULL;
--
-- Ver equipos urgentes:
-- SELECT * FROM equipos_temporales WHERE prioridad_alta = TRUE AND fecha_salida IS NULL;
--
-- Limpiar todos los datos (¡CUIDADO! Esto borra todo):
-- TRUNCATE TABLE equipos_temporales RESTART IDENTITY CASCADE;
--
-- =====================================================
