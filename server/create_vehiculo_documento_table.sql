-- Crear tabla vehiculo_documento para gestión de documentación de vehículos
-- Relaciona vehículos (placa) con documentos y fechas

CREATE TABLE vehiculo_documento (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    placa CHAR(10) NOT NULL,
    id_docu INT(11) NOT NULL,
    fecha_emision DATE NULL,
    fecha_vence DATE NULL,
    notas VARCHAR(256) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices para rendimiento
    INDEX idx_placa (placa),
    INDEX idx_id_docu (id_docu),
    INDEX idx_fecha_vence (fecha_vence),

    -- Evitar duplicados placa-documento
    UNIQUE KEY unique_vehiculo_documento (placa, id_docu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejemplos de inserción
INSERT INTO vehiculo_documento (placa, id_docu, fecha_emision, fecha_vence, notas) VALUES
('ABC123', 1, '2024-01-15', '2025-01-15', 'Seguro vigente'),
('XYZ987', 2, '2024-02-20', '2024-12-20', 'Revisión técnica próxima');
