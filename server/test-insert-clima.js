import mysql from 'mysql2/promise';

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mse'
  });

  try {
    console.log('Intentando insertar configuración de clima...\n');
    
    const clave = 'estado_tiempo_config';
    const valor = JSON.stringify({ ciudad: 'Quito', pais: 'EC', unidades: 'metric' });
    const descripcion = 'Configuración del widget Estado del Tiempo';
    const usuario_id = 1;

    const [result] = await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        valor = ?,
        descripcion = ?,
        fecha_modificacion = CURRENT_TIMESTAMP
    `, [clave, valor, descripcion, usuario_id, valor, descripcion]);

    console.log('✅ Configuración insertada exitosamente!');
    console.log('Resultado:', result);

    // Verificar la inserción
    const [configs] = await pool.query(
      'SELECT * FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      [clave, usuario_id]
    );
    
    console.log('\nConfiguración guardada:');
    console.table(configs);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Código de error:', err.code);
    console.error('SQL State:', err.sqlState);
  }

  await pool.end();
})();
