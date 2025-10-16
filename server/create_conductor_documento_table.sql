-- Crear tabla conductor_documento para gestión de documentación de conductores
-- Esta tabla relaciona choferes con sus documentos y fechas

CREATE TABLE conductor_documento (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    codigo_chofer INT(11) NOT NULL,
    id_docu INT(11) NOT NULL,
    fecha_emision DATE NULL,
    fecha_vence DATE NULL,
    notas VARCHAR(256) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para mejorar rendimiento
    INDEX idx_codigo_chofer (codigo_chofer),
    INDEX idx_id_docu (id_docu),
    INDEX idx_fecha_vence (fecha_vence),
    
    -- Clave única compuesta para evitar duplicados de chofer-documento
    UNIQUE KEY unique_chofer_documento (codigo_chofer, id_docu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos datos de ejemplo para pruebas
INSERT INTO conductor_documento (codigo_chofer, id_docu, fecha_emision, fecha_vence, notas) VALUES
(1, 1, '2024-01-15', '2025-01-15', 'Documento vigente'),
(1, 2, '2024-02-20', '2024-12-20', 'Próximo a vencer'),
(2, 1, '2024-03-10', '2025-03-10', 'Renovación automática');