const mysql = require('mysql2/promise');
const { TABLAS, sembrar } = require('./esquema');

let pool;
let esquemaListo = null;

function obtenerPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_ADDON_HOST,
      user: process.env.MYSQL_ADDON_USER,
      password: process.env.MYSQL_ADDON_PASSWORD,
      database: process.env.MYSQL_ADDON_DB,
      port: Number(process.env.MYSQL_ADDON_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 2,
      idleTimeout: 60000,
      connectTimeout: 20000,
      charset: 'utf8mb4',
      dateStrings: true,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

async function crearTablas() {
  const conexion = obtenerPool();
  for (const sql of TABLAS) {
    await conexion.query(sql);
  }
  await sembrar(conexion);
}

function asegurarEsquema() {
  if (!esquemaListo) {
    esquemaListo = crearTablas().catch((error) => {
      esquemaListo = null;
      throw error;
    });
  }

  return esquemaListo;
}

module.exports = {
  obtenerPool,
  asegurarEsquema,
};
