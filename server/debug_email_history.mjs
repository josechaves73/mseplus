import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

try {
  console.log('🔍 Verificando estructura de la tabla email_history...\n');
  
  // Obtener estructura de la tabla
  const [columns] = await pool.query('DESCRIBE email_history');
  
  console.log('📋 Columnas de la tabla email_history:');
  columns.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  process.exit(0);
}