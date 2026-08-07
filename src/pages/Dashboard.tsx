import { useMemo, useState } from 'react';
import { Car, ArrowDownToLine, ArrowUpFromLine, ParkingCircle, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StatCard from '@/components/StatCard';
import { useApp } from '@/contexts/AppContext';
import { vehicleTypeLabel } from '@/types';

type DetailType = 'entry' | 'exit';

const Dashboard = () => {
  const { vehicles, drivers, movements, getVehicle, getDriver } = useApp();
  const [detailType, setDetailType] = useState<DetailType | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayMovements = movements.filter(m => m.date === today);
  const entries = todayMovements.filter(m => m.type === 'entry');
  const exits = todayMovements.filter(m => m.type === 'exit');
  const inYard = vehicles.filter(v => v.inYard);
  const recentMovements = movements.slice(0, 8);
  const detailedVehicles = useMemo(() => {
    const latestByVehicle = new Map<string, (typeof movements)[number]>();
    movements.forEach(movement => {
      if (!latestByVehicle.has(movement.vehicleId)) {
        latestByVehicle.set(movement.vehicleId, movement);
      }
    });

    return vehicles
      .map(vehicle => ({ vehicle, movement: latestByVehicle.get(vehicle.id) }))
      .filter((item): item is { vehicle: typeof vehicles[number]; movement: typeof movements[number] } =>
        !!item.movement && item.movement.type === detailType
      )
      .sort((a, b) => {
        const aNumber = Number(a.vehicle.internalNumber);
        const bNumber = Number(b.vehicle.internalNumber);
        if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
        return a.vehicle.internalNumber.localeCompare(b.vehicle.internalNumber, undefined, { numeric: true });
      });
  }, [detailType, movements, vehicles]);
  const detailTitle = detailType === 'entry' ? 'Veiculos no Patio' : 'Saidas';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do estacionamento</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="No Pátio" value={inYard.length} icon={ParkingCircle} variant="success" onClick={() => setDetailType('entry')} />
        <StatCard title="Entradas Hoje" value={entries.length} icon={ArrowDownToLine} variant="default" />
        <StatCard title="Saídas" value={exits.length} icon={ArrowUpFromLine} variant="warning" onClick={() => setDetailType('exit')} />
        <StatCard title="Total Hoje" value={todayMovements.length} icon={ArrowLeftRight} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ParkingCircle className="h-4 w-4 text-success" />
              Veículos no Pátio ({inYard.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inYard.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum veículo no pátio</p>
            ) : (
              inYard.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Car className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{v.internalNumber}</p>
                      <p className="text-xs text-muted-foreground">{vehicleTypeLabel(v.vehicleType)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{vehicleTypeLabel(v.vehicleType)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              Últimas Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMovements.map(m => {
              const vehicle = getVehicle(m.vehicleId);
              const driver = getDriver(m.driverId);
              return (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {m.type === 'entry' ? (
                      <ArrowDownToLine className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{vehicle?.internalNumber || '—'}</p>
                      <p className="text-xs text-muted-foreground">{driver?.fullName || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={m.type === 'entry' ? 'default' : 'secondary'} className="text-xs">
                      {m.type === 'entry' ? 'Entrada' : 'Saída'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{m.time}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detailType} onOpenChange={(open) => !open && setDetailType(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Total de veiculos encontrados: {detailedVehicles.length}</p>
            <div className="max-h-[60vh] overflow-y-auto rounded-md border">
              <div className="grid grid-cols-3 gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Prefixo</span>
                <span>Data</span>
                <span>Hora</span>
              </div>
              {detailedVehicles.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Nenhum veiculo encontrado</p>
              ) : (
                detailedVehicles.map(({ vehicle, movement }) => (
                  <div key={vehicle.id} className="grid grid-cols-3 gap-3 px-3 py-2 text-sm odd:bg-muted/40">
                    <span className="font-medium">{vehicle.internalNumber}</span>
                    <span>{movement.date}</span>
                    <span>{movement.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailType(null)}>Retornar ao Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
