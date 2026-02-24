# 🚀 Configuración Rápida - 2 Pasos

## Paso 1: Crear la Tabla en Supabase

1. Ve a tu [Panel de Supabase](https://supabase.com/dashboard)
2. Abre **SQL Editor**
3. Copia y pega este SQL:

```sql
CREATE TABLE IF NOT EXISTS equipos_temporales (
    id SERIAL PRIMARY KEY,
    codigo_equipo VARCHAR(50) NOT NULL,
    marca_modelo VARCHAR(100),
    cliente VARCHAR(100),
    motivo VARCHAR(100) NOT NULL,
    recibido_por VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    prioridad_alta BOOLEAN DEFAULT FALSE,
    fecha_ingreso TIMESTAMP NULL,
    fecha_salida TIMESTAMP NULL,
    entregado_a VARCHAR(100) NULL,
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos_temporales(codigo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_prioridad ON equipos_temporales(prioridad_alta);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_ingreso ON equipos_temporales(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_salida ON equipos_temporales(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_equipos_motivo ON equipos_temporales(motivo);
CREATE INDEX IF NOT EXISTS idx_equipos_area ON equipos_temporales(area);
```

4. Presiona **Run** o `Ctrl+Enter`

## Paso 2: (Opcional) Agregar Datos de Prueba

```sql
INSERT INTO equipos_temporales 
(codigo_equipo, marca_modelo, cliente, motivo, recibido_por, area, prioridad_alta, fecha_ingreso, observaciones)
VALUES 
('LAP-001', 'Dell Latitude 5420', 'Acme Corp', 'Temporales', 'Harold Bayona', 'Inventario', FALSE, NOW() - INTERVAL '2 days', 'Equipo en buen estado'),
('LAP-002', 'HP EliteBook 840', 'TechSolutions', 'Alquileres', 'Ivan Quiroz', 'Reparaciones', TRUE, NOW() - INTERVAL '5 days', 'Urgente - Cliente prioritario'),
('LAP-003', 'Lenovo ThinkPad X1', NULL, 'Cambios', 'Joseph Sanchez', 'Logistica', FALSE, NOW() - INTERVAL '1 day', NULL),
('LAP-004', 'MacBook Pro 14"', NULL, 'Stock', 'Bruno Quipe', 'Inventario', FALSE, NOW() - INTERVAL '4 days', 'Revisar batería'),
('LAP-005', 'ASUS ZenBook', NULL, 'Temporales', 'Harold Bayona', 'Reparaciones', TRUE, NOW() - INTERVAL '6 hours', NULL);
```

## ✅ ¡Listo!

Refresca la aplicación y verás:
- ✅ Dashboard con estadísticas
- ✅ Tabla de equipos (con datos de prueba si los agregaste)
- ✅ Estados calculados automáticamente (Urgente, Retrasado, En Preparación, Listo)
- ✅ Días en custodia actualizados en tiempo real

## 📝 Características Principales

- **Cálculo Automático**: Días en custodia y estados se calculan en el servidor
- **Timestamps Automáticos**: Al marcar ingreso/salida
- **Prioridad Visual**: Filas rojas para urgentes, naranjas para retrasados
- **Exportar a CSV**: Descarga todos los datos
- **Tiempo Real**: Actualización instantánea

## 🔧 Arquitectura

```
Frontend (React) → Backend (Hono/Deno) → Database (PostgreSQL)
                   ↑
                   Cálculos de días y estados
```

Todo funciona sin vistas SQL complejas. El backend calcula dinámicamente:
- Días en custodia
- Estado del equipo
- Estadísticas del dashboard