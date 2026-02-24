# 🔧 GUÍA COMPLETA - Solución de Problemas del Sistema

## 📋 IMPORTANTE: Pasos para Aplicar las Correcciones

### ⚠️ PRIMERO: Redeploy del Servidor (OBLIGATORIO)

Los cambios en el servidor **NO** se aplican automáticamente. Debes redesplegar manualmente:

#### Opción 1: Desde la Terminal de Supabase
```bash
# 1. Conéctate a tu proyecto
supabase link --project-ref TU_PROJECT_ID

# 2. Despliega las funciones
supabase functions deploy make-server-7afbce9e
```

#### Opción 2: Desde el Panel de Supabase
1. Ve a Supabase Dashboard → **Edge Functions**
2. Encuentra la función `make-server-7afbce9e`
3. Haz clic en **"Deploy"** o **"Redeploy"**
4. Espera a que termine el deployment (30-60 segundos)
5. Verifica que el estado sea **"Active"**

### 🔄 SEGUNDO: Refresca tu Aplicación Web
```
1. Abre la aplicación en el navegador
2. Presiona Ctrl + Shift + R (Windows/Linux) o Cmd + Shift + R (Mac)
3. Esto recarga completamente la página sin caché
```

---

## 🐛 PROBLEMAS CORREGIDOS

### ✅ 1. Estado EN_PROCESO se regresaba a PENDIENTE

**PROBLEMA:** 
Al cambiar el estado a "EN_PROCESO", después de refrescar volvía a aparecer como "PENDIENTE".

**CAUSA:** 
El servidor no estaba guardando correctamente el campo `estado_proceso`.

**SOLUCIÓN APLICADA:**
- Modifiqué el endpoint PUT `/equipos/:id` para validar correctamente el campo `estado_proceso`
- Agregué logs de depuración para verificar qué se está guardando
- Aseguré que el estado se preserve al actualizar

**CÓMO PROBAR:**
1. Marca un equipo como "EN_PROCESO"
2. Refresca la página (F5)
3. El equipo debe seguir mostrando "EN_PROCESO"

---

### ✅ 2. Equipos desaparecen al marcar TERMINADO

**PROBLEMA:**
Cuando marcabas el estado_proceso como "TERMINADO" (sin marcar la salida física), el equipo desaparecía de la vista comercial.

**ACLARACIÓN IMPORTANTE:**

El sistema maneja **DOS CONCEPTOS DIFERENTES:**

#### a) **Estado del Proceso** (estado_proceso):
- **PENDIENTE**: El trabajo aún no ha comenzado
- **EN_PROCESO**: Estamos trabajando en el equipo
- **TERMINADO**: El trabajo está completo

#### b) **Fecha de Salida** (fecha_salida):
- Es cuando el equipo **SALE FÍSICAMENTE** de tu custodia
- Solo se marca con el botón verde "Marcar Salida"
- Genera el correo con formato de entrega

**COMPORTAMIENTO CORRECTO:**

| Escenario | Vista Admin | Vista Comercial |
|-----------|-------------|-----------------|
| Estado: PENDIENTE, sin salida | ✅ Visible | ✅ Visible |
| Estado: EN_PROCESO, sin salida | ✅ Visible | ✅ Visible |
| Estado: TERMINADO, sin salida | ✅ Visible | ✅ Visible |
| Estado: TERMINADO, con salida | ✅ Visible | ❌ NO visible (ya salió) |

**SOLUCIÓN:**
- Vista Comercial solo muestra equipos **sin fecha_salida** (que aún están en tu custodia)
- Cuando marcas la salida física, entonces sí desaparece de la vista comercial
- El estado_proceso es solo informativo del avance del trabajo

---

### ✅ 3. Días en Custodia no cuenta correctamente

**PROBLEMA:**
Si un equipo ingresó el 12/02/2026 y hoy es 13/02/2026, debería mostrar "1 día" pero mostraba "0 días".

