import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Marca } from '../components/Marca';
import { useAuth } from '../context/AuthContext';

const ACCESOS = [
  { etiqueta: 'Admin', email: 'lucia@colegio.edu' },
  { etiqueta: 'Bibliote.', email: 'carlos@colegio.edu' },
  { etiqueta: 'Estudiante', email: 'sofia@colegio.edu' },
];

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (usuario) {
    return <Navigate to="/panel" replace />;
  }

  async function entrar(evento, acceso) {
    evento?.preventDefault();
    setCargando(true);
    setError('');
    try {
      await iniciarSesion({
        email: acceso?.email || email,
        contrasena: acceso ? 'biblioteca123' : contrasena,
      });
      navigate('/panel');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <div className="hidden lg:flex flex-col justify-between p-12 w-[45%] relative overflow-hidden" style={{ background: 'var(--primary)' }}>
        <div className="relative z-10">
          <div className="mb-16">
            <Marca clara />
          </div>
          <blockquote className="border-l-2 pl-5" style={{ borderColor: 'var(--accent)' }}>
            <p className="font-display text-2xl italic leading-relaxed" style={{ color: 'var(--primary-foreground)' }}>
              “Una habitación sin libros es como un cuerpo sin alma.”
            </p>
            <footer className="mt-4 text-sm font-mono" style={{ color: 'rgba(245,237,214,0.55)' }}>— Marco Tulio Cicerón</footer>
          </blockquote>
        </div>
        <div className="relative z-10">
          <div className="ornament" style={{ color: 'rgba(245,237,214,0.3)' }}>
            <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>✦</span>
          </div>
          <p className="mt-4 text-xs font-mono leading-loose" style={{ color: 'rgba(245,237,214,0.45)' }}>
            SISTEMA DE BIBLIOTECA VIRTUAL
            <br />
            Institución Educativa Santa María
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Marca />
          </div>
          <h1 className="font-display text-3xl font-bold mb-1">Bienvenido</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>Ingresa tus credenciales para continuar</p>

          <form onSubmit={(evento) => entrar(evento)} className="space-y-5">
            {error && <p className="aviso-error">{error}</p>}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Correo electrónico</label>
              <input type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} required className="w-full px-4 py-2.5 text-sm" placeholder="usuario@colegio.edu" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Contraseña</label>
              <input type="password" value={contrasena} onChange={(evento) => setContrasena(evento.target.value)} required className="w-full px-4 py-2.5 text-sm" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={cargando} className="btn-primario w-full py-3 text-sm tracking-wider uppercase transition-base">
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8">
            <div className="ornament text-xs">
              <span>Acceso rápido (demo)</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ACCESOS.map((acceso) => (
                <button
                  key={acceso.email}
                  type="button"
                  disabled={cargando}
                  onClick={(evento) => entrar(evento, acceso)}
                  className="py-1.5 text-xs rounded-sm transition-base hover:opacity-80"
                  style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                >
                  {acceso.etiqueta}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
