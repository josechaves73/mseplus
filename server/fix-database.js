import mysql from 'mysql2/promise';

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mse'
  });

  try {
    console.log('1. Verificando si existe la tabla usuarios...\n');
    const [tablas] = await pool.query("SHOW TABLES LIKE 'usuarios'");
    
    if (tablas.length === 0) {
      console.log('Creando tabla usuarios...');
      await pool.query(`
        CREATE TABLE usuarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          nombre_completo VARCHAR(150) NOT NULL,
          email VARCHAR(150) UNIQUE,
          password_hash VARCHAR(255),
          rol VARCHAR(30) DEFAULT 'usuario',
          activo BOOLEAN DEFAULT TRUE,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          ultimo_acceso TIMESTAMP NULL,
          INDEX idx_username (username),
          INDEX idx_email (email),
          INDEX idx_activo (activo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabla usuarios creada');
    } else {
      console.log('✅ Tabla usuarios ya existe');
    }

    console.log('\n2. Insertando usuario admin...\n');
    await pool.query(`
      INSERT INTO usuarios (username, nombre_completo, email, rol, activo) 
      VALUES ('admin', 'Administrador del Sistema', 'admin@mseplus.com', 'admin', TRUE)
      ON DUPLICATE KEY UPDATE nombre_completo = 'Administrador del Sistema'
    `);
    console.log('✅ Usuario admin creado/actualizado');

    console.log('\n3. Verificando columna usuario_id en configuracion_sistema...\n');
    const [columnas] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'mse' 
        AND TABLE_NAME = 'configuracion_sistema' 
        AND COLUMN_NAME = 'usuario_id'
    `);

    if (columnas.length === 0) {
      console.log('Agregando columna usuario_id...');
      await pool.query(`
        ALTER TABLE configuracion_sistema 
        ADD COLUMN usuario_id INT DEFAULT 1 COMMENT 'ID del usuario (1 = admin por defecto)'
      `);
      console.log('✅ Columna usuario_id agregada');

      console.log('\nAgregando índice...');
      await pool.query(`
        ALTER TABLE configuracion_sistema 
        ADD INDEX idx_usuario_id (usuario_id)
      `);
      console.log('✅ Índice agregado');

      console.log('\nAgregando foreign key...');
      await pool.query(`
        ALTER TABLE configuracion_sistema 
        ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key agregada');
    } else {
      console.log('✅ Columna usuario_id ya existe');
    }

    console.log('\n4. Actualizando índice único...\n');
    try {
      await pool.query('ALTER TABLE configuracion_sistema DROP INDEX clave');
      console.log('✅ Índice antiguo eliminado');
    } catch (err) {
      console.log('⚠️  Índice antiguo no existe o ya fue eliminado');
    }

    try {
      await pool.query('ALTER TABLE configuracion_sistema ADD UNIQUE INDEX idx_clave_usuario (clave, usuario_id)');
      console.log('✅ Nuevo índice único compuesto creado');
    } catch (err) {
      console.log('⚠️  Índice compuesto ya existe');
    }

    console.log('\n5. Actualizando registros existentes...\n');
    await pool.query('UPDATE configuracion_sistema SET usuario_id = 1 WHERE usuario_id IS NULL OR usuario_id = 0');
    console.log('✅ Registros actualizados');

    console.log('\n6. Verificación final...\n');
    const [estructura] = await pool.query('DESCRIBE configuracion_sistema');
    console.table(estructura);

    const [configs] = await pool.query('SELECT * FROM configuracion_sistema');
    console.log('\nConfiguraciones actuales:');
    console.table(configs);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('SQL:', err.sql);
  }

  await pool.end();
  console.log('\n✅ Proceso completado!');
})();
