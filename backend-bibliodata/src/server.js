const app = require('./app');

const puerto = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(puerto, () => {
    console.log(`API de BiblioData en http://localhost:${puerto}`);
  });
}

module.exports = app;
