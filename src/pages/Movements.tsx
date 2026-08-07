import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download, Search, ArrowDownToLine, ArrowUpFromLine, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getActorLabel, getRoleLabel } from '@/lib/roleDisplay';
import { vehicleTypeLabel } from '@/types';
import { toast } from 'sonner';

const Movements = () => {
  const { movements, vehicles, getVehicle, getDriver, deleteMovement } = useApp();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'dev';
  const canDelete = canEdit;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportVehicleId, setExportVehicleId] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMovement(deleteId);
      toast.success('Movimentação excluída com sucesso');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    }
    setDeleteId(null);
  };

  const filtered = useMemo(() => {
    return movements.filter(m => {
      const vehicle = getVehicle(m.vehicleId);
      const driver = getDriver(m.driverId);
      const matchSearch = !search || [
        vehicle?.internalNumber, vehicle?.vehicleType, driver?.fullName, driver?.registration
      ].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchDate = !dateFilter || m.date === dateFilter;
      return matchSearch && matchType && matchDate;
    });
  }, [movements, search, typeFilter, dateFilter, getVehicle, getDriver]);

  const exportVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) =>
      a.internalNumber.localeCompare(b.internalNumber, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [vehicles]);

  const formatExportDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const exportXLSM = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Informe a data inicial e a data final para exportar');
      return;
    }

    if (exportStartDate > exportEndDate) {
      toast.error('A data inicial deve ser anterior ou igual à data final');
      return;
    }

    const exportMovements = filtered.filter(m => {
      const matchDateRange = m.date >= exportStartDate && m.date <= exportEndDate;
      const matchVehicle = exportVehicleId === 'all' || m.vehicleId === exportVehicleId;
      return matchDateRange && matchVehicle;
    });

    if (exportMovements.length === 0) {
      toast.info('Nenhum registro foi encontrado para os filtros informados');
      return;
    }

    const rows = exportMovements.map(m => {
      const v = getVehicle(m.vehicleId);
      const d = getDriver(m.driverId);
      return {
        Data: m.date,
        Hora: m.time,
        Tipo: m.type === 'entry' ? 'Entrada' : 'Saída',
        'Nº Carro': v?.internalNumber || '',
        'Tipo do Veículo': v?.vehicleType || '',
        Motorista: d?.fullName || '',
        Matrícula: d?.registration || '',
        Identificação: m.identificationStatus === 'automatic' ? 'Automático' : 'Manual',
        'Confirmado Por': m.confirmedBy === 'camera' ? 'Câmera' : 'Portaria',
        'Registrado Por': getActorLabel(m.registeredByUsername, m.registeredByRole, userRole),
        'Perfil do Usuário': getRoleLabel(m.registeredByRole, userRole),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
    const filename = `Garagem_Controle_${formatExportDate(new Date())}.xlsx`;
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
    toast.success(`Relatório exportado (${rows.length} registro${rows.length === 1 ? '' : 's'})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Movimentações</h1>
          <p className="text-muted-foreground text-sm">Histórico de entradas e saídas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar planilha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="export-start-date">Data Inicial (De)</Label>
              <Input
                id="export-start-date"
                type="date"
                value={exportStartDate}
                onChange={e => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-end-date">Data Final (Até)</Label>
              <Input
                id="export-end-date"
                type="date"
                value={exportEndDate}
                onChange={e => setExportEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Veículo (opcional)</Label>
              <Select value={exportVehicleId} onValueChange={setExportVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {exportVehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.internalNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportXLSM}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entry">Entrada</SelectItem>
                <SelectItem value="exit">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full sm:w-44" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nº Carro</TableHead>
                  <TableHead>Tipo do Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Confirmado</TableHead>
                  <TableHead>Registrado Por</TableHead>
                  {canDelete && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={canDelete ? 11 : 10} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell></TableRow>
                ) : (
                  filtered.map(m => {
                    const v = getVehicle(m.vehicleId);
                    const d = getDriver(m.driverId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{m.date}</TableCell>
                        <TableCell className="text-sm">{m.time}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'entry' ? 'default' : 'secondary'} className="gap-1">
                            {m.type === 'entry' ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}
                            {m.type === 'entry' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{v?.internalNumber || '—'}</TableCell>
                        <TableCell className="text-sm">{vehicleTypeLabel(v?.vehicleType)}</TableCell>
                        <TableCell className="text-sm">{d?.fullName || '—'}</TableCell>
                        <TableCell className="text-sm">{d?.registration || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {m.identificationStatus === 'automatic' ? 'Automático' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {m.confirmedBy === 'camera' ? '📷 Câmera' : '🏢 Portaria'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.registeredByUsername ? (
                            <div className="flex flex-col">
                              <span>{getActorLabel(m.registeredByUsername, m.registeredByRole, userRole)}</span>
                              {m.registeredByRole && (
                                <span className="text-xs text-muted-foreground">{getRoleLabel(m.registeredByRole, userRole)}</span>
                              )}
                            </div>
                          ) : '—'}
                        </TableCell>
                        {canDelete && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não poderá ser desfeita e ficará registrada no log de auditoria.
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

export default Movements;
