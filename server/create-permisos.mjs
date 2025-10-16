import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPermisosTables() {
  let connection;

  try {
    // Leer configuración de base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus',
      multipleStatements: true
    };

    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);

    // Leer archivo SQL
    const sqlFile = path.join(__dirname, 'create_permisos_sistema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Ejecutando script de permisos...');

    // Ejecutar el SQL
    await connection.execute(sqlContent);

    console.log('✅ Tablas de permisos creadas exitosamente!');
    console.log('👤 Usuario admin tiene todos los permisos asignados.');

    // Verificar que se crearon las tablas
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('permisos_modulos', 'permisos_usuarios')
    `, [dbConfig.database]);

    console.log('📊 Tablas creadas:', tables.map(t => t.TABLE_NAME));

    // Mostrar estadísticas
    const [stats] = await connection.execute(`
      SELECT
        (SELECT COUNT(*) FROM permisos_modulos) as total_permisos,
        (SELECT COUNT(*) FROM permisos_usuarios WHERE permitido = true) as permisos_admin
    `);

    console.log('📈 Estadísticas:', stats[0]);

  } catch (error) {
    console.error('❌ Error creando tablas de permisos:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createPermisosTables();
}

export { createPermisosTables };