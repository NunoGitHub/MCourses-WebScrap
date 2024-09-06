import dotenv from 'dotenv';

dotenv.config();

export const DB_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST ,
    database: process.env.DB_NAME ,
    password: process.env.DB_PASSWORD ,
    port: Number(process.env.DB_PORT) || 26257,
  };