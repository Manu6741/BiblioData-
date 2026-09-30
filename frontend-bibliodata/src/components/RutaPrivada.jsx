import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaPrivada({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="grid min-h-screen place-items-center font-display text-lg" style={{ color: 'var(--muted-foreground)', background: 'var(--background)' }}>
        Cargando…
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
