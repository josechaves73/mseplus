import pool from './db.js';

async function createConfiguracionSistema() {
  try {
    console.log('🔧 Creando tabla configuracion_sistema...');

    // Crear tabla
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        id INT PRIMARY KEY AUTO_INCREMENT,
        clave VARCHAR(100) UNIQUE NOT NULL COMMENT 'Identificador único de la configuración',
        valor TEXT NOT NULL COMMENT 'Valor de la configuración',
        descripcion VARCHAR(255) COMMENT 'Descripción legible de la configuración',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clave (clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabla configuracion_sistema creada exitosamente');

    // Insertar configuración por defecto
    await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE valor = valor
    `, [
      'dashboard_color_botones',
      '#0d4a0d',
      'Color de fondo de los botones de acceso directo del Dashboard'
    ]);

    console.log('✅ Configuración por defecto insertada');

    // Verificar
    const [rows] = await pool.query(
      'SELECT * FROM configuracion_sistema WHERE clave = ?',
      ['dashboard_color_botones']
    );

    console.log('📋 Configuración guardada:', rows[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createConfiguracionSistema();
