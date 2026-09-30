const API = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://biblio-data.vercel.app' : 'http://localhost:4000')
).replace(/\/$/, '');

export async function api(ruta, opciones = {}) {
  const { method = 'GET', body, token } = opciones;
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const sesion = token === undefined ? localStorage.getItem('bibliodata_token') : token;
  if (sesion) {
    headers.Authorization = `Bearer ${sesion}`;
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No hay conexión con el servidor.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(datos.error || 'No se pudo completar la solicitud.');
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}
