import { useState, useEffect } from 'react';
import { Plus, RefreshCw, PackageCheck, Eye, Shield, Lock, Unlock, KeyRound, LockKeyhole } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Button } from './components/ui/button';
import { StatsCards } from './components/StatsCards';
import { EquipmentTable } from './components/EquipmentTable';
import { EquipmentFormDrawer } from './components/EquipmentFormDrawer';
import { EditEquipmentDialog } from './components/EditEquipmentDialog';
import { MarkExitDialog } from './components/MarkExitDialog';
import { MarkMultipleExitDialog } from './components/MarkMultipleExitDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7afbce9e`;

interface Equipment {
  id: number;
  codigo_equipo: string;
  marca_modelo?: string;
  cliente?: string;
  motivo: string;
  recibido_por: string;
  area: string;
  prioridad_alta: boolean;
  fecha_ingreso?: string;
  fecha_salida?: string;
  entregado_a?: string;
  observaciones_ingreso?: string;
  observaciones_salida?: string;
  dias_en_custodia?: number;
  eliminado?: boolean;
  estado_proceso?: string;
}

interface DashboardStats {
  total_en_preparacion: number;
  total_urgentes: number;
  total_dias_custodia: number;
}

export default function App() {
  const [equipos, setEquipos] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_en_preparacion: 0,
    total_urgentes: 0,
    total_dias_custodia: 0
  });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingEquipo, setEditingEquipo] = useState<Equipment | null>(null);
  const [markExitOpen, setMarkExitOpen] = useState(false);
  const [markExitEquipo, setMarkExitEquipo] = useState<Equipment | null>(null);
  const [markMultipleExitOpen, setMarkMultipleExitOpen] = useState(false);
  const [selectedEquipos, setSelectedEquipos] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'preparacion' | 'urgentes' | 'dias' | null>(null);
  
  // Nuevo estado para la vista comercial y bloqueo
  const [viewMode, setViewMode] = useState<'admin' | 'commercial'>('admin');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());

  // Recuperar el modo de vista de la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('view');
    if (mode === 'commercial') {
      setViewMode('commercial');
    }
  }, []);

  // Actualizar la URL cuando cambia el modo de vista
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (viewMode === 'commercial') {
      params.set('view', 'commercial');
    } else {
      params.delete('view');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [viewMode]);

  useEffect(() => {
    fetchEquipos();
    // fetchEstadisticas(); // Ya no dependemos del backend para esto, lo calculamos localmente
    
    // Actualizar reloj cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    
    return () => clearInterval(timer);
  }, []);

  // Calcular estadísticas en el frontend para mayor precisión
  useEffect(() => {
    if (!equipos.length) {
      setStats({
        total_en_preparacion: 0,
        total_urgentes: 0,
        total_dias_custodia: 0 // Usaremos esto como promedio
      });
      return;
    }

    const enPreparacion = equipos.filter(e => !e.fecha_salida).length;
    const urgentes = equipos.filter(e => e.prioridad_alta && !e.fecha_salida).length;
    
    // Calcular promedio de días en custodia para equipos activos
    const equiposActivos = equipos.filter(e => !e.fecha_salida);
    let totalDias = 0;
    
    equiposActivos.forEach(e => {
      // Recalcular días en custodia localmente para asegurar precisión
      if (e.fecha_ingreso) {
        // PARSEAR FECHA DE INGRESO (asumiendo formato ISO del backend)
        const fechaIngresoStr = e.fecha_ingreso.split('T')[0]; // "2026-02-13"
        const [yearIngreso, monthIngreso, dayIngreso] = fechaIngresoStr.split('-').map(Number);
        
        // Obtener fecha actual
        const ahora = new Date();
        const yearHoy = ahora.getFullYear();
        const monthHoy = ahora.getMonth(); // Ya está en 0-11
        const dayHoy = ahora.getDate();
        
        // Crear fechas usando UTC
        const ingresoDate = Date.UTC(yearIngreso, monthIngreso - 1, dayIngreso);
        const hoyDate = Date.UTC(yearHoy, monthHoy, dayHoy);
        
        const diffTime = hoyDate - ingresoDate;
        const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`📊 PROMEDIO | Código: ${e.codigo_equipo} | Ingreso: ${fechaIngresoStr} | Días: ${dias}`);
        
        totalDias += Math.max(0, dias);
      } else {
        totalDias += (e.dias_en_custodia || 0);
      }
    });

    // IMPORTANTE: El promedio es la SUMA total dividido entre la cantidad
    const promedioDias = equiposActivos.length > 0 
      ? Math.round(totalDias / equiposActivos.length)
      : 0;
    
    console.log(`📈 PROMEDIO FINAL: ${totalDias} días totales / ${equiposActivos.length} equipos = ${promedioDias} días promedio`);
    
    setStats({
      total_en_preparacion: enPreparacion,
      total_urgentes: urgentes,
      total_dias_custodia: promedioDias
    });

  }, [equipos, currentTime]); // Recalcular cuando cambian equipos o el tiempo

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/equipos`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar equipos');
      }

      const data = await response.json();
      
      // Ordenar equipos: primero los que NO tienen fecha_salida, luego los que SÍ tienen
      const equiposOrdenados = (data.equipos || []).sort((a: Equipment, b: Equipment) => {
        // Si a no tiene salida y b sí, a va primero
        if (!a.fecha_salida && b.fecha_salida) return -1;
        // Si a tiene salida y b no, b va primero
        if (a.fecha_salida && !b.fecha_salida) return 1;
        // Si ambos tienen o no tienen salida, ordenar por fecha de ingreso (más reciente primero)
        const fechaA = new Date(a.fecha_ingreso || 0).getTime();
        const fechaB = new Date(b.fecha_ingreso || 0).getTime();
        return fechaB - fechaA;
      });
      
      setEquipos(equiposOrdenados);
    } catch (error: any) {
      console.error('Error fetching equipment:', error);
      
      // Detectar si es error de tabla no encontrada
      if (error.message && error.message.includes("Could not find the table")) {
        toast.error(
          'Base de datos no configurada',
          {
            description: 'Por favor ejecuta el script SQL en Supabase. Revisa SETUP_RAPIDO.md',
            duration: 8000
          }
        );
      } else {
        toast.error('Error al cargar los equipos');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${API_URL}/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar estadísticas');
      }

      const data = await response.json();
      setStats(data.estadisticas);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      
      // Detectar si es error de tabla no encontrada
      if (error.message && error.message.includes("Could not find the table")) {
        // No mostrar toast aquí para evitar duplicados
        return;
      }
      
      toast.error('Error al cargar estadísticas');
    }
  };

  const handleCreateEquipo = async (formData: any) => {
    try {
      // Validación final antes de enviar
      if (!formData.codigos || formData.codigos.trim() === '') {
        throw new Error('El campo de códigos es obligatorio');
      }

      const response = await fetch(`${API_URL}/equipos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear equipo');
      }
      
      // Actualizar datos
      await fetchEquipos(); // Wait to ensure sync
      fetchEstadisticas();
      
      return result;
    } catch (error: any) {
      console.error('Error creating equipment:', error);
      throw error; // Re-lanzar para que el Drawer lo capture
    }
  };

  const handleEditEquipo = async (formData: any) => {
    if (!editingEquipo) return;

    try {
      // Convertir codigo_equipo de vuelta a codigos si viene del formulario
      const updatePayload = {
        codigo_equipo: formData.codigo_equipo || formData.codigos,
        marca_modelo: formData.marca_modelo,
        cliente: formData.cliente,
        motivo: formData.motivo,
        recibido_por: formData.recibido_por,
        area: formData.area,
        prioridad_alta: formData.prioridad_alta,
        estado_proceso: formData.estado_proceso, // Incluir estado
        observaciones_ingreso: formData.observaciones_ingreso,
        observaciones_salida: formData.observaciones_salida,
        marcar_ingreso: formData.marcar_ingreso,
        marcar_salida: formData.marcar_salida,
        entregado_a: formData.entregado_a,
        fecha_ingreso_existente: editingEquipo.fecha_ingreso,
        fecha_salida_existente: editingEquipo.fecha_salida
      };

      const response = await fetch(`${API_URL}/equipos/${editingEquipo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar equipo');
      }

      toast.success('Equipo actualizado exitosamente');
      fetchEquipos();
      fetchEstadisticas();
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (equipo: Equipment, newStatus: string) => {
    try {
      console.log(`🔄 Actualizando estado de ${equipo.codigo_equipo}: ${equipo.estado_proceso} → ${newStatus}`);
      
      // Optimistic update
      setEquipos(prev => prev.map(e => e.id === equipo.id ? { ...e, estado_proceso: newStatus } : e));
      
      const response = await fetch(`${API_URL}/equipos/${equipo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // ENVIAR TODOS LOS CAMPOS PARA NO SOBRESCRIBIR
          codigo_equipo: equipo.codigo_equipo,
          marca_modelo: equipo.marca_modelo,
          cliente: equipo.cliente,
          motivo: equipo.motivo,
          recibido_por: equipo.recibido_por,
          area: equipo.area,
          prioridad_alta: equipo.prioridad_alta,
          estado_proceso: newStatus, // El nuevo estado
          observaciones_ingreso: equipo.observaciones_ingreso,
          observaciones_salida: equipo.observaciones_salida,
          fecha_ingreso_existente: equipo.fecha_ingreso,
          fecha_salida_existente: equipo.fecha_salida
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar estado');
      }

      const result = await response.json();
      console.log('✅ Estado actualizado exitosamente:', result);

      toast.success(`Estado actualizado a: ${newStatus.replace('_', ' ')}`);
      
      // Esperar un poco y recargar para sincronizar
      await fetchEquipos();
    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      toast.error('No se pudo actualizar el estado');
      // Revertir cambio optimista
      await fetchEquipos();
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setEditingEquipo(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (equipo: Equipment) => {
    if (equipo.fecha_salida) {
      toast.error('No se puede editar un equipo que ya tiene marcada la salida');
      return;
    }
    setDialogMode('edit');
    setEditingEquipo(equipo);
    setDialogOpen(true);
  };

  const handleDialogSubmit = (formData: any) => {
    handleCreateEquipo(formData);
  };

  const handleRefresh = () => {
    fetchEquipos();
    fetchEstadisticas();
    toast.success('Datos actualizados');
  };

  const handleMarkExit = (equipo: Equipment) => {
    setMarkExitEquipo(equipo);
    setMarkExitOpen(true);
  };

  const handleMarkExitSubmit = async (formData: any) => {
    if (!markExitEquipo) return;

    try {
      const updatePayload = {
        marcar_salida: formData.marcar_salida,
        entregado_a: formData.entregado_a,
        observaciones_salida: formData.observaciones_salida,
        estado_proceso: 'TERMINADO' // Asegurar que pase a terminado
      };

      const response = await fetch(`${API_URL}/equipos/${markExitEquipo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar salida');
      }

      toast.success('Salida marcada exitosamente');
      setMarkExitOpen(false);
      setMarkExitEquipo(null);
      fetchEquipos();
      fetchEstadisticas();
    } catch (error: any) {
      console.error('Error marking exit:', error);
      toast.error(error.message || 'Error al marcar salida');
    }
  };

  const handleMarkMultipleExit = () => {
    setMarkMultipleExitOpen(true);
  };

  const handleMarkMultipleExitSubmit = async (formData: any) => {
    if (selectedEquipos.length === 0) {
      toast.error('No hay equipos seleccionados para marcar salida');
      return;
    }

    try {
      // Procesar uno por uno con su respectivo destino
      const promises = formData.equipos_data.map((item: any) => {
        const equipoBase = equipos.find(e => e.id === item.id);
        return fetch(`${API_URL}/equipos/${item.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...equipoBase,
            marcar_salida: true,
            entregado_a: item.entregado_a,
            observaciones_salida: formData.observaciones_salida || equipoBase?.observaciones_salida,
            fecha_salida_existente: equipoBase?.fecha_salida,
            estado_proceso: 'TERMINADO'
          })
        }).then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al marcar salida');
          }
          return res.json();
        });
      });

      await Promise.all(promises);

      toast.success('Salida marcada exitosamente para los equipos seleccionados');
      setMarkMultipleExitOpen(false);
      setSelectedEquipos([]);
      fetchEquipos();
      fetchEstadisticas();
    } catch (error: any) {
      console.error('Error marking multiple exit:', error);
      toast.error(error.message || 'Error al marcar salida');
    }
  };

  const handleFilterClick = (filter: 'preparacion' | 'urgentes' | 'dias') => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

  // Filtrar equipos según el filtro activo y el modo de vista
  const getFilteredEquipos = () => {
    let filtered = equipos;

    // VISTA COMERCIAL: Muestra TODOS los equipos (no filtra nada)
    // La vista comercial es solo de lectura, pero muestra todo el inventario

    if (!activeFilter) return filtered;

    if (activeFilter === 'preparacion') {
      // PREPARACIÓN: Muestra TODOS los equipos sin salida (incluye urgentes y no urgentes)
      return filtered.filter(eq => !eq.fecha_salida);
    }
    
    if (activeFilter === 'urgentes') {
      // URGENTES: Solo los que tienen prioridad alta Y sin salida
      return filtered.filter(eq => eq.prioridad_alta && !eq.fecha_salida);
    }
    
    if (activeFilter === 'dias') {
      return [...filtered].sort((a, b) => (b.dias_en_custodia || 0) - (a.dias_en_custodia || 0));
    }

    return filtered;
  };

  const toggleViewMode = () => {
    if (viewMode === 'admin') {
      // Refresh data before switching to ensure sync
      fetchEquipos();
      setViewMode('commercial');
      toast.info('Modo Vista Comercial: Solo lectura y equipos activos');
    } else {
      // Require login to switch back
      setPasswordInput('');
      setShowAdminLogin(true);
    }
  };

  const handleAdminLogin = () => {
    // Contraseña simple harcodeada (en producción usaría auth real)
    if (passwordInput === 'admin2026') {
      setViewMode('admin');
      setShowAdminLogin(false);
      toast.success('Modo Administrador desbloqueado');
    } else {
      toast.error('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Gestión de Equipos Temporales</h1>
              <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground mt-0.5">
                <span>Control de laptops en preparación</span>
                <span className="text-blue-500 font-semibold">•</span>
                <span className="font-mono bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300">
                  {new Intl.DateTimeFormat('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true,
                    timeZone: 'America/Lima'
                  }).format(currentTime)}
                </span>
                
                {/* Badge de Modo */}
                {viewMode === 'commercial' && (
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    VISTA COMERCIAL
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Botón de cambio de vista */}
              <Button 
                variant={viewMode === 'admin' ? "outline" : "default"} 
                onClick={toggleViewMode} 
                size="sm" 
                className={`w-full sm:w-auto ${viewMode === 'commercial' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                title={viewMode === 'admin' ? "Cambiar a Vista Comercial" : "Desbloquear Modo Admin"}
              >
                {viewMode === 'admin' ? (
                  <>
                    <Eye className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Vista Comercial</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Desbloquear Admin</span>
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleRefresh} disabled={loading} size="sm" className="w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              
              {/* Ocultar botones de acción en modo comercial */}
              {viewMode === 'admin' && (
                <>
                  <Button onClick={handleOpenCreateDialog} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Registrar Equipo</span>
                    <span className="sm:hidden">Registrar</span>
                  </Button>
                  <Button onClick={handleMarkMultipleExit} disabled={selectedEquipos.length === 0} size="sm" className="w-full sm:w-auto">
                    <PackageCheck className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Marcar Salida Múltiple</span>
                    <span className="sm:hidden">Salida Múltiple</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 lg:px-6 py-4 lg:py-8 space-y-5 lg:space-y-8">
        <StatsCards stats={stats} onFilterClick={handleFilterClick} />
        
        <EquipmentTable 
          equipos={getFilteredEquipos()}
          onEdit={handleOpenEditDialog}
          onMarkExit={handleMarkExit}
          onUpdateStatus={handleUpdateStatus} // Nuevo prop
          selectedIds={selectedEquipos}
          onSelectionChange={setSelectedEquipos}
          activeFilter={activeFilter}
          readOnly={viewMode === 'commercial'} // Nuevo prop
        />
      </main>

      {/* Dialogs - only active/relevant in admin mode usually, but kept in DOM */}
      <EquipmentFormDrawer
        open={dialogOpen && dialogMode === 'create'}
        onClose={() => {
          setDialogOpen(false);
          setEditingEquipo(null);
        }}
        onSubmit={handleDialogSubmit}
        existingEquipos={equipos}
      />

      <EditEquipmentDialog
        open={dialogOpen && dialogMode === 'edit'}
        onClose={() => {
          setDialogOpen(false);
          setEditingEquipo(null);
        }}
        onSubmit={handleEditEquipo}
        equipment={editingEquipo}
      />

      <MarkExitDialog
        open={markExitOpen}
        onClose={() => {
          setMarkExitOpen(false);
          setMarkExitEquipo(null);
        }}
        onSubmit={handleMarkExitSubmit}
        equipment={markExitEquipo}
      />

      <MarkMultipleExitDialog
        open={markMultipleExitOpen}
        onClose={() => {
          setMarkMultipleExitOpen(false);
        }}
        onSubmit={handleMarkMultipleExitSubmit}
        selectedEquipos={equipos.filter(eq => selectedEquipos.includes(eq.id))}
      />

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-purple-600" />
              Acceso Administrativo
            </DialogTitle>
            <DialogDescription>
              Ingrese la contraseña para volver al modo administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminLogin();
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminLogin(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdminLogin}>
              <Unlock className="mr-2 h-4 w-4" />
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}