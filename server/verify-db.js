import mysql from 'mysql2/promise';

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mse'
  });

  try {
    console.log('Verificando estructura de configuracion_sistema...\n');
    const [rows] = await pool.query('DESCRIBE configuracion_sistema');
    console.table(rows);

    console.log('\nVerificando usuario admin...\n');
    const [users] = await pool.query('SELECT * FROM usuarios WHERE username = "admin"');
    console.table(users);

    console.log('\nVerificando configuraciones existentes...\n');
    const [configs] = await pool.query('SELECT * FROM configuracion_sistema');
    console.table(configs);

  } catch (err) {
    console.error('Error:', err.message);
  }

  await pool.end();
})();
