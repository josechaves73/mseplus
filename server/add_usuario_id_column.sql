-- Script simple para agregar columna usuario_id

-- 1. Agregar columna usuario_id si no existe
ALTER TABLE configuracion_sistema 
ADD COLUMN IF NOT EXISTS usuario_id INT DEFAULT 1 COMMENT 'ID del usuario (1 = admin por defecto)';

-- 2. Actualizar registros existentes
UPDATE configuracion_sistema 
SET usuario_id = 1 
WHERE usuario_id IS NULL OR usuario_id = 0;

-- 3. Verificar
SELECT * FROM configuracion_sistema;
