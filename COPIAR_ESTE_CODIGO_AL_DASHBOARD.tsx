// ============================================
// BACKEND CORREGIDO - COPIAR TODO ESTE CÓDIGO
// ============================================
// 
// INSTRUCCIONES:
// 1. Ve a: https://supabase.com/dashboard/project/buzjoutgvorgbrthrowx/functions
// 2. Click en "make-server-7afbce9e" (o "Create function" si no existe)
// 3. BORRA todo el código del editor
// 4. COPIA todo este archivo completo (desde aquí hasta el final)
// 5. PEGA en el editor del Dashboard
// 6. Click en "Deploy"
// 7. Espera 30 segundos
// 8. Recarga tu app
//
// ============================================

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.49.2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

app.use('*', logger(console.log));

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

app.get("/make-server-7afbce9e/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

function calcularDiasEnCustodia(fechaIngreso: string | null, fechaSalida: string | null): number {
  if (!fechaIngreso) return 0;
  const inicio = new Date(fechaIngreso);
  const fin = fechaSalida ? new Date(fechaSalida) : new Date();
  const diferencia = fin.getTime() - inicio.getTime();
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
}

function determinarEstado(equipo: any, diasEnCustodia: number): string {
  if (equipo.prioridad_alta && !equipo.fecha_salida) return 'URGENTE';
  if (diasEnCustodia > 3 && !equipo.fecha_salida) return 'RETRASADO';
  if (equipo.fecha_salida) return 'LISTO';
  if (equipo.fecha_ingreso && !equipo.fecha_salida) return 'EN_PREPARACION';
  return 'REGISTRADO';
}

// ⭐⭐⭐ IMPORTANTE: /equipos/multiple VA PRIMERO ⭐⭐⭐
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

    if (marcar_salida) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = entregado_a || null;
    }

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

