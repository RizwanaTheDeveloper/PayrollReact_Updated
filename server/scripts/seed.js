require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

async function seedUser({ name, email, password, role, designation }) {
  if (!email || !password) {
    console.warn(`Skipped ${role}: email or password missing in .env`);
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO employees (name, email, password_hash, role, designation)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    [name, email, hash, role, designation]
  );
  console.log(`${role} ready:`, email);
}

(async () => {
  try {
    const {
      ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD,
      EMPLOYEE_NAME, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD,
    } = process.env;

    await seedUser({
      name: ADMIN_NAME || 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      designation: 'Administrator',
    });

    await seedUser({
      name: EMPLOYEE_NAME || 'Employee',
      email: EMPLOYEE_EMAIL,
      password: EMPLOYEE_PASSWORD,
      role: 'employee',
      designation: 'Employee',
    });
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();