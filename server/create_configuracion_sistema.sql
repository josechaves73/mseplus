-- Tabla genérica para configuraciones del sistema
-- Reutilizable para futuras configuraciones
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clave VARCHAR(100) UNIQUE NOT NULL COMMENT 'Identificador único de la configuración',
  valor TEXT NOT NULL COMMENT 'Valor de la configuración (puede ser JSON, string, etc.)',
  descripcion VARCHAR(255) COMMENT 'Descripción legible de la configuración',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración por defecto para color de botones del dashboard
INSERT INTO configuracion_sistema (clave, valor, descripcion) 
VALUES (
  'dashboard_color_botones',
  '#0d4a0d',
  'Color de fondo de los botones de acceso directo del Dashboard'
) ON DUPLICATE KEY UPDATE 
  valor = '#0d4a0d';

-- Verificar inserción
SELECT * FROM configuracion_sistema WHERE clave = 'dashboard_color_botones';
