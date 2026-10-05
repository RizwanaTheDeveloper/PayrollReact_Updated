require('./env');

const { Client, Pool } = require('pg');

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {};

if (config.connectionString) {
  try {
    const url = new URL(config.connectionString);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error('Unsupported database URL');
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid postgres:// or postgresql:// connection URL in server/.env.');
  }
}

// Inspect the same configuration pg will use, including PGPASSWORD fallback.
let parameters;
try {
  parameters = new Client(config).connectionParameters;
} catch {
  throw new Error('Unable to read PostgreSQL configuration. Check DATABASE_URL in server/.env.');
}
if (typeof parameters.password !== 'string' || !parameters.password) {
  throw new Error('PostgreSQL password is missing. Set DATABASE_URL with your database password, or set PGPASSWORD, in server/.env.');
}

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
