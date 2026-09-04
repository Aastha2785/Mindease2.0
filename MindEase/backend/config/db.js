const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "mindease",
    password: process.env.DB_PASSWORD,
    port: 5432
});

pool.connect()
    .then(() => {
        console.log("PostgreSQL connected successfully!");
    })
    .catch((error) => {
        console.error("PostgreSQL connection error:", error.message);
    });

module.exports = pool;