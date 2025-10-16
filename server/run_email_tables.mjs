import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mseplus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  const sql = fs.readFileSync('create_email_tables.sql', 'utf8');
  const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await pool.execute(statement);
        console.log('✅ Ejecutado:', statement.substring(0, 50) + '...');
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }
  }

  console.log('🎉 Script de creación de tablas completado');
  
} catch (error) {
  console.error('Error general:', error);
} finally {
  process.exit(0);
}