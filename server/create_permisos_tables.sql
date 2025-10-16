-- Crear tabla de módulos de permisos
CREATE TABLE IF NOT EXISTS permisos_modulos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modulo VARCHAR(100) NOT NULL COMMENT 'Nombre del módulo principal',
  submodulo VARCHAR(100) NOT NULL COMMENT 'Nombre del submódulo',
  accion VARCHAR(50) NOT NULL COMMENT 'Acción permitida: ver, crear, editar, eliminar',
  descripcion VARCHAR(255) COMMENT 'Descripción del permiso',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_permiso (modulo, submodulo, accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de permisos por usuario
CREATE TABLE IF NOT EXISTS permisos_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  permiso_modulo_id INT NOT NULL,
  permitido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_modulo_id) REFERENCES permisos_modulos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_usuario_permiso (usuario_id, permiso_modulo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar permisos de módulos principales del sistema MSEPlus
INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion) VALUES
-- Manifiestos
('Manifiestos', 'Lista', 'ver', 'Ver lista de manifiestos'),
('Manifiestos', 'Lista', 'crear', 'Crear nuevos manifiestos'),
('Manifiestos', 'Lista', 'editar', 'Editar manifiestos existentes'),
('Manifiestos', 'Lista', 'eliminar', 'Eliminar manifiestos'),
('Manifiestos', 'Exportar', 'exportar', 'Exportar manifiestos a Excel'),

-- Boletas
('Boletas', 'Lista', 'ver', 'Ver lista de boletas'),
('Boletas', 'Lista', 'crear', 'Crear nuevas boletas'),
('Boletas', 'Lista', 'editar', 'Editar boletas existentes'),
('Boletas', 'Lista', 'eliminar', 'Eliminar boletas'),
('Boletas', 'Estado', 'cambiar', 'Cambiar estado de boletas'),
('Boletas', 'Tipo', 'cambiar', 'Cambiar tipo de boleta'),
('Boletas', 'Anular', 'anular', 'Anular boletas'),
('Boletas', 'Auditar', 'auditar', 'Auditar boletas'),

-- Choferes/Conductores
('Choferes', 'Lista', 'ver', 'Ver lista de choferes'),
('Choferes', 'Lista', 'crear', 'Crear nuevos choferes'),
('Choferes', 'Lista', 'editar', 'Editar choferes existentes'),
('Choferes', 'Lista', 'eliminar', 'Eliminar choferes'),
('Choferes', 'Documentos', 'gestionar', 'Gestionar documentos de choferes'),

-- Vehículos
('Vehiculos', 'Lista', 'ver', 'Ver lista de vehículos'),
('Vehiculos', 'Lista', 'crear', 'Crear nuevos vehículos'),
('Vehiculos', 'Lista', 'editar', 'Editar vehículos existentes'),
('Vehiculos', 'Lista', 'eliminar', 'Eliminar vehículos'),
('Vehiculos', 'Documentos', 'gestionar', 'Gestionar documentos de vehículos'),

-- Clientes
('Clientes', 'Lista', 'ver', 'Ver lista de clientes'),
('Clientes', 'Lista', 'crear', 'Crear nuevos clientes'),
('Clientes', 'Lista', 'editar', 'Editar clientes existentes'),
('Clientes', 'Lista', 'eliminar', 'Eliminar clientes'),

-- Artículos
('Articulos', 'Lista', 'ver', 'Ver lista de artículos'),
('Articulos', 'Lista', 'crear', 'Crear nuevos artículos'),
('Articulos', 'Lista', 'editar', 'Editar artículos existentes'),
('Articulos', 'Lista', 'eliminar', 'Eliminar artículos'),
('Articulos', 'Cliente', 'vincular', 'Vincular artículos con clientes'),

-- Reportes
('Reportes', 'General', 'ver', 'Ver reportes generales'),
('Reportes', 'Exportar', 'exportar', 'Exportar reportes'),
('Reportes', 'Estadisticas', 'ver', 'Ver estadísticas del sistema'),

-- Configuración
('Configuracion', 'Sistema', 'ver', 'Ver configuración del sistema'),
('Configuracion', 'Sistema', 'editar', 'Modificar configuración del sistema'),
('Configuracion', 'Email', 'configurar', 'Configurar cuentas de email'),
('Configuracion', 'Clima', 'configurar', 'Configurar clima multiusuario'),

-- Usuarios (Administración)
('Usuarios', 'Gestion', 'ver', 'Ver gestión de usuarios'),
('Usuarios', 'Gestion', 'crear', 'Crear nuevos usuarios'),
('Usuarios', 'Gestion', 'editar', 'Editar usuarios existentes'),
('Usuarios', 'Gestion', 'eliminar', 'Eliminar usuarios'),
('Usuarios', 'Permisos', 'gestionar', 'Gestionar permisos de usuarios');
