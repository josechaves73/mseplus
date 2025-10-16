import pool from './db.js';

async function verificarPermisosTransportes() {
  try {
    console.log('🔍 Verificando permisos existentes para módulo Transportes\n');

    const [rows] = await pool.query(
      'SELECT modulo, submodulo, accion, descripcion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion',
      ['Transportes']
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron permisos para el módulo Transportes');
    } else {
      console.log(`✅ Encontrados ${rows.length} permisos para Transportes:\n`);
      console.table(rows);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarPermisosTransportes();