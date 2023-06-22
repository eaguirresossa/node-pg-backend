require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importamos y configuramos Swagger
require("./swagger")(app);

// Configuración de CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

//Ruta Principal
app.use(express.static("public"));

//Cargamos Ruta Usuarios
const usuariosRouter = require("./endpoints/usuarios");

// Usar el middleware de usuariosRouter para las rutas bajo /api
app.use("/api", usuariosRouter);

//Control de rutas no existentes
app.get("*", (req, res) => {
  res.sendFile(__dirname + "/public/404.html");
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
