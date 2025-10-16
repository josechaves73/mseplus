import pool from './db.js';

async function actualizarPermisosConfiguracion() {
  try {
    console.log('🔧 Actualizando permisos de Configuración...\n');

    // 1. Eliminar permisos antiguos de Configuración
    console.log('🗑️ Eliminando permisos antiguos de Configuración...');
    const [deleted] = await pool.query(`
      DELETE FROM permisos_modulos 
      WHERE modulo = 'Configuracion'
    `);
    console.log(`✅ ${deleted.affectedRows} permisos eliminados\n`);

    // 2. Insertar solo el permiso de acceso
    console.log('➕ Insertando nuevo permiso de Configuración...');
    await pool.query(`
      INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion, activo)
      VALUES ('Configuracion', 'Acceso', 'ver', 'Acceder al módulo de configuración del sistema', TRUE)
    `);
    console.log('✅ Permiso de acceso creado\n');

    // 3. Verificar resultado
    console.log('📊 Permisos actuales de Configuración:');
    const [permisos] = await pool.query(`
      SELECT id, modulo, submodulo, accion, descripcion, activo
      FROM permisos_modulos
      WHERE modulo = 'Configuracion'
    `);
    console.table(permisos);

    console.log('\n✅ Actualización completada exitosamente');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

actualizarPermisosConfiguracion();
