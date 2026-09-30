import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Marca } from './Marca';
import { Badge, esPersonal, iniciales } from './ui';
import {
  IconoCampana,
  IconoHistorial,
  IconoLibro,
  IconoPanel,
  IconoPrestamo,
  IconoReporte,
  IconoSalir,
  IconoUsuarios,
} from './Iconos';

const ENLACES = [
  { to: '/panel', label: 'Panel', icono: IconoPanel, roles: ['administrador', 'bibliotecario', 'estudiante', 'docente'] },
  { to: '/catalogo', label: 'Catálogo', icono: IconoLibro, roles: ['administrador', 'bibliotecario', 'estudiante', 'docente'] },
  { to: '/prestamos', label: 'Préstamos', icono: IconoPrestamo, roles: ['administrador', 'bibliotecario', 'estudiante', 'docente'] },
  { to: '/historial', label: 'Historial', icono: IconoHistorial, roles: ['administrador', 'bibliotecario'] },
  { to: '/usuarios', label: 'Usuarios', icono: IconoUsuarios, roles: ['administrador'] },
  { to: '/reportes', label: 'Reportes', icono: IconoReporte, roles: ['administrador', 'bibliotecario'] },
  { to: '/alertas', label: 'Alertas', icono: IconoCampana, roles: ['administrador', 'bibliotecario'] },
];

export default function Marco() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState(0);

  useEffect(() => {
    if (!esPersonal(usuario)) return undefined;
    let activo = true;
    api('/api/alertas')
      .then((datos) => {
        if (activo) setAlertas(datos.alertas?.length || 0);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [usuario]);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  const enlaces = ENLACES.filter((enlace) => enlace.roles.includes(usuario.tipo));

  return (
    <div className="app-shell" style={{ background: 'var(--background)' }}>
      <aside className="sidebar">
        <div className="sidebar-logo flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(196,168,122,0.2)' }}>
          <Marca clara />
        </div>
        <nav className="sidebar-nav flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
          {enlaces.map((enlace) => {
            const Icono = enlace.icono;
            return (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                className={({ isActive }) => `sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-base relative ${isActive ? 'nav-active' : ''}`}
                style={({ isActive }) => (isActive ? undefined : { color: 'rgba(245,237,214,0.65)' })}
              >
                <Icono className="w-4 h-4 shrink-0" />
                <span className="nav-texto">{enlace.label}</span>
                {enlace.to === '/alertas' && alertas > 0 && (
                  <span className="sidebar-label ml-auto font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#261509' }}>
                    {alertas}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-pie p-3 border-t" style={{ borderColor: 'rgba(196,168,122,0.2)' }}>
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent)', color: '#261509' }}>
              {iniciales(usuario.nombre, usuario.apellido)}
            </div>
            <div className="sidebar-label overflow-hidden">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--primary-foreground)' }}>
                {usuario.nombre} {usuario.apellido}
              </p>
              <Badge type={usuario.tipo} />
            </div>
          </div>
          <button type="button" onClick={salir} className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm w-full transition-base hover:opacity-70" style={{ color: 'rgba(245,237,214,0.5)' }}>
            <IconoSalir className="w-3.5 h-3.5" />
            <span className="sidebar-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="barra-superior">
          <Marca clara />
          <button type="button" onClick={salir} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(245,237,214,0.75)' }}>
            <IconoSalir className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </header>
        <main className="main-content flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
