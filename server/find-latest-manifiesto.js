import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function findLatestManifiesto() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus'
    });

    // Encontrar el registro con la fecha más alta
    const [latestRows] = await connection.execute(
      'SELECT * FROM manifiestos ORDER BY fecha DESC LIMIT 1'
    );

    console.log('📅 Registro con la fecha más alta:');
    console.log('Detalles del registro:', latestRows[0]);

    // También mostrar las 3 fechas más recientes
    const [recentRows] = await connection.execute(
      'SELECT numero, fecha, tipo, peso_local FROM manifiestos ORDER BY fecha DESC LIMIT 3'
    );

    console.log('\n📋 Los 3 manifiestos más recientes:');
    recentRows.forEach((row, index) => {
      console.log(`${index + 1}. Manifiesto ${row.numero} - Fecha: ${row.fecha.toISOString().split('T')[0]} - Tipo: ${row.tipo} - Peso: ${row.peso_local}`);
    });

    // Estadísticas de fechas
    const [dateStats] = await connection.execute(`
      SELECT
        MIN(fecha) as fecha_minima,
        MAX(fecha) as fecha_maxima,
        COUNT(*) as total_registros
      FROM manifiestos
      WHERE fecha IS NOT NULL
    `);

    console.log('\n📊 Estadísticas de fechas:');
    console.log(`Fecha mínima: ${dateStats[0].fecha_minima.toISOString().split('T')[0]}`);
    console.log(`Fecha máxima: ${dateStats[0].fecha_maxima.toISOString().split('T')[0]}`);
    console.log(`Total de registros con fecha: ${dateStats[0].total_registros}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findLatestManifiesto();
