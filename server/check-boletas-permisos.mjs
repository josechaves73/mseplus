import pool from './db.js';

(async () => {
  try {
    const [permisos] = await pool.query('SELECT modulo, submodulo, accion FROM permisos_modulos WHERE modulo = ? ORDER BY submodulo, accion', ['Boletas']);
    console.log('Permisos disponibles para Boletas:');
    permisos.forEach(p => console.log(`  ${p.submodulo} > ${p.accion}`));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();