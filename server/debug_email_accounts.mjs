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
  console.log('🔍 Verificando estructura de la tabla email_accounts...\n');
  
  // Obtener estructura de la tabla
  const [columns] = await pool.query('DESCRIBE email_accounts');
  
  console.log('📋 Columnas de la tabla email_accounts:');
  columns.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  // Mostrar algunos registros de ejemplo
  const [records] = await pool.query('SELECT * FROM email_accounts LIMIT 3');
  
  console.log('\n📧 Registros de ejemplo:');
  records.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.nombre || 'Sin nombre'}`);
    console.log(`     Email: ${record.email || 'N/A'}`);
    console.log(`     Host: ${record.smtp_host || 'N/A'}`);
    console.log(`     Puerto: ${record.smtp_port || 'N/A'}`);
    console.log('     Campos disponibles:', Object.keys(record).join(', '));
    console.log('');
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  process.exit(0);
}