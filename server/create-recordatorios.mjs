import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function createRecordatoriosTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mseplus'
    });

    console.log('✅ Conexión establecida con MySQL');

    // Crear tabla recordatorios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recordatorios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        texto VARCHAR(100) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        INDEX idx_activo (activo),
        INDEX idx_fecha_creacion (fecha_creacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabla recordatorios creada exitosamente');

    // Insertar notas de ejemplo
    await connection.query(`
      INSERT INTO recordatorios (texto) VALUES
      ('Revisar documentos de conductores vencidos'),
      ('Llamar a proveedor de combustible'),
      ('Reunión equipo logística - Viernes 3pm'),
      ('Verificar mantenimiento vehículos'),
      ('Enviar reporte semanal a gerencia')
    `);

    console.log('✅ Notas de ejemplo insertadas');
    console.log('🎉 Tabla recordatorios configurada correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexión cerrada');
    }
  }
}

createRecordatoriosTable();
