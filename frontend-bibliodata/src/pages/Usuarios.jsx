import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { IconoMas } from '../components/Iconos';
import { Badge, Campo, Modal, SectionHeader, iniciales } from '../components/ui';

const VACIO = { nombre: '', apellido: '', email: '', contrasena: '', tipo: 'estudiante' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(false);
  const [nuevo, setNuevo] = useState(VACIO);
  const [error, setError] = useState('');

  async function cargar() {
    const datos = await api('/api/usuarios');
    setUsuarios(datos.usuarios);
  }

  useEffect(() => {
    cargar().catch((fallo) => setError(fallo.message));
  }, []);

  async function crear(evento) {
    evento.preventDefault();
    setError('');
    try {
      await api('/api/usuarios', { method: 'POST', body: nuevo });
      setFormulario(false);
      setNuevo(VACIO);
      await cargar();
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  async function alternar(usuario) {
    setError('');
    try {
      await api(`/api/usuarios/${usuario.id}`, { method: 'PATCH', body: { activo: !usuario.activo } });
      await cargar();
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Gestión de usuarios"
        subtitle={`${usuarios.length} usuarios registrados`}
        action={(
          <button type="button" onClick={() => setFormulario(true)} className="btn-primario flex items-center gap-2 px-4 py-2 text-sm">
            <IconoMas className="w-4 h-4" />
            Nuevo usuario
          </button>
        )}
      />
      {error && <p className="aviso-error mb-4">{error}</p>}

      <div className="hidden md:block bg-[var(--card)] rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              {['Usuario', 'Correo', 'Rol', 'Estado', 'Préstamos', ''].map((encabezado) => (
                <th key={encabezado} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{encabezado}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent)', color: '#261509' }}>{iniciales(usuario.nombre, usuario.apellido)}</span>
                    <span className="font-medium">{usuario.nombre} {usuario.apellido}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{usuario.email}</td>
                <td className="px-4 py-3"><Badge type={usuario.tipo} /></td>
                <td className="px-4 py-3"><span className={`badge ${usuario.activo ? 'badge-available' : 'badge-overdue'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td className="px-4 py-3 font-mono">{usuario.prestamos}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => alternar(usuario)} className="text-xs px-3 py-1 rounded-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {usuarios.map((usuario) => (
          <article key={usuario.id} className="bg-[var(--card)] p-4 rounded-sm shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
              <Badge type={usuario.tipo} />
            </div>
            <p className="text-xs font-mono mt-1 break-all" style={{ color: 'var(--muted-foreground)' }}>{usuario.email}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`badge ${usuario.activo ? 'badge-available' : 'badge-overdue'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
              <button type="button" onClick={() => alternar(usuario)} className="text-xs px-3 py-1 rounded-sm" style={{ border: '1px solid var(--border)' }}>
                {usuario.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {formulario && (
        <Modal title="Nuevo usuario" onClose={() => setFormulario(false)}>
          <form className="space-y-4" onSubmit={crear}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Nombre"><input required value={nuevo.nombre} onChange={(evento) => setNuevo({ ...nuevo, nombre: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
              <Campo label="Apellido"><input required value={nuevo.apellido} onChange={(evento) => setNuevo({ ...nuevo, apellido: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            </div>
            <Campo label="Correo electrónico"><input required type="email" value={nuevo.email} onChange={(evento) => setNuevo({ ...nuevo, email: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            <Campo label="Contraseña temporal"><input required type="password" minLength={6} value={nuevo.contrasena} onChange={(evento) => setNuevo({ ...nuevo, contrasena: evento.target.value })} className="w-full px-3 py-2 text-sm" /></Campo>
            <Campo label="Rol">
              <select value={nuevo.tipo} onChange={(evento) => setNuevo({ ...nuevo, tipo: evento.target.value })} className="w-full px-3 py-2 text-sm">
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="bibliotecario">Bibliotecario</option>
                <option value="administrador">Administrador</option>
              </select>
            </Campo>
            <button type="submit" className="btn-primario w-full py-3 text-sm">Crear usuario</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
