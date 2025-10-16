import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { env } from 'process';
dotenv.config();

console.log('🔌 Intentando conectar a DB con:', {
  host: env.DB_HOST,
  user: env.DB_USER,
  database: env.DB_NAME,
  password: env.DB_PASSWORD ? '***' : 'NO PASSWORD'
});

const pool = mysql.createPool({
  host: env.DB_HOST || 's5232.use1.stableserver.net',
  user: env.DB_USER || 'computac_jose_chaves',
  password: env.DB_PASSWORD || 'Jach1973',
  database: env.DB_NAME || 'computac_CONTROL_MSE',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  connectTimeout: 60000,
  multipleStatements: true
});

// Probar conexión
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a DB exitosa');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a DB:', err.message);
  });

export default pool;
