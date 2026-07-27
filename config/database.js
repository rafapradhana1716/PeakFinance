import * as mariadb from 'mariadb';
import 'dotenv/config';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
    idleTimeout: 60,
    acquireTimeout: 10000
});

export default pool;
