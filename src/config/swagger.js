// @ts-check
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TyMCO Ecommerce API',
      version: '1.0.0',
      description: 'API de documentación para el ecosistema de E-commerce TyMCO (v1.6.0).',
      contact: {
        name: 'SotoLabs Support',
        url: 'https://software-soto.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Buscará anotaciones en todos los archivos de rutas
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
