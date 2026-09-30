const bcrypt = require('bcryptjs');

const TABLAS = [
  `CREATE TABLE IF NOT EXISTS Autor (
    id_autor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Libro (
    id_libro INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) NOT NULL,
    id_autor INT NOT NULL,
    id_categoria INT NOT NULL,
    \`año_publicacion\` INT,
    idioma VARCHAR(30),
    editorial VARCHAR(120),
    UNIQUE KEY isbn_unico (isbn),
    CONSTRAINT fk_libro_autor FOREIGN KEY (id_autor) REFERENCES Autor(id_autor),
    CONSTRAINT fk_libro_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Ejemplar (
    id_ejemplar INT AUTO_INCREMENT PRIMARY KEY,
    id_libro INT NOT NULL,
    codigo_barras VARCHAR(50) NOT NULL,
    estado VARCHAR(50) DEFAULT 'disponible',
    UNIQUE KEY codigo_unico (codigo_barras),
    CONSTRAINT fk_ejemplar_libro FOREIGN KEY (id_libro) REFERENCES Libro(id_libro)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY email_unico (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Prestamo (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_ejemplar INT NOT NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATE,
    estado VARCHAR(20) DEFAULT 'activo',
    CONSTRAINT fk_prestamo_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_prestamo_ejemplar FOREIGN KEY (id_ejemplar) REFERENCES Ejemplar(id_ejemplar)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const CONSULTA_LIBROS = `
SELECT
  l.id_libro,
  l.titulo,
  l.isbn,
  CONCAT(a.nombre, ' ', a.apellido) AS autor,
  c.nombre AS categoria,
  l.\`año_publicacion\`,
  l.idioma
FROM Libro l
JOIN Autor a ON l.id_autor = a.id_autor
JOIN Categoria c ON l.id_categoria = c.id_categoria
`;

const CONSULTA_PRESTAMOS_ACTIVOS = `
SELECT
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
WHERE p.estado = 'activo'
`;

async function sembrar(pool) {
  const [usuarios] = await pool.query('SELECT COUNT(*) AS total FROM Usuario');
  if (usuarios[0].total > 0) {
    return;
  }

  const hash = await bcrypt.hash('biblioteca123', 10);
  const cuentas = [
    ['Lucía', 'Martínez', 'lucia@colegio.edu', 'administrador'],
    ['Carlos', 'Ramírez', 'carlos@colegio.edu', 'bibliotecario'],
    ['Sofía', 'Herrera', 'sofia@colegio.edu', 'estudiante'],
  ];

  for (const cuenta of cuentas) {
    await pool.query(
      'INSERT INTO Usuario (nombre, apellido, email, tipo, contrasena_hash) VALUES (?, ?, ?, ?, ?)',
      [...cuenta, hash],
    );
  }

  const categorias = ['Literatura', 'Ciencias', 'Historia', 'Infantil', 'Clásicos'];
  for (const nombre of categorias) {
    await pool.query('INSERT INTO Categoria (nombre) VALUES (?)', [nombre]);
  }

  await sembrarCatalogo(pool);
}

async function sembrarCatalogo(pool) {
  const [libros] = await pool.query('SELECT COUNT(*) AS total FROM Libro');
  if (libros[0].total > 0) return;

  const obras = [
    ['Cien años de soledad', 'Gabriel García', 'Márquez', '9780060883287', 'Literatura', 1967, 'Español', 'Sudamericana', 3],
    ['El principito', 'Antoine', 'de Saint-Exupéry', '9788426132799', 'Infantil', 1943, 'Español', 'Salamandra', 5],
    ['Don Quijote de la Mancha', 'Miguel', 'de Cervantes', '9788437604947', 'Clásicos', 1605, 'Español', 'Cátedra', 2],
    ['Sapiens: De animales a dioses', 'Yuval Noah', 'Harari', '9788499427985', 'Historia', 2011, 'Español', 'Debate', 4],
    ['El alquimista', 'Paulo', 'Coelho', '9780061122415', 'Literatura', 1988, 'Español', 'Planeta', 3],
    ['Física universitaria', 'Sears', 'Zemansky', '9786073227485', 'Ciencias', 2013, 'Español', 'Pearson', 6],
  ];

  for (const [titulo, nombre, apellido, isbn, categoria, año, idioma, editorial, copias] of obras) {
    const [autores] = await pool.query(
      'SELECT id_autor FROM Autor WHERE nombre = ? AND apellido = ? LIMIT 1',
      [nombre, apellido],
    );
    let idAutor = autores[0]?.id_autor;
    if (!idAutor) {
      const [autor] = await pool.query(
        'INSERT INTO Autor (nombre, apellido) VALUES (?, ?)',
        [nombre, apellido],
      );
      idAutor = autor.insertId;
    }
    const [categorias] = await pool.query(
      'SELECT id_categoria FROM Categoria WHERE nombre = ? LIMIT 1',
      [categoria],
    );
    const [libro] = await pool.query(
      'INSERT INTO Libro (titulo, isbn, id_autor, id_categoria, `año_publicacion`, idioma, editorial) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo, isbn, idAutor, categorias[0].id_categoria, año, idioma, editorial],
    );
    for (let i = 1; i <= copias; i += 1) {
      await pool.query(
        'INSERT INTO Ejemplar (id_libro, codigo_barras, estado) VALUES (?, ?, ?)',
        [libro.insertId, `SM-${libro.insertId}-${String(i).padStart(3, '0')}`, 'disponible'],
      );
    }
  }

  const [sofia] = await pool.query("SELECT id_usuario FROM Usuario WHERE email = 'sofia@colegio.edu' LIMIT 1");
  const [ejemplar] = await pool.query(
    `SELECT e.id_ejemplar
     FROM Ejemplar e
     JOIN Libro l ON l.id_libro = e.id_libro
     WHERE l.titulo = 'Cien años de soledad' AND e.estado = 'disponible'
     LIMIT 1`,
  );
  if (sofia[0] && ejemplar[0]) {
    await pool.query(
      `INSERT INTO Prestamo (id_usuario, id_ejemplar, fecha_prestamo, fecha_devolucion_esperada, estado)
       VALUES (?, ?, '2026-09-10', '2026-09-20', 'atrasado')`,
      [sofia[0].id_usuario, ejemplar[0].id_ejemplar],
    );
    await pool.query(
      "UPDATE Ejemplar SET estado = 'prestado' WHERE id_ejemplar = ?",
      [ejemplar[0].id_ejemplar],
    );
  }

  const [carlos] = await pool.query("SELECT id_usuario FROM Usuario WHERE email = 'carlos@colegio.edu' LIMIT 1");
  const [otro] = await pool.query(
    `SELECT e.id_ejemplar
     FROM Ejemplar e
     JOIN Libro l ON l.id_libro = e.id_libro
     WHERE l.titulo = 'El principito' AND e.estado = 'disponible'
     LIMIT 1`,
  );
  if (carlos[0] && otro[0]) {
    await pool.query(
      `INSERT INTO Prestamo (id_usuario, id_ejemplar, fecha_prestamo, fecha_devolucion_esperada, estado)
       VALUES (?, ?, '2026-09-25', '2026-10-09', 'activo')`,
      [carlos[0].id_usuario, otro[0].id_ejemplar],
    );
    await pool.query(
      "UPDATE Ejemplar SET estado = 'prestado' WHERE id_ejemplar = ?",
      [otro[0].id_ejemplar],
    );
  }
}

module.exports = {
  TABLAS,
  CONSULTA_LIBROS,
  CONSULTA_PRESTAMOS_ACTIVOS,
  sembrar,
};
