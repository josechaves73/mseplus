import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function countManifiestosTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus'
    });

    // Contar registros en tabla manifiestos
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as total FROM manifiestos'
    );

    console.log('📊 Total de registros en tabla manifiestos:', rows[0].total);

    // Mostrar estructura de la tabla
    const [structure] = await connection.execute(
      'DESCRIBE manifiestos'
    );

    console.log('📋 Estructura de la tabla manifiestos:');
    structure.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });

    // Mostrar algunos registros de ejemplo
    const [samples] = await connection.execute(
      'SELECT * FROM manifiestos LIMIT 3'
    );

    console.log('📋 Primeros 3 registros de manifiestos:');
    samples.forEach((sample, index) => {
      console.log(`  Registro ${index + 1}:`, sample);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

countManifiestosTable();
