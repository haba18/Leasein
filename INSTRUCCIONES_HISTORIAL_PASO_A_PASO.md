# 📋 Instrucciones: Activar el Historial de Equipos Eliminados

## ❌ Problema Actual
Los equipos eliminados no aparecen en el historial porque **faltan los campos en la base de datos**.

## ✅ Solución: Ejecutar el Script SQL

---

## 🎯 PASO 1: Ir a Supabase Dashboard

1. Abre tu navegador
2. Ve a: [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Inicia sesión con tu cuenta
4. Selecciona tu proyecto de equipos temporales

---

## 🎯 PASO 2: Abrir el SQL Editor

1. En el menú lateral **izquierdo**, busca el icono de base de datos 🗄️
2. Haz clic en **"SQL Editor"**
3. Se abrirá el editor de consultas SQL

---

## 🎯 PASO 3: Crear Nueva Consulta

1. Haz clic en el botón **"New query"** (Nueva consulta)
2. Se abrirá un editor vacío

---

## 🎯 PASO 4: Copiar el Script SQL

1. Abre el archivo **`sql_historial_equipos.sql`** que está en la raíz de tu proyecto
2. Selecciona **TODO** el contenido (Ctrl+A o Cmd+A)
3. Copia el contenido (Ctrl+C o Cmd+C)

**El contenido del archivo es este:**

```sql
-- Agregar campo 'eliminado'
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE NOT NULL;

-- Agregar campo 'fecha_eliminacion'
ALTER TABLE equipos_temporales 
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_equipos_eliminado 
ON equipos_temporales(eliminado);

CREATE INDEX IF NOT EXISTS idx_equipos_eliminado_fecha 
ON equipos_temporales(eliminado, fecha_eliminacion DESC);

-- Actualizar equipos existentes
UPDATE equipos_temporales 
SET eliminado = FALSE 
WHERE eliminado IS NULL;

-- Verificar que se crearon los campos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'equipos_temporales'
AND column_name IN ('eliminado', 'fecha_eliminacion')
ORDER BY column_name;
```

---

## 🎯 PASO 5: Pegar y Ejecutar

1. Pega el script en el editor SQL de Supabase (Ctrl+V o Cmd+V)
2. Haz clic en el botón verde **"Run"** (Ejecutar)
   - O presiona **Ctrl+Enter** en Windows/Linux
   - O presiona **Cmd+Enter** en Mac

---

## 🎯 PASO 6: Verificar que Funcionó

Después de ejecutar, deberías ver un resultado como este en la parte inferior:

```
✓ Success. No rows returned

Results:
column_name          | data_type                   | is_nullable | column_default
---------------------|----------------------------|-------------|---------------
eliminado            | boolean                    | NO          | false
fecha_eliminacion    | timestamp with time zone   | YES         | NULL
```

**Si ves esta tabla con los 2 campos, ¡TODO ESTÁ LISTO! ✅**

---

## 🎯 PASO 7: Probar en la Aplicación

1. Regresa a tu aplicación web
2. Recarga la página (F5 o Ctrl+R)
3. Selecciona un equipo de prueba
4. Haz clic en el botón **"Eliminar"** (🗑️)
5. Confirma la eliminación
6. Haz clic en el botón **"Ver Historial"** 📜 en el header
7. **Deberías ver el equipo eliminado en el historial** ✅

---

## 🔍 Solución de Problemas

### ❌ Error: "relation 'equipos_temporales' does not exist"
**Solución:** Tu tabla principal no existe. Debes ejecutar primero el script de creación de la tabla principal.

### ❌ El botón "Run" está deshabilitado
**Solución:** Asegúrate de haber pegado el script SQL en el editor.

### ❌ No veo equipos en el historial después de eliminar
**Solución:** 
1. Verifica que ejecutaste el script SQL correctamente
2. Recarga la página de la aplicación (F5)
3. Intenta eliminar un nuevo equipo de prueba

### ❌ Error: "permission denied"
**Solución:** Asegúrate de estar usando una cuenta con permisos de administrador en Supabase.

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún no funciona:

1. Verifica que ejecutaste el script SQL completo
2. Revisa la consola del navegador para ver errores (F12 → Console)
3. Verifica que los campos se crearon ejecutando esta consulta en SQL Editor:
   ```sql
   SELECT * FROM equipos_temporales LIMIT 1;
   ```
   Deberías ver las columnas `eliminado` y `fecha_eliminacion`

---

## ✨ ¡Listo!

Una vez completados todos los pasos, tu sistema de historial estará **100% funcional** y podrás:

- 📜 Ver todos los equipos eliminados
- 🔍 Buscar equipos en el historial
- 📅 Consultar las fechas de ingreso, salida y eliminación
- 📊 Mapear y analizar datos históricos

**¡Nunca más perderás información de equipos eliminados!** 🎉
