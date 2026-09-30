const express = require('express');
const { obtenerPool } = require('../db');
const { requerirAuth, requerirRol } = require('../middleware/auth');
const { CONSULTA_LIBROS, CONSULTA_PRESTAMOS_ACTIVOS } = require('../esquema');

const router = express.Router();

router.use(requerirAuth);

function fecha(valor) {
  if (!valor) return null;
  return String(valor).slice(0, 10);
}

async function marcarVencidos(pool) {
  await pool.query(
    `UPDATE Prestamo
     SET estado = 'atrasado'
     WHERE estado = 'activo' AND fecha_devolucion_esperada < CURDATE()`,
  );
}

function dividirAutor(texto) {
  const partes = String(texto || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombre: 'Sin', apellido: 'autor' };
  if (partes.length === 1) return { nombre: partes[0], apellido: partes[0] };
  return { nombre: partes.slice(0, -1).join(' '), apellido: partes.at(-1) };
}

async function asegurarAutor(pool, nombreCompleto) {
  const { nombre, apellido } = dividirAutor(nombreCompleto);
  const [existentes] = await pool.query(
    'SELECT id_autor FROM Autor WHERE nombre = ? AND apellido = ? LIMIT 1',
    [nombre, apellido],
  );
  if (existentes.length) return existentes[0].id_autor;
  const [resultado] = await pool.query(
    'INSERT INTO Autor (nombre, apellido) VALUES (?, ?)',
    [nombre, apellido],
  );
  return resultado.insertId;
}

async function asegurarCategoria(pool, nombre) {
  const limpio = String(nombre || '').trim();
  const [existentes] = await pool.query(
    'SELECT id_categoria FROM Categoria WHERE nombre = ? LIMIT 1',
    [limpio],
  );
  if (existentes.length) return existentes[0].id_categoria;
  const [resultado] = await pool.query(
    'INSERT INTO Categoria (nombre) VALUES (?)',
    [limpio],
  );
  return resultado.insertId;
}

router.get('/libros', async (req, res) => {
  const pool = obtenerPool();
  const titulo = String(req.query.titulo || req.query.q || '').trim();
  const autor = String(req.query.autor || '').trim();
  const categoria = String(req.query.categoria || '').trim();
  const codigo = String(req.query.codigo || '').trim();
  const condiciones = [];
  const parametros = [];

  if (titulo && !autor && !codigo) {
    condiciones.push("(l.titulo LIKE ? OR CONCAT(a.nombre, ' ', a.apellido) LIKE ? OR l.isbn LIKE ?)");
    parametros.push(`%${titulo}%`, `%${titulo}%`, `%${titulo}%`);
  } else if (titulo) {
    condiciones.push('l.titulo LIKE ?');
    parametros.push(`%${titulo}%`);
  }
  if (autor) {
    condiciones.push("CONCAT(a.nombre, ' ', a.apellido) LIKE ?");
    parametros.push(`%${autor}%`);
  }
  if (categoria && categoria !== 'all') {
    condiciones.push('c.nombre = ?');
    parametros.push(categoria);
  }
  if (codigo) {
    condiciones.push('l.isbn LIKE ?');
    parametros.push(`%${codigo}%`);
  }

  const consulta = condiciones.length
    ? `${CONSULTA_LIBROS} WHERE ${condiciones.join(' AND ')} ORDER BY l.titulo`
    : `${CONSULTA_LIBROS} ORDER BY l.titulo`;

  const [filas] = await pool.query(consulta, parametros);
  const [copias] = await pool.query(
    'SELECT id_libro, estado, COUNT(*) AS total FROM Ejemplar GROUP BY id_libro, estado',
  );
  const porLibro = new Map();
  for (const fila of copias) {
    if (!porLibro.has(fila.id_libro)) porLibro.set(fila.id_libro, { copias: 0, disponibles: 0 });
    const actual = porLibro.get(fila.id_libro);
    actual.copias += Number(fila.total);
    if (fila.estado === 'disponible') actual.disponibles += Number(fila.total);
  }

  res.json({
    libros: filas.map((fila) => {
      const inventario = porLibro.get(fila.id_libro) || { copias: 0, disponibles: 0 };
      return {
        id: fila.id_libro,
        titulo: fila.titulo,
        isbn: fila.isbn,
        autor: fila.autor,
        categoria: fila.categoria,
        año: fila.año_publicacion,
        idioma: fila.idioma,
        copias: inventario.copias,
        disponibles: inventario.disponibles,
        estado: inventario.disponibles > 0 ? 'available' : 'loaned',
      };
    }),
  });
});

