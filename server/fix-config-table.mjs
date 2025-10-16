import pool from './db.js';

async function fixConfigTable() {
  try {
    console.log('🔧 Arreglando tabla configuracion_sistema...');

    // 1. Verificar estructura actual
    console.log('📊 Verificando estructura actual...');
    const [indexes] = await pool.query('SHOW INDEX FROM configuracion_sistema');
    console.log('Índices actuales:', indexes.map(idx => `${idx.Key_name}: ${idx.Column_name} (Unique: ${idx.Non_unique === 0})`));

    // 2. Eliminar el índice único en 'clave'
    console.log('🗑️ Eliminando índice único en columna "clave"...');
    try {
      await pool.query('ALTER TABLE configuracion_sistema DROP INDEX clave');
      console.log('✅ Índice eliminado exitosamente');
    } catch (error) {
      console.log('⚠️ El índice ya no existe o no se pudo eliminar:', error.message);
    }

    // 3. Crear nuevo índice único compuesto
    console.log('🔨 Creando nuevo índice único compuesto (clave, usuario_id)...');
    try {
      await pool.query('ALTER TABLE configuracion_sistema ADD CONSTRAINT uk_clave_usuario UNIQUE (clave, usuario_id)');
      console.log('✅ Nuevo índice único compuesto creado exitosamente');
    } catch (error) {
      console.log('⚠️ Error al crear índice compuesto:', error.message);
    }

    // 4. Verificar estructura final
    console.log('📊 Verificando estructura final...');
    const [newIndexes] = await pool.query('SHOW INDEX FROM configuracion_sistema');
    console.log('Índices finales:', newIndexes.map(idx => `${idx.Key_name}: ${idx.Column_name} (Unique: ${idx.Non_unique === 0})`));

    // 5. Probar que ahora funciona para múltiples usuarios
    console.log('🧪 Probando guardado para múltiples usuarios...');

    // Guardar para Admin (usuario_id = 1)
    await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE valor = ?, descripcion = ?, fecha_modificacion = CURRENT_TIMESTAMP
    `, ['dashboard_color_botones', '#22c55e', 'Color verde para Admin', 1, '#22c55e', 'Color verde para Admin']);

    // Guardar para Olga (usuario_id = 4)
    await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE valor = ?, descripcion = ?, fecha_modificacion = CURRENT_TIMESTAMP
    `, ['dashboard_color_botones', '#ff6b6b', 'Color rojo para Olga', 4, '#ff6b6b', 'Color rojo para Olga']);

    // Verificar resultados
    const [results] = await pool.query(`
      SELECT id, clave, valor, usuario_id, fecha_modificacion
      FROM configuracion_sistema
      WHERE clave = 'dashboard_color_botones'
      ORDER BY usuario_id
    `);

    console.log('🎨 Configuraciones de color guardadas:');
    results.forEach(row => {
      console.log(`  👤 Usuario ${row.usuario_id}: ${row.valor} (ID: ${row.id})`);
    });

    console.log('✅ ¡Tabla arreglada! Ahora cada usuario puede tener sus propias configuraciones.');

  } catch (error) {
    console.error('❌ Error al arreglar tabla:', error);
  } finally {
    process.exit(0);
  }
}

fixConfigTable();