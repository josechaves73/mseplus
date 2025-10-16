-- Script para agregar columnas tipo_cert y tipo_res a la tabla articulos

-- Agregar columna tipo_cert si no existe
SET @sql = 'SELECT COUNT(*) INTO @exists FROM information_schema.columns 
           WHERE table_schema = DATABASE() 
           AND table_name = "articulos" 
           AND column_name = "tipo_cert"';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@exists = 0, 
    'ALTER TABLE articulos ADD COLUMN tipo_cert VARCHAR(100)', 
    'SELECT "Column tipo_cert already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna tipo_res si no existe
SET @sql = 'SELECT COUNT(*) INTO @exists FROM information_schema.columns 
           WHERE table_schema = DATABASE() 
           AND table_name = "articulos" 
           AND column_name = "tipo_res"';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@exists = 0, 
    'ALTER TABLE articulos ADD COLUMN tipo_res VARCHAR(100)', 
    'SELECT "Column tipo_res already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar la estructura de la tabla
DESCRIBE articulos;