app.get("/equipos", async (c) => {
  try {
    const { data, error } = await supabase
      .from('equipos_temporales')
      .select('*')
      .order('prioridad_alta', { ascending: false })
      .order('fecha_ingreso', { ascending: false, nullsFirst: false });

    if (error) {
      console.log(`Error fetching equipment: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    const equiposConEstado = (data || []).map(equipo => {
      const dias_en_custodia = calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida);
      const estado = determinarEstado(equipo, dias_en_custodia);
      return { ...equipo, dias_en_custodia, estado };
    });

    return c.json({ equipos: equiposConEstado });
  } catch (err) {
    console.log(`Server error fetching equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.get("/estadisticas", async (c) => {
  try {
    const { data: equipos, error } = await supabase
      .from('equipos_temporales')
      .select('*');

    if (error) {
      console.log(`Error fetching statistics: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }

    const equiposConDias = (equipos || []).map(equipo => ({
      ...equipo,
      dias_en_custodia: calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida)
    }));

    const enPreparacion = equiposConDias.filter(e => !e.fecha_salida);
    
    const stats = {
      total_en_preparacion: enPreparacion.length,
      total_urgentes: enPreparacion.filter(e => e.prioridad_alta).length,
      equipos_retrasados: enPreparacion.filter(e => e.dias_en_custodia > 3 && !e.prioridad_alta).length,
      promedio_dias: enPreparacion.length > 0 
        ? Math.round(enPreparacion.reduce((sum, e) => sum + e.dias_en_custodia, 0) / enPreparacion.length)
        : 0
    };

    return c.json({ estadisticas: stats });
  } catch (err) {
    console.log(`Server error fetching statistics: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.post("/equipos", async (c) => {
  try {
    const body = await c.req.json();
    let codigos = body.codigos || body.codigo_equipo || '';
    
    const codigosArray = codigos.split('\n')
      .map((codigo: string) => codigo.trim().toUpperCase().replace(/'/g, '-'))
      .filter((codigo: string) => codigo.length > 0);
    
    if (codigosArray.length === 0) {
      return c.json({ error: 'Debe proporcionar al menos un código de equipo' }, 400);
    }

    const resultados = [];
    const advertencias = [];

    for (const codigo of codigosArray) {
      const { data: existingEquipo } = await supabase
        .from('equipos_temporales')
        .select('id, codigo_equipo')
        .eq('codigo_equipo', codigo)
        .single();
      
      if (existingEquipo) {
        advertencias.push(`⚠️ El código ${codigo} ya existe`);
      }

      const equipoData: any = {
        codigo_equipo: codigo,
        marca_modelo: body.marca_modelo || null,
        cliente: body.cliente || null,
        motivo: body.motivo,
        recibido_por: body.recibido_por,
        area: body.area,
        prioridad_alta: body.prioridad_alta || false,
        observaciones_ingreso: body.observaciones_ingreso || null,
        observaciones_salida: body.observaciones_salida || null
      };

      if (body.marcar_ingreso) {
        equipoData.fecha_ingreso = new Date().toISOString();
      }

      if (body.marcar_salida) {
        equipoData.fecha_salida = new Date().toISOString();
        equipoData.entregado_a = body.entregado_a || null;
      }

      const { data, error } = await supabase
        .from('equipos_temporales')
        .insert(equipoData)
        .select()
        .single();

      if (error) {
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

app.put("/equipos/:id", async (c) => {
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
      observaciones_ingreso: body.observaciones_ingreso || null,
      observaciones_salida: body.observaciones_salida || null
    };

    if (body.marcar_ingreso && !body.fecha_ingreso_existente) {
      updateData.fecha_ingreso = new Date().toISOString();
    }

    if (body.marcar_salida && !body.fecha_salida_existente) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = body.entregado_a || null;
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

app.delete("/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const { error } = await supabase
      .from('equipos_temporales')
      .delete()
      .eq('id', id);

    if (error) {
      console.log(`Error deleting equipment: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`Server error deleting equipment: ${err}`);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

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

app.post("/equipos/:id/salida", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        fecha_salida: new Date().toISOString(),
        entregado_a: body.entregado_a,
        especialista: body.especialista
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

// ⭐ RUTAS CON PREFIJO (legacy) ⭐
app.get("/make-server-7afbce9e/equipos", async (c) => {
  try {
    const { data, error } = await supabase
      .from('equipos_temporales')
      .select('*')
      .order('prioridad_alta', { ascending: false })
      .order('fecha_ingreso', { ascending: false, nullsFirst: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const equiposConEstado = (data || []).map(equipo => {
      const dias_en_custodia = calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida);
      const estado = determinarEstado(equipo, dias_en_custodia);
      return { ...equipo, dias_en_custodia, estado };
    });

    return c.json({ equipos: equiposConEstado });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.get("/make-server-7afbce9e/estadisticas", async (c) => {
  try {
    const { data: equipos, error } = await supabase
      .from('equipos_temporales')
      .select('*');

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const equiposConDias = (equipos || []).map(equipo => ({
      ...equipo,
      dias_en_custodia: calcularDiasEnCustodia(equipo.fecha_ingreso, equipo.fecha_salida)
    }));

    const enPreparacion = equiposConDias.filter(e => !e.fecha_salida);
    
    const stats = {
      total_en_preparacion: enPreparacion.length,
      total_urgentes: enPreparacion.filter(e => e.prioridad_alta).length,
      equipos_retrasados: enPreparacion.filter(e => e.dias_en_custodia > 3 && !e.prioridad_alta).length,
      promedio_dias: enPreparacion.length > 0 
        ? Math.round(enPreparacion.reduce((sum, e) => sum + e.dias_en_custodia, 0) / enPreparacion.length)
        : 0
    };

    return c.json({ estadisticas: stats });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.post("/make-server-7afbce9e/equipos", async (c) => {
  try {
    const body = await c.req.json();
    let codigos = body.codigos || body.codigo_equipo || '';
    
    const codigosArray = codigos.split('\n')
      .map((codigo: string) => codigo.trim().toUpperCase().replace(/'/g, '-'))
      .filter((codigo: string) => codigo.length > 0);
    
    if (codigosArray.length === 0) {
      return c.json({ error: 'Debe proporcionar al menos un código de equipo' }, 400);
    }

    const resultados = [];
    const advertencias = [];

    for (const codigo of codigosArray) {
      const { data: existingEquipo } = await supabase
        .from('equipos_temporales')
        .select('id, codigo_equipo')
        .eq('codigo_equipo', codigo)
        .single();
      
      if (existingEquipo) {
        advertencias.push(`⚠️ El código ${codigo} ya existe`);
      }

      const equipoData: any = {
        codigo_equipo: codigo,
        marca_modelo: body.marca_modelo || null,
        cliente: body.cliente || null,
        motivo: body.motivo,
        recibido_por: body.recibido_por,
        area: body.area,
        prioridad_alta: body.prioridad_alta || false,
        observaciones_ingreso: body.observaciones_ingreso || null,
        observaciones_salida: body.observaciones_salida || null
      };

      if (body.marcar_ingreso) {
        equipoData.fecha_ingreso = new Date().toISOString();
      }

      if (body.marcar_salida) {
        equipoData.fecha_salida = new Date().toISOString();
        equipoData.entregado_a = body.entregado_a || null;
      }

      const { data, error } = await supabase
        .from('equipos_temporales')
        .insert(equipoData)
        .select()
        .single();

      if (error) {
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
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// ⭐⭐⭐ IMPORTANTE: Esta ruta VA ANTES de /:id ⭐⭐⭐
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

    if (marcar_salida) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = entregado_a || null;
    }

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
      observaciones_ingreso: body.observaciones_ingreso || null,
      observaciones_salida: body.observaciones_salida || null
    };

    if (body.marcar_ingreso && !body.fecha_ingreso_existente) {
      updateData.fecha_ingreso = new Date().toISOString();
    }

    if (body.marcar_salida && !body.fecha_salida_existente) {
      updateData.fecha_salida = new Date().toISOString();
      updateData.entregado_a = body.entregado_a || null;
    }

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.delete("/make-server-7afbce9e/equipos/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const { error } = await supabase
      .from('equipos_temporales')
      .delete()
      .eq('id', id);

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

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
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

app.post("/make-server-7afbce9e/equipos/:id/salida", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('equipos_temporales')
      .update({ 
        fecha_salida: new Date().toISOString(),
        entregado_a: body.entregado_a,
        especialista: body.especialista
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ equipo: data });
  } catch (err) {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

Deno.serve(app.fetch);
