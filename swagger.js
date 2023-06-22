const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Usuarios",
      version: "1.0.0",
      description: "Una API para administrar usuarios",
    },
  },
  apis: ["./endpoints/usuarios.js"],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = (app) => {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
