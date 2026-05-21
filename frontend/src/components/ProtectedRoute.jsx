import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Wrapper para proteger rutas según autenticación y roles.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Pantalla de carga premium mientras se restaura la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none"></div>
        
        <div className="text-center z-10 space-y-4">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(190,100,50,0.3)]"></div>
          <p className="text-sm font-semibold tracking-wider text-brand-text-muted animate-pulse uppercase">Cargando Consola MotoBoss...</p>
        </div>
      </div>
    );
  }

  // Redirigir al Login si no hay sesión activa
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir al Dashboard si el rol del usuario no tiene permisos autorizados
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    console.warn(`Intento de acceso no autorizado del usuario ${user.correo} con rol ${user.rol}`);
    return <Navigate to="/" replace />;
  }

  return children;
};
