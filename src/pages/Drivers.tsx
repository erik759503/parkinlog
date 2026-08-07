import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Edit2, User, Trash2, Upload } from 'lucide-react';
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
import { Driver } from '@/types';
import { toast } from 'sonner';

const emptyDriver: Omit<Driver, 'id'> = { fullName: '', registration: '', status: 'active' };

type ImportSummary = {
  imported: number;
  skipped: number;
  errors: number;
};

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const getCellValue = (row: Record<string, unknown>, keys: string[]) => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeText(key), value] as const);
  const match = normalizedEntries.find(([key]) => keys.includes(key));
  return String(match?.[1] || '').trim();
};

const Drivers = () => {
  const { drivers, addDriver, updateDriver, deleteDriver } = useApp();
  const { userRole } = useAuth();
  const canManage = userRole === 'admin' || userRole === 'dev';
  const canDelete = canManage;
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDriver);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDriver(deleteId);
      toast.success('Motorista excluído com sucesso');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir motorista');
    }
    setDeleteId(null);
  };

  const filtered = drivers.filter(d =>
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.registration.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(emptyDriver); setEditing(null); setDialogOpen(true); };
  const openEdit = (d: Driver) => {
    setForm({ fullName: d.fullName, registration: d.registration, status: d.status, photoUrl: d.photoUrl });
    setEditing(d.id); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) { await updateDriver(editing, form); }
    else { await addDriver(form); }
    setDialogOpen(false);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    const summary: ImportSummary = { imported: 0, skipped: 0, errors: 0 };
    const knownRegistrations = new Set(drivers.map(d => normalizeText(d.registration)).filter(Boolean));
    const knownNames = new Set(drivers.map(d => normalizeText(d.fullName)).filter(Boolean));

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      for (const row of rows) {
        const fullName = getCellValue(row, ['nome', 'nome completo', 'motorista', 'full_name', 'fullname', 'name']);
        const registration = getCellValue(row, ['matricula', 'matrícula', 'registro', 'registration', 'codigo', 'código']);
        const normalizedName = normalizeText(fullName);
        const normalizedRegistration = normalizeText(registration);

        if (!fullName || !registration) {
          summary.errors += 1;
          continue;
        }

        if (knownRegistrations.has(normalizedRegistration) || knownNames.has(normalizedName)) {
          summary.skipped += 1;
          continue;
        }

        try {
          await addDriver({ fullName, registration, status: 'active' });
          knownRegistrations.add(normalizedRegistration);
          knownNames.add(normalizedName);
          summary.imported += 1;
        } catch {
          summary.errors += 1;
        }
      }

      toast.success(`Importação concluída: ${summary.imported} importados, ${summary.skipped} ignorados, ${summary.errors} erros.`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao importar planilha');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Motoristas</h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de motoristas cadastrados</p>
        </div>
        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={e => handleImport(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importando...' : 'Importar Excel'}
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Motorista</Button>
          </div>
        )}
      </div>

      <Input placeholder="Buscar por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d => (
          <Card key={d.id}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{d.fullName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{d.registration}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {canManage && <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit2 className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>{d.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Completo</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><Label>Matrícula</Label><Input value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(val: 'active' | 'inactive') => setForm({ ...form, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
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
              Tem certeza que deseja excluir este motorista? Esta ação não poderá ser desfeita e ficará registrada no log de auditoria.
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

export default Drivers;
