import { useEffect, useState } from 'react';
import { Code, KeyRound, Plus, Shield, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { getRoleLabel } from '@/lib/roleDisplay';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const PROTECTED_USERNAME = 'erikdev';

interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  role: AppRole;
}

const Users = () => {
  const { userRole, user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('gate');
  const [creating, setCreating] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUserRole, setEditUserRole] = useState<AppRole>('gate');
  const [editRole, setEditRole] = useState<AppRole>('gate');
  const [pwDialog, setPwDialog] = useState(false);
  const [pwUserId, setPwUserId] = useState('');
  const [pwUserName, setPwUserName] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwChanging, setPwChanging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [profiles, roles] = await Promise.all([
        api.get<any[]>('/profiles'),
        api.get<any[]>('/user-roles'),
      ]);
      setUsers((profiles || []).map(p => {
        const role = roles?.find(r => r.user_id === p.user_id);
        return {
          id: p.id,
          userId: p.user_id,
          fullName: p.full_name,
          username: p.username || '',
          role: (role?.role as AppRole) || 'gate',
        };
      }));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const isDev = userRole === 'dev';
  const isAdmin = userRole === 'admin';
  const isDevOrAdmin = isDev || isAdmin;
  const visibleUsers = isAdmin ? users.filter(u => u.role !== 'dev') : users;
  const creatableRoles: { value: AppRole; label: string }[] = isDev
    ? [
        { value: 'dev', label: 'Desenvolvedor' },
        { value: 'admin', label: 'Administrador' },
        { value: 'office', label: 'Escritorio' },
        { value: 'gate', label: 'Portaria' },
      ]
    : [
        { value: 'office', label: 'Escritorio' },
        { value: 'gate', label: 'Portaria' },
      ];

  if (!isDevOrAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    );
  }

  const openCreate = () => {
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setNewRole('gate');
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!newUsername || !newPassword || !newName) {
      toast.error('Preencha todos os campos');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', { username: newUsername, password: newPassword, fullName: newName, role: newRole });
      toast.success('Usuario criado com sucesso');
      setDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar usuario');
    } finally {
      setCreating(false);
    }
  };

  const canEditRole = (u: UserProfile) => {
    if (u.userId === user?.id) return false;
    if (u.username.toLowerCase() === PROTECTED_USERNAME) return false;
    if (isDev) return u.role !== 'dev';
    if (isAdmin) return u.role === 'office' || u.role === 'gate';
    return false;
  };

  const canDelete = (u: UserProfile) => canEditRole(u);
  const canChangePassword = (u: UserProfile) => canEditRole(u);

  const openEditRole = (u: UserProfile) => {
    setEditUserId(u.userId);
    setEditUserRole(u.role);
    setEditRole(u.role);
    setEditDialog(true);
  };

  const handleRoleChange = async () => {
    if (editUserRole === 'dev' && !isDev) { toast.error('Sem permissao'); return; }
    if (editRole === 'dev' && !isDev) { toast.error('Apenas DEV pode promover ao nivel DEV'); return; }
    if (isAdmin && (editRole === 'admin' || editRole === 'dev')) {
      toast.error('Admin so pode atribuir Escritorio ou Portaria');
      return;
    }

    try {
      await api.patch(`/users/${editUserId}/role`, { role: editRole });
      await api.post('/user-action-logs', {
        action: 'change_role',
        target_user_id: editUserId,
        target_username: users.find(u => u.userId === editUserId)?.username,
        target_role: editRole,
        performed_by: user!.id,
        performed_by_username: userRole === 'dev' ? 'Teste' : (user?.username || user?.fullName),
        performed_by_role: userRole === 'dev' ? 'teste' : userRole,
        details: { previous_role: editUserRole, new_role: editRole },
      });
      toast.success('Permissao alterada');
      setEditDialog(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar permissao');
    }
  };

  const openPwDialog = (u: UserProfile) => {
    setPwUserId(u.userId);
    setPwUserName(u.fullName || u.username);
    setPwNew('');
    setPwDialog(true);
  };

  const handlePasswordChange = async () => {
    if (!pwNew || pwNew.length < 6) { toast.error('Senha deve ter no minimo 6 caracteres'); return; }
    setPwChanging(true);
    try {
      await api.patch(`/users/${pwUserId}/password`, { newPassword: pwNew });
      toast.success('Senha alterada com sucesso');
      setPwDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setPwChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.userId}`);
      toast.success('Usuario excluido');
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuario');
    } finally {
      setDeleting(false);
    }
  };

  const roleBadgeVariant = (role: AppRole, viewerRole: AppRole | null) => {
    if (role === 'dev' && viewerRole === 'admin') return 'secondary' as const;
    if (role === 'dev') return 'destructive' as const;
    if (role === 'admin') return 'default' as const;
    if (role === 'office') return 'outline' as const;
    return 'secondary' as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Gerenciamento de acessos e permissoes</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Usuario</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleUsers.map(u => (
            <Card key={u.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {u.role === 'dev' ? <Code className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{u.fullName || 'Sem nome'}</CardTitle>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canChangePassword(u) && (
                    <Button variant="ghost" size="icon" onClick={() => openPwDialog(u)} title="Alterar senha">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  )}
                  {canEditRole(u) && (
                    <Button variant="ghost" size="icon" onClick={() => openEditRole(u)} title="Alterar permissao">
                      <Shield className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete(u) && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)} title="Excluir usuario">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={roleBadgeVariant(u.role, userRole)}>{getRoleLabel(u.role, userRole)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Completo</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Joao Silva" /></div>
            <div><Label>Nome de Usuario</Label><Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="joao.silva" /></div>
            <div><Label>Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" /></div>
            <div>
              <Label>Permissao</Label>
              <Select value={newRole} onValueChange={(v: AppRole) => setNewRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {creatableRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Criando...' : 'Criar Usuario'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Permissao</DialogTitle></DialogHeader>
          <div>
            <Label>Permissao</Label>
            <Select value={editRole} onValueChange={(v: string) => setEditRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {creatableRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleRoleChange}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pwDialog} onOpenChange={setPwDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Senha - {pwUserName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Senha</Label>
              <Input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Minimo 6 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialog(false)}>Cancelar</Button>
            <Button onClick={handlePasswordChange} disabled={pwChanging}>{pwChanging ? 'Alterando...' : 'Alterar Senha'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao e permanente. O usuario <strong>{deleteTarget?.fullName || deleteTarget?.username}</strong>
              {' '}({deleteTarget && getRoleLabel(deleteTarget.role, userRole)}) sera removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
