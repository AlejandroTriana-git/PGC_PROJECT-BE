import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API PGC Project',
            version: '1.0.0',
            description: 'Documentación oficial de la API para la gestión de Proyectos de Gestión del Conocimiento (PGC).',
        },
        servers: [
            {
                url: 'http://localhost:7000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el token JWT obtenido en el login.'
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Swagger dónde buscar los comentarios de las rutas
    apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;