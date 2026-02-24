-- =========================================
-- SCRIPT SQL COMPLETO PARA POSTGRESQL / SUPABASE
-- Sistema de Gestión de Equipos Temporales
-- =========================================

-- 1. ELIMINAR TABLA SI EXISTE (USAR CON PRECAUCIÓN)
-- =========================================
-- Descomentar solo si necesitas recrear la tabla desde cero
-- DROP TABLE IF EXISTS equipos_temporales CASCADE;

-- 2. CREAR TABLA PRINCIPAL
-- =========================================
CREATE TABLE IF NOT EXISTS equipos_temporales (
    -- Identificador único del registro
    id SERIAL PRIMARY KEY,
    
    -- Información básica del equipo
    codigo_equipo VARCHAR(50) NOT NULL,
    marca_modelo VARCHAR(100),
    cliente VARCHAR(100),
    
    -- Motivo del ingreso (Temporales, Alquileres, Cambios, Stock)
    motivo VARCHAR(100) NOT NULL,
    
    -- Información de recepción
    recibido_por VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    
    -- Prioridad y control
    prioridad_alta BOOLEAN DEFAULT FALSE,
    
    -- Timestamps de ingreso y salida
    fecha_ingreso TIMESTAMP NULL,
    fecha_salida TIMESTAMP NULL,
    
    -- Información de entrega
    entregado_a VARCHAR(100) NULL,
    
    -- Dos campos de observaciones
    observaciones_ingreso TEXT NULL,
    observaciones_salida TEXT NULL,
    
    -- Timestamp de creación del registro
    creado_en TIMESTAMP DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =========================================
CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos_temporales(codigo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_prioridad ON equipos_temporales(prioridad_alta);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_ingreso ON equipos_temporales(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_salida ON equipos_temporales(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_equipos_motivo ON equipos_temporales(motivo);
CREATE INDEX IF NOT EXISTS idx_equipos_area ON equipos_temporales(area);

-- 4. COMENTARIOS EN COLUMNAS (DOCUMENTACIÓN)
-- =========================================
COMMENT ON TABLE equipos_temporales IS 'Tabla principal para gestión de equipos temporales (laptops en preparación)';

COMMENT ON COLUMN equipos_temporales.id IS 'Identificador único autoincremental';
COMMENT ON COLUMN equipos_temporales.codigo_equipo IS 'Código único del equipo (LAP-001, etc). Siempre en MAYÚSCULAS. Apostrofes se reemplazan por guiones';
COMMENT ON COLUMN equipos_temporales.marca_modelo IS 'Marca y modelo del equipo (opcional)';
COMMENT ON COLUMN equipos_temporales.cliente IS 'Nombre del cliente (opcional)';
COMMENT ON COLUMN equipos_temporales.motivo IS 'Motivo del ingreso: Temporales, Alquileres, Cambios, Stock';
COMMENT ON COLUMN equipos_temporales.recibido_por IS 'Persona que recibió el equipo: Harold Bayona, Ivan Quiroz, Joseph Sanchez, Bruno Quipe';
COMMENT ON COLUMN equipos_temporales.area IS 'Área responsable: Inventario, Reparaciones, Logistica';
COMMENT ON COLUMN equipos_temporales.prioridad_alta IS 'Indica si el equipo es urgente (alta prioridad)';
COMMENT ON COLUMN equipos_temporales.fecha_ingreso IS 'Fecha y hora de ingreso del equipo al sistema';
COMMENT ON COLUMN equipos_temporales.fecha_salida IS 'Fecha y hora de salida del equipo (NULL si aún está en preparación)';
COMMENT ON COLUMN equipos_temporales.entregado_a IS 'Área a la que se entregó: Inventario, Logistica, Reparaciones';
COMMENT ON COLUMN equipos_temporales.observaciones_ingreso IS 'Observaciones adicionales sobre el equipo o proceso al momento de ingreso';
COMMENT ON COLUMN equipos_temporales.observaciones_salida IS 'Observaciones adicionales sobre el equipo o proceso al momento de salida';
COMMENT ON COLUMN equipos_temporales.creado_en IS 'Timestamp de creación del registro';

-- 5. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- =========================================
-- Descomentar para insertar datos de prueba:
/*
INSERT INTO equipos_temporales 
(codigo_equipo, marca_modelo, cliente, motivo, recibido_por, area, prioridad_alta, fecha_ingreso, observaciones_ingreso)
VALUES 
('LAP-001', 'Dell Latitude 5420', 'Acme Corp', 'Temporales', 'Harold Bayona', 'Inventario', FALSE, NOW() - INTERVAL '2 days', 'Equipo en buen estado'),
('LAP-002', 'HP EliteBook 840', 'TechSolutions', 'Alquileres', 'Ivan Quiroz', 'Reparaciones', TRUE, NOW() - INTERVAL '5 days', 'Urgente - Cliente prioritario'),
('LAP-003', 'Lenovo ThinkPad X1', 'InnovateLab', 'Cambios', 'Joseph Sanchez', 'Logistica', FALSE, NOW() - INTERVAL '1 day', NULL),
('LAP-004', 'MacBook Pro 14"', 'Creative Studio', 'Stock', 'Bruno Quipe', 'Inventario', FALSE, NOW() - INTERVAL '4 days', 'Revisar batería'),
('LAP-005', 'ASUS ZenBook', NULL, 'Temporales', 'Harold Bayona', 'Reparaciones', TRUE, NOW() - INTERVAL '6 hours', 'Sin cliente asignado');
*/

-- 6. CONSULTAS ÚTILES PARA REPORTES
-- =========================================

-- Consulta 1: Ver todos los equipos en preparación (sin fecha de salida)
-- SELECT * FROM equipos_temporales WHERE fecha_salida IS NULL ORDER BY prioridad_alta DESC, fecha_ingreso ASC;

-- Consulta 2: Equipos urgentes en preparación
-- SELECT * FROM equipos_temporales WHERE prioridad_alta = TRUE AND fecha_salida IS NULL;

-- Consulta 3: Equipos retrasados (más de 3 días sin salir)
/*
SELECT 
    codigo_equipo,
    cliente,
    motivo,
    area,
    fecha_ingreso,
    EXTRACT(DAY FROM (NOW() - fecha_ingreso)) as dias_en_custodia
FROM equipos_temporales 
WHERE fecha_salida IS NULL 
AND fecha_ingreso IS NOT NULL
AND fecha_ingreso < NOW() - INTERVAL '3 days'
ORDER BY fecha_ingreso ASC;
*/

-- Consulta 4: Estadísticas generales
/*
SELECT 
    COUNT(*) FILTER (WHERE fecha_salida IS NULL) as total_en_preparacion,
    COUNT(*) FILTER (WHERE prioridad_alta = TRUE AND fecha_salida IS NULL) as total_urgentes,
    COUNT(*) FILTER (WHERE fecha_salida IS NULL AND fecha_ingreso < NOW() - INTERVAL '3 days') as equipos_retrasados,
    ROUND(AVG(EXTRACT(DAY FROM (NOW() - fecha_ingreso)))) as promedio_dias_custodia
FROM equipos_temporales 
WHERE fecha_ingreso IS NOT NULL;
*/

-- Consulta 5: Equipos por área
-- SELECT area, COUNT(*) as total FROM equipos_temporales WHERE fecha_salida IS NULL GROUP BY area ORDER BY total DESC;

-- Consulta 6: Equipos por motivo
-- SELECT motivo, COUNT(*) as total FROM equipos_temporales GROUP BY motivo ORDER BY total DESC;

-- Consulta 7: Historial completo de un equipo por código
-- SELECT * FROM equipos_temporales WHERE codigo_equipo = 'LAP-001' ORDER BY creado_en DESC;

-- Consulta 8: Códigos duplicados
/*
SELECT 
    codigo_equipo, 
    COUNT(*) as cantidad,
    STRING_AGG(id::TEXT, ', ') as ids
FROM equipos_temporales 
GROUP BY codigo_equipo 
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;
*/

-- =========================================
-- FIN DEL SCRIPT SQL
-- =========================================

-- NOTAS IMPORTANTES:
-- 1. Los códigos de equipo se normalizan automáticamente a MAYÚSCULAS
-- 2. Los apostrofes (') se reemplazan automáticamente por guiones (-)
-- 3. El sistema permite códigos duplicados pero alerta al usuario
-- 4. Los cálculos de días en custodia y estados se realizan en el servidor backend
-- 5. Marca/modelo y cliente son campos opcionales
-- 6. El campo 'especialista' fue removido - solo se usa 'entregado_a'