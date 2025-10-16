import pool from './db.js';

async function verificarPermisosManifiestos() {
  try {
    console.log('🔍 Verificando permisos existentes para módulo Manifiestos\n');

    const [rows] = await pool.query(
      'SELECT modulo, submodulo, accion, descripcion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion',
      ['Manifiestos']
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron permisos para el módulo Manifiestos');
      console.log('✅ Podemos proceder a crear los permisos');
    } else {
      console.log(`✅ Encontrados ${rows.length} permisos para Manifiestos:\n`);
      console.table(rows);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarPermisosManifiestos();