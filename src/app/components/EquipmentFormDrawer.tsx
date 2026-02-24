import { useState, useEffect } from 'react';
import { X, AlertCircle, Trash2, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface EquipmentFormData {
  codigos: string;
  marcas_modelos: string;
  clientes: string;
  motivo: string;
  recibido_por: string;
  area: string;
  prioridad_alta: boolean;
  marcar_ingreso: boolean;
  observaciones_ingreso: string;
}

interface ParsedEquipment {
  codigo: string;
  motivo: string;
}

interface EquipmentFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  mode?: 'create' | 'edit';
  editingEquipo?: any;
  existingEquipos: any[];
}

const MOTIVOS = ['Temporales', 'Mantenimientos', 'Alquileres', 'Cambios'];
const AREAS = ['Inventario', 'Reparaciones', 'Logistica'];
const ESPECIALISTAS = ['Harold Bayona', 'Ivan Quiroz', 'Joseph Sanchez', 'Bruno Quipe', 'Raul Dioses'];

export function EquipmentFormDrawer({ open, onClose, onSubmit, mode, editingEquipo, existingEquipos }: EquipmentFormDrawerProps) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    codigos: '',
    marcas_modelos: '',
    clientes: '',
    motivo: '',
    recibido_por: '',
    area: '',
    prioridad_alta: false,
    marcar_ingreso: true,
    observaciones_ingreso: ''
  });
  const [parsedEquipments, setParsedEquipments] = useState<ParsedEquipment[]>([]);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setFormData({
        codigos: '',
        marcas_modelos: '',
        clientes: '',
        motivo: '',
        recibido_por: '',
        area: '',
        prioridad_alta: false,
        marcar_ingreso: true,
        observaciones_ingreso: ''
      });
      setParsedEquipments([]);
      setShowTable(false);
    }
  }, [open]);

  const handleChange = (field: keyof EquipmentFormData, value: any) => {
    if (field === 'codigos' && typeof value === 'string') {
      value = value.toUpperCase().replace(/'/g, '-');
      if (error) setError(null);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Procesar códigos y mostrar tabla
  const handleProcessCodes = () => {
    setError(null);

    if (!formData.codigos || formData.codigos.trim() === '') {
      setError('Debes ingresar al menos un código de equipo');
      return;
    }

    if (!formData.recibido_por || !formData.area) {
      setError('Completa los campos obligatorios: Recibido por y Especialista');
      return;
    }

    const codigosArray = formData.codigos.split('\n')
      .map(c => c.trim().toUpperCase().replace(/'/g, '-'))
      .filter(c => c.length > 0);

    if (codigosArray.length === 0) {
      setError('No se encontraron códigos válidos');
      return;
    }

    // Validar duplicados contra equipos en custodia
    const enCustodia = existingEquipos.filter(e => !e.fecha_salida).map(e => e.codigo_equipo.toUpperCase());
    const duplicados = codigosArray.filter(c => enCustodia.includes(c));

    if (duplicados.length > 0) {
      setError(`Los siguientes equipos ya están en custodia: ${duplicados.join(', ')}`);
      return;
    }

    // Crear lista de equipos con motivo por defecto (el seleccionado o vacío)
    const equipments: ParsedEquipment[] = codigosArray.map(codigo => ({
      codigo,
      motivo: formData.motivo || 'Temporales'
    }));

    setParsedEquipments(equipments);
    setShowTable(true);
  };

  // Actualizar motivo de un equipo específico
  const updateEquipmentMotivo = (index: number, motivo: string) => {
    setParsedEquipments(prev => {
      const updated = [...prev];
      updated[index].motivo = motivo;
      return updated;
    });
  };

  // Eliminar equipo de la lista
  const removeEquipment = (index: number) => {
    setParsedEquipments(prev => prev.filter((_, i) => i !== index));
    if (parsedEquipments.length === 1) {
      setShowTable(false);
    }
  };

  // Volver a editar códigos
  const handleBackToEdit = () => {
    setShowTable(false);
    setParsedEquipments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (parsedEquipments.length === 0) {
      setError('No hay equipos para registrar');
      return;
    }

    // Validar que todos tengan motivo
    const sinMotivo = parsedEquipments.filter(eq => !eq.motivo || eq.motivo === '');
    if (sinMotivo.length > 0) {
      setError('Todos los equipos deben tener un motivo asignado');
      return;
    }

    const marcasArray = formData.marcas_modelos.split('\n').map(c => c.trim());
    const clientesArray = formData.clientes.split('\n').map(c => c.trim());

    const equipos = parsedEquipments.map((parsed, index) => ({
      codigos: parsed.codigo,
      codigo_equipo: parsed.codigo,
      marca_modelo: marcasArray[index] || marcasArray[0] || null,
      cliente: clientesArray[index] || clientesArray[0] || null,
      motivo: parsed.motivo,
      recibido_por: formData.recibido_por,
      area: formData.area,
      prioridad_alta: formData.prioridad_alta,
      marcar_ingreso: formData.marcar_ingreso,
      marcar_salida: false,
      observaciones_ingreso: formData.observaciones_ingreso || null
    }));

    const enviarEquipos = async () => {
      let exitosos = 0;
      let errores_msgs: string[] = [];

      for (const equipo of equipos) {
        try {
          await onSubmit(equipo);
          exitosos++;
        } catch (error: any) {
          errores_msgs.push(error.message || 'Error desconocido');
        }
      }

      if (exitosos > 0) {
        toast.success(`${exitosos} equipo(s) registrado(s) exitosamente`);
        if (errores_msgs.length === 0) {
          onClose();
          return;
        }
      }
      
      if (errores_msgs.length > 0) {
        setError(errores_msgs[0]);
      }
    };

    enviarEquipos();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-950 shadow-2xl overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Registrador Equipos</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {showTable ? 'Asigna motivos individuales a cada equipo' : 'Ingresa uno o múltiples equipos'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            
            {error && (
              <div className="sticky top-0 z-10 mb-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 shadow-md rounded-md animate-in fade-in zoom-in duration-200">
                <div className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Error detectado</p>
                  <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                    {error}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Paso 1: Formulario de códigos */}
            {!showTable && (
              <>
                {/* Códigos de Equipo */}
                <div className="space-y-2">
                  <Label htmlFor="codigos" className="text-sm font-medium">
                    Código(s) de Equipo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="codigos"
                    value={formData.codigos}
                    onChange={(e) => handleChange('codigos', e.target.value)}
                    placeholder="PCR-LAP25077009&#10;MPF3X3CJG&#10;LAP-2024-001"
                    required
                    rows={4}
                    className="font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Un código por línea - Podrás asignar un motivo individual a cada uno
                  </p>
                </div>

                {/* Datos Obligatorios */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Datos Obligatorios</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recibido por */}
                    <div className="space-y-2">
                      <Label htmlFor="recibido_por" className="text-sm">
                        Recibido por <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="recibido_por"
                        value={formData.recibido_por}
                        onChange={(e) => handleChange('recibido_por', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Seleccionar</option>
                        {AREAS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Especialista */}
                    <div className="space-y-2">
                      <Label htmlFor="especialista" className="text-sm">
                        Especialista <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="especialista"
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Seleccionar</option>
                        {ESPECIALISTAS.map((especialista) => (
                          <option key={especialista} value={especialista}>
                            {especialista}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Motivo por defecto (opcional) */}
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="text-sm">
                      Motivo por defecto <span className="text-xs text-muted-foreground">(puedes cambiarlo individualmente después)</span>
                    </Label>
                    <select
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => handleChange('motivo', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleccionar después</option>
                      {MOTIVOS.map((motivo) => (
                        <option key={motivo} value={motivo}>
                          {motivo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prioridad Alta */}
                <div className="flex items-center justify-between gap-3 p-3 border-2 border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div>
                    <Label htmlFor="prioridad_alta" className="cursor-pointer font-medium text-sm">
                      🔴 Prioridad Alta
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Urgente</p>
                  </div>
                  <Switch
                    id="prioridad_alta"
                    checked={formData.prioridad_alta}
                    onCheckedChange={(checked) => handleChange('prioridad_alta', checked)}
                  />
                </div>

                {/* Marca/Modelo */}
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="marcas_modelos" className="text-sm font-medium">
                      Observaciones <span className="text-muted-foreground font-normal">(Opcional - Una por línea)</span>
                    </Label>
                    <Textarea
                      id="marcas_modelos"
                      value={formData.marcas_modelos}
                      onChange={(e) => handleChange('marcas_modelos', e.target.value)}
                      placeholder="Ingresa observaciones, una por línea"
                      rows={2}
                      className="mt-1.5 resize-none text-xs"
                    />
                  </div>
                </div>

                {/* Clientes */}
                <div className="space-y-2">
                  <Label htmlFor="clientes" className="text-sm">
                    Cliente(s) <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id="clientes"
                    value={formData.clientes}
                    onChange={(e) => handleChange('clientes', e.target.value)}
                    placeholder="Ingresa los clientes, uno por línea"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                {/* ELIMINADO: Campo duplicado "Observaciones de Ingreso" */}
              </>
            )}

            {/* Paso 2: Tabla de asignación de motivos */}
            {showTable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Asigna motivos a cada equipo</h3>
                    <p className="text-sm text-muted-foreground">
                      {parsedEquipments.length} equipo(s) detectado(s)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToEdit}
                  >
                    ← Editar códigos
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Código de Equipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {parsedEquipments.map((equipment, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {equipment.codigo}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={equipment.motivo}
                                onChange={(e) => updateEquipmentMotivo(index, e.target.value)}
                                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="">Seleccionar motivo</option>
                                {MOTIVOS.map((motivo) => (
                                  <option key={motivo} value={motivo}>
                                    {motivo}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeEquipment(index)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen de datos que se aplicarán a todos */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    📋 Datos que se aplicarán a todos los equipos:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Recibido por:</span>
                      <p className="font-medium">{formData.recibido_por}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Especialista:</span>
                      <p className="font-medium">{formData.area}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Prioridad:</span>
                      <p className="font-medium">{formData.prioridad_alta ? '🔴 Alta' : 'Normal'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-950 border-t px-6 py-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {!showTable ? (
            <Button 
              type="button" 
              onClick={handleProcessCodes} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continuar <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700"
            >
              Registrar {parsedEquipments.length} Equipo(s)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}