import pool from './db.js';

async function verificarConfiguracionesUsuario() {
  try {
    console.log('🔍 Verificando configuraciones de usuario existentes...\n');

    const [rows] = await pool.query(
      'SELECT clave, descripcion, valor FROM configuracion_sistema WHERE usuario_id = 1 ORDER BY clave'
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron configuraciones para el usuario admin');
    } else {
      console.log(`✅ Encontradas ${rows.length} configuraciones para el usuario admin:\n`);
      rows.forEach(config => {
        console.log(`📋 ${config.clave}`);
        console.log(`   Descripción: ${config.descripcion}`);
        console.log(`   Valor: ${config.valor.substring(0, 100)}${config.valor.length > 100 ? '...' : ''}\n`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarConfiguracionesUsuario();