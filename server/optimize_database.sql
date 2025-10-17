-- ============================================
-- SCRIPT DE OPTIMIZACIÓN GENERAL DE BASE DE DATOS
-- MSEPlus - Optimización de rendimiento
-- ============================================

-- Este script ejecuta ANALYZE TABLE en todas las tablas principales
-- para actualizar estadísticas y mejorar el rendimiento de consultas

-- Tablas principales del sistema
ANALYZE TABLE boletas;
ANALYZE TABLE manifiestos;
ANALYZE TABLE chofer;
ANALYZE TABLE vehiculos;
ANALYZE TABLE clientes;
ANALYZE TABLE articulos;
ANALYZE TABLE articulos_x_cliente;
ANALYZE TABLE usuarios;
ANALYZE TABLE configuracion_sistema;
ANALYZE TABLE permisos_usuarios;
ANALYZE TABLE permisos_modulos;
ANALYZE TABLE email_accounts;
ANALYZE TABLE email_history;
ANALYZE TABLE recordatorios;
ANALYZE TABLE conductor_documento;
ANALYZE TABLE vehiculo_documento;

-- Verificar estadísticas actualizadas
SHOW TABLE STATUS WHERE Name IN (
    'boletas', 'manifiestos', 'chofer', 'vehiculos', 'clientes',
    'articulos', 'usuarios', 'configuracion_sistema'
);

-- ============================================
-- COMANDOS ADICIONALES PARA OPTIMIZACIÓN AVANZADA
-- ============================================

-- Si tienes permisos, puedes ejecutar OPTIMIZE TABLE (puede estar limitado en shared hosting):
-- OPTIMIZE TABLE boletas, manifiestos, chofer, vehiculos, clientes, articulos;

-- Para verificar índices existentes en una tabla específica:
-- SHOW INDEX FROM boletas;

-- Para crear índices adicionales si es necesario (ejemplos):
-- CREATE INDEX idx_boletas_fecha ON boletas(fecha);
-- CREATE INDEX idx_boletas_manifiesto ON boletas(manifiesto);
-- CREATE INDEX idx_manifiestos_fecha ON manifiestos(fecha);