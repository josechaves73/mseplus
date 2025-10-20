-- Crear tabla para mensajes del chat interno
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  remitente_id INT(11) NOT NULL,
  destinatario_id INT(11) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE,
  INDEX idx_remitente (remitente_id),
  INDEX idx_destinatario (destinatario_id),
  INDEX idx_fecha (fecha),
  INDEX idx_conversacion (remitente_id, destinatario_id),
  FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para configuración del chat por usuario
CREATE TABLE IF NOT EXISTS chat_configuracion (
  usuario_id INT(11) NOT NULL PRIMARY KEY,
  chat_activo BOOLEAN DEFAULT TRUE,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración por defecto para usuarios existentes
INSERT IGNORE INTO chat_configuracion (usuario_id, chat_activo)
SELECT id, TRUE FROM usuarios;