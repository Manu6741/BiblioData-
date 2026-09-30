require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { asegurarEsquema } = require('./db');

const app = express();
const origenes = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

function origenPermitido(origen) {
  if (!origen || origenes.includes(origen)) {
    return true;
  }

  const alterno = origen.includes('://127.0.0.1')
    ? origen.replace('://127.0.0.1', '://localhost')
    : origen.replace('://localhost', '://127.0.0.1');

  return origenes.includes(alterno);
}

app.use(cors({
  origin(origen, callback) {
    callback(null, origenPermitido(origen));
  },
}));

app.use(express.json({ limit: '2mb' }));

app.use(async (req, res, next) => {
  try {
    await asegurarEsquema();
    next();
  } catch (error) {
    console.error('No se pudo preparar la base de datos.', error);
    res.status(503).json({ error: 'No se pudo conectar con la base de datos.' });
  }
});

app.get('/api/salud', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/gestion'));

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
