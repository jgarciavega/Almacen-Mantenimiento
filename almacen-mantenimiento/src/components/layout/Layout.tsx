import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import {
  LayoutDashboard, Package, ArrowLeftRight,
  Truck, Users, BarChart2, LogOut, Warehouse, Settings, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import GlobalSearch from '../ui/GlobalSearch';
import StockAlertBell from '../ui/StockAlertBell';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventario',   icon: Package,          label: 'Inventario' },
  { to: '/movimientos',  icon: ArrowLeftRight,   label: 'Movimientos' },
  { to: '/proveedores',  icon: Truck,            label: 'Proveedores' },
  { to: '/usuarios',     icon: Users,            label: 'Usuarios',  adminOnly: true },
  { to: '/reportes',     icon: BarChart2,        label: 'Reportes' },
];

export default function Layout() {
  const { usuario, logout } = useAuthStore();
  const menuItems = navItems.filter(item => !item.adminOnly || usuario?.rol === 'ADMIN');
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Navegación con flechas del teclado
  useEffect(() => {
    const allItems = [...menuItems, { to: '/configuracion', label: 'Configuración' }];
    const handler = (e: KeyboardEvent) => {
      // No interferir cuando el foco está en un input, textarea o select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();

      const currentIndex = allItems.findIndex(item => location.pathname.startsWith(item.to));
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + step + allItems.length) % allItems.length;
      navigate(allItems[nextIndex].to);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [location.pathname, menuItems, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 flex flex-col transition-colors duration-300">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <Warehouse className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-bold text-sm leading-tight text-slate-800 dark:text-white">Almacén</p>
            <p className="text-xs text-slate-400 dark:text-slate-400">Mantenimiento</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-3 pb-2">
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Configuración
          </NavLink>
        </div>

        {/* Usuario */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{usuario?.nombre}</p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                usuario?.rol === 'ADMIN'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {usuario?.rol}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center gap-4 shrink-0 transition-colors duration-300">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <StockAlertBell />
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster
        richColors
        position="top-right"
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          classNames: {
            success: '!bg-green-500 !text-white !border-green-600',
            error:   '!bg-red-600   !text-white !border-red-700',
          },
        }}
      />
    </div>
  );
}
