# Actualización del Sistema de Historial de Equipos Eliminados

## ⚠️ IMPORTANTE: Debes ejecutar el script SQL primero

Si los equipos eliminados no aparecen en el historial, es porque **faltan los campos en la base de datos**.

## 🚀 Pasos para Activar el Historial (OBLIGATORIO)

### Paso 1: Ejecutar el Script SQL

1. Abre tu proyecto en **Supabase Dashboard**
2. Ve al menú lateral izquierdo y haz clic en **"SQL Editor"**
3. Haz clic en **"New query"** (nueva consulta)
4. Abre el archivo **`sql_historial_equipos.sql`** que está en la raíz del proyecto
5. Copia TODO el contenido del archivo
6. Pégalo en el editor SQL de Supabase
7. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter / Cmd+Enter)
8. Deberías ver un mensaje de éxito y una tabla con los campos creados

### Paso 2: Verificar que Funcionó

Después de ejecutar el script, verás una tabla de verificación que muestra:
```
column_name          | data_type                   | is_nullable | column_default
---------------------|----------------------------|-------------|---------------
eliminado            | boolean                    | NO          | false
fecha_eliminacion    | timestamp with time zone   | YES         | NULL
```

Si ves esto, ¡todo está listo! ✅

### Paso 3: Probar el Historial

1. Ve a tu aplicación
2. Elimina un equipo de prueba
3. Haz clic en el botón **"Ver Historial"** en el header
4. Deberías ver el equipo eliminado en el historial

## Descripción
Se ha implementado un sistema de "soft delete" (eliminación lógica) que permite mantener un historial completo de todos los equipos que se eliminan, sin borrarlos permanentemente de la base de datos.

## Cambios Realizados

### 1. Backend
- El endpoint DELETE ahora marca los equipos como eliminados en lugar de borrarlos
- El endpoint GET filtra equipos eliminados por defecto
- Se agregó el parámetro `incluir_eliminados=true` para obtener todos los equipos incluyendo los eliminados

### 2. Frontend
- Botón "Ver Historial" en el header del dashboard
- Componente `HistoryDialog` que muestra todos los equipos eliminados
- Función de búsqueda y filtrado dentro del historial
- Vista completa con todas las fechas: ingreso, salida y eliminación

### 3. Base de Datos
Necesitas agregar dos nuevos campos a la tabla `equipos_temporales`:

## Script SQL para Actualizar la Base de Datos

Ejecuta el siguiente script SQL en el SQL Editor de Supabase:

```sql
-- Agregar campos para soft delete
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE;

ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_equipos_eliminado 
ON equipos_temporales(eliminado);

-- Actualizar equipos existentes para que no estén marcados como eliminados
UPDATE equipos_temporales 
SET eliminado = FALSE 
WHERE eliminado IS NULL;
```

## Funcionalidades del Historial

1. **Eliminación Lógica**: Cuando eliminas un equipo, se marca como `eliminado = true` y se registra la `fecha_eliminacion`

2. **Vista de Historial**: 
   - Accede mediante el botón "Ver Historial" en el dashboard
   - Muestra todos los equipos eliminados con toda su información
   - Incluye búsqueda por código, marca, cliente o motivo
   - Visualiza las tres fechas importantes: ingreso, salida y eliminación

3. **Mapeo y Consulta**:
   - Puedes consultar cualquier equipo eliminado previamente
   - Ver todos los detalles: códigos, fechas, responsables, observaciones
   - Filtrar y buscar dentro del historial

## Ventajas

- ✅ No se pierde información histórica
- ✅ Puedes rastrear todos los movimientos de equipos
- ✅ Auditoría completa del sistema
- ✅ Recuperación de información si es necesaria
- ✅ Mapeo y análisis de patrones

## Notas

- Los equipos eliminados NO aparecen en la vista principal
- Los equipos eliminados NO afectan las estadísticas del dashboard
- Los equipos eliminados quedan registrados permanentemente en el historial
- El sistema sigue validando que no puedas registrar un equipo que aún está en custodia (no eliminado)