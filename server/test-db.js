import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Probando conexión a la base de datos...');
  console.log(`📡 Host: ${process.env.DB_HOST}`);
  console.log(`👤 Usuario: ${process.env.DB_USER}`);
  console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`);
  console.log('─'.repeat(50));

  try {
    // Crear conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 segundos timeout
      acquireTimeout: 10000,
      timeout: 10000
    });

    console.log('✅ Conexión establecida exitosamente!');

    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows);

    // Verificar si las tablas existen
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas disponibles:', tables.map(t => Object.values(t)[0]));

    // Cerrar conexión
    await connection.end();
    console.log('✅ Conexión cerrada correctamente');

  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('SQL State:', error.sqlState);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 El servidor rechaza la conexión. Verifica:');
      console.log('   - Puerto MySQL (3306)');
      console.log('   - Firewall del servidor');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Credenciales incorrectas. Verifica:');
      console.log('   - Usuario y contraseña');
      console.log('   - Permisos del usuario');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host no encontrado. Verifica:');
      console.log('   - URL del servidor');
      console.log('   - Conexión a internet');
    }
  }
}

testDatabaseConnection();
