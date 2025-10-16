-- Script para arreglar la tabla configuracion_sistema
-- Problema: La restricción UNIQUE está solo en 'clave', no en ('clave', 'usuario_id')
-- Esto impide que diferentes usuarios tengan configuraciones diferentes

-- 1. Eliminar el índice único actual en 'clave'
ALTER TABLE configuracion_sistema DROP INDEX clave;

-- 2. Crear nuevo índice único compuesto en ('clave', 'usuario_id')
ALTER TABLE configuracion_sistema ADD CONSTRAINT uk_clave_usuario UNIQUE (clave, usuario_id);

-- 3. Verificar que la tabla esté correcta
-- SELECT * FROM information_schema.table_constraints
-- WHERE table_name = 'configuracion_sistema' AND constraint_type = 'UNIQUE';