import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, Edit2, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { type Driver } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { vehicleTypeLabel } from '@/types';

const normalizeText = (value: string) => value.trim().toLowerCase();

const DriverPicker = ({
  label,
  drivers,
  value,
  query,
  onValueChange,
  onQueryChange,
  placeholder,
  helperText,
}: {
  label: string;
  drivers: Driver[];
  value: string;
  query: string;
  onValueChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  placeholder: string;
  helperText?: string;
}) => {
  const [open, setOpen] = useState(false);

  const exactMatch = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return undefined;
    return drivers.find(driver => normalizeText(driver.fullName) === normalizedQuery || normalizeText(driver.registration) === normalizedQuery);
  }, [drivers, query]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const list = normalizedQuery
      ? drivers.filter(driver => [driver.fullName, driver.registration].some(field => normalizeText(field).includes(normalizedQuery)))
      : drivers;
    return list.slice(0, 8);
  }, [drivers, query]);

  const handleChange = (nextQuery: string) => {
    onQueryChange(nextQuery);
    const normalizedQuery = normalizeText(nextQuery);
    const match = normalizedQuery
      ? drivers.find(driver => normalizeText(driver.fullName) === normalizedQuery || normalizeText(driver.registration) === normalizedQuery)
      : undefined;
    onValueChange(match?.id || '');
    setOpen(true);
  };

  const selectDriver = (driver: Driver) => {
    onValueChange(driver.id);
    onQueryChange(driver.fullName);
    setOpen(false);
  };

  return (
    <div className="space-y-1 relative">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (suggestions.length > 0 || (query.trim() && !exactMatch)) && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {suggestions.length > 0 ? suggestions.map(driver => (
            <button
              key={driver.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectDriver(driver)}
              className={`flex w-full flex-col rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${value === driver.id ? 'bg-accent text-accent-foreground' : ''}`}
            >
              <span className="font-medium">{driver.fullName}</span>
              <span className="text-xs text-muted-foreground">{driver.registration}</span>
            </button>
          )) : (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Nenhum motorista encontrado.
            </div>
          )}
        </div>
      )}
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
};

const Gate = () => {
  const { vehicles, drivers, movements, addMovement, addDriver, updateMovement, getVehicle, getDriver } = useApp();
  const [newType, setNewType] = useState<'entry' | 'exit'>('entry');
  const [newVehicle, setNewVehicle] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newDriverQuery, setNewDriverQuery] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVehicle, setEditVehicle] = useState('');
  const [editDriver, setEditDriver] = useState('');
  const [editDriverQuery, setEditDriverQuery] = useState('');

  const availableVehicles = vehicles;
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const findDriverByQuery = (query: string) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return undefined;
    return activeDrivers.find(driver => normalizeText(driver.fullName) === normalizedQuery || normalizeText(driver.registration) === normalizedQuery);
  };
  const today = new Date().toISOString().split('T')[0];
  const todayMovements = movements.filter(m => m.date === today);

  const handleRegister = async () => {
    if (!newVehicle || !newDriverQuery.trim()) {
      toast.error('Selecione o veículo e informe o motorista');
      return;
    }

    let driverId = newDriver || findDriverByQuery(newDriverQuery)?.id || '';
    if (!driverId) {
      const createdId = await addDriver({
        fullName: newDriverQuery.trim(),
        registration: newDriverQuery.trim(),
        status: 'active',
      });
      if (!createdId) {
        toast.error('Não foi possível cadastrar o motorista');
        return;
      }
      driverId = createdId;
    }

    const now = new Date();
    await addMovement({
      type: newType,
      date: today,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      vehicleId: newVehicle,
      driverId,
      identificationStatus: 'manual',
      confirmedBy: 'gate',
    });
    toast.success(`${newType === 'entry' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    setNewVehicle('');
    setNewDriver('');
    setNewDriverQuery('');
  };

  const openEdit = (id: string) => {
    const m = movements.find(x => x.id === id);
    if (!m) return;
    setEditingId(id);
    setEditVehicle(m.vehicleId);
    setEditDriver(m.driverId);
    setEditDriverQuery(getDriver(m.driverId)?.fullName || '');
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    if (editingId) {
      const resolvedDriverId = editDriver || findDriverByQuery(editDriverQuery)?.id;
      if (!resolvedDriverId) {
        toast.error('Selecione um motorista válido');
        return;
      }
      await updateMovement(editingId, { vehicleId: editVehicle, driverId: resolvedDriverId, identificationStatus: 'manual', confirmedBy: 'gate' });
      toast.success('Movimentação corrigida');
    }
    setEditDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portaria</h1>
        <p className="text-muted-foreground text-sm">Registro e confirmação de movimentações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Registrar Movimentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={newType === 'entry' ? 'default' : 'outline'} onClick={() => setNewType('entry')} className="flex-1 gap-2">
              <ArrowDownToLine className="h-4 w-4" />Entrada
            </Button>
            <Button variant={newType === 'exit' ? 'default' : 'outline'} onClick={() => setNewType('exit')} className="flex-1 gap-2">
              <ArrowUpFromLine className="h-4 w-4" />Saída
            </Button>
          </div>
          <div>
            <Label>Veículo</Label>
            <Select value={newVehicle} onValueChange={setNewVehicle}>
              <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
              <SelectContent>
                {availableVehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.internalNumber} — {vehicleTypeLabel(v.vehicleType)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DriverPicker
            label="Motorista"
            drivers={activeDrivers}
            value={newDriver}
            query={newDriverQuery}
            onValueChange={setNewDriver}
            onQueryChange={setNewDriverQuery}
            placeholder="Digite o nome do motorista"
          />
          <Button onClick={handleRegister} className="w-full gap-2">
            <Check className="h-4 w-4" />Registrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações de Hoje ({todayMovements.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma movimentação hoje</p>
          ) : (
            todayMovements.map(m => {
              const v = getVehicle(m.vehicleId);
              const d = getDriver(m.driverId);
              return (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {m.type === 'entry' ? (
                      <ArrowDownToLine className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{v?.internalNumber} • {vehicleTypeLabel(v?.vehicleType)}</p>
                      <p className="text-xs text-muted-foreground">{d?.fullName} • {m.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {m.confirmedBy === 'camera' ? '📷' : '🏢'} {m.identificationStatus === 'automatic' ? 'Auto' : 'Manual'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m.id)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Veículo</Label>
              <Select value={editVehicle} onValueChange={setEditVehicle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.internalNumber} — {vehicleTypeLabel(v.vehicleType)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DriverPicker
              label="Motorista"
              drivers={activeDrivers}
              value={editDriver}
              query={editDriverQuery}
              onValueChange={setEditDriver}
              onQueryChange={setEditDriverQuery}
              placeholder="Digite o nome do motorista"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar Correção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gate;
