-- =========================================================================
-- Consultas SQL para la Biblioteca Virtual - PWA
-- Basado en el Modelo Entidad-Relación
-- =========================================================================

-- 1. Listado completo de libros con su autor y categoría
-- Esta consulta une las tablas de libros, autores y categorías para mostrar 
-- la información detallada de cada obra disponible.
SELECT 
    l.id_libro,
    l.titulo,
    l.isbn,
    CONCAT(a.nombre, ' ', a.apellido) AS autor,
    c.nombre AS categoria,
    l.año_publicacion,
    l.idioma
FROM Libro l
JOIN Autor a ON l.id_autor = a.id_autor
JOIN Categoria c ON l.id_categoria = c.id_categoria;


-- 2. Consulta de préstamos activos con datos del usuario y el ejemplar
-- Esta consulta permite ver qué usuarios tienen préstamos vigentes, qué libro 
-- están usando y el código de barras del ejemplar correspondiente.
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
WHERE p.estado = 'activo';