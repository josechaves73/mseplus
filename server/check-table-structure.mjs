import pool from './db.js';

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla configuracion_sistema...');

    // Ver índices y constraints
    const [indexes] = await pool.query(`
      SHOW INDEX FROM configuracion_sistema
    `);

    console.log('📊 Índices encontrados:');
    indexes.forEach(index => {
      console.log(`  - ${index.Key_name}: ${index.Column_name} (${index.Index_type}) - Unique: ${index.Non_unique === 0 ? 'YES' : 'NO'}`);
    });

    // Ver estructura completa
    const [columns] = await pool.query(`
      DESCRIBE configuracion_sistema
    `);

    console.log('\n📋 Estructura de columnas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Ver todas las configuraciones actuales
    const [allConfigs] = await pool.query(`
      SELECT id, clave, LEFT(valor, 30) as valor_preview, usuario_id, fecha_modificacion
      FROM configuracion_sistema
      WHERE clave = 'dashboard_color_botones'
      ORDER BY usuario_id
    `);

    console.log('\n🎨 Todas las configuraciones de color de botones:');
    if (allConfigs.length === 0) {
      console.log('  (Ninguna configuración encontrada)');
    } else {
      allConfigs.forEach(config => {
        console.log(`  ID: ${config.id} | Usuario: ${config.usuario_id} | Color: ${config.valor_preview} | Fecha: ${config.fecha_modificacion}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();