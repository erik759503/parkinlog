import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Car, LayoutDashboard, Users, ArrowLeftRight, DoorOpen, UserCog, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="md:hidden">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">ParkControl</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm pt-14">
          <nav className="bg-card border-b border-border p-4 space-y-1">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={async () => { setOpen(false); await signOut(); }}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-2 border-t border-border pt-3"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
