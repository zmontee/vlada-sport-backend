import * as dotenv from 'dotenv';

dotenv.config();

const PGSQL_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export default PGSQL_CONFIG;