**CAUSA:**
El cálculo usaba Math.floor() que redondeaba hacia abajo, y no consideraba la zona horaria de Lima.

**SOLUCIÓN APLICADA:**
```javascript
// Nuevo cálculo mejorado:
- Convierte fechas a zona horaria de Lima (UTC-5)
- Compara solo fechas (sin horas)
- Si hay diferencia de días, cuenta correctamente
- Mínimo muestra 1 día si el equipo está desde ayer
```

**CÓMO PROBAR:**
1. Crea un equipo con fecha de ingreso de ayer
2. Verifica que muestre "1" en la columna "Días en Custodia"
3. Los equipos de hoy deben mostrar "1"
4. Los equipos de hace 2 días deben mostrar "2"

---

### ✅ 4. Botones de Estado más pequeños

**PROBLEMA:**
Los selectores de estado ocupaban mucho espacio.

**SOLUCIÓN:**
- Altura reducida de `h-8` (32px) a `h-7` (28px)
- Ancho reducido de `w-[140px]` a `w-[120px]`
- Tamaño de texto de `text-xs` (12px) a `text-[11px]` (11px)
- Ahora son más compactos y profesionales

---

### ✅ 5. Script SQL Completo en Español

**UBICACIÓN:** `/SCRIPT_SQL_COMPLETO.sql`

**CONTENIDO:**
- ✅ Instrucciones paso a paso en español
- ✅ Creación de tabla completa
- ✅ Todos los índices para optimización
- ✅ Trigger para actualizar timestamps
- ✅ Políticas de seguridad (RLS)
- ✅ Datos de ejemplo opcionales
- ✅ Consultas útiles de administración

**CÓMO USAR:**
1. Abre Supabase → **SQL Editor**
2. Click en **"New query"**
3. Copia TODO el contenido de `/SCRIPT_SQL_COMPLETO.sql`
4. Pega en el editor
5. Click en **"Run"** (esquina inferior derecha)
6. Espera confirmación de éxito
7. ¡Listo!

---

## 🧪 PRUEBAS PASO A PASO

### Test 1: Verificar Estados se Guardan
```
1. Admin: Crea un equipo nuevo
2. Admin: Cambia estado a "EN_PROCESO"
3. Refresca la página (F5)
4. ✅ Debe seguir en "EN_PROCESO"

5. Vista Comercial: Cambia estado a "TERMINADO"
6. Refresca la página
7. ✅ Debe seguir en "TERMINADO"
8. ✅ Equipo sigue visible (porque no tiene fecha_salida)

9. Admin: Marca la salida física (botón verde)
10. ✅ En admin sigue visible con estado "TERMINADO"
11. Vista Comercial: Refresca
12. ✅ Equipo ya NO debe estar visible (salió físicamente)
```

### Test 2: Verificar Días en Custodia
```
1. Abre Supabase → SQL Editor
2. Ejecuta esta consulta para crear equipo de ayer:

   INSERT INTO equipos_temporales 
     (codigo_equipo, motivo, recibido_por, area, fecha_ingreso, estado_proceso)
   VALUES 
     ('TEST-AYER', 'Instalación', 'Test User', 'Sistemas', 
      NOW() - INTERVAL '1 day', 'PENDIENTE');

3. Refresca tu app
4. ✅ El equipo "TEST-AYER" debe mostrar "1" en Días en Custodia

5. Para probar con 3 días:
   UPDATE equipos_temporales 
   SET fecha_ingreso = NOW() - INTERVAL '3 days'
   WHERE codigo_equipo = 'TEST-AYER';

6. Refresca tu app
7. ✅ Debe mostrar "3" días y fondo ROJO (retrasado)
```

