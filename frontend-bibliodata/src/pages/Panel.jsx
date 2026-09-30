import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { IconoAlerta, IconoLibro, IconoPrestamo, IconoUsuarios } from '../components/Iconos';
import { Badge, SectionHeader, StatCard, esPersonal } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Panel() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const personal = esPersonal(usuario);
    Promise.all([
      api('/api/libros'),
      api('/api/prestamos/activos'),
      api('/api/prestamos/vencidos'),
      personal ? api('/api/reportes') : Promise.resolve(null),
      personal ? api('/api/usuarios') : Promise.resolve(null),
    ])
      .then(([libros, activos, vencidos, reportes, usuarios]) => {
        if (activo) setDatos({ libros: libros.libros, activos: activos.prestamos, vencidos: vencidos.prestamos, reportes, usuarios: usuarios?.usuarios || [] });
      })
      .catch((fallo) => {
        if (activo) setError(fallo.message);
      });
    return () => {
      activo = false;
    };
  }, [usuario]);

  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const libros = datos?.libros || [];
  const categorias = datos?.reportes?.porCategoria?.length ? datos.reportes.porCategoria : agrupar(libros);
  const maximo = Math.max(1, ...categorias.map((fila) => Number(fila.total)));
  const disponibles = libros.filter((libro) => libro.disponibles > 0).length;
  const copias = libros.reduce((suma, libro) => suma + libro.copias, 0);

  return (
    <div>
      <SectionHeader title="Panel de control" subtitle={`Resumen de actividad · ${fecha}`} />
      {error && <p className="aviso-error mb-4">{error}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Total libros" value={libros.length} icon={<IconoLibro className="w-5 h-5" />} sub={`${copias} copias totales`} />
        <StatCard label="Usuarios" value={esPersonal(usuario) ? datos?.usuarios.length ?? '—' : '—'} icon={<IconoUsuarios className="w-5 h-5" />} sub={esPersonal(usuario) ? `${datos?.usuarios.filter((item) => item.activo).length || 0} activos` : 'Solo personal'} />
        <StatCard label="Préstamos activos" value={datos?.activos.length ?? '—'} icon={<IconoPrestamo className="w-5 h-5" />} sub="En circulación" />
        <StatCard label="Vencidos" value={datos?.vencidos.length ?? '—'} icon={<IconoAlerta className="w-5 h-5" />} sub="Requieren atención" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card)] rounded-sm shadow-sm p-5">
          <h3 className="font-display font-semibold text-base mb-4">Actividad reciente</h3>
          <div className="space-y-3">
            {[...(datos?.vencidos || []), ...(datos?.activos || [])].slice(0, 4).map((prestamo) => (
              <div key={prestamo.id} className="flex items-center justify-between gap-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prestamo.libro}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{prestamo.usuario} · vence {prestamo.fechaDevolucion}</p>
                </div>
                <Badge type={prestamo.estado} />
              </div>
            ))}
            {datos && !datos.activos.length && !datos.vencidos.length && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Todavía no hay préstamos registrados.</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-sm shadow-sm p-5">
          <h3 className="font-display font-semibold text-base mb-4">Por categoría</h3>
          <div className="space-y-3">
            {categorias.map((fila) => (
              <div key={fila.nombre}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--muted-foreground)' }}>{fila.nombre}</span>
                  <span className="font-mono">{fila.total}</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-fill" style={{ width: `${(Number(fila.total) / maximo) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Disponibilidad</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="stat-bar" style={{ height: '8px' }}>
                  <div className="stat-bar-fill" style={{ width: `${libros.length ? (disponibles / libros.length) * 100 : 0}%`, background: '#2A7A4A' }} />
                </div>
              </div>
              <span className="text-sm font-mono font-bold">{libros.length ? Math.round((disponibles / libros.length) * 100) : 0}%</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Títulos con ejemplares disponibles</p>
          </div>
        </div>
      </div>

      {(datos?.vencidos.length || 0) > 0 && (
        <div className="mt-5 p-4 rounded-sm border flex items-start gap-3" style={{ background: '#FFF3CD', borderColor: '#C4A82A', color: '#5A4200' }}>
          <IconoAlerta className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Atención requerida</p>
            <p className="text-xs mt-0.5">
              {datos.vencidos.length === 1
                ? 'Hay 1 préstamo vencido.'
                : `Hay ${datos.vencidos.length} préstamos vencidos.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function agrupar(libros) {
  const mapa = new Map();
  for (const libro of libros) {
    mapa.set(libro.categoria, (mapa.get(libro.categoria) || 0) + 1);
  }
  return [...mapa.entries()].map(([nombre, total]) => ({ nombre, total }));
}
