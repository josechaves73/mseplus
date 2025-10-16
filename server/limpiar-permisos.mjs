import pool from './db.js';

async function limpiarPermisos() {
  try {
    console.log('🗑️ Limpiando todos los permisos existentes...\n');

    // 1. Eliminar permisos de usuarios (FK constraint)
    const [deletedUsuarios] = await pool.query('DELETE FROM permisos_usuarios');
    console.log(`✅ ${deletedUsuarios.affectedRows} permisos de usuarios eliminados`);

    // 2. Eliminar todos los permisos de módulos
    const [deletedModulos] = await pool.query('DELETE FROM permisos_modulos');
    console.log(`✅ ${deletedModulos.affectedRows} permisos de módulos eliminados`);

    // 3. Resetear auto_increment
    await pool.query('ALTER TABLE permisos_modulos AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE permisos_usuarios AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment reseteado');

    // 4. Verificar limpieza
    const [count] = await pool.query('SELECT COUNT(*) as total FROM permisos_modulos');
    console.log(`\n📊 Permisos restantes: ${count[0].total}`);

    console.log('\n✅ Base de datos limpia y lista para nuevos permisos');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

limpiarPermisos();
