const crypto = require('crypto');
const { obtenerPool } = require('./db');

function mapearBiblioteca(fila, estanterias, repisasPorEstanteria, librosPorRepisa) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    ancho: Number(fila.ancho),
    largo: Number(fila.largo),
    creadoEn: fila.creado_en,
    estanterias: estanterias.map((estanteria) => ({
      id: estanteria.id,
      numero: estanteria.numero,
      nombre: estanteria.nombre,
      ancho: Number(estanteria.ancho),
      largo: Number(estanteria.largo),
      posicionX: Number(estanteria.posicion_x),
      posicionY: Number(estanteria.posicion_y),
      repisas: (repisasPorEstanteria.get(estanteria.id) || []).map((repisa) => ({
        letra: repisa.letra,
        libros: librosPorRepisa.get(repisa.id) || [],
      })),
    })),
  };
}

async function leerArbol(conexion, bibliotecaId) {
  const [estanterias] = await conexion.query(
    `SELECT id, numero, nombre, ancho, largo, posicion_x, posicion_y
     FROM estanterias
     WHERE biblioteca_id = ?
     ORDER BY numero, id`,
    [bibliotecaId],
  );

  const [repisas] = await conexion.query(
    `SELECT r.id, r.estanteria_id, r.letra, r.orden
     FROM repisas r
     INNER JOIN estanterias e ON e.id = r.estanteria_id
     WHERE e.biblioteca_id = ?
     ORDER BY r.orden, r.id`,
    [bibliotecaId],
  );

  const [libros] = await conexion.query(
    `SELECT l.id, l.repisa_id, l.nombre, l.autor, l.categoria
     FROM libros l
     INNER JOIN repisas r ON r.id = l.repisa_id
     INNER JOIN estanterias e ON e.id = r.estanteria_id
     WHERE e.biblioteca_id = ?`,
    [bibliotecaId],
  );

  const repisasPorEstanteria = new Map();
  for (const repisa of repisas) {
    if (!repisasPorEstanteria.has(repisa.estanteria_id)) {
      repisasPorEstanteria.set(repisa.estanteria_id, []);
    }
    repisasPorEstanteria.get(repisa.estanteria_id).push(repisa);
  }

  const librosPorRepisa = new Map();
  for (const libro of libros) {
    if (!librosPorRepisa.has(libro.repisa_id)) {
      librosPorRepisa.set(libro.repisa_id, []);
    }
    librosPorRepisa.get(libro.repisa_id).push({
      id: libro.id,
      nombre: libro.nombre,
      autor: libro.autor,
      categoria: libro.categoria,
    });
  }

  return { estanterias, repisasPorEstanteria, librosPorRepisa };
}

async function obtenerBiblioteca(id, usuarioId) {
  const pool = obtenerPool();
  const [filas] = await pool.query(
    `SELECT id, nombre, ancho, largo, creado_en
     FROM bibliotecas
     WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId],
  );

  if (!filas.length) {
    return null;
  }

  const arbol = await leerArbol(pool, id);
  return mapearBiblioteca(filas[0], arbol.estanterias, arbol.repisasPorEstanteria, arbol.librosPorRepisa);
}

async function listarBibliotecas(usuarioId) {
  const pool = obtenerPool();
  const [bibliotecas] = await pool.query(
    `SELECT id, nombre, ancho, largo, creado_en
     FROM bibliotecas
     WHERE usuario_id = ?
     ORDER BY creado_en DESC`,
    [usuarioId],
  );

  if (!bibliotecas.length) {
    return [];
  }

  const ids = bibliotecas.map((biblioteca) => biblioteca.id);
  const [estanterias] = await pool.query(
    `SELECT id, biblioteca_id, numero, nombre
     FROM estanterias
     WHERE biblioteca_id IN (?)
     ORDER BY numero`,
    [ids],
  );

  const [conteos] = await pool.query(
    `SELECT e.biblioteca_id, COUNT(l.id) AS cantidad
     FROM estanterias e
     LEFT JOIN repisas r ON r.estanteria_id = e.id
     LEFT JOIN libros l ON l.repisa_id = r.id
     WHERE e.biblioteca_id IN (?)
     GROUP BY e.biblioteca_id`,
    [ids],
  );

  const estanteriasPorBiblioteca = new Map();
  for (const estanteria of estanterias) {
    if (!estanteriasPorBiblioteca.has(estanteria.biblioteca_id)) {
      estanteriasPorBiblioteca.set(estanteria.biblioteca_id, []);
    }
    estanteriasPorBiblioteca.get(estanteria.biblioteca_id).push({
      id: estanteria.id,
      nombre: estanteria.nombre,
      numero: estanteria.numero,
    });
  }

  const librosPorBiblioteca = new Map(conteos.map((fila) => [fila.biblioteca_id, Number(fila.cantidad)]));

  return bibliotecas.map((biblioteca) => ({
    id: biblioteca.id,
    nombre: biblioteca.nombre,
    ancho: Number(biblioteca.ancho),
    largo: Number(biblioteca.largo),
    creadoEn: biblioteca.creado_en,
    cantidadLibros: librosPorBiblioteca.get(biblioteca.id) || 0,
    estanterias: estanteriasPorBiblioteca.get(biblioteca.id) || [],
  }));
}

async function insertarArbol(conexion, bibliotecaId, biblioteca) {
  for (const estanteria of biblioteca.estanterias) {
    await conexion.query(
      `INSERT INTO estanterias
        (id, biblioteca_id, numero, nombre, ancho, largo, posicion_x, posicion_y)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        estanteria.id,
        bibliotecaId,
        estanteria.numero,
        estanteria.nombre,
        estanteria.ancho,
        estanteria.largo,
        estanteria.posicionX,
        estanteria.posicionY,
      ],
    );

    for (const repisa of estanteria.repisas) {
      const [resultado] = await conexion.query(
        `INSERT INTO repisas (estanteria_id, letra, orden) VALUES (?, ?, ?)`,
        [estanteria.id, repisa.letra, repisa.orden],
      );

      for (const libro of repisa.libros) {
        await conexion.query(
          `INSERT INTO libros (id, repisa_id, nombre, autor, categoria) VALUES (?, ?, ?, ?, ?)`,
          [libro.id, resultado.insertId, libro.nombre, libro.autor, libro.categoria],
        );
      }
    }
  }
}