### Test 3: Verificar Vista Comercial vs Admin
```
1. Vista Admin:
   ✅ Debe ver TODOS los equipos (con y sin salida)
   ✅ Puede editar equipos sin salida
   ✅ Puede marcar salida
   ✅ Puede cambiar estados

2. Vista Comercial:
   ✅ Solo ve equipos SIN fecha_salida
   ✅ Puede cambiar estados de proceso
   ✅ NO puede editar otros campos
   ✅ NO puede marcar salida
   ✅ Requiere contraseña "admin2026" para volver a Admin
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Si el estado sigue sin guardarse:

1. **Verifica que redesplayaste el servidor:**
   ```bash
   # Revisa logs del servidor
   supabase functions logs make-server-7afbce9e
   ```

2. **Busca estos mensajes en los logs:**
   ```
   === BACKEND UPDATE: Body recibido ===
   === BACKEND UPDATE: Actualizando estado_proceso a ===
   === BACKEND UPDATE: Datos finales a actualizar ===
   === BACKEND UPDATE: Resultado exitoso ===
   ```

3. **Si no ves los logs:**
   - El servidor NO se redesplego correctamente
   - Vuelve a hacer el deployment

### Si los días en custodia están mal:

1. **Verifica la zona horaria del servidor:**
   ```sql
   SELECT NOW(), NOW() AT TIME ZONE 'America/Lima';
   ```

2. **Verifica los datos de un equipo:**
   ```sql
   SELECT 
     codigo_equipo,
     fecha_ingreso,
     fecha_salida,
     EXTRACT(DAY FROM (COALESCE(fecha_salida, NOW()) - fecha_ingreso)) as dias_calculados
   FROM equipos_temporales
   LIMIT 5;
   ```

### Si la vista comercial no funciona:

1. **Verifica que estés en vista comercial:**
   - Debe aparecer badge morado "VISTA COMERCIAL" en el header
   - Botones "Registrar Equipo" y "Salida Múltiple" NO deben estar visibles

2. **Prueba cambiar a Admin:**
   - Click en "Desbloquear Admin"
   - Contraseña: `admin2026`
   - Debe cambiar a modo Admin

---

## 📞 SOPORTE ADICIONAL

Si después de seguir TODOS estos pasos el problema persiste:

1. **Abre la consola del navegador:**
   - Presiona F12
   - Ve a la pestaña "Console"
   - Captura cualquier error en rojo

2. **Revisa los logs del servidor:**
   ```bash
   supabase functions logs make-server-7afbce9e --tail
   ```

3. **Verifica la base de datos directamente:**
   ```sql
   SELECT * FROM equipos_temporales 
   ORDER BY id DESC 
   LIMIT 10;
   ```

---

## ✅ CHECKLIST FINAL

Antes de reportar que algo no funciona, verifica:

- [ ] Redespleguéel servidor Supabase
- [ ] Refresqué la página con Ctrl+Shift+R
- [ ] Ejecuté el script SQL completo
- [ ] Probé en modo Admin Y en modo Comercial
- [ ] Revisé los logs del servidor
- [ ] Verifiqué los datos directamente en Supabase
- [ ] Usé la contraseña correcta: `admin2026`

---

## 🎯 RESUMEN DE CAMBIOS

| Archivo | Cambio Realizado |
|---------|------------------|
| `/supabase/functions/make-server-7afbce9e/index.tsx` | ✅ Cálculo de días corregido<br>✅ Guardado de estado_proceso arreglado<br>✅ Logs de depuración agregados |
| `/src/app/App.tsx` | ✅ Contraseña cambiada a "admin2026"<br>✅ handleUpdateStatus mejorado |
| `/src/app/components/EquipmentTable.tsx` | ✅ Botones más pequeños (h-7, w-120, text-11px)<br>✅ Lógica de vista comercial mejorada |
| `/SCRIPT_SQL_COMPLETO.sql` | ✅ Script completo en español<br>✅ Instrucciones detalladas<br>✅ Consultas de diagnóstico |

---

**Última actualización:** 13 de Febrero de 2026
**Contraseña Admin:** `admin2026`
**Estado:** ✅ Todos los problemas corregidos
