-- =========================================================================
-- Esquema de Base de Datos (DDL) para Biblioteca Virtual - Bibliodata+
-- Basado en el Modelo Entidad-Relación
-- =========================================================================

CREATE DATABASE IF NOT EXISTS biblioteca_virtual;
USE biblioteca_virtual;

-- Tabla de Autores
CREATE TABLE Autor (
    id_autor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(50)
);

-- Tabla de Categorías / Géneros
CREATE TABLE Categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de Libros (Entidad principal)
CREATE TABLE Libro (
    id_libro INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    id_autor INT NOT NULL,
    id_categoria INT NOT NULL,
    año_publicacion INT,
    idioma VARCHAR(30),
    CONSTRAINT fk_libro_autor FOREIGN KEY (id_autor) REFERENCES Autor(id_autor),
    CONSTRAINT fk_libro_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
);

-- Tabla de Ejemplares físicos o digitales de cada libro
CREATE TABLE Ejemplar (
    id_ejemplar INT AUTO_INCREMENT PRIMARY KEY,
    id_libro INT NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(50) DEFAULT 'disponible',
    CONSTRAINT fk_ejemplar_libro FOREIGN KEY (id_libro) REFERENCES Libro(id_libro)
);

-- Tabla de Usuarios del Sistema
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL -- Ejemplo: estudiante, docente, administrativo
);

-- Tabla de Préstamos (Relación M:N entre Usuario y Ejemplar)
CREATE TABLE Prestamo (
    id_prestamo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_ejemplar INT NOT NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATE,
    estado VARCHAR(20) DEFAULT 'activo', -- activo, devuelto, atrasado
    CONSTRAINT fk_prestamo_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_prestamo_ejemplar FOREIGN KEY (id_ejemplar) REFERENCES Ejemplar(id_ejemplar)
);