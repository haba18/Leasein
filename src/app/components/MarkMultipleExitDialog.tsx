import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface Equipment {
  id: number;
  codigo_equipo: string;
  cliente?: string;
  marca_modelo?: string;
}

interface EquipmentWithDetails extends Equipment {
  estado_correo: string;
  problema?: string;
}

interface MarkMultipleExitDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    marcar_salida: boolean; 
    observaciones_salida: string;
    equipos_data: { id: number; entregado_a: string }[] 
  }) => void;
  selectedEquipos: Equipment[];
}

export function MarkMultipleExitDialog({ 
  open, 
  onClose, 
  onSubmit, 
  selectedEquipos 
}: MarkMultipleExitDialogProps) {
  const [entregadoA, setEntregadoA] = useState('Almacén');
  const [observaciones, setObservaciones] = useState('');
  const [emailText, setEmailText] = useState('');
  const [copied, setCopied] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState<EquipmentWithDetails[]>([]);

  useEffect(() => {
    if (open && selectedEquipos.length > 0) {
      setEntregadoA('Almacén');
      setObservaciones('');
      setCopied(false);
      
      // Inicializar detalles de equipos
      setEquipmentDetails(selectedEquipos.map(eq => ({
        id: eq.id,
        codigo_equipo: eq.codigo_equipo,
        cliente: eq.cliente,
        marca_modelo: eq.marca_modelo,
        estado_correo: 'Reservado ✅',
        problema: ''
      })));
    }
  }, [open, selectedEquipos]);

  // Efecto para cambiar automáticamente "Entregado A" cuando algún equipo está "Dañado"
  useEffect(() => {
    const hayDanados = equipmentDetails.some(eq => eq.estado_correo === 'Dañado ❌');
    if (hayDanados) {
      setEntregadoA('Almacén - Reparaciones');
    }
  }, [equipmentDetails]);

  useEffect(() => {
    generateEmail();
  }, [entregadoA, equipmentDetails]);

  const updateEquipmentDetail = (id: number, field: 'estado_correo' | 'problema', value: string) => {
    setEquipmentDetails(prev => 
      prev.map(eq => eq.id === id ? { ...eq, [field]: value } : eq)
    );
  };

  const generateEmail = () => {
    if (equipmentDetails.length === 0) return;

    const lineasEquipos = equipmentDetails.map(eq => {
      const cliente = eq.cliente || 'Sin cliente asignado';
      const conProblema = eq.problema && eq.problema.trim() !== '';
      
      // Determinar el destino según el estado del equipo individual
      const destino = eq.estado_correo === 'Dañado ❌' ? 'Almacén - Reparaciones' : 'Almacén';
      
      if (conProblema) {
        return `${eq.codigo_equipo} // ${cliente} / ${eq.estado_correo} - ${destino} (${eq.problema})`;
      } else {
        return `${eq.codigo_equipo} // ${cliente} / ${eq.estado_correo} - ${destino}`;
      }
    }).join('\n\n');

    const emailBody = `Buenas tardes,

Cambiar el estado de los siguientes equipos temporales:

${lineasEquipos}

Saludos.`;
    
    setEmailText(emailBody);
  };

  const handleCopyEmail = () => {
    if (!emailText) {
      toast.error('No hay texto para copiar');
      return;
    }

    // Método de textarea que funciona en todos los navegadores
    const textArea = document.createElement('textarea');
    textArea.value = emailText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        toast.success('Correo copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('No se pudo copiar. Intenta seleccionar y copiar manualmente el texto.');
      }
    } catch (err) {
      console.error('Error al copiar:', err);
      toast.error('Error al copiar. Selecciona y copia manualmente el texto.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      marcar_salida: true,
      observaciones_salida: observaciones,
      equipos_data: equipmentDetails.map(eq => ({
        id: eq.id,
        entregado_a: eq.estado_correo === 'Dañado ❌' ? 'Almacén - Reparaciones' : 'Almacén'
      }))
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-xl">
            Marcar Salida de Múltiples Equipos
          </DialogTitle>
          <DialogDescription className="text-sm">
            Registra la salida de <strong className="text-foreground">{selectedEquipos.length}</strong> equipo(s) seleccionado(s)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          
          {/* Configuración Global */}
          <div className="space-y-3 lg:space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 lg:p-4">
            <h3 className="font-semibold text-sm lg:text-base">Configuración General</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label htmlFor="entregado_a" className="text-sm">Entregado A <span className="text-red-500">*</span></Label>
                <Select value={entregadoA} onValueChange={setEntregadoA} required>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Almacén">Almacén</SelectItem>
                    <SelectItem value="Almacén - Reparaciones">Almacén - Reparaciones</SelectItem>
                    <SelectItem value="Logistica">Logistica</SelectItem>
                    <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones" className="text-sm">Observaciones Generales</Label>
                <Input
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Lista de Equipos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm lg:text-base">Equipos Seleccionados</h3>
            <div className="space-y-3">
              {equipmentDetails.map((eq) => (
                <div key={eq.id} className="bg-white dark:bg-gray-950 border rounded-lg p-3 lg:p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-bold text-sm break-all">{eq.codigo_equipo}</p>
                      {eq.cliente && <p className="text-xs text-muted-foreground mt-1">{eq.cliente}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Estado para Correo</Label>
                      <Select 
                        value={eq.estado_correo} 
                        onValueChange={(value) => updateEquipmentDetail(eq.id, 'estado_correo', value)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Reservado ✅">Reservado ✅</SelectItem>
                          <SelectItem value="Dañado ❌">Dañado ❌</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Problema/Error (Opcional)</Label>
                      <Input
                        value={eq.problema || ''}
                        onChange={(e) => updateEquipmentDetail(eq.id, 'problema', e.target.value)}
                        placeholder="Ej: Rajadura en pantalla"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formato de Correo */}
          <div className="space-y-3 p-3 lg:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm lg:text-base font-semibold">📧 Vista Previa del Correo</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyEmail}
                className="text-xs lg:text-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs lg:text-sm p-2 lg:p-3 bg-white dark:bg-gray-800 rounded border whitespace-pre-wrap font-mono max-h-48 lg:max-h-64 overflow-y-auto">
{emailText}
            </pre>
            <p className="text-xs text-muted-foreground">
              💡 Copia este texto y pégalo en tu cliente de correo
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 lg:gap-3 pt-2 lg:pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm lg:text-base">
              Marcar Salida de {selectedEquipos.length} Equipo(s)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}