async function crearBiblioteca(usuarioId, biblioteca) {
  const pool = obtenerPool();
  const conexion = await pool.getConnection();
  const id = crypto.randomUUID();

  try {
    await conexion.beginTransaction();
    await conexion.query(
      `INSERT INTO bibliotecas (id, usuario_id, nombre, ancho, largo) VALUES (?, ?, ?, ?, ?)`,
      [id, usuarioId, biblioteca.nombre, biblioteca.ancho, biblioteca.largo],
    );
    await insertarArbol(conexion, id, biblioteca);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return obtenerBiblioteca(id, usuarioId);
}

async function actualizarBiblioteca(id, usuarioId, biblioteca) {
  const pool = obtenerPool();
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filas] = await conexion.query(
      'SELECT id FROM bibliotecas WHERE id = ? AND usuario_id = ? FOR UPDATE',
      [id, usuarioId],
    );

    if (!filas.length) {
      await conexion.rollback();
      return null;
    }

    await conexion.query(
      'UPDATE bibliotecas SET nombre = ?, ancho = ?, largo = ? WHERE id = ?',
      [biblioteca.nombre, biblioteca.ancho, biblioteca.largo, id],
    );
    await conexion.query('DELETE FROM estanterias WHERE biblioteca_id = ?', [id]);
    await insertarArbol(conexion, id, biblioteca);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return obtenerBiblioteca(id, usuarioId);
}

function escaparLike(valor) {
  return `%${String(valor).replace(/[\\%_]/g, '\\$&')}%`;
}

async function buscarLibros(usuarioId, filtros) {
  const pool = obtenerPool();
  const condiciones = ['b.usuario_id = ?'];
  const parametros = [usuarioId];

  if (filtros.nombre) {
    condiciones.push("l.nombre LIKE ? ESCAPE '\\\\'");
    parametros.push(escaparLike(filtros.nombre));
  }

  if (filtros.autor) {
    condiciones.push("l.autor LIKE ? ESCAPE '\\\\'");
    parametros.push(escaparLike(filtros.autor));
  }

  if (filtros.categoria) {
    condiciones.push("l.categoria LIKE ? ESCAPE '\\\\'");
    parametros.push(escaparLike(filtros.categoria));
  }

  const [filas] = await pool.query(
    `SELECT
       l.id, l.nombre, l.autor, l.categoria,
       b.id AS biblioteca_id, b.nombre AS biblioteca_nombre,
       e.id AS estanteria_id, e.nombre AS estanteria_nombre,
       r.letra
     FROM libros l
     INNER JOIN repisas r ON r.id = l.repisa_id
     INNER JOIN estanterias e ON e.id = r.estanteria_id
     INNER JOIN bibliotecas b ON b.id = e.biblioteca_id
     WHERE ${condiciones.join(' AND ')}
     ORDER BY l.nombre
     LIMIT 300`,
    parametros,
  );

  return filas.map((fila) => ({
    libro: {
      id: fila.id,
      nombre: fila.nombre,
      autor: fila.autor,
      categoria: fila.categoria,
    },
    biblioteca: {
      id: fila.biblioteca_id,
      nombre: fila.biblioteca_nombre,
    },
    estanteria: {
      id: fila.estanteria_id,
      nombre: fila.estanteria_nombre,
    },
    repisa: {
      letra: fila.letra,
    },
  }));
}

module.exports = {
  listarBibliotecas,
  obtenerBiblioteca,
  crearBiblioteca,
  actualizarBiblioteca,
  buscarLibros,
};
