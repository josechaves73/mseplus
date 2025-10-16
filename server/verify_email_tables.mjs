import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mseplus'
});

try {
  console.log('🔍 Verificando tablas de email...');
  
  const [rows] = await pool.query("SHOW TABLES LIKE 'email_%'");
  console.log('📊 Tablas de email encontradas:');
  rows.forEach(row => console.log('  ✅', Object.values(row)[0]));
  
  if (rows.length > 0) {
    console.log('\n📧 Verificando plantillas de email:');
    const [templates] = await pool.query('SELECT COUNT(*) as count FROM email_templates');
    console.log('  📝 Plantillas:', templates[0].count);
    
    console.log('\n📊 Verificando tabla historial:');
    const [history] = await pool.query('SELECT COUNT(*) as count FROM email_history');
    console.log('  📜 Registros en historial:', history[0].count);
  }
  
  console.log('\n✅ Verificación completada');
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  process.exit(0);
}