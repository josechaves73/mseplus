import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testNewEndpoint() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus'
    });

    // Probar la nueva consulta
    const [rows] = await connection.execute(`
      SELECT
        numero,
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
        tipo,
        peso_local,
        notas,
        articulo,
        clienten as cliente,
        cantidad
      FROM manifiestos
      WHERE fecha IS NOT NULL
      ORDER BY fecha DESC, numero DESC
      LIMIT 5
    `);

    console.log('📊 Primeros 5 resultados de la nueva consulta:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. Manifiesto ${row.numero} - Fecha: ${row.fecha} - Tipo: ${row.tipo} - Peso: ${row.peso_local}`);
    });

    // Contar total sin limit
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as total FROM manifiestos WHERE fecha IS NOT NULL
    `);

    console.log(`\n📈 Total de registros que devolverá el endpoint: ${countRows[0].total}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewEndpoint();
