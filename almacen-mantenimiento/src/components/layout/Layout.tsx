import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  { to: '/usuarios',     icon: Users,            label: 'Usuarios' },
  { to: '/reportes',     icon: BarChart2,        label: 'Reportes' },
];

export default function Layout() {
  const { usuario, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 flex flex-col transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <Warehouse className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-bold text-sm leading-tight text-slate-800 dark:text-white">Almacén</p>
            <p className="text-xs text-slate-400 dark:text-slate-400">Mantenimiento</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
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
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{usuario?.nombre}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{usuario?.rol}</p>
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
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4 transition-colors duration-300">
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
