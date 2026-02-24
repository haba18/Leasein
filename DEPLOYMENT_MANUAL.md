# 🚀 DEPLOYMENT MANUAL - Gestión de Equipos Temporales

## 🔴 IMPORTANTE: Error 403 Resuelto

El error 403 al desplegar desde Figma Make es un problema de permisos de la plataforma. **Debes desplegar manualmente usando Supabase CLI o el Dashboard.**

---

## ✅ SOLUCIÓN PASO A PASO

### 📋 Prerequisitos

- Acceso al proyecto de Supabase: `buzjoutgvorgbrthrowx`
- Los archivos del backend ya están listos en:
  - `/supabase/functions/server/index.tsx`
  - `/supabase/functions/make-server-7afbce9e/index.tsx`

---

## 🎯 OPCIÓN 1: Supabase CLI (Más Rápido - Recomendado)

### 1️⃣ Instalar Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows (con Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Windows (con Chocolatey):**
```bash
choco install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

### 2️⃣ Login en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Acepta y vuelve a la terminal.

### 3️⃣ Link tu Proyecto

```bash
cd /ruta/a/tu/proyecto
supabase link --project-ref buzjoutgvorgbrthrowx
```

Te pedirá la contraseña de la base de datos. Encuéntrala en:
- Dashboard de Supabase → Settings → Database → Database password

### 4️⃣ Desplegar la Función

**Opción A: Desplegar la función principal (recomendado)**
```bash
supabase functions deploy make-server-7afbce9e
```

**Opción B: Desplegar función alternativa**
```bash
supabase functions deploy server
```

**Opción C: Desplegar todas las funciones**
```bash
supabase functions deploy
```

### 5️⃣ Verificar que Funciona

Prueba el endpoint:
```bash
curl https://buzjoutgvorgbrthrowx.supabase.co/functions/v1/make-server-7afbce9e/health
```

**Respuesta esperada:**
```json
{"status":"ok"}
```

---

## 🎯 OPCIÓN 2: Dashboard de Supabase

### 1️⃣ Ir al Dashboard

Abre: https://supabase.com/dashboard/project/buzjoutgvorgbrthrowx/functions

### 2️⃣ Crear o Actualizar la Función

1. Si la función `make-server-7afbce9e` ya existe:
   - Haz clic en ella
   - Click en "Edit"
   
2. Si la función NO existe:
   - Click en "Create Function"
   - Nombre: `make-server-7afbce9e`

### 3️⃣ Copiar el Código

1. Abre el archivo `/supabase/functions/make-server-7afbce9e/index.tsx`
2. Copia TODO el contenido
3. Pégalo en el editor del Dashboard
4. Click en "Deploy"

### 4️⃣ Verificar

Espera unos segundos y prueba:
```
https://buzjoutgvorgbrthrowx.supabase.co/functions/v1/make-server-7afbce9e/health
```

---

## 🐛 TROUBLESHOOTING

### ❌ Error: "invalid input syntax for type integer: 'multiple'"

**Causa:** El servidor anterior no tiene la ruta `/equipos/multiple` en el orden correcto.

**Solución:** 
1. Vuelve a desplegar usando el CLI o Dashboard
2. Asegúrate de copiar el código de `/supabase/functions/make-server-7afbce9e/index.tsx`
3. Este archivo ya tiene las rutas corregidas

### ❌ Error: "Could not find the table 'equipos_temporales'"

**Solución:**
1. Ve al SQL Editor en el Dashboard de Supabase
2. Ejecuta este script:

```sql
-- Crear tabla equipos_temporales
CREATE TABLE IF NOT EXISTS equipos_temporales (
  id SERIAL PRIMARY KEY,
  codigo_equipo TEXT NOT NULL UNIQUE,
  marca_modelo TEXT,
  cliente TEXT,
  motivo TEXT NOT NULL,
  recibido_por TEXT NOT NULL,
  area TEXT NOT NULL,
  prioridad_alta BOOLEAN DEFAULT FALSE,
  fecha_ingreso TIMESTAMPTZ,
  fecha_salida TIMESTAMPTZ,
  entregado_a TEXT,
  observaciones_ingreso TEXT,
  observaciones_salida TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_codigo_equipo ON equipos_temporales(codigo_equipo);
CREATE INDEX IF NOT EXISTS idx_fecha_ingreso ON equipos_temporales(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_prioridad ON equipos_temporales(prioridad_alta);
```

### ❌ Error de CORS

**Solución:** Ya está configurado en el código. Si persiste:
- Verifica que el backend esté correctamente desplegado
- El CORS permite todos los orígenes (`origin: "*"`)

### ❌ Error 403 al desplegar desde Figma Make

**Esto es normal.** No es un problema del código, es una limitación de permisos de la plataforma Figma Make con Supabase. Por eso debes usar CLI o Dashboard.

---

## 📋 ENDPOINTS DISPONIBLES

Una vez desplegado, estos endpoints estarán disponibles:

### Con prefijo (actual):
- `GET /make-server-7afbce9e/health` - Health check
- `GET /make-server-7afbce9e/equipos` - Listar equipos
- `GET /make-server-7afbce9e/estadisticas` - Estadísticas
- `POST /make-server-7afbce9e/equipos` - Crear equipos (múltiples)
- `PUT /make-server-7afbce9e/equipos/multiple` - ⭐ Actualizar múltiples equipos (SALIDA MÚLTIPLE)
- `PUT /make-server-7afbce9e/equipos/:id` - Actualizar equipo individual
- `DELETE /make-server-7afbce9e/equipos/:id` - Eliminar equipo
- `POST /make-server-7afbce9e/equipos/:id/ingreso` - Marcar ingreso
- `POST /make-server-7afbce9e/equipos/:id/salida` - Marcar salida

### Sin prefijo (compatibilidad futura):
- `GET /health`
- `GET /equipos`
- `GET /estadisticas`
- `POST /equipos`
- `PUT /equipos/multiple` - ⭐ Actualizar múltiples equipos
- `PUT /equipos/:id`
- `DELETE /equipos/:id`
- Etc.

---

## 🎉 CONFIRMACIÓN FINAL

Después de desplegar, abre tu aplicación en el navegador y:

1. ✅ El dashboard debe mostrar las estadísticas
2. ✅ Puedes crear nuevos equipos
3. ✅ Puedes seleccionar múltiples equipos y marcar salida
4. ✅ El botón "Copiar Correo" debe funcionar
5. ✅ Los estados visuales (azul, verde, naranja, rojo) deben mostrarse correctamente

---

## 📞 NOTAS IMPORTANTES

1. **AMBOS ARCHIVOS SON IDÉNTICOS:**
   - `/supabase/functions/server/index.tsx`
   - `/supabase/functions/make-server-7afbce9e/index.tsx`
   
   Puedes desplegar cualquiera de los dos.

2. **LA RUTA `/equipos/multiple` ESTÁ CORREGIDA:**
   - Ahora va ANTES de `/equipos/:id` en el código
   - Esto soluciona el error "invalid input syntax for type integer"

3. **EL FRONTEND YA ESTÁ CONFIGURADO:**
   - Usa la URL: `https://buzjoutgvorgbrthrowx.supabase.co/functions/v1/make-server-7afbce9e`
   - No necesitas cambiar nada en el frontend

4. **SI USAS CLI:** Recuerda estar en la carpeta raíz del proyecto cuando ejecutes los comandos.

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos el error persiste:

1. Verifica que el código desplegado sea el más reciente
2. Revisa los logs en el Dashboard de Supabase: Functions → Logs
3. Confirma que la tabla `equipos_temporales` existe en la base de datos
4. Verifica que las variables de entorno estén configuradas (se configuran automáticamente)

---

**¡Listo para desplegar! 🚀**
