import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventarioPage from './pages/inventory/InventarioPage';
import MovimientosPage from './pages/movements/MovimientosPage';
import ProveedoresPage from './pages/suppliers/ProveedoresPage';
import UsuariosPage from './pages/users/UsuariosPage';
import ConfiguracionPage from './pages/config/ConfiguracionPage';
import ReportesPage from './pages/reports/ReportesPage';
import './App.css';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario);
  return usuario?.rol === 'ADMIN' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="movimientos" element={<MovimientosPage />} />
            <Route path="proveedores" element={<ProveedoresPage />} />
            <Route path="usuarios" element={<AdminRoute><UsuariosPage /></AdminRoute>} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

