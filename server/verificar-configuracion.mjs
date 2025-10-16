import pool from './db.js';

async function verificarPermisosConfiguracion() {
  try {
    console.log('🔍 Verificando permisos existentes para módulo Configuración\n');

    const [rows] = await pool.query(
      'SELECT modulo, submodulo, accion, descripcion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion',
      ['Configuración']
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron permisos para el módulo Configuración');
      console.log('✅ Podemos proceder a crear los permisos');
    } else {
      console.log(`✅ Encontrados ${rows.length} permisos para Configuración:\n`);
      console.table(rows);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarPermisosConfiguracion();