import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.49.2";

const app = new Hono();

// Inicializar Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7afbce9e/health", (c) => {
  return c.json({ status: "ok" });
});

// COMPATIBILIDAD: Agregar rutas sin prefijo para deployment
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// =========================================
// ENDPOINTS PARA GESTIÓN DE EQUIPOS
// =========================================

// Función auxiliar para calcular días en custodia
function calcularDiasEnCustodia(fechaIngreso: string | null, fechaSalida: string | null): number {
  if (!fechaIngreso) return 0;
  
  // Obtener la fecha final (salida o ahora)
  const fechaFin = fechaSalida ? new Date(fechaSalida) : new Date();
  const fechaInicio = new Date(fechaIngreso);
  
  // Calcular diferencia en milisegundos
  const diffTime = fechaFin.getTime() - fechaInicio.getTime();
  
  // Convertir a días (1 día = 86400000 milisegundos)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // IMPORTANTE: Si hay diferencia positiva, retornar al menos 1 día
  // Esto asegura que equipos ingresados ayer muestren al menos 1 día
  if (diffDays >= 1) {
    return diffDays;
  }
  
  // Si es del mismo día pero tiene tiempo transcurrido, contar como 1 día
  if (diffTime > 0 && diffDays === 0) {
    return 1;
  }
  
  // Si no hay tiempo transcurrido, retornar 0
  return 0;
}

// Función auxiliar para determinar estado
function determinarEstado(equipo: any, diasEnCustodia: number): string {
  if (equipo.prioridad_alta && !equipo.fecha_salida) {
    return 'URGENTE';
  }
  if (diasEnCustodia > 3 && !equipo.fecha_salida) {
    return 'RETRASADO';
  }
  if (equipo.fecha_salida) {
    return 'LISTO';
  }
  if (equipo.fecha_ingreso && !equipo.fecha_salida) {
    return 'EN_PREPARACION';
  }
  return 'REGISTRADO';
}

// RUTAS SIN PREFIJO PARA DEPLOYMENT
// (Las rutas con "multiple" deben ir ANTES de las rutas con :id)

