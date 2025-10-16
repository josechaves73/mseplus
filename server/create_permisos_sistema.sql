-- ============================================
-- SISTEMA DE PERMISOS GRANULAR MSEPlus
-- Tablas para control de acceso por usuario
-- ============================================

-- 1. TABLA DE MÓDULOS Y ACCIONES
-- ============================================
CREATE TABLE IF NOT EXISTS permisos_modulos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  modulo VARCHAR(50) NOT NULL COMMENT 'Nombre del módulo principal (articulos, boletas, etc.)',
  submodulo VARCHAR(50) NOT NULL COMMENT 'Nombre del sub-módulo (lista_articulos, trazabilidad, etc.)',
  accion VARCHAR(100) NOT NULL COMMENT 'Acción específica (ver, crear, editar, eliminar, auditar, etc.)',
  descripcion VARCHAR(255) COMMENT 'Descripción de la acción',
  activo BOOLEAN DEFAULT TRUE COMMENT 'Permiso activo o no',

  UNIQUE KEY unique_modulo_accion (modulo, submodulo, accion),
  INDEX idx_modulo (modulo),
  INDEX idx_submodulo (submodulo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de todas las acciones disponibles en el sistema';

-- 2. TABLA DE PERMISOS POR USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS permisos_usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL COMMENT 'ID del usuario',
  permiso_modulo_id INT NOT NULL COMMENT 'ID del permiso del módulo',
  permitido BOOLEAN DEFAULT FALSE COMMENT 'Si tiene o no el permiso',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_modulo_id) REFERENCES permisos_modulos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_usuario_permiso (usuario_id, permiso_modulo_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_permiso (permiso_modulo_id),
  INDEX idx_permitido (permitido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permisos específicos asignados a cada usuario';

-- ============================================
-- DATOS INICIALES - PERMISOS DEL SISTEMA
-- ============================================

-- MÓDULO: ARTÍCULOS
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('articulos', 'lista_articulos', 'ver', 'Ver lista de artículos'),
('articulos', 'lista_articulos', 'crear', 'Crear nuevos artículos'),
('articulos', 'lista_articulos', 'editar', 'Editar artículos existentes'),
('articulos', 'lista_articulos', 'eliminar', 'Eliminar artículos'),
('articulos', 'articulos_cliente', 'ver', 'Ver artículos por cliente'),
('articulos', 'familias', 'ver', 'Ver familias de artículos'),
('articulos', 'familias', 'crear', 'Crear nuevas familias'),
('articulos', 'familias', 'editar', 'Editar familias'),
('articulos', 'familias', 'eliminar', 'Eliminar familias'),
('articulos', 'reporte_agrupado', 'ver', 'Ver reporte agrupado'),
('articulos', 'reporte_agrupado', 'exportar', 'Exportar reporte agrupado');

-- MÓDULO: BOLETAS
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('boletas', 'lista_boletas', 'ver', 'Ver lista de boletas'),
('boletas', 'lista_boletas', 'crear', 'Crear nuevas boletas'),
('boletas', 'lista_boletas', 'editar', 'Editar boletas existentes'),
('boletas', 'lista_boletas', 'auditar', 'Auditar boletas'),
('boletas', 'lista_boletas', 'anular', 'Anular boletas'),
('boletas', 'lista_boletas', 'cambiar_tipo', 'Cambiar tipo de boleta'),
('boletas', 'lista_boletas', 'ver_manifiestos', 'Ver manifiestos asociados'),
('boletas', 'lista_boletas', 'exportar', 'Exportar boletas a Excel'),
('boletas', 'lista_boletas', 'tipos_boleta', 'Ver y gestionar tipos de boleta'),
('boletas', 'trazabilidad', 'ver', 'Ver trazabilidad de boletas'),
('boletas', 'reportes', 'ver', 'Ver reportes de boletas'),
('boletas', 'reportes', 'exportar', 'Exportar reportes');

-- MÓDULO: CLIENTES
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('clientes', 'lista_clientes', 'ver', 'Ver lista de clientes'),
('clientes', 'lista_clientes', 'crear', 'Crear nuevos clientes'),
('clientes', 'lista_clientes', 'editar', 'Editar clientes existentes'),
('clientes', 'lista_clientes', 'eliminar', 'Eliminar clientes'),
('clientes', 'lista_clientes', 'email', 'Enviar emails a clientes');

-- MÓDULO: TRANSPORTES
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('transportes', 'lista_vehiculos', 'ver', 'Ver lista de vehículos'),
('transportes', 'lista_vehiculos', 'crear', 'Crear nuevos vehículos'),
('transportes', 'lista_vehiculos', 'editar', 'Editar vehículos'),
('transportes', 'lista_vehiculos', 'eliminar', 'Eliminar vehículos'),
('transportes', 'lista_vehiculos', 'documentos', 'Gestionar documentos de vehículos'),
('transportes', 'lista_conductores', 'ver', 'Ver lista de conductores'),
('transportes', 'lista_conductores', 'crear', 'Crear nuevos conductores'),
('transportes', 'lista_conductores', 'editar', 'Editar conductores'),
('transportes', 'lista_conductores', 'eliminar', 'Eliminar conductores'),
('transportes', 'lista_conductores', 'documentos', 'Gestionar documentos de conductores'),
('transportes', 'documentacion', 'ver', 'Ver documentación'),
('transportes', 'documentacion', 'crear', 'Crear nueva documentación'),
('transportes', 'documentacion', 'editar', 'Editar documentación'),
('transportes', 'documentacion', 'eliminar', 'Eliminar documentación');

-- MÓDULO: MANIFIESTOS
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('manifiestos', 'lista_manifiestos', 'ver', 'Ver lista de manifiestos'),
('manifiestos', 'lista_manifiestos', 'crear', 'Crear nuevos manifiestos'),
('manifiestos', 'lista_manifiestos', 'editar', 'Editar manifiestos'),
('manifiestos', 'lista_manifiestos', 'eliminar', 'Eliminar manifiestos'),
('manifiestos', 'lista_manifiestos', 'exportar', 'Exportar manifiestos');

-- MÓDULO: CONFIGURACIÓN
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
('configuracion', 'general', 'ver', 'Ver configuración general'),
('configuracion', 'general', 'editar', 'Editar configuración general'),
('configuracion', 'email', 'ver', 'Ver configuración de email'),
('configuracion', 'email', 'editar', 'Editar configuración de email'),
('configuracion', 'dashboard', 'ver', 'Ver configuración del dashboard'),
('configuracion', 'dashboard', 'editar', 'Editar configuración del dashboard'),
('configuracion', 'usuarios', 'ver', 'Ver gestión de usuarios'),
('configuracion', 'usuarios', 'crear', 'Crear nuevos usuarios'),
('configuracion', 'usuarios', 'editar', 'Editar usuarios'),
('configuracion', 'usuarios', 'eliminar', 'Eliminar usuarios'),
('configuracion', 'permisos', 'ver', 'Ver permisos de usuarios'),
('configuracion', 'permisos', 'editar', 'Editar permisos de usuarios');

-- ============================================
-- ASIGNAR PERMISOS AL ADMIN POR DEFECTO
-- ============================================

-- Insertar todos los permisos para el usuario admin
INSERT INTO permisos_usuarios (usuario_id, permiso_modulo_id, permitido)
SELECT
  (SELECT id FROM usuarios WHERE username = 'admin') as usuario_id,
  pm.id as permiso_modulo_id,
  TRUE as permitido
FROM permisos_modulos pm
ON DUPLICATE KEY UPDATE permitido = TRUE;

-- ============================================
-- FUNCIONES DE VERIFICACIÓN DE PERMISOS
-- ============================================

DELIMITER //

-- Función para verificar si un usuario tiene un permiso específico
CREATE FUNCTION IF NOT EXISTS tiene_permiso(
  p_usuario_id INT,
  p_modulo VARCHAR(50),
  p_submodulo VARCHAR(50),
  p_accion VARCHAR(100)
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE resultado BOOLEAN DEFAULT FALSE;

  SELECT pu.permitido INTO resultado
  FROM permisos_usuarios pu
  INNER JOIN permisos_modulos pm ON pu.permiso_modulo_id = pm.id
  WHERE pu.usuario_id = p_usuario_id
    AND pm.modulo = p_modulo
    AND pm.submodulo = p_submodulo
    AND pm.accion = p_accion
    AND pm.activo = TRUE
  LIMIT 1;

  RETURN IFNULL(resultado, FALSE);
END //

DELIMITER ;

-- ============================================
-- VISTAS PARA FACILITAR CONSULTAS
-- ============================================

-- Vista de permisos por usuario
CREATE OR REPLACE VIEW vista_permisos_usuario AS
SELECT
  u.id as usuario_id,
  u.username,
  u.nombre_completo,
  pm.modulo,
  pm.submodulo,
  pm.accion,
  pm.descripcion,
  pu.permitido,
  pu.fecha_modificacion
FROM usuarios u
CROSS JOIN permisos_modulos pm
LEFT JOIN permisos_usuarios pu ON u.id = pu.usuario_id AND pm.id = pu.permiso_modulo_id
WHERE u.activo = TRUE AND pm.activo = TRUE
ORDER BY u.username, pm.modulo, pm.submodulo, pm.accion;