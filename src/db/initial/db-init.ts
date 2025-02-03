import dotenv from 'dotenv';
import fs from 'fs';
import pg from 'pg';
import PGSQL_CONFIG from '@/db/pg-config';
import path from 'path';
import * as process from 'node:process';
import rootDirName from '@/utils/path';

dotenv.config();

const { Client } = pg;

const initializeDatabase = async () => {
  try {
    const client = new Client(PGSQL_CONFIG);

    await client.connect();
    console.log('✅ Успішне підключення до бази даних');

    const sqlFilePath = path.join(
      rootDirName,
      'db',
      'initial',
      'init-schema.sql'
    );
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    await client.query(sqlScript);

    console.log('✅ Схему бази даних успішно створено');

    await client.end();
    console.log('📦 Ініціалізацію бази даних завершено');
  } catch (error) {
    console.error('❌ Помилка ініціалізації бази даних:', error);
    process.exit(1);
  }
};

export default initializeDatabase();
