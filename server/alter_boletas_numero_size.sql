-- Alterar el tamaño del campo numero en la tabla boletas de CHAR(8) a CHAR(15)
-- Esto es necesario porque ahora agregamos "-anulada" al número cuando se anula una boleta

ALTER TABLE boletas MODIFY COLUMN numero CHAR(15) NOT NULL;

-- Verificar que el cambio se aplicó correctamente
DESCRIBE boletas;