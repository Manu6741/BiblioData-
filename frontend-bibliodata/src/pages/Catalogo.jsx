import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { IconoBuscar, IconoLibro, IconoMas } from '../components/Iconos';
import { Badge, Campo, Modal, SectionHeader, esPersonal } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const VACIO = { titulo: '', autor: '', isbn: '', categoria: 'Literatura', año: '', copias: '1', editorial: '', idioma: 'Español' };

export default function Catalogo() {
  const { usuario } = useAuth();
  const [libros, setLibros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [seleccionado, setSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState(false);
  const [nuevo, setNuevo] = useState(VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const solicitud = useRef(0);

  async function cargar(consulta = busqueda, categoriaActual = categoria) {
    const id = solicitud.current + 1;
    solicitud.current = id;
    const params = new URLSearchParams();
    if (consulta.trim()) params.set('q', consulta.trim());
    if (categoriaActual !== 'all') params.set('categoria', categoriaActual);
    const [lista, cats] = await Promise.all([
      api(`/api/libros?${params.toString()}`),
      api('/api/categorias'),
    ]);
    if (id !== solicitud.current) return;
    setLibros(lista.libros);
    setCategorias(cats.categorias);
  }

  useEffect(() => {
    cargar(busqueda, categoria).catch((fallo) => setError(fallo.message));
  }, [categoria]);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await api('/api/libros', {
        method: 'POST',
        body: { ...nuevo, año: Number(nuevo.año), copias: Number(nuevo.copias) },
      });
      setFormulario(false);
      setNuevo(VACIO);
      await cargar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  const copias = libros.reduce((suma, libro) => suma + libro.copias, 0);

  return (
    <div>
      <SectionHeader
        title="Catálogo de libros"
        subtitle={`${libros.length} ${libros.length === 1 ? 'título' : 'títulos'} · ${copias} ${copias === 1 ? 'copia' : 'copias'}`}
        action={esPersonal(usuario) && (
          <button type="button" onClick={() => setFormulario(true)} className="btn-primario flex items-center gap-2 px-4 py-2 text-sm transition-base">
            <IconoMas className="w-4 h-4" />
            <span>Agregar libro</span>
          </button>
        )}
      />
      {error && <p className="aviso-error mb-4">{error}</p>}

      <form className="flex flex-col sm:flex-row gap-3 mb-6" onSubmit={(evento) => {
        evento.preventDefault();
        const consulta = String(new FormData(evento.currentTarget).get('q') || '');
        setBusqueda(consulta);
        cargar(consulta, categoria).catch((fallo) => setError(fallo.message));
      }}>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}><IconoBuscar className="w-4 h-4" /></span>
          <input
            name="q"
            defaultValue={busqueda}
            onInput={(evento) => {
              const consulta = evento.currentTarget.value;
              setBusqueda(consulta);
              cargar(consulta, categoria).catch((fallo) => setError(fallo.message));
            }}
            placeholder="Buscar por título, autor o ISBN..."
            className="w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} className="px-3 py-2 text-sm sm:w-48">
          <option value="all">Todas las categorías</option>
          {categorias.map((item) => <option key={item.id_categoria} value={item.nombre}>{item.nombre}</option>)}
        </select>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {libros.map((libro) => (
          <button type="button" key={libro.id} className="book-card bg-[var(--card)] p-4 rounded-sm text-left" onClick={() => setSeleccionado(libro)}>
            <div className="flex gap-4">
              <div className="w-12 h-16 rounded-sm flex items-center justify-center shrink-0" style={{ background: 'var(--muted)', color: 'var(--accent)' }}>
                <IconoLibro className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display font-semibold text-sm leading-tight truncate">{libro.titulo}</h4>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{libro.autor} · {libro.año || 's. f.'}</p>
                  </div>
                  <Badge type={libro.estado} />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  <span>{libro.categoria}</span>
                  <span>{libro.disponibles}/{libro.copias} disp.</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {libros.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
          <p className="font-display text-lg">Sin resultados</p>
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </div>
      )}

      {seleccionado && (
        <Modal title="Datos del libro" onClose={() => setSeleccionado(null)}>
          <h4 className="font-display font-bold text-xl leading-tight">{seleccionado.titulo}</h4>
          <p className="text-sm mt-1 mb-3" style={{ color: 'var(--muted-foreground)' }}>{seleccionado.autor}</p>
          <Badge type={seleccionado.estado} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-5">
            {[
              ['ISBN', seleccionado.isbn],
              ['Categoría', seleccionado.categoria],
              ['Año de publicación', seleccionado.año || '—'],
              ['Idioma', seleccionado.idioma || '—'],
              ['Copias totales', seleccionado.copias],
              ['Disponibles', seleccionado.disponibles],
            ].map(([clave, valor]) => (
              <div key={clave} className="p-3 rounded-sm" style={{ background: 'var(--background)' }}>
                <p className="text-xs font-mono uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{clave}</p>
                <p className="font-medium break-all">{valor}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {formulario && (
        <Modal title="Agregar libro" onClose={() => setFormulario(false)}>
          <form className="space-y-4" onSubmit={guardar}>
            <Campo label="Título"><input required value={nuevo.titulo} onChange={(evento) => setNuevo({ ...nuevo, titulo: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            <Campo label="Autor"><input required value={nuevo.autor} onChange={(evento) => setNuevo({ ...nuevo, autor: evento.target.value })} className="w-full px-3 py-2 text-sm" placeholder="Nombre y apellido" /></Campo>
            <Campo label="ISBN"><input required value={nuevo.isbn} onChange={(evento) => setNuevo({ ...nuevo, isbn: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            <Campo label="Categoría">
              <input required list="categorias" value={nuevo.categoria} onChange={(evento) => setNuevo({ ...nuevo, categoria: evento.target.value })} className="w-full px-3 py-2 text-sm" />
              <datalist id="categorias">{categorias.map((item) => <option key={item.id_categoria} value={item.nombre} />)}</datalist>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Año"><input required type="number" value={nuevo.año} onChange={(evento) => setNuevo({ ...nuevo, año: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
              <Campo label="Copias"><input required type="number" min="1" value={nuevo.copias} onChange={(evento) => setNuevo({ ...nuevo, copias: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            </div>
            <Campo label="Editorial"><input value={nuevo.editorial} onChange={(evento) => setNuevo({ ...nuevo, editorial: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            <button type="submit" disabled={guardando} className="btn-primario w-full py-2.5 text-sm">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
