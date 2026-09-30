import { Navigate, Route, Routes } from 'react-router-dom';
import PWABadge from './PWABadge';
import Marco from './components/Marco';
import RutaPrivada from './components/RutaPrivada';
import RutaRol from './components/RutaRol';
import Alertas from './pages/Alertas';
import Catalogo from './pages/Catalogo';
import Historial from './pages/Historial';
import Login from './pages/Login';
import Panel from './pages/Panel';
import Prestamos from './pages/Prestamos';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RutaPrivada><Marco /></RutaPrivada>}>
          <Route path="/panel" element={<Panel />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/prestamos" element={<Prestamos />} />
          <Route path="/historial" element={<RutaRol tipos={['administrador', 'bibliotecario']}><Historial /></RutaRol>} />
          <Route path="/usuarios" element={<RutaRol tipos={['administrador']}><Usuarios /></RutaRol>} />
          <Route path="/reportes" element={<RutaRol tipos={['administrador', 'bibliotecario']}><Reportes /></RutaRol>} />
          <Route path="/alertas" element={<RutaRol tipos={['administrador', 'bibliotecario']}><Alertas /></RutaRol>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWABadge />
    </>
  );
}
