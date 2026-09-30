import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SectionHeader } from '../components/ui';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default function Reportes() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/reportes')
      .then(setDatos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  const meses = datos?.porMes || [];
  const maximo = Math.max(1, ...meses.map((fila) => Number(fila.total)));
  const prestados = datos?.masPrestados || [];
  const tope = Math.max(1, ...prestados.map((fila) => Number(fila.total)));
  const inventario = datos?.inventario || {};
  const tasa = Number(inventario.devueltos) ? Math.round((Number(inventario.aTiempo) / Number(inventario.devueltos)) * 100) : 0;

  return (
    <div>
      <SectionHeader title="Reportes y estadísticas" subtitle="Análisis del rendimiento de la biblioteca" />
      {error && <p className="aviso-error mb-4">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Préstamos por mes</h3>
          <div className="flex items-end gap-2 sm:gap-3 h-40">
            {meses.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Aún no hay préstamos en los últimos seis meses.</p>}
            {meses.map((fila, indice) => (
              <div key={fila.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{fila.total}</span>
                <div className="w-full rounded-sm" style={{ height: `${(Number(fila.total) / maximo) * 120}px`, background: indice === meses.length - 1 ? 'var(--accent)' : 'var(--muted)' }} />
                <span className="text-[10px] sm:text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{MESES[Number(String(fila.mes).slice(5)) - 1]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Libros más prestados</h3>
          <div className="space-y-3">
            {prestados.map((libro, indice) => (
              <div key={libro.titulo} className="flex items-center gap-3">
                <span className="font-mono text-xs w-5 text-right" style={{ color: 'var(--muted-foreground)' }}>{indice + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="truncate">{libro.titulo}</span>
                    <span className="font-mono">{libro.total}</span>
                  </div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${(Number(libro.total) / tope) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {prestados.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Todavía no hay préstamos para ordenar.</p>}
          </div>
        </section>

        <section className="bg-[var(--card)] p-5 rounded-sm shadow-sm lg:col-span-2">
          <h3 className="font-display font-semibold text-base mb-5">Resumen general</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Títulos', inventario.titulos ?? '—', 'en el catálogo'],
              ['Ejemplares', inventario.ejemplares ?? '—', `${inventario.disponibles ?? 0} disponibles`],
              ['Préstamos activos', inventario.activos ?? '—', `${inventario.vencidos ?? 0} vencidos`],
              ['A tiempo', `${tasa}%`, 'de las devoluciones'],
            ].map(([etiqueta, valor, detalle]) => (
              <div key={etiqueta} className="p-3 rounded-sm" style={{ background: 'var(--background)' }}>
                <p className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>{etiqueta}</p>
                <p className="font-display font-bold text-xl">{valor}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{detalle}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
