import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import almacenGif from '../../assets/almacen.gif';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!email.trim()) errors.email = 'El correo electrónico es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Ingresa un correo electrónico válido';
    if (!password) errors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.usuario);
      navigate('/dashboard');
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-red-400 focus:ring-red-400'
        : 'border-gray-300 focus:ring-blue-500'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <img src={almacenGif} alt="Almacén" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Almacén</h1>
          <p className="text-gray-500 text-sm mt-1">Área de Mantenimiento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${formErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({...prev, email: undefined})); }}
                className={inputClass(formErrors.email)}
                placeholder="usuario@empresa.com"
              />
            </div>
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${formErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormErrors(prev => ({...prev, password: undefined})); }}
                className={inputClass(formErrors.password)}
                placeholder="••••••••"
              />
            </div>
            {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}