import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mseplus'
};

async function addColumns() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos MySQL');

    // Verificar si las columnas existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'articulos'
    `, [dbConfig.database]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('Columnas existentes en articulos:', existingColumns);

    // Agregar tipo_cert si no existe
    if (!existingColumns.includes('tipo_cert')) {
      await connection.query('ALTER TABLE articulos ADD COLUMN tipo_cert VARCHAR(100)');
      console.log('✅ Columna tipo_cert agregada exitosamente');
    } else {
      console.log('ℹ️ La columna tipo_cert ya existe');
    }

    // Agregar tipo_res si no existe
    if (!existingColumns.includes('tipo_res')) {
      await connection.query('ALTER TABLE articulos ADD COLUMN tipo_res VARCHAR(100)');
      console.log('✅ Columna tipo_res agregada exitosamente');
    } else {
      console.log('ℹ️ La columna tipo_res ya existe');
    }

    // Mostrar estructura final de la tabla
    const [structure] = await connection.query('DESCRIBE articulos');
    console.log('\n📋 Estructura actual de la tabla articulos:');
    structure.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    await connection.end();
    console.log('\n🔌 Conexión cerrada');
    console.log('✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addColumns();
