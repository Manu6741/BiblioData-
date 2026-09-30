import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'bibliodata_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return undefined;
    }

    let activo = true;
    setCargando(true);

    api('/api/auth/me')
      .then((datos) => {
        if (activo) {
          setUsuario(datos.usuario);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (activo) {
          setToken(null);
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const valor = useMemo(() => ({
    usuario,
    token,
    cargando,
    async iniciarSesion(datos) {
      const respuesta = await api('/api/auth/login', { method: 'POST', body: datos, token: null });
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
      return respuesta;
    },
    cerrarSesion() {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUsuario(null);
    },
  }), [usuario, token, cargando]);

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return contexto;
}
