import pool from './db.js';

(async () => {
  try {
    // Verificar artículos con descripciones vacías o solo espacios
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM articulos WHERE TRIM(descri) = "" OR descri IS NULL');
    console.log('Artículos sin descripción (vacía o NULL):', rows[0].total);

    // Verificar algunos ejemplos con descripciones
    const [examples] = await pool.query('SELECT codigo, descri, LENGTH(TRIM(descri)) as len FROM articulos LIMIT 10');
    console.log('Ejemplos de artículos con longitud de descripción:');
    examples.forEach(row => console.log(`${row.codigo}: "${row.descri}" (longitud: ${row.len})`));

    // Verificar el reporte actual
    console.log('\nVerificando reporte agrupado...');
    const [reporte] = await pool.query(`
      SELECT a.codigo, a.descri,
             COALESCE(SUM(mp.ebodega), 0) as ebodega_total,
             COALESCE(SUM(mp.eproceso), 0) as eproceso_total,
             COALESCE(SUM(mp.eterminado), 0) as eterminado_total,
             COALESCE(SUM(mp.despachado), 0) as despachado_total
      FROM articulos a
      LEFT JOIN materiales_proceso mp ON a.codigo = mp.codigo
      GROUP BY a.codigo, a.descri
      LIMIT 5
    `);
    console.log('Primeros 5 del reporte:');
    reporte.forEach(row => console.log(`${row.codigo}: "${row.descri}"`));

  } catch (error) {
    console.error('Error:', error);
  }
})();