router.post('/libros', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const titulo = String(req.body?.titulo || '').trim();
  const autor = String(req.body?.autor || '').trim();
  const isbn = String(req.body?.isbn || '').trim();
  const categoria = String(req.body?.categoria || '').trim();
  const año = Number(req.body?.año);
  const copias = Number(req.body?.copias);
  const idioma = String(req.body?.idioma || 'Español').trim();
  const editorial = String(req.body?.editorial || '').trim();

  if (!titulo || !autor || !isbn || !categoria || !Number.isInteger(copias) || copias < 1) {
    res.status(400).json({ error: 'Completa título, autor, ISBN, categoría y al menos una copia.' });
    return;
  }

  const pool = obtenerPool();
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const idAutor = await asegurarAutor(conexion, autor);
    const idCategoria = await asegurarCategoria(conexion, categoria);
    const [libro] = await conexion.query(
      'INSERT INTO Libro (titulo, isbn, id_autor, id_categoria, `año_publicacion`, idioma, editorial) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo, isbn, idAutor, idCategoria, Number.isInteger(año) ? año : null, idioma, editorial || null],
    );

    for (let i = 1; i <= copias; i += 1) {
      await conexion.query(
        'INSERT INTO Ejemplar (id_libro, codigo_barras, estado) VALUES (?, ?, ?)',
        [libro.insertId, `SM-${libro.insertId}-${String(i).padStart(3, '0')}`, 'disponible'],
      );
    }
    await conexion.commit();
    res.status(201).json({ id: libro.insertId });
  } catch (error) {
    await conexion.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Ese ISBN ya está registrado.' });
      return;
    }
    throw error;
  } finally {
    conexion.release();
  }
});

router.get('/categorias', async (req, res) => {
  const pool = obtenerPool();
  const [filas] = await pool.query('SELECT id_categoria, nombre FROM Categoria ORDER BY nombre');
  res.json({ categorias: filas });
});

router.get('/prestamos/activos', async (req, res) => {
  const pool = obtenerPool();
  await marcarVencidos(pool);
  const propio = req.usuario.tipo === 'estudiante' || req.usuario.tipo === 'docente';
  const consulta = propio
    ? `${CONSULTA_PRESTAMOS_ACTIVOS} AND u.id_usuario = ?`
    : CONSULTA_PRESTAMOS_ACTIVOS;
  const [filas] = await pool.query(consulta, propio ? [req.usuario.id] : []);
  res.json({
    prestamos: filas.map((fila) => ({
      id: fila.id_prestamo,
      usuario: fila.usuario,
      tipoUsuario: fila.tipo_usuario,
      libro: fila.libro_prestado,
      codigoBarras: fila.codigo_barras,
      fechaPrestamo: fecha(fila.fecha_prestamo),
      fechaDevolucion: fecha(fila.fecha_devolucion_esperada),
      estado: 'active',
    })),
  });
});

router.get('/prestamos/vencidos', async (req, res) => {
  const pool = obtenerPool();
  await marcarVencidos(pool);
  const propio = req.usuario.tipo === 'estudiante' || req.usuario.tipo === 'docente';
  const [filas] = await pool.query(
    `SELECT
       p.id_prestamo,
       CONCAT(u.nombre, ' ', u.apellido) AS usuario,
       u.tipo AS tipo_usuario,
       l.titulo AS libro_prestado,
       e.codigo_barras,
       p.fecha_prestamo,
       p.fecha_devolucion_esperada
     FROM Prestamo p
     JOIN Usuario u ON p.id_usuario = u.id_usuario
     JOIN Ejemplar e ON p.id_ejemplar = e.id_ejemplar
     JOIN Libro l ON e.id_libro = l.id_libro
     WHERE p.estado = 'atrasado' ${propio ? 'AND u.id_usuario = ?' : ''}
     ORDER BY p.fecha_devolucion_esperada`,
    propio ? [req.usuario.id] : [],
  );
  res.json({
    prestamos: filas.map((fila) => ({
      id: fila.id_prestamo,
      usuario: fila.usuario,
      tipoUsuario: fila.tipo_usuario,
      libro: fila.libro_prestado,
      codigoBarras: fila.codigo_barras,
      fechaPrestamo: fecha(fila.fecha_prestamo),
      fechaDevolucion: fecha(fila.fecha_devolucion_esperada),
      estado: 'overdue',
    })),
  });
});

