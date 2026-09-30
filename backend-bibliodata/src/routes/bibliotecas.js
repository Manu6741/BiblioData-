const express = require('express');
const { requerirAuth } = require('../middleware/auth');
const { validarBiblioteca, normalizarBiblioteca } = require('../validar');
const {
  listarBibliotecas,
  obtenerBiblioteca,
  crearBiblioteca,
  actualizarBiblioteca,
  buscarLibros,
} = require('../bibliotecasRepositorio');

const router = express.Router();

router.use(requerirAuth);

router.get('/', async (req, res) => {
  const bibliotecas = await listarBibliotecas(req.usuario.id);
  res.json({ bibliotecas });
});

router.get('/buscar', async (req, res) => {
  const resultados = await buscarLibros(req.usuario.id, {
    nombre: String(req.query.nombre || '').trim(),
    autor: String(req.query.autor || '').trim(),
    categoria: String(req.query.categoria || '').trim(),
  });
  res.json({ resultados });
});

router.get('/:id', async (req, res) => {
  const biblioteca = await obtenerBiblioteca(req.params.id, req.usuario.id);

  if (!biblioteca) {
    res.status(404).json({ error: 'La biblioteca no existe o no tienes acceso a ella.' });
    return;
  }

  res.json({ biblioteca });
});

router.post('/', async (req, res) => {
  const error = validarBiblioteca(req.body);

  if (error) {
    res.status(400).json({ error });
    return;
  }

  const biblioteca = await crearBiblioteca(req.usuario.id, normalizarBiblioteca(req.body));
  res.status(201).json({ biblioteca });
});

router.put('/:id', async (req, res) => {
  const error = validarBiblioteca(req.body);

  if (error) {
    res.status(400).json({ error });
    return;
  }

  const biblioteca = await actualizarBiblioteca(
    req.params.id,
    req.usuario.id,
    normalizarBiblioteca(req.body),
  );

  if (!biblioteca) {
    res.status(404).json({ error: 'La biblioteca no existe o no tienes acceso a ella.' });
    return;
  }

  res.json({ biblioteca });
});

module.exports = router;
