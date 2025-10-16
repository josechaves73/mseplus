import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function countManifiestos() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus'
    });

    // Contar registros en boletas con manifiesto no nulo
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as total FROM boletas WHERE manifiesto IS NOT NULL AND manifiesto != ""'
    );

    console.log('📊 Total de registros en tabla boletas con manifiesto:', rows[0].total);

    // Contar manifiestos únicos
    const [uniqueRows] = await connection.execute(
      'SELECT COUNT(DISTINCT manifiesto) as total_unique FROM boletas WHERE manifiesto IS NOT NULL AND manifiesto != ""'
    );

    console.log('📊 Total de manifiestos únicos:', uniqueRows[0].total_unique);

    // Mostrar algunos ejemplos
    const [samples] = await connection.execute(
      'SELECT manifiesto, COUNT(*) as cantidad_boletas FROM boletas WHERE manifiesto IS NOT NULL AND manifiesto != "" GROUP BY manifiesto ORDER BY COUNT(*) DESC LIMIT 5'
    );

    console.log('📋 Top 5 manifiestos por cantidad de boletas:');
    samples.forEach((sample, index) => {
      console.log(`  ${index + 1}. Manifiesto ${sample.manifiesto}: ${sample.cantidad_boletas} boletas`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

countManifiestos();
