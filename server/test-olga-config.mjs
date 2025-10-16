import pool from './db.js';

async function testOlgaConfig() {
  try {
    console.log('🧪 Probando guardado de configuración para Olga (usuario_id = 4)...');

    // Simular lo que hace el frontend cuando guarda
    const testConfig = {
      clave: 'dashboard_color_botones',
      valor: '#ff6b6b', // Color de prueba: rojo coral
      descripcion: 'Color de fondo de los botones de acceso directo del Dashboard'
    };

    console.log('💾 Intentando guardar:', testConfig, 'para usuario_id: 4');

    // Ejecutar la misma query que usa el servidor
    await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        valor = ?,
        descripcion = ?,
        fecha_modificacion = CURRENT_TIMESTAMP
    `, [testConfig.clave, testConfig.valor, testConfig.descripcion, 4, testConfig.valor, testConfig.descripcion]);

    console.log('✅ Configuración guardada exitosamente para Olga');

    // Verificar que se guardó
    const [rows] = await pool.query(
      'SELECT id, clave, valor, usuario_id, fecha_modificacion FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      ['dashboard_color_botones', 4]
    );

    if (rows.length > 0) {
      console.log('🔍 Verificación - Configuración encontrada:');
      console.log('📊 ID:', rows[0].id);
      console.log('🎨 Color:', rows[0].valor);
      console.log('👤 Usuario ID:', rows[0].usuario_id);
      console.log('📅 Fecha modificación:', rows[0].fecha_modificacion);
    } else {
      console.log('❌ Error: No se encontró la configuración después de guardar');
    }

    // Comparar con Admin
    console.log('\n📊 Comparación con Admin (usuario_id = 1):');
    const [adminRows] = await pool.query(
      'SELECT id, clave, valor, usuario_id, fecha_modificacion FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      ['dashboard_color_botones', 1]
    );

    if (adminRows.length > 0) {
      console.log('👑 Admin - Color:', adminRows[0].valor);
      console.log('👤 Olga - Color:', rows[0]?.valor || 'No tiene');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testOlgaConfig();