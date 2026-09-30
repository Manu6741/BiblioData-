# BiblioData+

Biblioteca virtual de la Institución Educativa Santa María. El personal administra el catálogo, los ejemplares y los préstamos; estudiantes y docentes consultan disponibilidad y su propio historial de circulación. El frontend y el backend se despliegan por separado en Vercel.

## Estructura

- `frontend-bibliodata`: PWA con React, Vite y Tailwind.
- `backend-bibliodata`: API con Express y MySQL en Clever Cloud.
- `docs`: esquema y consultas SQL del modelo de la biblioteca.

## Desarrollo local

En una terminal, el backend:

```bash
cd backend-bibliodata
cp .env.example .env
npm install
npm run dev
```

Completa `.env` con los datos de Clever Cloud, un `JWT_SECRET` y `CORS_ORIGIN=http://localhost:5173`. El archivo `.env` no se sube a git.

En otra terminal, el frontend:

```bash
cd frontend-bibliodata
cp .env.example .env
npm install
npm run dev
```

La app queda en `http://localhost:5173` y la API en `http://localhost:4000`.

Si la tabla de usuarios está vacía, el primer arranque crea tres cuentas de demostración con la contraseña `biblioteca123`:

- `lucia@colegio.edu` — administrador
- `carlos@colegio.edu` — bibliotecario
- `sofia@colegio.edu` — estudiante

## Despliegue en Vercel

Crea dos proyectos a partir de este repositorio.

**Frontend**

- Root Directory: `frontend-bibliodata`
- Framework: Vite
- Variable de entorno, antes del build: `VITE_API_URL` con la URL pública del backend, sin barra final.

**Backend**

- Root Directory: `backend-bibliodata`
- Vercel detecta Express desde `src/app.js`.
- Variables: `MYSQL_ADDON_HOST`, `MYSQL_ADDON_DB`, `MYSQL_ADDON_USER`, `MYSQL_ADDON_PORT`, `MYSQL_ADDON_PASSWORD`, `JWT_SECRET` y `CORS_ORIGIN` con la URL del frontend. Si hay más de un origen, sepáralos con coma.

Vite incorpora `VITE_API_URL` en el momento del build. Si cambias la URL del backend, vuelve a desplegar el frontend.
