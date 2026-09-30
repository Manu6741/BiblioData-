import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { IconoCheck, IconoEscudo } from '../components/Iconos';
import { Badge, Campo, Modal, SectionHeader, esPersonal } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const hoy = () => new Date().toISOString().slice(0, 10);

export default function Prestamos() {
  const { usuario } = useAuth();
  const personal = esPersonal(usuario);
  const [tab, setTab] = useState('active');
  const [activos, setActivos] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [formulario, setFormulario] = useState({ idUsuario: '', idLibro: '', fechaPrestamo: hoy(), fechaDevolucion: '' });
  const [devolucion, setDevolucion] = useState(null);
  const [fechaReal, setFechaReal] = useState(hoy());
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  async function cargar() {
    const peticiones = [api('/api/prestamos/activos'), api('/api/prestamos/vencidos')];
    if (personal) peticiones.push(api('/api/usuarios'), api('/api/libros'));
    const [listaActivos, listaVencidos, listaUsuarios, listaLibros] = await Promise.all(peticiones);
    setActivos(listaActivos.prestamos);
    setVencidos(listaVencidos.prestamos);
    setUsuarios(listaUsuarios?.usuarios || []);
    setLibros((listaLibros?.libros || []).filter((libro) => libro.disponibles > 0));
  }

  useEffect(() => {
    cargar().catch((fallo) => setError(fallo.message));
  }, [usuario]);

  async function registrar(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
    try {
      await api('/api/prestamos', { method: 'POST', body: formulario });
      setAviso('Préstamo registrado.');
      setFormulario({ idUsuario: '', idLibro: '', fechaPrestamo: hoy(), fechaDevolucion: '' });
      await cargar();
      setTab('active');
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  async function devolver(evento) {
    evento.preventDefault();
    setError('');
    try {
      await api(`/api/prestamos/${devolucion.id}/devolucion`, { method: 'POST', body: { fecha: fechaReal } });
      setDevolucion(null);
      await cargar();
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  const pestanas = [
    { id: 'active', label: 'Activos', count: activos.length },
    { id: 'overdue', label: 'Vencidos', count: vencidos.length },
    ...(personal ? [{ id: 'register', label: 'Registrar', count: null }] : []),
  ];
  const lista = tab === 'overdue' ? vencidos : activos;

  return (
    <div>
      <SectionHeader title="Gestión de préstamos" subtitle="Control de circulación del material bibliográfico" />
      {error && <p className="aviso-error mb-4">{error}</p>}
      {aviso && <p className="mb-4 p-3 rounded-sm text-sm" style={{ background: '#D4EDDA', color: '#1A5C2A' }}>{aviso}</p>}

      <div className="flex flex-wrap gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {pestanas.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-base border-b-2 -mb-px ${tab === item.id ? 'border-[var(--accent)]' : 'border-transparent'}`}
            style={{ color: tab === item.id ? 'var(--accent)' : 'var(--muted-foreground)' }}
          >
            {item.label}
            {item.count > 0 && (
              <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ background: item.id === 'overdue' ? '#F8D7DA' : 'var(--muted)', color: item.id === 'overdue' ? '#7A1A1A' : 'var(--muted-foreground)' }}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'register' ? (
        <form onSubmit={registrar} className="max-w-md bg-[var(--card)] rounded-sm shadow-sm p-5 sm:p-6 space-y-4">
          <Campo label="Usuario">
            <select required value={formulario.idUsuario} onChange={(evento) => setFormulario({ ...formulario, idUsuario: evento.target.value })} className="w-full px-3 py-2 text-sm">
              <option value="">Seleccionar usuario...</option>
              {usuarios.filter((item) => item.activo).map((item) => (
                <option key={item.id} value={item.id}>{item.nombre} {item.apellido} — {item.email}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Libro">
            <select required value={formulario.idLibro} onChange={(evento) => setFormulario({ ...formulario, idLibro: evento.target.value })} className="w-full px-3 py-2 text-sm">
              <option value="">Seleccionar libro...</option>
              {libros.map((libro) => <option key={libro.id} value={libro.id}>{libro.titulo} — {libro.disponibles} disp.</option>)}
            </select>
          </Campo>
          <Campo label="Fecha de préstamo">
            <input required type="date" value={formulario.fechaPrestamo} onChange={(evento) => setFormulario({ ...formulario, fechaPrestamo: evento.target.value })} className="w-full px-3 py-2 text-sm" />
          </Campo>
          <Campo label="Fecha de devolución">
            <input required type="date" value={formulario.fechaDevolucion} onChange={(evento) => setFormulario({ ...formulario, fechaDevolucion: evento.target.value })} className="w-full px-3 py-2 text-sm" />
          </Campo>
          <div className="p-3 rounded-sm border flex items-start gap-2.5 text-xs" style={{ background: '#D4EDDA', borderColor: '#A8D5B5', color: '#1A5C2A' }}>
            <IconoEscudo className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Se valida que haya un ejemplar disponible y que el usuario no tenga préstamos vencidos.</span>
          </div>
          <button type="submit" className="btn-primario w-full py-3 text-sm">Registrar préstamo</button>
        </form>
      ) : (
        <div className="space-y-3">
          {lista.map((prestamo) => (
            <article key={prestamo.id} className="bg-[var(--card)] p-4 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-display font-semibold text-sm">{prestamo.libro}</h4>
                  <Badge type={prestamo.estado} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {prestamo.usuario} · {prestamo.codigoBarras} · Prestado: {prestamo.fechaPrestamo} · Vence: {prestamo.fechaDevolucion}
                </p>
              </div>
              {personal && (
                <button type="button" onClick={() => { setDevolucion(prestamo); setFechaReal(hoy()); }} className="btn-primario flex items-center justify-center gap-1.5 px-4 py-2 text-xs">
                  <IconoCheck className="w-3.5 h-3.5" />
                  Registrar devolución
                </button>
              )}
            </article>
          ))}
          {lista.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
              <p className="font-display text-lg">Sin {tab === 'active' ? 'préstamos activos' : 'préstamos vencidos'}</p>
            </div>
          )}
        </div>
      )}

      {devolucion && (
        <Modal title="Registrar devolución" onClose={() => setDevolucion(null)}>
          <form className="space-y-4" onSubmit={devolver}>
            <div className="p-3 rounded-sm" style={{ background: 'var(--background)' }}>
              <p className="font-display font-semibold">{devolucion.libro}</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{devolucion.usuario} · {devolucion.codigoBarras}</p>
            </div>
            <Campo label="Fecha de devolución">
              <input required type="date" value={fechaReal} onChange={(evento) => setFechaReal(evento.target.value)} className="w-full px-3 py-2 text-sm" />
            </Campo>
            <button type="submit" className="btn-primario w-full py-3 text-sm">Confirmar devolución</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
