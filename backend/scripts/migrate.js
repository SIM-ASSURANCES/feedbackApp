#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const sqlPath = path.resolve(__dirname, '../../database/init.sql');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not defined in backend/.env');
  process.exit(1);
}

async function main() {
  let sql;
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (err) {
    console.error(`ERROR: Unable to read SQL file at ${sqlPath}:`, err.message);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();
    try {
      console.log(`Running SQL migration from ${sqlPath}...`);
      await client.query(sql);
      console.log('Database migration completed successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('ERROR: Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
