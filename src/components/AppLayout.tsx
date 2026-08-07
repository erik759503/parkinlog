import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import MobileNav from './MobileNav';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <MobileNav />
      <main className="md:ml-64 p-4 md:p-6 pt-16 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