router.get('/prestamos/historial', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const pool = obtenerPool();
  await marcarVencidos(pool);
  const [filas] = await pool.query(
    `SELECT
       p.id_prestamo,
       CONCAT(u.nombre, ' ', u.apellido) AS usuario,
       l.titulo AS libro_prestado,
       p.fecha_prestamo,
       p.fecha_devolucion_esperada,
       p.fecha_devolucion_real,
       p.estado
     FROM Prestamo p
     JOIN Usuario u ON p.id_usuario = u.id_usuario
     JOIN Ejemplar e ON p.id_ejemplar = e.id_ejemplar
     JOIN Libro l ON e.id_libro = l.id_libro
     ORDER BY p.fecha_prestamo DESC, p.id_prestamo DESC`,
  );
  const estados = { activo: 'active', atrasado: 'overdue', devuelto: 'returned' };
  res.json({
    prestamos: filas.map((fila) => ({
      id: fila.id_prestamo,
      usuario: fila.usuario,
      libro: fila.libro_prestado,
      fechaPrestamo: fecha(fila.fecha_prestamo),
      fechaDevolucion: fecha(fila.fecha_devolucion_esperada),
      fechaReal: fecha(fila.fecha_devolucion_real),
      estado: estados[fila.estado] || fila.estado,
    })),
  });
});

router.post('/prestamos', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const idUsuario = Number(req.body?.idUsuario);
  const idLibro = Number(req.body?.idLibro);
  const fechaPrestamo = fecha(req.body?.fechaPrestamo) || new Date().toISOString().slice(0, 10);
  const fechaDevolucion = fecha(req.body?.fechaDevolucion);

  if (!idUsuario || !idLibro || !fechaDevolucion) {
    res.status(400).json({ error: 'Selecciona usuario, libro y fecha de devolución.' });
    return;
  }

  const pool = obtenerPool();
  await marcarVencidos(pool);
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [vencidos] = await conexion.query(
      `SELECT id_prestamo FROM Prestamo WHERE id_usuario = ? AND estado = 'atrasado' LIMIT 1`,
      [idUsuario],
    );
    if (vencidos.length) {
      await conexion.rollback();
      res.status(409).json({ error: 'El usuario tiene préstamos vencidos. No se puede prestar otro libro.' });
      return;
    }

    const [ejemplares] = await conexion.query(
      `SELECT id_ejemplar FROM Ejemplar
       WHERE id_libro = ? AND estado = 'disponible'
       LIMIT 1 FOR UPDATE`,
      [idLibro],
    );
    if (!ejemplares.length) {
      await conexion.rollback();
      res.status(409).json({ error: 'No hay ejemplares disponibles de ese libro.' });
      return;
    }

    const idEjemplar = ejemplares[0].id_ejemplar;
    const [activos] = await conexion.query(
      `SELECT id_prestamo FROM Prestamo WHERE id_ejemplar = ? AND estado IN ('activo', 'atrasado') LIMIT 1`,
      [idEjemplar],
    );
    if (activos.length) {
      await conexion.rollback();
      res.status(409).json({ error: 'Ese ejemplar ya tiene un préstamo activo.' });
      return;
    }

    await conexion.query(
      `INSERT INTO Prestamo (id_usuario, id_ejemplar, fecha_prestamo, fecha_devolucion_esperada, estado)
       VALUES (?, ?, ?, ?, 'activo')`,
      [idUsuario, idEjemplar, fechaPrestamo, fechaDevolucion],
    );
    await conexion.query(
      `UPDATE Ejemplar SET estado = 'prestado' WHERE id_ejemplar = ?`,
      [idEjemplar],
    );
    await conexion.commit();
    res.status(201).json({ ok: true });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
});

router.post('/prestamos/:id/devolucion', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const pool = obtenerPool();
  const conexion = await pool.getConnection();
  const fechaReal = fecha(req.body?.fecha) || new Date().toISOString().slice(0, 10);
  try {
    await conexion.beginTransaction();
    const [filas] = await conexion.query(
      `SELECT id_prestamo, id_ejemplar, estado FROM Prestamo WHERE id_prestamo = ? FOR UPDATE`,
      [req.params.id],
    );
    if (!filas.length || filas[0].estado === 'devuelto') {
      await conexion.rollback();
      res.status(404).json({ error: 'No hay un préstamo abierto con ese identificador.' });
      return;
    }
    await conexion.query(
      `UPDATE Prestamo SET estado = 'devuelto', fecha_devolucion_real = ? WHERE id_prestamo = ?`,
      [fechaReal, req.params.id],
    );
    await conexion.query(
      `UPDATE Ejemplar SET estado = 'disponible' WHERE id_ejemplar = ?`,
      [filas[0].id_ejemplar],
    );
    await conexion.commit();
    res.json({ ok: true });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
});

router.get('/usuarios', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const pool = obtenerPool();
  const [filas] = await pool.query(
    `SELECT
       u.id_usuario,
       u.nombre,
       u.apellido,
       u.email,
       u.tipo,
       u.activo,
       (SELECT COUNT(*) FROM Prestamo p WHERE p.id_usuario = u.id_usuario AND p.estado IN ('activo', 'atrasado')) AS prestamos
     FROM Usuario u
     ORDER BY u.apellido, u.nombre`,
  );
  res.json({
    usuarios: filas.map((fila) => ({
      id: fila.id_usuario,
      nombre: fila.nombre,
      apellido: fila.apellido,
      email: fila.email,
      tipo: fila.tipo,
      activo: Boolean(fila.activo),
      prestamos: Number(fila.prestamos),
    })),
  });
});

