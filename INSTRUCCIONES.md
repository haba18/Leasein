# Sistema de Gestión de Equipos Temporales

## 📋 Configuración Inicial

### 1. Ejecutar el Script SQL en Supabase

⚠️ **IMPORTANTE**: El sistema ahora funciona automáticamente sin necesidad de vistas SQL. Solo necesitas crear la tabla base:

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** en el menú lateral
3. Copia el siguiente SQL y ejecútalo:

```sql
CREATE TABLE IF NOT EXISTS equipos_temporales (
    id SERIAL PRIMARY KEY,
    codigo_equipo VARCHAR(50) UNIQUE NOT NULL,
    marca_modelo VARCHAR(100),
    cliente VARCHAR(100),
    motivo VARCHAR(100),
    recibido_por VARCHAR(100),
    area VARCHAR(100),
    prioridad_alta BOOLEAN DEFAULT FALSE,
    fecha_ingreso TIMESTAMP,
    fecha_salida TIMESTAMP NULL,
    entregado_a VARCHAR(100),
    especialista VARCHAR(100),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos_temporales(codigo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_prioridad ON equipos_temporales(prioridad_alta);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_ingreso ON equipos_temporales(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_equipos_fecha_salida ON equipos_temporales(fecha_salida);
```

4. Haz clic en **Run** (o presiona `Ctrl+Enter`)

✅ **¡Listo!** El sistema calculará automáticamente:
- Días en custodia
- Estados dinámicos
- Estadísticas del dashboard

Todo se procesa en el servidor backend, sin necesidad de vistas SQL.

### 2. Insertar Datos de Prueba (Opcional)

Para probar el sistema con datos de ejemplo:

```sql
INSERT INTO equipos_temporales 
(codigo_equipo, marca_modelo, cliente, motivo, recibido_por, area, prioridad_alta, fecha_ingreso)
VALUES 
('LAP-001', 'Dell Latitude 5420', 'Acme Corp', 'Reparación', 'Juan Pérez', 'Soporte Técnico', FALSE, NOW() - INTERVAL '2 days'),
('LAP-002', 'HP EliteBook 840', 'TechSolutions', 'Formateo', 'María García', 'Sistemas', TRUE, NOW() - INTERVAL '5 days'),
('LAP-003', 'Lenovo ThinkPad X1', 'InnovateLab', 'Actualización', 'Carlos López', 'Infraestructura', FALSE, NOW() - INTERVAL '1 day'),
('LAP-004', 'MacBook Pro 14"', 'Creative Studio', 'Mantenimiento', 'Ana Rodríguez', 'Help Desk', FALSE, NOW() - INTERVAL '4 days'),
('LAP-005', 'ASUS ZenBook', 'DataCorp', 'Diagnóstico', 'Pedro Martínez', 'Soporte Técnico', TRUE, NOW() - INTERVAL '6 hours');
```

---

## 🎯 Funcionalidades del Sistema

### Dashboard Principal
- **Total en Preparación**: Equipos actualmente en custodia
- **Equipos Urgentes**: Marcados con prioridad alta
- **Equipos Retrasados**: Más de 3 días sin salida
- **Promedio de Días**: Tiempo promedio en custodia

### Registro de Equipos
Campos obligatorios:
- Código de equipo (único)
- Marca/Modelo
- Cliente
- Motivo (dropdown)
- Recibido por
- Área (dropdown)

### Estados Automáticos
El sistema calcula automáticamente el estado según:
- **URGENTE** 🔴: Prioridad alta + sin salida
- **RETRASADO** 🟠: Más de 3 días + sin salida
- **EN PREPARACIÓN** 🔵: Con ingreso + sin salida
- **LISTO** 🟢: Con fecha de salida
- **REGISTRADO** ⚪: Sin ingreso aún

### Cálculo de Días en Custodia
- Si no tiene salida: `fecha_actual - fecha_ingreso`
- Si tiene salida: `fecha_salida - fecha_ingreso`
- Actualización automática en tiempo real

### Visualización por Prioridad
- Equipos urgentes: Fondo rojo suave + badge "URGENTE"
- Equipos retrasados: Fondo naranja suave
- Otros equipos: Fondo normal

---

## 🔧 Uso del Sistema

### Registrar Nuevo Equipo
1. Clic en **"Registrar Equipo"**
2. Completa los campos obligatorios
3. Opcionalmente marca **"Marcar Ingreso"** para registrar timestamp automático
4. Activa **"Prioridad Alta"** si es urgente
5. Guarda el registro

### Marcar Salida de Equipo
1. Clic en el icono de **edición** (lápiz)
2. Activa **"Marcar Salida"**
3. Completa "Entregado a" y "Especialista"
4. Guarda los cambios

### Exportar Datos
- Clic en **"Exportar"** para descargar CSV con todos los equipos
- Formato: Código, Cliente, Marca/Modelo, Motivo, Área, Días, Estado, Fechas

### Actualizar Vista
- Clic en **"Actualizar"** para refrescar datos en tiempo real
- Útil si varios usuarios trabajan simultáneamente

---

## 📊 Consultas SQL Útiles

### Ver estadísticas
```sql
SELECT * FROM get_dashboard_stats();
```

### Equipos retrasados
```sql
SELECT codigo_equipo, cliente, dias_en_custodia, fecha_ingreso
FROM vista_estado_equipos
WHERE estado = 'RETRASADO'
ORDER BY dias_en_custodia DESC;
```

### Equipos urgentes activos
```sql
SELECT codigo_equipo, cliente, dias_en_custodia
FROM vista_estado_equipos
WHERE prioridad_alta = TRUE AND fecha_salida IS NULL
ORDER BY fecha_ingreso ASC;
```

### Promedio por área
```sql
SELECT area, 
       COUNT(*) as total_equipos,
       AVG(dias_en_custodia)::INTEGER as promedio_dias
FROM vista_estado_equipos
WHERE fecha_salida IS NOT NULL
GROUP BY area
ORDER BY promedio_dias DESC;
```

---

## 🔐 Seguridad

El sistema utiliza:
- Supabase Service Role Key para operaciones del servidor
- Public Anon Key para comunicación frontend-backend
- Validaciones en ambos lados (cliente y servidor)
- Logs detallados para debugging

---

## 🎨 Diseño UI

- **Framework**: React + TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Notificaciones**: Sonner (toast)
- **Fechas**: date-fns con locale español

---

## 🚀 Próximos Pasos Sugeridos

- [ ] Agregar filtros por cliente, área o estado
- [ ] Implementar búsqueda en tiempo real
- [ ] Crear reportes visuales con gráficos
- [ ] Agregar notificaciones automáticas para equipos retrasados
- [ ] Implementar historial de cambios por equipo
- [ ] Agregar autenticación de usuarios