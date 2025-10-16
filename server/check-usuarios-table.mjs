import pool from './db.js';

async function checkTable() {
  try {
    console.log('🔍 Verificando tabla usuarios...\n');
    
    // Verificar si existe la tabla
    const [tables] = await pool.query("SHOW TABLES LIKE 'usuarios'");
    
    if (tables.length === 0) {
      console.log('❌ La tabla "usuarios" NO EXISTE');
      console.log('\n📝 SQL para crear la tabla:');
      console.log(`
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  rol ENUM('admin', 'supervisor', 'usuario') DEFAULT 'usuario',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
      `);
    } else {
      console.log('✅ La tabla "usuarios" EXISTE\n');
      
      // Mostrar estructura
      const [columns] = await pool.query('DESCRIBE usuarios');
      console.log('📋 Estructura de la tabla:');
      console.table(columns);
      
      // Contar usuarios
      const [count] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
      console.log(`\n👥 Total de usuarios: ${count[0].total}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();
