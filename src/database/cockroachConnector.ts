import { Pool } from 'pg';
import { DB_CONFIG } from '../config/config';



const db = new Pool({
  user: DB_CONFIG.user,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  password: DB_CONFIG.password,
  port: DB_CONFIG.port,
  ssl: {
    rejectUnauthorized: false, // Usualmente necessário para CockroachDB
  },
});

export default db;