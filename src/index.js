// 0.Isirasom nodemon, kad perkrautu serveri
// npm i nodemon --save-dev
// 1.Isirasom express(padeda tvarkytis su responsu, requestu)
// ir cors(tikrina ir validuoja is kokiu domenu ateina signalai ir i kokius siunciam)
// ir dotenv(priims env failus)
// npm i express cors dotenv

// inportuojam ka surasem...
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const mysqlConfig = {
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB,
  port: process.env.MYSQL_PORT,
};

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send({ messege: "The server is running successfully" });
});

// GET, POST/models
app.get("/models", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`SELECT * FROM models`);

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "Unexpected error has ocurred. Please try again later" });
  }
});

app.post("/models", async (req, res) => {
  if (!req.body.name || !req.body.hourprice || req.body.hourprice < 0) {
    return res.status(400).send({ error: "Incorrect data has been passed" });
  }

  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [result] = await con.execute(
      `INSERT INTO models (name, hourprice) VALUES (${mysql.escape(
        req.body.name
      )}, ${mysql.escape(req.body.hourprice)})`
    );

    if (!result.insertId) {
      return res
        .status(500)
        .send({ error: "Execution failed. Please contact admin" });
    }

    return res.send({ id: result.insertId });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "Unexpected error has ocurred. Please try again later" });
  }
});

// GET/modelscount
app.get("/modelscount", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT name, 
    COUNT(vehicles.model_id) AS count, 
    hourprice
    FROM models
    INNER JOIN vehicles ON vehicles.model_id = models.id
    GROUP BY models.id
    `);

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "Unexpected error has ocurred. Please try again later" });
  }
});

// GET, POST /vehicles
app.get("/vehicles", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
      SELECT models.name, (models.hourprice + models.hourprice * 0.21) AS hour_price_pvm, number_plate, country_location
      FROM vehicles
      INNER JOIN models ON (models.id = vehicles.model_id)
      `);

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "Unexpected error has ocurred. Please try again later" });
  }
});

app.post("/vehicles", async (req, res) => {
  if (
    !req.body.model_id ||
    !req.body.number_plate ||
    !req.body.country_location
  ) {
    return res.status(400).send({ error: "Incorrect data has been passed" });
  }

  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [result] = await con.execute(
      `INSERT INTO vehicles (model_id, number_plate, country_location) VALUES 
      (${mysql.escape(req.body.model_id)}, 
      ${mysql.escape(req.body.number_plate)}, 
      ${mysql.escape(req.body.country_location)})`
    );

    if (!result.insertId) {
      return res
        .status(500)
        .send({ error: "Execution failed. Please contact admin" });
    }

    return res.send({ id: result.insertId });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "Unexpected error has ocurred. Please try again later" });
  }
});

app.all("*", (req, res) => {
  res.status(404).send({ error: "Page not found" });
});

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Listening on ${port}`));
