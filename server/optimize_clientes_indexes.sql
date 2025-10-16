-- ============================================
-- SCRIPT DE OPTIMIZACIÓN DE ÍNDICES - TABLA CLIENTES
-- ============================================

-- Este script optimiza los índices de la tabla clientes para mejorar
-- el rendimiento de las consultas de búsqueda y listado

-- 1. ELIMINAR ÍNDICES EXISTENTES (si existen)
-- Los índices básicos ya están definidos, pero vamos a agregar más específicos

-- 2. CREAR ÍNDICES OPTIMIZADOS PARA BÚSQUEDAS

-- Índice compuesto para búsquedas múltiples (más eficiente para OR)
-- Este índice mejora las consultas con LIKE en múltiples campos
CREATE INDEX idx_clientes_busqueda_nombre ON clientes(nombre(20));
CREATE INDEX idx_clientes_busqueda_telefonos ON clientes(telefonos);
CREATE INDEX idx_clientes_busqueda_email ON clientes(email(25));
CREATE INDEX idx_clientes_busqueda_contacto1 ON clientes(contacto1(25));

-- Índice para ordenamiento por código (ya existe idx_codigo, pero lo optimizamos)
-- El idx_codigo ya existe según el DDL, así que no necesitamos recrearlo

-- 3. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN AVANZADA

-- Índice compuesto para consultas frecuentes (codigo + nombre)
CREATE INDEX idx_clientes_codigo_nombre ON clientes(codigo, nombre(30));

-- Índice para consultas por zona (si se usará en el futuro)
-- El idx_zona ya existe según el DDL

-- 4. ESTADÍSTICAS DE LA TABLA
-- Para asegurar que MySQL tenga estadísticas actualizadas
ANALYZE TABLE clientes;

-- 5. VERIFICAR ÍNDICES CREADOS
-- Ejecutar para ver todos los índices:
-- SHOW INDEX FROM clientes;

-- ============================================
-- NOTAS DE OPTIMIZACIÓN:
-- ============================================

-- 1. Los índices con prefijos (ej: nombre(20)) son más eficientes 
--    para campos largos cuando solo se busca por los primeros caracteres

-- 2. Para búsquedas con LIKE '%texto%', los índices no son muy efectivos,
--    pero para LIKE 'texto%' sí lo son

-- 3. El orden de los campos en índices compuestos importa:
--    se debe poner primero el campo más selectivo

-- 4. Muchos índices pueden ralentizar INSERT/UPDATE/DELETE,
--    así que solo agregamos los necesarios

-- ============================================
-- CONSULTAS DE PRUEBA PARA VERIFICAR RENDIMIENTO:
-- ============================================

-- Consulta básica (debería usar idx_codigo)
-- SELECT codigo, nombre, dire, telefonos, email, contacto1 FROM clientes ORDER BY codigo ASC LIMIT 100;

-- Consulta con búsqueda (debería usar los nuevos índices)
-- SELECT codigo, nombre, dire, telefonos, email, contacto1 FROM clientes 
-- WHERE codigo LIKE '123%' OR nombre LIKE 'EMPRESA%' OR telefonos LIKE '555%' 
-- ORDER BY codigo ASC;

-- Para ver el plan de ejecución:
-- EXPLAIN SELECT codigo, nombre, dire, telefonos, email, contacto1 FROM clientes 
-- WHERE codigo LIKE '123%' OR nombre LIKE 'EMPRESA%' ORDER BY codigo ASC;
