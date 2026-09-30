const crypto = require('crypto');

function idSeguro(id) {
  if (typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id)) {
    return id;
  }

  return crypto.randomUUID();
}

function texto(valor, maximo) {
  return String(valor ?? '').trim().slice(0, maximo);
}

function validarBiblioteca(datos) {
  if (!datos || typeof datos !== 'object') {
    return 'Los datos de la biblioteca no son válidos.';
  }

  if (!texto(datos.nombre, 200)) {
    return 'Debes ponerle un nombre a la biblioteca.';
  }

  const ancho = Number(datos.ancho);
  const largo = Number(datos.largo);

  if (!Number.isFinite(ancho) || ancho <= 0) {
    return 'El ancho de la biblioteca no es válido.';
  }

  if (!Number.isFinite(largo) || largo <= 0) {
    return 'El largo de la biblioteca no es válido.';
  }

  if (!Array.isArray(datos.estanterias) || datos.estanterias.length > 100) {
    return 'La cantidad de estanterías no es válida.';
  }

  let cantidadLibros = 0;

  for (let i = 0; i < datos.estanterias.length; i += 1) {
    const estanteria = datos.estanterias[i];
    const numero = i + 1;

    if (!texto(estanteria?.nombre, 200)) {
      return `La estantería ${numero} necesita un nombre.`;
    }

    const anchoEstanteria = Number(estanteria.ancho);
    const largoEstanteria = Number(estanteria.largo);

    if (!Number.isFinite(anchoEstanteria) || anchoEstanteria <= 0) {
      return `El ancho de la estantería ${numero} no es válido.`;
    }

    if (!Number.isFinite(largoEstanteria) || largoEstanteria <= 0) {
      return `El largo de la estantería ${numero} no es válido.`;
    }

    if (!Array.isArray(estanteria.repisas) || estanteria.repisas.length < 1 || estanteria.repisas.length > 100) {
      return `La estantería ${numero} necesita al menos una repisa.`;
    }

    const posicionX = Number(estanteria.posicionX);
    const posicionY = Number(estanteria.posicionY);

    if (!Number.isFinite(posicionX) || !Number.isFinite(posicionY) || posicionX < 0 || posicionY < 0) {
      return `La posición de la estantería ${numero} no puede ser negativa.`;
    }

    if (posicionX + anchoEstanteria / 100 > ancho) {
      return `La estantería ${numero} se sale de la biblioteca por el lado derecho.`;
    }

    if (posicionY + largoEstanteria / 100 > largo) {
      return `La estantería ${numero} se sale de la biblioteca por la parte inferior.`;
    }

    for (const repisa of estanteria.repisas) {
      if (!Array.isArray(repisa?.libros)) {
        return `Las repisas de la estantería ${numero} no son válidas.`;
      }

      cantidadLibros += repisa.libros.length;

      for (const libro of repisa.libros) {
        if (!texto(libro?.nombre, 255) || !texto(libro?.autor, 255) || !texto(libro?.categoria, 255)) {
          return `Hay un libro incompleto en la estantería ${numero}.`;
        }
      }
    }
  }

  if (cantidadLibros > 5000) {
    return 'La biblioteca supera el máximo de 5000 libros.';
  }

  return null;
}

function normalizarBiblioteca(datos) {
  return {
    nombre: texto(datos.nombre, 200),
    ancho: Number(datos.ancho),
    largo: Number(datos.largo),
    estanterias: datos.estanterias.map((estanteria, indice) => ({
      id: idSeguro(estanteria.id),
      numero: Number(estanteria.numero) || indice + 1,
      nombre: texto(estanteria.nombre, 200),
      ancho: Number(estanteria.ancho),
      largo: Number(estanteria.largo),
      posicionX: Number(estanteria.posicionX),
      posicionY: Number(estanteria.posicionY),
      repisas: estanteria.repisas.map((repisa, orden) => ({
        letra: texto(repisa.letra, 8) || String(orden + 1),
        orden: orden + 1,
        libros: repisa.libros.map((libro) => ({
          id: idSeguro(libro.id),
          nombre: texto(libro.nombre, 255),
          autor: texto(libro.autor, 255),
          categoria: texto(libro.categoria, 255),
        })),
      })),
    })),
  };
}

module.exports = {
  validarBiblioteca,
  normalizarBiblioteca,
};
