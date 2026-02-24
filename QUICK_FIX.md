# ⚡ SOLUCIÓN RÁPIDA - Error 403 y "multiple"

## 🔥 EJECUTA ESTOS COMANDOS AHORA

```bash
# 1. Instalar Supabase CLI (si no lo tienes)
# macOS:
brew install supabase/tap/supabase

# Windows:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 2. Login
supabase login

# 3. Link proyecto
supabase link --project-ref buzjoutgvorgbrthrowx

# 4. Desplegar función
supabase functions deploy make-server-7afbce9e

# 5. Verificar
curl https://buzjoutgvorgbrthrowx.supabase.co/functions/v1/make-server-7afbce9e/health
```

## ✅ Respuesta esperada:
```json
{"status":"ok"}
```

## 🎯 Archivos actualizados:
- ✅ `/supabase/functions/server/index.tsx` (corregido)
- ✅ `/supabase/functions/make-server-7afbce9e/index.tsx` (corregido)

## 🔧 Cambios aplicados:
- Ruta `/equipos/multiple` ahora va ANTES de `/equipos/:id`
- Esto soluciona el error: "invalid input syntax for type integer: 'multiple'"

## ❌ Por qué el error 403:
El deployment automático desde Figma Make está bloqueado por permisos de la plataforma. Es normal. Usa CLI.

## 📱 Después del deployment:
1. Recarga tu app en el navegador
2. Selecciona múltiples equipos
3. Click en "Marcar Salida Múltiple"
4. ✅ Debe funcionar sin errores

---

**¿No tienes CLI?** Ve a: https://supabase.com/dashboard/project/buzjoutgvorgbrthrowx/functions

Y copia el contenido de `/supabase/functions/make-server-7afbce9e/index.tsx` directamente en el editor.
