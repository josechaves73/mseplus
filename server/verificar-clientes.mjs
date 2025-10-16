import pool from './db.js';

async function verificarPermisosClientes() {
  try {
    console.log('🔍 Verificando permisos existentes para módulo Clientes\n');

    const [rows] = await pool.query(
      'SELECT modulo, submodulo, accion, descripcion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion',
      ['Clientes']
    );

    if (rows.length === 0) {
      console.log('❌ No se encontraron permisos para el módulo Clientes');
    } else {
      console.log(`✅ Encontrados ${rows.length} permisos para Clientes:\n`);
      console.table(rows);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarPermisosClientes();