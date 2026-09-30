import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { IconoAlerta, IconoCerrar } from '../components/Iconos';
import { SectionHeader } from '../components/ui';

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [leidas, setLeidas] = useState(() => new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/alertas')
      .then((datos) => setAlertas(datos.alertas))
      .catch((fallo) => setError(fallo.message));
  }, []);

  const pendientes = alertas.filter((alerta) => !leidas.has(alerta.id)).length;

  return (
    <div>
      <SectionHeader
        title="Notificaciones"
        subtitle={`${pendientes} sin leer`}
        action={(
          <button type="button" onClick={() => setLeidas(new Set(alertas.map((alerta) => alerta.id)))} className="text-sm px-4 py-2 rounded-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
            Marcar todas como leídas
          </button>
        )}
      />
      {error && <p className="aviso-error mb-4">{error}</p>}
      <div className="space-y-3">
        {alertas.map((alerta) => {
          const leida = leidas.has(alerta.id);
          return (
            <article
              key={alerta.id}
              className="p-4 rounded-sm border flex items-start gap-3"
              style={{ background: leida ? 'var(--card)' : '#F8D7DA', borderColor: leida ? 'var(--border)' : '#E4A0A8', opacity: leida ? 0.7 : 1 }}
            >
              <IconoAlerta className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{alerta.mensaje}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--muted-foreground)' }}>{alerta.fecha}</p>
              </div>
              {!leida && (
                <button type="button" aria-label="Marcar como leída" onClick={() => setLeidas((actual) => new Set(actual).add(alerta.id))} style={{ color: 'var(--muted-foreground)' }}>
                  <IconoCerrar className="w-4 h-4" />
                </button>
              )}
            </article>
          );
        })}
        {alertas.length === 0 && !error && (
          <p className="text-center py-16 font-display text-lg" style={{ color: 'var(--muted-foreground)' }}>No hay alertas de préstamos vencidos.</p>
        )}
      </div>
    </div>
  );
}
