import express from 'express';
import mariadb from 'mariadb';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();

const pool = mariadb.createPool({
  host: 'localhost',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 3,
});

app.get('/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('DB not ready: ' + err.message);
  }
});

app.listen(process.env.HEALTH_PORT || 3000, () => {
  console.log(`Health check server on port ${process.env.HEALTH_PORT}`);
});
