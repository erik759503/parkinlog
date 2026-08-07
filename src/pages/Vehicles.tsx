import { useState } from 'react';
import { Plus, Edit2, Car, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, vehicleTypeOptions, vehicleTypeLabel } from '@/types';
import { toast } from 'sonner';

const emptyVehicle: Omit<Vehicle, 'id'> = {
  internalNumber: '', vehicleType: 'Particular', inYard: false,
};

const Vehicles = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useApp();
  const { userRole } = useAuth();
  const canManage = userRole === 'admin' || userRole === 'dev';
  const canDelete = canManage;
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVehicle);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVehicle(deleteId);
      toast.success('Veículo excluído com sucesso');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir veículo');
    }
    setDeleteId(null);
  };

  const filtered = vehicles.filter(v =>
    v.internalNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicleType?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(emptyVehicle); setEditing(null); setDialogOpen(true); };
  const openEdit = (v: Vehicle) => {
    setForm({ internalNumber: v.internalNumber, vehicleType: v.vehicleType, inYard: v.inYard });
    setEditing(v.id); setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) { await updateVehicle(editing, form); }
      else { await addVehicle(form); }
      toast.success(editing ? 'Veículo atualizado com sucesso' : 'Veículo criado com sucesso');
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar veículo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de veículos cadastrados</p>
        </div>
        {canManage && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Veículo</Button>}
      </div>

      <Input placeholder="Buscar por número ou tipo..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => (
          <Card key={v.id} className="relative">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{v.internalNumber}</CardTitle>
              </div>
              <div className="flex gap-1">
                {canManage && <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Edit2 className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Badge variant="outline">{vehicleTypeLabel(v.vehicleType)}</Badge>
                {v.inYard && <Badge className="bg-success text-success-foreground">No Pátio</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Número Interno</Label><Input value={form.internalNumber} onChange={e => setForm({ ...form, internalNumber: e.target.value })} placeholder="Ex: CARRO-06" /></div>
            <div>
              <Label>Tipo do Veículo</Label>
              <Select value={form.vehicleType} onValueChange={(val: 'Rainha' | 'STB' | 'Particular') => setForm({ ...form, vehicleType: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não poderá ser desfeita e ficará registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
