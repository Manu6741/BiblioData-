import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaRol({ tipos, children }) {
  const { usuario } = useAuth();

  if (!tipos.includes(usuario?.tipo)) {
    return <Navigate to="/panel" replace />;
  }

  return children;
}
