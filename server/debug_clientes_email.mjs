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
  console.log('🔍 Verificando clientes con emails...\n');
  
  // Contar total de clientes
  const [totalClientes] = await pool.query('SELECT COUNT(*) as total FROM clientes');
  console.log('📊 Total de clientes en BD:', totalClientes[0].total);
  
  // Contar clientes con email principal
  const [conEmail] = await pool.query('SELECT COUNT(*) as total FROM clientes WHERE email IS NOT NULL AND email != ""');
  console.log('📧 Clientes con email principal:', conEmail[0].total);
  
  // Contar clientes con email secundario
  const [conEmail2] = await pool.query('SELECT COUNT(*) as total FROM clientes WHERE email2 IS NOT NULL AND email2 != ""');
  console.log('📧 Clientes con email2:', conEmail2[0].total);
  
  // Contar clientes con al menos un email
  const [conAlgunEmail] = await pool.query(`
    SELECT COUNT(*) as total FROM clientes 
    WHERE (email IS NOT NULL AND email != "") 
       OR (email2 IS NOT NULL AND email2 != "")
  `);
  console.log('📧 Clientes con al menos un email:', conAlgunEmail[0].total);
  
  // Mostrar algunos ejemplos
  const [ejemplos] = await pool.query(`
    SELECT codigo, nombre, email, email2 
    FROM clientes 
    WHERE (email IS NOT NULL AND email != "") 
       OR (email2 IS NOT NULL AND email2 != "")
    LIMIT 5
  `);
  
  console.log('\n📋 Ejemplos de clientes con email:');
  ejemplos.forEach(cliente => {
    console.log(`  ${cliente.codigo} - ${cliente.nombre}`);
    console.log(`    Email: ${cliente.email || 'N/A'}`);
    console.log(`    Email2: ${cliente.email2 || 'N/A'}`);
    console.log('');
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  process.exit(0);
}