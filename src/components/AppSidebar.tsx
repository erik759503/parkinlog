import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Users, ArrowLeftRight, Shield, DoorOpen, LogOut, UserCog, Code } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const AppSidebar = () => {
  const { userRole, signOut } = useAuth();
  const location = useLocation();

  const allLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vehicles', icon: Car, label: 'Veículos' },
    { to: '/drivers', icon: Users, label: 'Motoristas' },
    { to: '/movements', icon: ArrowLeftRight, label: 'Movimentações' },
    { to: '/gate', icon: DoorOpen, label: 'Portaria' },
    { to: '/users', icon: UserCog, label: 'Usuários' },
  ];

  const gateLinks = [
    { to: '/gate', icon: DoorOpen, label: 'Portaria' },
    { to: '/movements', icon: ArrowLeftRight, label: 'Movimentações' },
  ];

  const officeLinks = [
    { to: '/movements', icon: ArrowLeftRight, label: 'Movimentações' },
  ];

  const links = userRole === 'gate' ? gateLinks : userRole === 'office' ? officeLinks : allLinks;

  const roleLabel = userRole === 'dev' ? 'Desenvolvedor' : userRole === 'admin' ? 'Administrador' : userRole === 'office' ? 'Escritório' : 'Portaria';
  const RoleIcon = userRole === 'dev' ? Code : Shield;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Car className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ParkControl</h1>
            <p className="text-xs text-sidebar-foreground/60">Controle de Frotas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === link.to
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
          <RoleIcon className="h-4 w-4 text-sidebar-primary" />
          <span className="text-xs font-medium">{roleLabel}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
