import { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Shield, 
  Users, 
  Gamepad2, 
  Trophy, 
  Settings, 
  BarChart3,
  Home,
  Loader2,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isModerator } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      }
      // If the user is signed in but not a moderator/admin, we render an access denied message
      // instead of redirecting away (helps debugging + clearer UX).
    }
  }, [user, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold text-foreground">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Youre signed in, but your account doesnt have admin/moderator access.
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-foreground truncate">{user?.id ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Role (from backend)</span>
              <span className="font-mono text-foreground">{role}</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            If this looks wrong, log out and back in (role changes can take effect after a fresh session).
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/games', icon: Gamepad2, label: 'Games' },
    { to: '/admin/leaderboards', icon: Trophy, label: 'Leaderboards' },
    { to: '/admin/history', icon: History, label: 'Bet History' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <span className="text-xs text-muted-foreground capitalize mt-1 block">
            Role: {role}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to App
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
