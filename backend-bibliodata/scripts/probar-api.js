require('dotenv').config();
const mysql = require('mysql2/promise');

const base = 'http://localhost:4000';
const usuario = `prueba_${Date.now()}`;
const contrasena = 'clave-prueba';

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: opciones.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.token ? { Authorization: `Bearer ${opciones.token}` } : {}),
    },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(`${respuesta.status} ${ruta}: ${datos.error || JSON.stringify(datos)}`);
  }
  return datos;
}

async function main() {
  console.log('salud', await pedir('/api/salud'));
  console.log('registro', await pedir('/api/auth/registro', {
    method: 'POST',
    body: { usuario, contrasena, confirmarContrasena: contrasena },
  }));
  const sesion = await pedir('/api/auth/login', {
    method: 'POST',
    body: { usuario, contrasena },
  });
  console.log('login', sesion.usuario.usuario);

  const creada = await pedir('/api/bibliotecas', {
    method: 'POST',
    token: sesion.token,
    body: {
      nombre: 'Biblioteca Central',
      ancho: 10,
      largo: 8,
      estanterias: [{
        numero: 1,
        nombre: 'Literatura',
        ancho: 80,
        largo: 30,
        posicionX: 1,
        posicionY: 1,
        repisas: [{
          letra: 'A',
          libros: [{ nombre: 'Cien años de soledad', autor: 'García Márquez', categoria: 'Literatura' }],
        }],
      }],
    },
  });
  console.log('creada', creada.biblioteca.id, creada.biblioteca.estanterias[0].repisas[0].libros[0].nombre);

  const lista = await pedir('/api/bibliotecas', { token: sesion.token });
  console.log('lista', lista.bibliotecas.length, lista.bibliotecas[0].cantidadLibros);

  const busqueda = await pedir('/api/bibliotecas/buscar?nombre=soledad', { token: sesion.token });
  console.log('busqueda', busqueda.resultados.length, busqueda.resultados[0]?.repisa.letra);

  creada.biblioteca.nombre = 'Biblioteca Editada';
  const editada = await pedir(`/api/bibliotecas/${creada.biblioteca.id}`, {
    method: 'PUT',
    token: sesion.token,
    body: creada.biblioteca,
  });
  console.log('editada', editada.biblioteca.nombre);

  const conexion = await mysql.createConnection({
    host: process.env.MYSQL_ADDON_HOST,
    user: process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.MYSQL_ADDON_DB,
    port: Number(process.env.MYSQL_ADDON_PORT || 3306),
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });
  await conexion.query('DELETE FROM usuarios WHERE usuario = ?', [usuario]);
  await conexion.end();
  console.log('limpieza ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
