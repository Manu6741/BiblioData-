import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Badge, SectionHeader } from '../components/ui';

export default function Historial() {
  const [prestamos, setPrestamos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/prestamos/historial')
      .then((datos) => setPrestamos(datos.prestamos))
      .catch((fallo) => setError(fallo.message));
  }, []);

  return (
    <div>
      <SectionHeader title="Historial de préstamos" subtitle="Registro completo de todas las operaciones" />
      {error && <p className="aviso-error mb-4">{error}</p>}

      <div className="hidden md:block bg-[var(--card)] rounded-sm shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
              {['#', 'Libro', 'Usuario', 'Préstamo', 'Devolución', 'Estado'].map((encabezado) => (
                <th key={encabezado} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{encabezado}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prestamos.map((prestamo, indice) => (
              <tr key={prestamo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{String(indice + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 font-medium">{prestamo.libro}</td>
                <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>{prestamo.usuario}</td>
                <td className="px-4 py-3 font-mono text-xs">{prestamo.fechaPrestamo}</td>
                <td className="px-4 py-3 font-mono text-xs">{prestamo.fechaReal || '—'}</td>
                <td className="px-4 py-3"><Badge type={prestamo.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {prestamos.map((prestamo) => (
          <article key={prestamo.id} className="bg-[var(--card)] p-4 rounded-sm shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-sm">{prestamo.libro}</h3>
              <Badge type={prestamo.estado} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{prestamo.usuario}</p>
            <p className="text-xs font-mono mt-1">{prestamo.fechaPrestamo} → {prestamo.fechaReal || 'pendiente'}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
