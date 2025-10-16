import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mse_db'
};

async function createDocuConfigTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Creando tabla docu_config...');
    
    // Crear tabla
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS docu_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        aplica_a VARCHAR(15) NOT NULL COMMENT 'Indica si aplica a vehiculo o conductor',
        nombre_documento VARCHAR(80) NOT NULL COMMENT 'Nombre del tipo de documento',
        fecha_creado_renovado DATE COMMENT 'Fecha de creación o renovación del documento',
        fecha_vencimiento DATE COMMENT 'Fecha de vencimiento del documento',
        nota VARCHAR(250) COMMENT 'Notas adicionales sobre el documento',
        aviso_vence_dias INT(3) DEFAULT 30 COMMENT 'Días de anticipación para aviso de vencimiento',
        autoridad_relacion VARCHAR(80) COMMENT 'Autoridad o entidad relacionada con el documento',
        
        INDEX idx_aplica_a (aplica_a),
        INDEX idx_fecha_vencimiento (fecha_vencimiento),
        INDEX idx_nombre_documento (nombre_documento)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Configuración de documentos para vehículos y conductores'
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Tabla docu_config creada exitosamente');
    
    // Verificar si ya hay datos
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM docu_config');
    
    if (rows[0].count === 0) {
      console.log('📝 Insertando datos de ejemplo...');
      
      // Insertar registros de ejemplo para vehículos
      const vehiculoInserts = [
        ['vehiculo', 'Licencia de Circulación', 30, 'Municipalidad', 'Documento obligatorio para circular'],
        ['vehiculo', 'Seguro Obligatorio (SOAP)', 15, 'Compañía de Seguros', 'Seguro obligatorio de accidentes personales'],
        ['vehiculo', 'Revisión Técnica', 30, 'Planta de Revisión Técnica', 'Inspección técnica vehicular'],
        ['vehiculo', 'Permiso de Circulación', 30, 'Municipalidad', 'Permiso municipal anual']
      ];
      
      // Insertar registros de ejemplo para conductores
      const conductorInserts = [
        ['conductor', 'Licencia de Conducir', 60, 'Dirección de Tránsito', 'Licencia clase profesional'],
        ['conductor', 'Certificado Médico', 30, 'Centro Médico Autorizado', 'Examen médico para conductores'],
        ['conductor', 'Curso de Manejo Defensivo', 90, 'Instituto de Capacitación', 'Capacitación obligatoria'],
        ['conductor', 'Examen Psicotécnico', 30, 'Centro Psicotécnico', 'Evaluación psicológica']
      ];
      
      const insertSQL = `
        INSERT INTO docu_config (aplica_a, nombre_documento, aviso_vence_dias, autoridad_relacion, nota) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      // Insertar datos de vehículos
      for (const vehiculo of vehiculoInserts) {
        await connection.execute(insertSQL, vehiculo);
      }
      
      // Insertar datos de conductores
      for (const conductor of conductorInserts) {
        await connection.execute(insertSQL, conductor);
      }
      
      console.log('✅ Datos de ejemplo insertados exitosamente');
    } else {
      console.log('ℹ️ La tabla ya contiene datos, omitiendo inserción de ejemplos');
    }
    
    // Mostrar estructura de la tabla
    console.log('📊 Estructura de la tabla:');
    const [describe] = await connection.execute('DESCRIBE docu_config');
    console.table(describe);
    
    // Mostrar datos insertados
    console.log('📋 Datos en la tabla:');
    const [data] = await connection.execute('SELECT * FROM docu_config ORDER BY aplica_a, nombre_documento');
    console.table(data);
    
    console.log('🎉 Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la función
createDocuConfigTable()
  .then(() => {
    console.log('✅ Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la ejecución:', error);
    process.exit(1);
  });

export { createDocuConfigTable };