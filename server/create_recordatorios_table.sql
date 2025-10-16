-- Crear tabla recordatorios para gestión de notas recordatorias
-- Esta tabla almacena notas breves de hasta 100 caracteres

CREATE TABLE IF NOT EXISTS recordatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Índices para mejorar rendimiento
    INDEX idx_activo (activo),
    INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunas notas de ejemplo
INSERT INTO recordatorios (texto) VALUES
('Revisar documentos de conductores vencidos'),
('Llamar a proveedor de combustible'),
('Reunión equipo logística - Viernes 3pm'),
('Verificar mantenimiento vehículos'),
('Enviar reporte semanal a gerencia');
