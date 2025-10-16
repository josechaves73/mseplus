import pool from './db.js';

async function agregarPermisos(modulo, permisos) {
  try {
    console.log(`\n📦 Agregando permisos para módulo: ${modulo}`);
    
    for (const permiso of permisos) {
      await pool.query(`
        INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion, activo)
        VALUES (?, ?, ?, ?, TRUE)
      `, [modulo, permiso.submodulo, permiso.accion, permiso.descripcion]);
      
      console.log(`  ✅ ${permiso.submodulo} > ${permiso.accion}: ${permiso.descripcion}`);
    }
    
    console.log(`✅ ${permisos.length} permisos agregados para ${modulo}`);
    
  } catch (error) {
    console.error('❌ Error agregando permisos:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Sistema de Creación de Permisos - Agregando Módulo Configuración\n');
    console.log('=' .repeat(60));

    // MÓDULO: CONFIGURACIÓN (NUEVO)
    await agregarPermisos('Configuración', [
      // Submódulos independientes (solo acceso)
      { submodulo: 'Configuración General', accion: 'acceso', descripcion: 'Acceder a configuración general del sistema' },
      { submodulo: 'Wallpaper', accion: 'acceso', descripcion: 'Configurar wallpaper del sistema' },
      { submodulo: 'Configuración de Emails', accion: 'acceso', descripcion: 'Configurar cuentas de email' },
      { submodulo: 'Usuarios', accion: 'acceso', descripcion: 'Gestionar usuarios del sistema' }
    ]);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Todos los permisos han sido creados exitosamente\n');
    
    // Mostrar resumen
    const [total] = await pool.query('SELECT COUNT(*) as total FROM permisos_modulos');
    const [porModulo] = await pool.query(`
      SELECT modulo, COUNT(*) as cantidad 
      FROM permisos_modulos 
      GROUP BY modulo 
      ORDER BY modulo
    `);
    
    console.log(`📊 Total de permisos: ${total[0].total}\n`);
    console.table(porModulo);
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