router.post('/usuarios', requerirRol('administrador'), async (req, res) => {
  const bcrypt = require('bcryptjs');
  const nombre = String(req.body?.nombre || '').trim();
  const apellido = String(req.body?.apellido || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const tipo = String(req.body?.tipo || '').trim();
  const contrasena = String(req.body?.contrasena || '');
  const permitidos = ['administrador', 'bibliotecario', 'estudiante', 'docente'];

  if (!nombre || !apellido || !email || !permitidos.includes(tipo) || contrasena.length < 6) {
    res.status(400).json({ error: 'Revisa nombre, apellido, correo, rol y una contraseña de al menos 6 caracteres.' });
    return;
  }

  const pool = obtenerPool();
  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const [resultado] = await pool.query(
      'INSERT INTO Usuario (nombre, apellido, email, tipo, contrasena_hash) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, tipo, hash],
    );
    res.status(201).json({ id: resultado.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Ese correo ya está registrado.' });
      return;
    }
    throw error;
  }
});

router.patch('/usuarios/:id', requerirRol('administrador'), async (req, res) => {
  const pool = obtenerPool();
  const activo = req.body?.activo ? 1 : 0;
  const [resultado] = await pool.query(
    'UPDATE Usuario SET activo = ? WHERE id_usuario = ?',
    [activo, req.params.id],
  );
  if (!resultado.affectedRows) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }
  res.json({ ok: true });
});

router.get('/reportes', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const pool = obtenerPool();
  await marcarVencidos(pool);
  const [[inventario]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM Libro) AS titulos,
       (SELECT COUNT(*) FROM Ejemplar) AS ejemplares,
       (SELECT COUNT(*) FROM Ejemplar WHERE estado = 'disponible') AS disponibles,
       (SELECT COUNT(*) FROM Prestamo) AS prestamos,
       (SELECT COUNT(*) FROM Prestamo WHERE estado = 'activo') AS activos,
       (SELECT COUNT(*) FROM Prestamo WHERE estado = 'atrasado') AS vencidos,
       (SELECT COUNT(*) FROM Prestamo WHERE estado = 'devuelto') AS devueltos,
       (SELECT COUNT(*) FROM Prestamo WHERE estado = 'devuelto' AND fecha_devolucion_real <= fecha_devolucion_esperada) AS aTiempo`,
  );
  const [porMes] = await pool.query(
    `SELECT DATE_FORMAT(fecha_prestamo, '%Y-%m') AS mes, COUNT(*) AS total
     FROM Prestamo
     WHERE fecha_prestamo >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY mes
     ORDER BY mes`,
  );
  const [masPrestados] = await pool.query(
    `SELECT l.titulo, COUNT(*) AS total
     FROM Prestamo p
     JOIN Ejemplar e ON e.id_ejemplar = p.id_ejemplar
     JOIN Libro l ON l.id_libro = e.id_libro
     GROUP BY l.id_libro, l.titulo
     ORDER BY total DESC
     LIMIT 5`,
  );
  const [porCategoria] = await pool.query(
    `SELECT c.nombre, COUNT(l.id_libro) AS total
     FROM Categoria c
     LEFT JOIN Libro l ON l.id_categoria = c.id_categoria
     GROUP BY c.id_categoria, c.nombre
     ORDER BY total DESC`,
  );
  res.json({
    inventario,
    porMes,
    masPrestados,
    porCategoria,
  });
});

router.get('/alertas', requerirRol('administrador', 'bibliotecario'), async (req, res) => {
  const pool = obtenerPool();
  await marcarVencidos(pool);
  const [filas] = await pool.query(
    `SELECT
       p.id_prestamo,
       CONCAT(u.nombre, ' ', u.apellido) AS usuario,
       l.titulo,
       p.fecha_devolucion_esperada,
       DATEDIFF(CURDATE(), p.fecha_devolucion_esperada) AS dias
     FROM Prestamo p
     JOIN Usuario u ON u.id_usuario = p.id_usuario
     JOIN Ejemplar e ON e.id_ejemplar = p.id_ejemplar
     JOIN Libro l ON l.id_libro = e.id_libro
     WHERE p.estado = 'atrasado'
     ORDER BY p.fecha_devolucion_esperada`,
  );
  res.json({
    alertas: filas.map((fila) => ({
      id: fila.id_prestamo,
      tipo: 'overdue',
      mensaje: `${fila.usuario} tiene '${fila.titulo}' vencido desde hace ${fila.dias} días.`,
      fecha: fecha(fila.fecha_devolucion_esperada),
    })),
  });
});

module.exports = router;