// Actualizar múltiples equipos (salida múltiple)
app.put("/equipos/multiple", async (c) => {
  try {
    const body = await c.req.json();
    const { ids, marcar_salida, entregado_a, observaciones_salida } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Se requiere un array de IDs' }, 400);
    }

    const updateData: any = {
      observaciones_salida: observaciones_salida || null
    };

    // Si se marca salida
    if (marcar_salida) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = entregado_a || null;
      updateData.estado_proceso = 'TERMINADO';
    }

    // Actualizar todos los equipos con los IDs proporcionados
    const { data, error } = await supabase
      .from('equipos_temporales')
      .update(updateData)
      .in('id', ids)
      .select();

    if (error) {
      console.log(`Error updating multiple equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipos: data, count: data?.length || 0 });
  } catch (err) {
    console.log(`Server error updating multiple equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Obtener todos los equipos
app.get("/equipos", async (c) => {
  try {
    const incluirEliminados = c.req.query('incluir_eliminados') === 'true';
    
    let query = supabase
      .from('equipos_temporales')
      .select('*');
    
    // Por defecto, no mostrar equipos eliminados
    if (!incluirEliminados) {
      query = query.or('eliminado.is.null,eliminado.eq.false');
    }
    
    const { data, error } = await query
      .order('prioridad_alta', { ascending: false })
      .order('fecha_ingreso', { ascending: false, nullsFirst: false });

    if (error) {
      console.log(`Error fetching equipment: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    // Calcular días y estado para cada equipo
    const equiposConEstado = (data || []).map(equipo => {
      const dias_en_custodia = calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida);
      const estado = determinarEstado(equipo, dias_en_custodia);
      
      return {
        ...equipo,
        dias_en_custodia,
        estado
      };
    });

    return c.json({ equipos: equiposConEstado });
  } catch (err) {
    console.log(`Server error fetching equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Obtener estadísticas del dashboard
app.get("/estadisticas", async (c) => {
  try {
    const { data: equipos, error } = await supabase
      .from('equipos_temporales')
      .select('*')
      .or('eliminado.is.null,eliminado.eq.false');

    if (error) {
      console.log(`Error fetching statistics: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    console.log('📊 Calculando estadísticas para equipos:', equipos?.length || 0);

    // Calcular estadísticas manualmente con el nuevo cálculo de días
    const equiposConDias = (equipos || []).map(equipo => {
      const dias = calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida);
      console.log(`📅 ${equipo.codigo_equipo}: ${dias} días`);
      return {
        ...equipo,
        dias_en_custodia: dias
      };
    });

    const enPreparacion = equiposConDias.filter(e => !e.fecha_salida);
    const totalDias = enPreparacion.reduce((sum, e) => sum + e.dias_en_custodia, 0);
    
    console.log('📈 Total equipos en preparación:', enPreparacion.length);
    console.log('🔢 Total días en custodia:', totalDias);
    
    const stats = {
      total_en_preparacion: enPreparacion.filter(e => !e.prioridad_alta).length,
      total_urgentes: enPreparacion.filter(e => e.prioridad_alta).length,
      total_dias_custodia: totalDias
    };

    return c.json({ estadisticas: stats });
  } catch (err) {
    console.log(`Server error fetching statistics: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Crear nuevo equipo
app.post("/equipos", async (c) => {
  try {
    const body = await c.req.json();
    console.log('=== BACKEND: Body recibido ===', body); // DEBUG
    
    // Normalizar y dividir códigos si vienen múltiples
    let codigos = body.codigos || body.codigo_equipo || '';
    console.log('=== BACKEND: Codigos extraídos ===', codigos); // DEBUG
    
    const codigosArray = codigos.split('\n')
      .map((codigo: string) => codigo.trim().toUpperCase().replace(/'/g, '-'))
      .filter((codigo: string) => codigo.length > 0);
    
    console.log('=== BACKEND: Codigos array ===', codigosArray); // DEBUG
    
    if (codigosArray.length === 0) {
      return c.json({ error: 'Debe proporcionar al menos un código de equipo' }, 400);
    }

    const resultados = [];
    const advertencias = [];

    // Procesar cada código
    for (const codigo of codigosArray) {
      console.log('=== BACKEND: Procesando código ===', codigo); // DEBUG
      
      // Verificar si el código ya existe Y SIGUE EN CUSTODIA (sin fecha_salida)
      const { data: existingEquipo } = await supabase
        .from('equipos_temporales')
        .select('id, codigo_equipo, fecha_salida')
        .eq('codigo_equipo', codigo)
        .single();
      
      if (existingEquipo && !existingEquipo.fecha_salida) {
        // Si existe y NO tiene fecha_salida, significa que aún está en custodia
        return c.json({ 
          error: `❌ El código ${codigo} ya está registrado y aún se encuentra en tu custodia. No puedes registrarlo nuevamente hasta marcar su salida.` 
        }, 400);
      }
      
      if (existingEquipo && existingEquipo.fecha_salida) {
        // Si existe pero YA tiene fecha_salida, solo advertir pero permitir
        advertencias.push(`⚠️ El código ${codigo} fue registrado anteriormente (ya salió)`);
      }

      const equipoData: any = {
        codigo_equipo: codigo,
        marca_modelo: body.marca_modelo || null,
        cliente: body.cliente || null,
        motivo: body.motivo,
        recibido_por: body.recibido_por,
        area: body.area,
        prioridad_alta: body.prioridad_alta || false,
        estado_proceso: body.estado_proceso || 'PENDIENTE',
        observaciones_ingreso: body.observaciones_ingreso || null,
        observaciones_salida: body.observaciones_salida || null
      };

      console.log('=== BACKEND: Datos del equipo a insertar ===', equipoData); // DEBUG

      // Manejar timestamps de ingreso y salida
      if (body.marcar_ingreso) {
        equipoData.fecha_ingreso = new Date().toISOString();
      }

      if (body.marcar_salida) {
        equipoData.fecha_salida = new Date().toISOString();
        equipoData.entregado_a = body.entregado_a || null;
        equipoData.estado_proceso = 'TERMINADO';
      }

      const { data, error } = await supabase
        .from('equipos_temporales')
        .insert(equipoData)
        .select()
        .single();

      if (error) {
        console.log(`=== BACKEND: Error insertando ${codigo} ===`, error.message); // DEBUG
        return c.json({ error: `Error al crear equipo ${codigo}: ${error.message}` }, 500);
      }

      resultados.push(data);
    }

    return c.json({ 
      equipos: resultados,
      count: resultados.length,
      warning: advertencias.length > 0 ? advertencias.join('. ') : null
    });
  } catch (err) {
    console.log(`Server error creating equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Actualizar equipo individual
app.put("/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    console.log('=== BACKEND UPDATE: Body recibido ===', JSON.stringify(body, null, 2));

    const updateData: any = {
      marca_modelo: body.marca_modelo || null,
      cliente: body.cliente || null,
      motivo: body.motivo,
      recibido_por: body.recibido_por,
      area: body.area,
      prioridad_alta: body.prioridad_alta || false,
      observaciones_ingreso: body.observaciones_ingreso || null,
      observaciones_salida: body.observaciones_salida || null
    };

    // IMPORTANTE: Solo actualizar estado_proceso si viene en el body
    if (body.estado_proceso) {
      updateData.estado_proceso = body.estado_proceso;
      console.log('=== BACKEND UPDATE: Actualizando estado_proceso a ===', body.estado_proceso);
    }

    // Si se marca ingreso y no tiene fecha de ingreso
    if (body.marcar_ingreso && !body.fecha_ingreso_existente) {
      updateData.fecha_ingreso = new Date().toISOString();
    }

    // Si se marca salida y no tiene fecha de salida
    if (body.marcar_salida && !body.fecha_salida_existente) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = body.entregado_a || null;
      updateData.estado_proceso = 'TERMINADO';
    }

    console.log('=== BACKEND UPDATE: Datos finales a actualizar ===', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error updating equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log('=== BACKEND UPDATE: Resultado exitoso ===', JSON.stringify(data, null, 2));

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error updating equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Eliminar equipo
app.delete("/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Soft delete: marcar como eliminado en lugar de borrar
    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        eliminado: true,
        fecha_eliminacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error deleting equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, equipo: data });
  } catch (err) {
    console.log(`Server error deleting equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Marcar ingreso de equipo
app.post("/equipos/:id/ingreso", async (c) => {
  try {
    const id = c.req.param('id');

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ fecha_ingreso: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error marking entry: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error marking entry: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// Marcar salida de equipo
app.post("/equipos/:id/salida", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        fecha_salida: new Date().toISOString(),
        entregado_a: body.entregado_a,
        especialista: body.especialista,
        estado_proceso: 'TERMINADO'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error marking exit: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error marking exit: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// RUTAS CON PREFIJO (legacy)

// 1. Obtener todos los equipos con estado calculado
app.get("/make-server-7afbce9e/equipos", async (c) => {
  try {
    const incluirEliminados = c.req.query('incluir_eliminados') === 'true';
    
    let query = supabase
      .from('equipos_temporales')
      .select('*');
    
    // Por defecto, no mostrar equipos eliminados
    if (!incluirEliminados) {
      query = query.or('eliminado.is.null,eliminado.eq.false');
    }
    
    const { data, error } = await query
      .order('prioridad_alta', { ascending: false })
      .order('fecha_ingreso', { ascending: false, nullsFirst: false });

    if (error) {
      console.log(`Error fetching equipment: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    // Calcular días y estado para cada equipo
    const equiposConEstado = (data || []).map(equipo => {
      const dias_en_custodia = calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida);
      const estado = determinarEstado(equipo, dias_en_custodia);
      
      return {
        ...equipo,
        dias_en_custodia,
        estado
      };
    });

    return c.json({ equipos: equiposConEstado });
  } catch (err) {
    console.log(`Server error fetching equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 2. Obtener estadísticas del dashboard
app.get("/make-server-7afbce9e/estadisticas", async (c) => {
  try {
    const { data: equipos, error } = await supabase
      .from('equipos_temporales')
      .select('*');

    if (error) {
      console.log(`Error fetching statistics: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    // Calcular estadísticas manualmente
    const equiposConDias = (equipos || []).map(equipo => ({
      ...equipo,
      dias_en_custodia: calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida)
    }));

    const enPreparacion = equiposConDias.filter(e => !e.fecha_salida);
    
    const stats = {
      total_en_preparacion: enPreparacion.filter(e => !e.prioridad_alta).length,
      total_urgentes: enPreparacion.filter(e => e.prioridad_alta).length,
      total_dias_custodia: enPreparacion.reduce((sum, e) => sum + e.dias_en_custodia, 0)
    };

    return c.json({ estadisticas: stats });
  } catch (err) {
    console.log(`Server error fetching statistics: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 3. Crear nuevo equipo
app.post("/make-server-7afbce9e/equipos", async (c) => {
  try {
    const body = await c.req.json();
    console.log('=== BACKEND: Body recibido ===', body); // DEBUG
    
    // Normalizar y dividir códigos si vienen múltiples
    let codigos = body.codigos || body.codigo_equipo || '';
    console.log('=== BACKEND: Codigos extraídos ===', codigos); // DEBUG
    
    const codigosArray = codigos.split('\n')
      .map((codigo: string) => codigo.trim().toUpperCase().replace(/'/g, '-'))
      .filter((codigo: string) => codigo.length > 0);
    
    console.log('=== BACKEND: Codigos array ===', codigosArray); // DEBUG
    
    if (codigosArray.length === 0) {
      return c.json({ error: 'Debe proporcionar al menos un código de equipo' }, 400);
    }

    const resultados = [];
    const advertencias = [];

    // Procesar cada código
    for (const codigo of codigosArray) {
      console.log('=== BACKEND: Procesando código ===', codigo); // DEBUG
      
      // Verificar si el código ya existe Y SIGUE EN CUSTODIA (sin fecha_salida)
      const { data: existingEquipo } = await supabase
        .from('equipos_temporales')
        .select('id, codigo_equipo, fecha_salida')
        .eq('codigo_equipo', codigo)
        .single();
      
      if (existingEquipo && !existingEquipo.fecha_salida) {
        // Si existe y NO tiene fecha_salida, significa que aún está en custodia
        return c.json({ 
          error: `❌ El código ${codigo} ya está registrado y aún se encuentra en tu custodia. No puedes registrarlo nuevamente hasta marcar su salida.` 
        }, 400);
      }
      
      if (existingEquipo && existingEquipo.fecha_salida) {
        // Si existe pero YA tiene fecha_salida, solo advertir pero permitir
        advertencias.push(`⚠️ El código ${codigo} fue registrado anteriormente (ya salió)`);
      }

      const equipoData: any = {
        codigo_equipo: codigo,
        marca_modelo: body.marca_modelo || null,
        cliente: body.cliente || null,
        motivo: body.motivo,
        recibido_por: body.recibido_por,
        area: body.area,
        prioridad_alta: body.prioridad_alta || false,
        estado_proceso: body.estado_proceso || 'PENDIENTE',
        observaciones_ingreso: body.observaciones_ingreso || null,
        observaciones_salida: body.observaciones_salida || null
      };

      console.log('=== BACKEND: Datos del equipo a insertar ===', equipoData); // DEBUG

      // Manejar timestamps de ingreso y salida
      if (body.marcar_ingreso) {
        equipoData.fecha_ingreso = new Date().toISOString();
      }

      if (body.marcar_salida) {
        equipoData.fecha_salida = new Date().toISOString();
        equipoData.entregado_a = body.entregado_a || null;
        equipoData.estado_proceso = 'TERMINADO';
      }

      const { data, error } = await supabase
        .from('equipos_temporales')
        .insert(equipoData)
        .select()
        .single();

      if (error) {
        console.log(`=== BACKEND: Error insertando ${codigo} ===`, error.message); // DEBUG
        return c.json({ error: `Error al crear equipo ${codigo}: ${error.message}` }, 500);
      }

      resultados.push(data);
    }

    return c.json({ 
      equipos: resultados,
      count: resultados.length,
      warning: advertencias.length > 0 ? advertencias.join('. ') : null
    });
  } catch (err) {
    console.log(`Server error creating equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 4. Actualizar múltiples equipos (salida múltiple) - DEBE IR ANTES DE LA RUTA CON :id
app.put("/make-server-7afbce9e/equipos/multiple", async (c) => {
  try {
    const body = await c.req.json();
    const { ids, marcar_salida, entregado_a, observaciones_salida } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ error: 'Se requiere un array de IDs' }, 400);
    }

    const updateData: any = {
      observaciones_salida: observaciones_salida || null
    };

    // Si se marca salida
    if (marcar_salida) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = entregado_a || null;
      updateData.estado_proceso = 'TERMINADO';
    }

    // Actualizar todos los equipos con los IDs proporcionados
    const { data, error } = await supabase
      .from('equipos_temporales')
      .update(updateData)
      .in('id', ids)
      .select();

    if (error) {
      console.log(`Error updating multiple equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipos: data, count: data?.length || 0 });
  } catch (err) {
    console.log(`Server error updating multiple equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 5. Actualizar equipo individual
app.put("/make-server-7afbce9e/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updateData: any = {
      marca_modelo: body.marca_modelo || null,
      cliente: body.cliente || null,
      motivo: body.motivo,
      recibido_por: body.recibido_por,
      area: body.area,
      prioridad_alta: body.prioridad_alta || false,
      estado_proceso: body.estado_proceso,
      observaciones_ingreso: body.observaciones_ingreso || null,
      observaciones_salida: body.observaciones_salida || null
    };

    // Si se marca ingreso y no tiene fecha de ingreso
    if (body.marcar_ingreso && !body.fecha_ingreso_existente) {
      updateData.fecha_ingreso = new Date().toISOString();
    }

    // Si se marca salida y no tiene fecha de salida
    if (body.marcar_salida && !body.fecha_salida_existente) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = body.entregado_a || null;
      updateData.estado_proceso = 'TERMINADO';
    }

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error updating equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error updating equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 6. Eliminar equipo
app.delete("/make-server-7afbce9e/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');

    // Soft delete: marcar como eliminado en lugar de borrar
    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        eliminado: true,
        fecha_eliminacion: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error deleting equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, equipo: data });
  } catch (err) {
    console.log(`Server error deleting equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 6. Marcar ingreso de equipo
app.post("/make-server-7afbce9e/equipos/:id/ingreso", async (c) => {
  try {
    const id = c.req.param('id');

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ fecha_ingreso: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error marking entry: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error marking entry: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// 7. Marcar salida de equipo
app.post("/make-server-7afbce9e/equipos/:id/salida", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        fecha_salida: new Date().toISOString(),
        entregado_a: body.entregado_a,
        especialista: body.especialista,
        estado_proceso: 'TERMINADO'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.log(`Error marking exit: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    console.log(`Server error marking exit: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

Deno.serve(app.fetch);