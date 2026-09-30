const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { obtenerPool } = require('../db');
const { requerirAuth } = require('../middleware/auth');

const router = express.Router();

const ROLES = {
  administrador: 'admin',
  bibliotecario: 'librarian',
  estudiante: 'student',
  docente: 'student',
};

function perfil(fila) {
  return {
    id: fila.id_usuario,
    nombre: fila.nombre,
    apellido: fila.apellido,
    email: fila.email,
    tipo: fila.tipo,
    rol: ROLES[fila.tipo] || 'student',
  };
}

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const contrasena = String(req.body?.contrasena || '');
  const pool = obtenerPool();
  const [filas] = await pool.query(
    'SELECT id_usuario, nombre, apellido, email, tipo, contrasena_hash, activo FROM Usuario WHERE email = ?',
    [email],
  );
  const encontrado = filas[0];

  if (!encontrado || !encontrado.activo || !(await bcrypt.compare(contrasena, encontrado.contrasena_hash))) {
    res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    return;
  }

  const token = jwt.sign(
    {
      id: encontrado.id_usuario,
      email: encontrado.email,
      tipo: encontrado.tipo,
      nombre: encontrado.nombre,
      apellido: encontrado.apellido,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  res.json({ token, usuario: perfil(encontrado) });
});

router.get('/me', requerirAuth, async (req, res) => {
  const pool = obtenerPool();
  const [filas] = await pool.query(
    'SELECT id_usuario, nombre, apellido, email, tipo, activo FROM Usuario WHERE id_usuario = ?',
    [req.usuario.id],
  );
  if (!filas.length || !filas[0].activo) {
    res.status(401).json({ error: 'No has iniciado sesión.' });
    return;
  }
  res.json({ usuario: perfil(filas[0]) });
});

module.exports = router;
