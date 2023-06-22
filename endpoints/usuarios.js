require("dotenv").config();

const { Pool } = require("pg");

const express = require("express");
const usuariosRouter = express.Router();

const jwt = require("jsonwebtoken");

//Constante para el control de la duración del token
const tokenExpiration = 5 * 60; // 5 minutos en segundos

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware para verificar el token de autenticación
function verifyToken(req, res, next) {
  const tokenAuth = req.headers.authorization;
  console.log(tokenAuth);
  if (!tokenAuth) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  jwt.verify(tokenAuth, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token Verificación inválido" });
    }

    req.user = decoded;
    next();
  });
}
//Endpoint generar token

// Endpoint de inicio de sesión
/**
 * @swagger
 * tags:
 *   name: login
 *   description: Endpoint para obtener un token de autenticación para acceder al resto de endpoints
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Obtener un token temporal de acceso al resto de endpoints.
 *     description: Obtiene un token temporal de acceso al resto de endpoints.
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Datos no proporcionado o inválido
 *       500:
 *         description: Error del servidor
 */
usuariosRouter.post("/login", async (req, res) => {
  try {
    const { username, pwd, token } = req.body;

    // Verificar las credenciales del usuario consultando la tabla usuarios
    const query = "SELECT * FROM usuarios WHERE username = $1 AND pwd = $2";
    const result = await pool.query(query, [username, pwd]);

    if (result.rows.length === 0) {
      // Credenciales inválidas
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const usuario = result.rows[0];

    // Verificar si el campo "token" coincide
    if (usuario.token !== token) {
      return res.status(401).json({ error: "Token de usuario inválido" });
    }

    // Generar un token de autenticación
    const authToken = jwt.sign({ userId: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: tokenExpiration,
    });

    // Devolver el token en la respuesta
    res.json({ authToken });
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Ruta para obtener todos los usuarios
/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Operaciones relacionadas con los usuarios
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener un usuario especifico o todos los usuarios
 *     description: Obtiene un usuario especifico o todos los usuarios.
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Token no proporcionado o inválido
 *       500:
 *         description: Error del servidor
 */
usuariosRouter.get("/usuarios/:id?", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = "SELECT * FROM usuarios";

    if (id) {
      query += " WHERE id = $1";
    }

    const result = await pool.query(query, id ? [id] : []);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error en la consulta de usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Ruta para crear un nuevo usuario
/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Faltan campos obligatorios
 *       401:
 *         description: Token no proporcionado o inválido
 *       500:
 *         description: Error del servidor
 */
usuariosRouter.post("/usuarios", verifyToken, (req, res) => {
  const { username, email, pwd, token } = req.body;

  if (!username || !email || !pwd || !token) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  pool.query(
    "INSERT INTO usuarios (username, email, pwd, token) VALUES ($1, $2, $3, $4) RETURNING *",
    [username, email, pwd, token],
    (err, result) => {
      if (err) {
        console.error("Error al crear el usuario", err);
        return res
          .status(500)
          .json({ error: "Creación de usuario", mensaje: err.detail });
      }

      res.json(result.rows[0]);
    }
  );
});

//Ruta para editar un usuario
/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Modificar un usuario existente
 *     description: Modifica un usuario existente según su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a modificar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario modificado correctamente
 *       400:
 *         description: Faltan campos obligatorios
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
usuariosRouter.put("/usuarios/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { username, email, pwd, token } = req.body;

  if (!username || !email || !pwd || !token) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  pool.query(
    "UPDATE usuarios SET username = $1, email = $2, pwd = $3, token = $4 WHERE id = $5 RETURNING *",
    [username, email, pwd, token, id],
    (err, result) => {
      if (err) {
        console.error("Error al modificar el usuario", err);
        return res
          .status(500)
          .json({ error: "Error del servidor", message: err });
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(result.rows[0]);
    }
  );
});

//Ruta para eliminar un usuario
/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario existente
 *     description: Elimina un usuario existente según su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
usuariosRouter.delete("/usuarios/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  pool.query(
    "DELETE FROM usuarios WHERE id = $1 RETURNING *",
    [id],
    (err, result) => {
      if (err) {
        console.error("Error al eliminar el usuario", err);
        return res.status(500).json({ error: "Error del servidor" });
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ message: "Usuario eliminado correctamente" });
    }
  );
});

module.exports = usuariosRouter;
