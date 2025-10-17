-- ============================================
-- SCRIPT DE OPTIMIZACIÓN ESPECÍFICA - TABLA BOLETAS
-- MSEPlus - Optimización de rendimiento para consultas lentas
-- ============================================

-- Este script optimiza específicamente la tabla boletas que es la más
-- consultada en el sistema (manifiestos, listados, búsquedas)

-- 1. ANALIZAR LA TABLA PARA ACTUALIZAR ESTADÍSTICAS
ANALYZE TABLE boletas;

-- 2. VERIFICAR ÍNDICES EXISTENTES ANTES DE OPTIMIZAR
-- Ejecutar manualmente para ver qué índices ya existen:
-- SHOW INDEX FROM boletas;

-- 3. CREAR ÍNDICES OPTIMIZADOS PARA CONSULTAS FRECUENTES
-- Nota: Si ya existen índices, puedes ejecutar primero:
-- DROP INDEX idx_boletas_fecha ON boletas;
-- DROP INDEX idx_boletas_manifiesto ON boletas;
-- DROP INDEX idx_boletas_tipo ON boletas;
-- DROP INDEX idx_boletas_manifiesto_tipo_fecha ON boletas;
-- DROP INDEX idx_boletas_cliente ON boletas;

-- Índice para consultas por fecha (ordenamiento descendente común)
CREATE INDEX IF NOT EXISTS idx_boletas_fecha ON boletas(fecha);

-- Índice para filtrado por manifiesto (muy usado en consultas)
CREATE INDEX IF NOT EXISTS idx_boletas_manifiesto ON boletas(manifiesto);

-- Índice para agrupación por tipo
CREATE INDEX IF NOT EXISTS idx_boletas_tipo ON boletas(tipo);

-- Índice compuesto para consultas de manifiestos (manifiesto + tipo + fecha)
-- Este es crítico para las consultas GROUP BY manifiesto, tipo con ORDER BY fecha
CREATE INDEX IF NOT EXISTS idx_boletas_manifiesto_tipo_fecha ON boletas(manifiesto, tipo, fecha);

-- Índice para búsquedas por cliente (si se usa frecuentemente)
CREATE INDEX IF NOT EXISTS idx_boletas_cliente ON boletas(cliente);

-- Índice para consultas por estado (si existe el campo)
-- CREATE INDEX idx_boletas_estado ON boletas(estado);

-- 4. OPTIMIZAR LA TABLA FÍSICAMENTE (si tienes permisos)
-- En shared hosting puede estar limitado, pero vale la pena intentar
OPTIMIZE TABLE boletas;

-- 5. VERIFICAR EL ESTADO DESPUÉS DE LA OPTIMIZACIÓN
SHOW TABLE STATUS LIKE 'boletas';

-- 6. VERIFICAR ÍNDICES CREADOS
SHOW INDEX FROM boletas;

-- ============================================
-- EXPLICACIÓN DE LOS ÍNDICES CREADOS
-- ============================================

-- idx_boletas_fecha: Acelera consultas ordenadas por fecha (ORDER BY fecha DESC)
-- idx_boletas_manifiesto: Acelera filtrado WHERE manifiesto IS NOT NULL o = valor
-- idx_boletas_tipo: Acelera GROUP BY tipo y WHERE tipo = valor
-- idx_boletas_manifiesto_tipo_fecha: Índice compuesto para consultas complejas
--   como: SELECT ... FROM boletas WHERE manifiesto IS NOT NULL
--         GROUP BY manifiesto, tipo ORDER BY MIN(fecha) DESC

-- ============================================
-- COMANDOS PARA MONITOREAR RENDIMIENTO
-- ============================================

-- Para ver el plan de ejecución de una consulta lenta:
-- EXPLAIN SELECT manifiesto, DATE_FORMAT(MIN(fecha), '%Y-%m-%d') as fecha,
--               SUM(peso) as peso_local, tipo, GROUP_CONCAT(nota) as notas
--        FROM boletas WHERE manifiesto IS NOT NULL
--        GROUP BY manifiesto, tipo ORDER BY MIN(fecha) DESC LIMIT 10;

-- Para ver estadísticas de uso de índices:
-- SHOW ENGINE INNODB STATUS;