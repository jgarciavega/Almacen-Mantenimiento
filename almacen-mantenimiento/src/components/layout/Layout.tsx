import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowLeftRight,
  Truck, Users, BarChart2, LogOut, Warehouse, Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import GlobalSearch from '../ui/GlobalSearch';

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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <Warehouse className="w-7 h-7 text-blue-400" />
          <div>
            <p className="font-bold text-sm leading-tight">Almacén</p>
            <p className="text-xs text-slate-400">Mantenimiento</p>
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
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Configuración
          </NavLink>
        </div>

        {/* Usuario */}
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 truncate">{usuario?.nombre}</p>
          <p className="text-xs text-slate-500 mb-3">{usuario?.rol}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar con buscador */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
