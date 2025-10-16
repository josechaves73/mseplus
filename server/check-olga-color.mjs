import pool from './db.js';

async function checkOlgaColor() {
  try {
    console.log('🔍 Consultando configuración de color para Olga (usuario_id = 4)...');

    const [rows] = await pool.query(
      'SELECT id, clave, valor, usuario_id, fecha_modificacion FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      ['dashboard_color_botones', 4]
    );

    if (rows.length === 0) {
      console.log('❌ Olga no tiene configuración de color guardada');
      console.log('ℹ️  Esto significa que está usando el color por defecto: #0d4a0d (verde oscuro)');
    } else {
      console.log('✅ Configuración encontrada para Olga:');
      console.log('📊 ID:', rows[0].id);
      console.log('🎨 Color:', rows[0].valor);
      console.log('👤 Usuario ID:', rows[0].usuario_id);
      console.log('📅 Última modificación:', rows[0].fecha_modificacion);
    }

    // También mostrar todas las configuraciones de Olga
    console.log('\n📋 Todas las configuraciones de Olga:');
    const [allRows] = await pool.query(
      'SELECT id, clave, LEFT(valor, 50) as valor_preview, usuario_id, fecha_modificacion FROM configuracion_sistema WHERE usuario_id = 4 ORDER BY clave'
    );

    if (allRows.length === 0) {
      console.log('❌ Olga no tiene ninguna configuración guardada');
    } else {
      console.table(allRows);
    }

  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error);
  } finally {
    process.exit(0);
  }
}

checkOlgaColor();