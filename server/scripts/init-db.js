const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const pool = require('../src/config/db');

const config = { ...pool.options, connectionTimeoutMillis: 5000 };

async function connectDatabase() {
  const client = new Client(config);
  try {
    await client.connect();
    return client;
  } catch (err) {
    await client.end();
    if (err.code !== '3D000') throw err;
  }

  const database = client.connectionParameters.database;
  const maintenanceConfig = { ...config, database: 'postgres' };
  if (config.connectionString) {
    const url = new URL(config.connectionString);
    url.pathname = '/postgres';
    url.searchParams.delete('database');
    maintenanceConfig.connectionString = url.toString();
  }

  const maintenance = new Client(maintenanceConfig);
  try {
    await maintenance.connect();
    // PostgreSQL identifiers cannot use query parameters.
    const identifier = '"' + database.replace(/"/g, '""') + '"';
    try {
      await maintenance.query(`CREATE DATABASE ${identifier}`);
      console.log(`Created database: ${database}`);
    } catch (err) {
      if (err.code !== '42P04') throw err;
    }
  } finally {
    await maintenance.end();
  }

  const target = new Client(config);
  try {
    await target.connect();
    return target;
  } catch (err) {
    await target.end();
    throw err;
  }
}

(async () => {
  let client;
  try {
    const schema = fs.readFileSync(path.resolve(__dirname, '../src/schema.sql'), 'utf8');
    client = await connectDatabase();
    await client.query('BEGIN');
    await client.query('SET LOCAL search_path TO public');
    await client.query(schema);
    await client.query('COMMIT');
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    console.log(`Database ready: ${client.connectionParameters.database}`);
    console.log(`Tables: ${rows.map(row => row.table_name).join(', ')}`);
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error(`Database initialization failed${err.code ? ` (${err.code})` : ''}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (client) await client.end();
    await pool.end();
  }
})();
