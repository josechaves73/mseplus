import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

async function createChatTables() {
  let connection;

  try {
    console.log('🔧 Conectando a la base de datos...');

    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conexión exitosa');

    console.log('📄 Creando tabla chat_mensajes...');

    // Crear tabla chat_mensajes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_mensajes (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        remitente_id INT(11) NOT NULL,
        destinatario_id INT(11) NOT NULL,
        mensaje TEXT NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        leido BOOLEAN DEFAULT FALSE,
        INDEX idx_remitente (remitente_id),
        INDEX idx_destinatario (destinatario_id),
        INDEX idx_fecha (fecha),
        INDEX idx_conversacion (remitente_id, destinatario_id),
        FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('📄 Creando tabla chat_configuracion...');

    // Crear tabla chat_configuracion
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_configuracion (
        usuario_id INT(11) NOT NULL PRIMARY KEY,
        chat_activo BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('📄 Insertando configuración por defecto para usuarios existentes...');

    // Insertar configuración por defecto
    await connection.execute(`
      INSERT IGNORE INTO chat_configuracion (usuario_id, chat_activo)
      SELECT id, TRUE FROM usuarios
    `);

    console.log('📄 Configurando limpieza automática de mensajes antiguos...');

    // Intentar crear el evento (puede fallar si no hay permisos)
    try {
      await connection.execute(`SET GLOBAL event_scheduler = ON`);

      await connection.execute(`
        CREATE EVENT IF NOT EXISTS limpiar_chat_antiguo
        ON SCHEDULE EVERY 1 DAY
        DO
          DELETE FROM chat_mensajes WHERE fecha < DATE_SUB(NOW(), INTERVAL 5 DAY)
      `);

      console.log('✅ Evento de limpieza automática creado');
    } catch (eventError) {
      console.log('⚠️ No se pudo crear el evento automático (posible falta de permisos)');
      console.log('   La limpieza se puede hacer manualmente o con un cron job');
    }

    console.log('✅ Tablas de chat creadas exitosamente');
    console.log('📋 Tablas creadas:');
    console.log('   - chat_mensajes: Para almacenar mensajes del chat');
    console.log('   - chat_configuracion: Para configuración por usuario');

    // Verificar que las tablas se crearon
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'chat_%'"
    );

    console.log('📊 Tablas encontradas:', tables.map(row => Object.values(row)[0]));

    // Verificar configuración inicial
    const [configCount] = await connection.execute(
      "SELECT COUNT(*) as total FROM chat_configuracion"
    );

    console.log(`👥 Configuración inicializada para ${configCount[0].total} usuarios`);

  } catch (error) {
    console.error('❌ Error al crear las tablas de chat:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

createChatTables();