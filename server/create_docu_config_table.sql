-- Crear tabla docu_config para configuración de documentación
-- Fecha de creación: 2025-10-03

CREATE TABLE docu_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aplica_a VARCHAR(15) NOT NULL COMMENT 'Indica si aplica a vehiculo o conductor',
    nombre_documento VARCHAR(80) NOT NULL COMMENT 'Nombre del tipo de documento',
    fecha_creado_renovado DATE COMMENT 'Fecha de creación o renovación del documento',
    fecha_vencimiento DATE COMMENT 'Fecha de vencimiento del documento',
    nota VARCHAR(250) COMMENT 'Notas adicionales sobre el documento',
    aviso_vence_dias INT(3) DEFAULT 30 COMMENT 'Días de anticipación para aviso de vencimiento',
    autoridad_relacion VARCHAR(80) COMMENT 'Autoridad o entidad relacionada con el documento',
    
    -- Índices para optimizar consultas
    INDEX idx_aplica_a (aplica_a),
    INDEX idx_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_nombre_documento (nombre_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Configuración de documentos para vehículos y conductores';

-- Insertar algunos registros de ejemplo para vehículos
INSERT INTO docu_config (aplica_a, nombre_documento, aviso_vence_dias, autoridad_relacion, nota) VALUES
('vehiculo', 'Licencia de Circulación', 30, 'Municipalidad', 'Documento obligatorio para circular'),
('vehiculo', 'Seguro Obligatorio (SOAP)', 15, 'Compañía de Seguros', 'Seguro obligatorio de accidentes personales'),
('vehiculo', 'Revisión Técnica', 30, 'Planta de Revisión Técnica', 'Inspección técnica vehicular'),
('vehiculo', 'Permiso de Circulación', 30, 'Municipalidad', 'Permiso municipal anual'),

-- Insertar algunos registros de ejemplo para conductores
('conductor', 'Licencia de Conducir', 60, 'Dirección de Tránsito', 'Licencia clase profesional'),
('conductor', 'Certificado Médico', 30, 'Centro Médico Autorizado', 'Examen médico para conductores'),
('conductor', 'Curso de Manejo Defensivo', 90, 'Instituto de Capacitación', 'Capacitación obligatoria'),
('conductor', 'Examen Psicotécnico', 30, 'Centro Psicotécnico', 'Evaluación psicológica');

-- Verificar la creación de la tabla
SELECT 'Tabla docu_config creada exitosamente' AS resultado;

-- Mostrar estructura de la tabla
DESCRIBE docu_config;