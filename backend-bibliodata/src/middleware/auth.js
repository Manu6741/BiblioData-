const jwt = require('jsonwebtoken');

function requerirAuth(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'No has iniciado sesión.' });
    return;
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

function requerirRol(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario?.tipo)) {
      res.status(403).json({ error: 'No tienes permiso para esta acción.' });
      return;
    }
    next();
  };
}

module.exports = {
  requerirAuth,
  requerirRol,
};
