import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function crearTablasPermisos() {
  try {
    console.log('📋 Iniciando creación de tablas de permisos...\n');

    const sqlFile = join(__dirname, 'create_permisos_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.query(stmt);
          const preview = stmt.trim().substring(0, 60).replace(/\n/g, ' ');
          console.log('✅ Ejecutado:', preview + '...');
        } catch (e) {
          const preview = stmt.trim().substring(0, 60).replace(/\n/g, ' ');
          console.error('❌ Error:', e.message);
          console.error('   En:', preview);
        }
      }
    }

    console.log('\n🔍 Verificando tablas creadas:');
    const [tables] = await pool.query("SHOW TABLES LIKE 'permisos%'");
    console.table(tables);

    const [count] = await pool.query('SELECT COUNT(*) as total FROM permisos_modulos');
    console.log('\n📊 Total permisos en catálogo:', count[0].total);

    const [sample] = await pool.query('SELECT * FROM permisos_modulos LIMIT 5');
    console.log('\n🔍 Muestra de permisos creados:');
    console.table(sample);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error general:', error);
    await pool.end();
    process.exit(1);
  }
}

crearTablasPermisos();
