const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const port = process.env.PORT || 3000;
const docsDir = path.join(__dirname, '../docs').replace(/\\/g, '/');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Simulador de Corretora — API',
      version: '1.0.0',
      description:
        'API REST do simulador de corretora (DSW). ' +
        'Rotas protegidas exigem JWT obtido em `POST /auth/login`. ' +
        'Use o botão **Authorize** com o valor `Bearer <seu_token>`.',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [`${docsDir}/components.js`, `${docsDir}/paths/*.js`],
};

module.exports = swaggerJsdoc(options);
