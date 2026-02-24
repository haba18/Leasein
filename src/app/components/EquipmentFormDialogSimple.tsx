import { useState, useRef, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface EquipmentFormData {
  codigos: string; // Múltiples códigos separados por Enter
  marca_modelo: string;
  cliente: string;
  motivo: string;
  recibido_por: string;
  area: string;
  prioridad_alta: boolean;
  marcar_ingreso: boolean;
  marcar_salida: boolean;
  entregado_a: string;
  observaciones_ingreso: string;
  observaciones_salida: string;
}

interface EquipmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EquipmentFormData) => void;
  initialData?: Partial<EquipmentFormData>;
  mode: 'create' | 'edit';
}

const MOTIVOS = ['Temporales', 'Mantenimientos', 'Alquileres', 'Cambios'];
const RECIBIDO_POR = ['Harold Bayona', 'Ivan Quiroz', 'Joseph Sanchez', 'Bruno Quipe'];
const AREAS = ['Inventario', 'Reparaciones', 'Logistica'];
const ENTREGADO_A = ['Inventario', 'Logistica', 'Reparaciones'];

export function EquipmentFormDialogSimple({ open, onClose, onSubmit, initialData, mode }: EquipmentFormDialogProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    codigos: initialData?.codigos || '',
    marca_modelo: initialData?.marca_modelo || '',
    cliente: initialData?.cliente || '',
    motivo: initialData?.motivo || '',
    recibido_por: initialData?.recibido_por || '',
    area: initialData?.area || '',
    prioridad_alta: initialData?.prioridad_alta || false,
    marcar_ingreso: initialData?.marcar_ingreso || false,
    marcar_salida: initialData?.marcar_salida || false,
    entregado_a: initialData?.entregado_a || '',
    observaciones_ingreso: initialData?.observaciones_ingreso || '',
    observaciones_salida: initialData?.observaciones_salida || ''
  });

  const [emailText, setEmailText] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // RESETEAR FORMULARIO cuando cambia open o initialData
  useEffect(() => {
    if (open) {
      setFormData({
        codigos: initialData?.codigos || '',
        marca_modelo: initialData?.marca_modelo || '',
        cliente: initialData?.cliente || '',
        motivo: initialData?.motivo || '',
        recibido_por: initialData?.recibido_por || '',
        area: initialData?.area || '',
        prioridad_alta: initialData?.prioridad_alta || false,
        marcar_ingreso: initialData?.marcar_ingreso || false,
        marcar_salida: initialData?.marcar_salida || false,
        entregado_a: initialData?.entregado_a || '',
        observaciones_ingreso: initialData?.observaciones_ingreso || '',
        observaciones_salida: initialData?.observaciones_salida || ''
      });
      setEmailText('');
      setCopied(false);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof EquipmentFormData, value: any) => {
    // Normalizar códigos: mayúsculas y reemplazar ' por -
    if (field === 'codigos' && typeof value === 'string') {
      value = value.toUpperCase().replace(/'/g, '-');
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya al menos un código
    if (!formData.codigos || formData.codigos.trim() === '') {
      toast.error('Debes ingresar al menos un código de equipo');
      return;
    }
    
    // Validar longitud de cada código (máximo 50 caracteres)
    const codigosArray = formData.codigos.split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    const codigoLargo = codigosArray.find(c => c.length > 50);
    if (codigoLargo) {
      toast.error(`El código "${codigoLargo}" es demasiado largo (máximo 50 caracteres)`);
      return;
    }
    
    // Validar campos requeridos
    if (!formData.motivo) {
      toast.error('Debes seleccionar un motivo');
      return;
    }
    
    if (!formData.recibido_por) {
      toast.error('Debes seleccionar quién recibió el equipo');
      return;
    }
    
    if (!formData.area) {
      toast.error('Debes seleccionar un área');
      return;
    }
    
    // Preparar datos para enviar - ASEGURAR que codigos SIEMPRE tenga valor
    const dataToSend = {
      codigos: formData.codigos.trim(),
      codigo_equipo: formData.codigos.trim(), // AGREGAR TAMBIÉN codigo_equipo por si acaso
      marca_modelo: formData.marca_modelo || null,
      cliente: formData.cliente || null,
      motivo: formData.motivo,
      recibido_por: formData.recibido_por,
      area: formData.area,
      prioridad_alta: formData.prioridad_alta,
      marcar_ingreso: formData.marcar_ingreso,
      marcar_salida: formData.marcar_salida,
      entregado_a: formData.entregado_a || null,
      observaciones_ingreso: formData.observaciones_ingreso || null,
      observaciones_salida: formData.observaciones_salida || null
    };
    
    onSubmit(dataToSend);
  };

  // Generar correo al marcar salida
  useEffect(() => {
    if (formData.marcar_salida && formData.codigos) {
      const codigos = formData.codigos.split('\n').filter(c => c.trim());
      const emailBody = `Buenas, estos son los equipos revisados CAM/TEMP\n\n${codigos.map(codigo => `${codigo} // ${formData.cliente || 'Sin cliente'} (${formData.entregado_a || 'Sin área'}) ✓`).join('\n')}\n\nSaludos.\n\n--`;
      setEmailText(emailBody);
    } else {
      setEmailText('');
    }
  }, [formData.marcar_salida, formData.codigos, formData.cliente, formData.entregado_a]);

  const handleCopyEmail = () => {
    if (emailText) {
      navigator.clipboard.writeText(emailText);
      setCopied(true);
      toast.success('Correo copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Registrar Equipo' : 'Editar Equipo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Ingresa uno o múltiples códigos (presiona Enter entre cada uno)' : 'Actualiza los detalles del equipo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código(s) */}
          <div className="space-y-2">
            <Label htmlFor="codigos">Código de Equipo(s) *</Label>
            <Textarea
              id="codigos"
              ref={textareaRef}
              value={formData.codigos}
              onChange={(e) => handleChange('codigos', e.target.value)}
              placeholder="LAP-001&#10;LAP-002&#10;LAP-003"
              required
              disabled={mode === 'edit'}
              rows={4}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {mode === 'create' ? 'Escribe un código por línea. Al pistolear, presiona Enter después de cada código.' : 'El código no puede ser editado'}
            </p>
          </div>

          {/* Marca/Modelo y Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca_modelo">Marca / Modelo</Label>
              <Input
                id="marca_modelo"
                value={formData.marca_modelo}
                onChange={(e) => handleChange('marca_modelo', e.target.value)}
                placeholder="Dell Latitude 5420"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => handleChange('cliente', e.target.value)}
                placeholder="Empresa XYZ"
              />
            </div>
          </div>

          {/* Motivo, Recibido Por y Área */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Select value={formData.motivo} onValueChange={(value) => handleChange('motivo', value)} required>
                <SelectTrigger>
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
              <Label htmlFor="recibido_por">Recibido Por *</Label>
              <Select value={formData.recibido_por} onValueChange={(value) => handleChange('recibido_por', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
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
          </div>

          {/* Observaciones de Ingreso */}
          <div className="space-y-2">
            <Label htmlFor="observaciones_ingreso">Observaciones de Ingreso</Label>
            <Textarea
              id="observaciones_ingreso"
              value={formData.observaciones_ingreso}
              onChange={(e) => handleChange('observaciones_ingreso', e.target.value)}
              placeholder="Observaciones al momento del ingreso..."
              rows={2}
            />
          </div>

          {/* Prioridad Alta */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="prioridad_alta" className="cursor-pointer">
              Prioridad Alta (Urgente)
            </Label>
            <Switch
              id="prioridad_alta"
              checked={formData.prioridad_alta}
              onCheckedChange={(checked) => handleChange('prioridad_alta', checked)}
            />
          </div>

          {/* Marcar Ingreso */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Label htmlFor="marcar_ingreso" className="cursor-pointer">
              Marcar Ingreso
            </Label>
            <Switch
              id="marcar_ingreso"
              checked={formData.marcar_ingreso}
              onCheckedChange={(checked) => handleChange('marcar_ingreso', checked)}
            />
          </div>

          {/* Marcar Salida */}
          <div className="space-y-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="marcar_salida" className="cursor-pointer">
                Marcar Salida
              </Label>
              <Switch
                id="marcar_salida"
                checked={formData.marcar_salida}
                onCheckedChange={(checked) => handleChange('marcar_salida', checked)}
              />
            </div>

            {formData.marcar_salida && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="entregado_a">Entregado A</Label>
                  <Select value={formData.entregado_a} onValueChange={(value) => handleChange('entregado_a', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
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
                  <Label htmlFor="observaciones_salida">Observaciones de Salida</Label>
                  <Textarea
                    id="observaciones_salida"
                    value={formData.observaciones_salida}
                    onChange={(e) => handleChange('observaciones_salida', e.target.value)}
                    placeholder="Observaciones al momento de la salida..."
                    rows={2}
                  />
                </div>

                {/* Formato de Correo */}
                {emailText && (
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Formato de Correo:</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopyEmail}
                        className="h-8"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs p-2 bg-white dark:bg-gray-800 rounded border whitespace-pre-wrap font-mono">
                      {emailText}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Guardar' : 'Actualizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}