import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface EquipmentFormData {
  codigo_equipo: string;
  marca_modelo: string;
  cliente: string;
  motivo: string;
  recibido_por: string;
  area: string;
  prioridad_alta: boolean;
  marcar_ingreso: boolean;
  marcar_salida: boolean;
  entregado_a: string;
  observaciones: string;
}

interface EquipmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EquipmentFormData) => void;
  initialData?: Partial<EquipmentFormData>;
  mode: 'create' | 'edit';
}

const MOTIVOS = [
  'Temporales',
  'Mantenimientos',
  'Alquileres',
  'Cambios'
];

const RECIBIDO_POR = [
  'Harold Bayona',
  'Ivan Quiroz',
  'Joseph Sanchez',
  'Bruno Quipe'
];

const AREAS = [
  'Inventario',
  'Reparaciones',
  'Logistica'
];

const ENTREGADO_A = [
  'Inventario',
  'Logistica',
  'Reparaciones'
];

export function EquipmentFormDialog({ open, onClose, onSubmit, initialData, mode }: EquipmentFormDialogProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    codigo_equipo: initialData?.codigo_equipo || '',
    marca_modelo: initialData?.marca_modelo || '',
    cliente: initialData?.cliente || '',
    motivo: initialData?.motivo || '',
    recibido_por: initialData?.recibido_por || '',
    area: initialData?.area || '',
    prioridad_alta: initialData?.prioridad_alta || false,
    marcar_ingreso: initialData?.marcar_ingreso || false,
    marcar_salida: initialData?.marcar_salida || false,
    entregado_a: initialData?.entregado_a || '',
    observaciones: initialData?.observaciones || ''
  });

  const handleChange = (field: keyof EquipmentFormData, value: any) => {
    // Normalizar código de equipo: mayúsculas y reemplazar ' por -
    if (field === 'codigo_equipo' && typeof value === 'string') {
      value = value.toUpperCase().replace(/'/g, '-');
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Registrar Nuevo Equipo' : 'Editar Equipo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Ingresa los detalles del nuevo equipo' : 'Actualiza los detalles del equipo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_equipo">Código de Equipo *</Label>
              <Input
                id="codigo_equipo"
                value={formData.codigo_equipo}
                onChange={(e) => handleChange('codigo_equipo', e.target.value)}
                placeholder="LAP-001"
                required
                disabled={mode === 'edit'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca_modelo">Marca / Modelo</Label>
              <Input
                id="marca_modelo"
                value={formData.marca_modelo}
                onChange={(e) => handleChange('marca_modelo', e.target.value)}
                placeholder="Dell Latitude 5420"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                placeholder="Empresa XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Select value={formData.motivo} onValueChange={(value) => handleChange('motivo', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recibido_por">Recibido Por *</Label>
              <Select value={formData.recibido_por} onValueChange={(value) => handleChange('recibido_por', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar recibido por" />
                </SelectTrigger>
                <SelectContent>
                  {RECIBIDO_POR.map((recibido) => (
                    <SelectItem key={recibido} value={recibido}>
                      {recibido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Select value={formData.area} onValueChange={(value) => handleChange('area', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área" />
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
          </div>

          {/* Prioridad alta */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="prioridad_alta" className="text-base font-semibold">
                Prioridad Alta (Urgente)
              </Label>
              <p className="text-sm text-muted-foreground">
                Marcar este equipo como urgente
              </p>
            </div>
            <Switch
              id="prioridad_alta"
              checked={formData.prioridad_alta}
              onCheckedChange={(checked) => handleChange('prioridad_alta', checked)}
            />
          </div>

          {/* Control de ingreso */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="space-y-0.5">
              <Label htmlFor="marcar_ingreso" className="text-base font-semibold">
                Marcar Ingreso
              </Label>
              <p className="text-sm text-muted-foreground">
                Registra automáticamente fecha y hora de ingreso
              </p>
            </div>
            <Switch
              id="marcar_ingreso"
              checked={formData.marcar_ingreso}
              onCheckedChange={(checked) => handleChange('marcar_ingreso', checked)}
            />
          </div>

          {/* Control de salida */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marcar_salida" className="text-base font-semibold">
                  Marcar Salida
                </Label>
                <p className="text-sm text-muted-foreground">
                  Registra automáticamente fecha y hora de salida
                </p>
              </div>
              <Switch
                id="marcar_salida"
                checked={formData.marcar_salida}
                onCheckedChange={(checked) => handleChange('marcar_salida', checked)}
              />
            </div>

            {formData.marcar_salida && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="entregado_a">Entregado A</Label>
                  <Select value={formData.entregado_a} onValueChange={(value) => handleChange('entregado_a', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar entregado a" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTREGADO_A.map((entregado) => (
                        <SelectItem key={entregado} value={entregado}>
                          {entregado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Input
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => handleChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Registrar Equipo' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}