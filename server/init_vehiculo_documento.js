import pool from './db.js';

const createSql = `
CREATE TABLE IF NOT EXISTS vehiculo_documento (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  placa CHAR(10) NOT NULL,
  id_docu INT(11) NOT NULL,
  fecha_emision DATE NULL,
  fecha_vence DATE NULL,
  notas VARCHAR(256) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_placa (placa),
  INDEX idx_id_docu (id_docu),
  INDEX idx_fecha_vence (fecha_vence),
  UNIQUE KEY unique_vehiculo_documento (placa, id_docu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

(async () => {
  try {
    const [result] = await pool.query(createSql);
    console.log('Tabla vehiculo_documento creada o ya existente:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error creando tabla vehiculo_documento:', err);
    process.exit(1);
  }
})();
