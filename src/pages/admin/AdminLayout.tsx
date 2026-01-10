import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Shield, 
  Users, 
  Gamepad2, 
  Settings, 
  BarChart3,
  Home,
  Loader2,
  History,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, isModerator } = useUserRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isModerator) {
        navigate('/');
      }
    }
  }, [user, authLoading, roleLoading, isModerator, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isModerator) {
    return null;
  }

  const navItems = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Players' },
    { to: '/admin/history', icon: History, label: 'Bet History' },
    { to: '/admin/games', icon: Gamepad2, label: 'Game Config' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">Admin</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize mt-1 block">
          {role}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <NavLink
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
        >
          <Home className="w-4 h-4" />
          Back to Casino
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-14 left-0 bottom-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 bg-card border-r border-border flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;