import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface EditEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  equipment: any;
}

const MOTIVOS = ['Temporales', 'Mantenimientos', 'Alquileres', 'Cambios'];
const AREAS = ['Inventario', 'Reparaciones', 'Logistica'];
const ESPECIALISTAS = ['Harold Bayona', 'Ivan Quiroz', 'Joseph Sanchez', 'Bruno Quipe', 'Raul Dioses'];

export function EditEquipmentDialog({ open, onClose, onSubmit, equipment }: EditEquipmentDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    marca_modelo: '',
    motivo: '',
    recibido_por: '',
    area: '',
    prioridad_alta: false,
    observaciones_ingreso: ''
  });

  useEffect(() => {
    if (open && equipment) {
      setError(null);
      setFormData({
        cliente: equipment.cliente || '',
        marca_modelo: equipment.marca_modelo || '',
        motivo: equipment.motivo || '',
        recibido_por: equipment.recibido_por || '',
        area: equipment.area || '',
        prioridad_alta: equipment.prioridad_alta || false,
        observaciones_ingreso: equipment.observaciones_ingreso || ''
      });
    }
  }, [open, equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.motivo || !formData.recibido_por || !formData.area) {
      setError('Completa todos los campos obligatorios (*)');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el equipo');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-950 shadow-2xl rounded-lg overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white px-4 lg:px-8 py-4 lg:py-6 flex items-center justify-between border-b border-blue-500">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg lg:text-2xl font-bold">Editar Equipo</h2>
            <p className="text-blue-100 text-xs lg:text-sm mt-1 font-mono break-all">{equipment.codigo_equipo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 ml-2 flex-shrink-0"
          >
            <X className="h-5 w-5 lg:h-6 lg:w-6" />
          </Button>
        </div>

        {/* Form Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 lg:space-y-6">
            
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

            {/* Info del Código (No editable) */}
          <div className="bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg p-3 lg:p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Código de Equipo</p>
                <p className="text-base lg:text-xl font-mono font-bold mt-1 break-all">{equipment.codigo_equipo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Días</p>
                <p className="text-base lg:text-xl font-bold mt-1">{equipment.dias_en_custodia || 0}</p>
              </div>
            </div>
          </div>

          {/* Cliente (Editable) */}
          <div className="space-y-2">
            <Label htmlFor="cliente" className="text-sm lg:text-base font-semibold">
              Cliente
            </Label>
            <Input
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
              placeholder="Nombre del cliente"
              className="text-sm lg:text-base"
            />
          </div>

          {/* Observaciones (Editable) */}
          <div className="space-y-2">
            <Label htmlFor="marca_modelo" className="text-sm lg:text-base font-semibold">
              Observaciones
            </Label>
            <Textarea
              id="marca_modelo"
              value={formData.marca_modelo}
              onChange={(e) => setFormData(prev => ({ ...prev, marca_modelo: e.target.value }))}
              placeholder="Escriba aquí las observaciones del equipo (ej: Pantalla rayada, teclado pegajoso, etc.)"
              className="text-sm lg:text-base min-h-[80px]"
            />
          </div>

          {/* Datos Obligatorios */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 lg:p-6 space-y-3 lg:space-y-4">
            <h3 className="font-semibold text-base lg:text-lg">Datos Obligatorios</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label htmlFor="motivo" className="text-sm">Motivo <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.motivo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value }))} 
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm">Recibido por <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.recibido_por} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recibido_por: value }))} 
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialista" className="text-sm">Especialista <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.area} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, area: value }))} 
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIALISTAS.map((especialista) => (
                      <SelectItem key={especialista} value={especialista}>
                        {especialista}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prioridad */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 lg:p-4 border-2 border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div>
              <Label htmlFor="prioridad_alta" className="cursor-pointer font-semibold text-sm lg:text-base">
                🔴 Prioridad Alta (Urgente)
              </Label>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">Marca este equipo como urgente</p>
            </div>
            <Switch
              id="prioridad_alta"
              checked={formData.prioridad_alta}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, prioridad_alta: checked }))}
            />
          </div>

          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t px-4 lg:px-8 py-3 lg:py-4 flex flex-col sm:flex-row justify-end gap-2 lg:gap-3">
          <Button type="button" variant="outline" onClick={onClose} size="lg" className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}