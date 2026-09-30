import { IconoCerrar } from './Iconos';

const CLASES = {
  available: 'badge-available',
  loaned: 'badge-loaned',
  overdue: 'badge-overdue',
  active: 'badge-loaned',
  returned: 'badge-available',
  admin: 'badge-admin',
  librarian: 'badge-librarian',
  student: 'badge-student',
  administrador: 'badge-admin',
  bibliotecario: 'badge-librarian',
  estudiante: 'badge-student',
  docente: 'badge-student',
};

const ETIQUETAS = {
  available: 'Disponible',
  loaned: 'Prestado',
  overdue: 'Vencido',
  active: 'Activo',
  returned: 'Devuelto',
  admin: 'Admin',
  librarian: 'Bibliotecario',
  student: 'Estudiante',
  administrador: 'Admin',
  bibliotecario: 'Bibliotecario',
  estudiante: 'Estudiante',
  docente: 'Docente',
};

export function iniciales(nombre = '', apellido = '') {
  return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase();
}

export function esPersonal(usuario) {
  return usuario?.tipo === 'administrador' || usuario?.tipo === 'bibliotecario';
}

export function Badge({ type }) {
  return <span className={`badge ${CLASES[type] || ''}`}>{ETIQUETAS[type] || type}</span>;
}

export function StatCard({ label, value, icon, sub }) {
  return (
    <div className="book-card bg-[var(--card)] p-4 sm:p-5 rounded-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-[var(--foreground)]">{value}</p>
          {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-sm shrink-0" style={{ background: 'rgba(184,122,46,0.12)', color: 'var(--accent)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-[var(--foreground)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-lg bg-[var(--card)] rounded-sm shadow-2xl" onClick={(evento) => evento.stopPropagation()}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b sticky top-0 bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--muted-foreground)' }}>
            <IconoCerrar className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      {children}
    </label>
  );
}
