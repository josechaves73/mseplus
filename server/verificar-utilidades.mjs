import pool from './db.js';

async function verificarPermisosUtilidades() {
  try {
    console.log('🔍 Verificando permisos existentes para módulo Utilidades\n');

    const [rows] = await pool.query(
      'SELECT modulo, submodulo, accion, descripcion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion',
      ['Utilidades']
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron permisos para el módulo Utilidades');
      console.log('✅ Podemos proceder a crear los permisos');
    } else {
      console.log(`✅ Encontrados ${rows.length} permisos para Utilidades:\n`);
      console.table(rows);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarPermisosUtilidades();