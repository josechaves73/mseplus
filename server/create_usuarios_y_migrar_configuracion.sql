-- ============================================
-- MIGRACIÓN PARA SOPORTE MULTI-USUARIO
-- Sistema MSEPlus - Configuraciones por Usuario
-- ============================================

-- 1. CREAR TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre de usuario único',
  nombre_completo VARCHAR(150) NOT NULL COMMENT 'Nombre completo del usuario',
  email VARCHAR(150) UNIQUE COMMENT 'Email del usuario',
  password_hash VARCHAR(255) COMMENT 'Hash de la contraseña (para implementación futura)',
  rol VARCHAR(30) DEFAULT 'usuario' COMMENT 'Rol: admin, usuario, supervisor, etc.',
  activo BOOLEAN DEFAULT TRUE COMMENT 'Usuario activo o desactivado',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL COMMENT 'Última vez que el usuario accedió al sistema',
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tabla de usuarios del sistema MSEPlus';

-- Insertar usuario por defecto: Admin
INSERT INTO usuarios (username, nombre_completo, email, password_hash, rol, activo) 
VALUES (
  'admin',
  'Administrador del Sistema',
  'admin@mseplus.com',
  'admin123',  -- Password temporal para desarrollo
  'admin',
  TRUE
) ON DUPLICATE KEY UPDATE 
  nombre_completo = 'Administrador del Sistema',
  password_hash = 'admin123',
  rol = 'admin';

-- ============================================
-- 2. MODIFICAR TABLA configuracion_sistema
-- ============================================

-- Agregar columna usuario_id (si no existe)
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'configuracion_sistema' 
    AND COLUMN_NAME = 'usuario_id'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE configuracion_sistema 
   ADD COLUMN usuario_id INT DEFAULT 1 COMMENT ''ID del usuario (1 = admin por defecto)'',
   ADD INDEX idx_usuario_id (usuario_id),
   ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE',
  'SELECT ''La columna usuario_id ya existe en configuracion_sistema'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. ACTUALIZAR CONFIGURACIONES EXISTENTES
-- ============================================

-- Asignar todas las configuraciones existentes al usuario admin (id = 1)
UPDATE configuracion_sistema 
SET usuario_id = 1 
WHERE usuario_id IS NULL OR usuario_id = 0;

-- ============================================
-- 4. MODIFICAR ÍNDICE ÚNICO
-- ============================================

-- Eliminar índice único anterior de 'clave' si existe
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'configuracion_sistema' 
    AND INDEX_NAME = 'clave'
);

SET @sql_drop = IF(
  @index_exists > 0,
  'ALTER TABLE configuracion_sistema DROP INDEX clave',
  'SELECT ''Índice clave no existe, continuando...'' AS mensaje'
);

PREPARE stmt FROM @sql_drop;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice único compuesto: clave + usuario_id
-- Esto permite que cada usuario tenga su propia configuración
ALTER TABLE configuracion_sistema 
ADD UNIQUE INDEX idx_clave_usuario (clave, usuario_id);

-- ============================================
-- 5. VERIFICACIÓN
-- ============================================

-- Verificar estructura de la tabla usuarios
SELECT 'Tabla usuarios creada:' AS status;
DESCRIBE usuarios;

-- Verificar estructura actualizada de configuracion_sistema
SELECT 'Tabla configuracion_sistema actualizada:' AS status;
DESCRIBE configuracion_sistema;

-- Verificar datos del usuario admin
SELECT 'Usuario admin creado:' AS status;
SELECT id, username, nombre_completo, rol, activo, fecha_creacion 
FROM usuarios 
WHERE username = 'admin';

-- Verificar configuraciones asignadas al admin
SELECT 'Configuraciones del admin:' AS status;
SELECT cs.id, cs.clave, cs.valor, cs.descripcion, u.username as usuario
FROM configuracion_sistema cs
LEFT JOIN usuarios u ON cs.usuario_id = u.id
ORDER BY cs.clave;

-- ============================================
-- 6. NOTAS DE IMPLEMENTACIÓN
-- ============================================

/*
NOTAS IMPORTANTES:

1. USUARIO POR DEFECTO:
   - username: 'admin'
   - id: 1
   - Todas las configuraciones existentes se asignan a este usuario

2. CAMBIOS EN LA API:
   - Los endpoints deben modificarse para aceptar usuario_id
   - Por ahora, usar hardcoded: usuario_id = 1 (admin)
   - Cuando se implemente login, usar el usuario_id de la sesión

3. CONFIGURACIONES POR USUARIO:
   - Ahora cada usuario puede tener sus propias configuraciones
   - La combinación (clave, usuario_id) es única
   - Ejemplo: 
     * admin puede tener dashboard_color_botones = '#0d4a0d'
     * usuario2 puede tener dashboard_color_botones = '#3b82f6'

4. MIGRACIÓN SEGURA:
   - Este script es idempotente (se puede ejecutar múltiples veces)
   - Usa verificaciones con INFORMATION_SCHEMA
   - No perderá datos existentes

5. PRÓXIMOS PASOS:
   - Implementar sistema de login
   - Crear middleware de autenticación
   - Actualizar todos los endpoints para usar usuario_id de la sesión
*/
