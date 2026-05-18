const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment');
}

const isSupabase = connectionString.includes('supabase.co');

const pool = new Pool({
  connectionString,
  ...(isSupabase && { ssl: { rejectUnauthorized: false } }),
});

module.exports = pool;
