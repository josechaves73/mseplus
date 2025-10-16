-- Crear tabla de plantillas de email si no existe
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_nombre (nombre)
);

-- Crear tabla de historial de emails si no existe
CREATE TABLE IF NOT EXISTS email_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    cliente_codigo VARCHAR(20),
    recipient_email VARCHAR(255) NOT NULL,
    cc_emails TEXT,
    bcc_emails TEXT,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_cliente_codigo (cliente_codigo),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

-- Insertar plantillas de ejemplo
INSERT IGNORE INTO email_templates (nombre, descripcion, subject_template, body_template) VALUES
('Bienvenida Cliente', 'Plantilla de bienvenida para nuevos clientes', 
 'Bienvenido a MSEPlus - {{cliente_nombre}}', 
 'Estimado/a {{cliente_nombre}},\n\nNos complace darle la bienvenida a MSEPlus.\n\nSu código de cliente es: {{cliente_codigo}}\n\nFecha: {{fecha_actual}}\n\nGracias por confiar en nosotros.\n\nSaludos cordiales,\n{{usuario_nombre}}\nMSEPlus'),

('Consulta General', 'Plantilla para consultas generales', 
 'Consulta - Cliente {{cliente_nombre}}', 
 'Estimado/a {{cliente_nombre}},\n\nEsperamos que se encuentre bien.\n\nNos ponemos en contacto con usted para...\n\n[AGREGAR MENSAJE AQUÍ]\n\nSi tiene alguna consulta, no dude en contactarnos.\n\nFecha: {{fecha_actual}}\n\nSaludos cordiales,\n{{usuario_nombre}}\nMSEPlus'),

('Seguimiento Servicio', 'Plantilla para seguimiento de servicios', 
 'Seguimiento de Servicio - {{cliente_nombre}}', 
 'Estimado/a {{cliente_nombre}},\n\nQueremos hacer un seguimiento del servicio brindado.\n\nCódigo de cliente: {{cliente_codigo}}\nFecha: {{fecha_actual}}\n\n[AGREGAR DETALLES DEL SERVICIO]\n\nAgradecemos su preferencia y quedamos atentos a sus comentarios.\n\nSaludos cordiales,\n{{usuario_nombre}}\nMSEPlus'),

('Información de Cuenta', 'Plantilla para información de cuenta del cliente', 
 'Información de su Cuenta - {{cliente_nombre}}', 
 'Estimado/a {{cliente_nombre}},\n\nLe enviamos la información actualizada de su cuenta.\n\nCódigo de cliente: {{cliente_codigo}}\nFecha de consulta: {{fecha_actual}}\n\n[AGREGAR INFORMACIÓN DE CUENTA]\n\nSi necesita alguna aclaración, estamos a su disposición.\n\nSaludos cordiales,\n{{usuario_nombre}}\nMSEPlus');

-- Mostrar confirmación
SELECT 'Tablas de email creadas exitosamente' as mensaje;