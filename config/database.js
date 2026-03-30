import * as mariadb from 'mariadb';
import 'dotenv/config';

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 1,
    idleTimeout: 1000,
    acquireTimeout: 10000
});

export default pool;