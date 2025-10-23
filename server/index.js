import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { v2 as cloudinary } from 'cloudinary';
import { Buffer } from 'buffer';
import Parser from 'rss-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '.env') });
} else {
  dotenv.config();
}

console.log('🔧 Variables cargadas:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT
});

// Configurar RSS Parser
const rssParser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure']
  }
});

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
// Para Render: usar el puerto asignado dinámicamente
const PORT = process.env.PORT || 4000;

// Configuración CORS para producción
const corsOptions = {
  origin: [
    'http://localhost:5173', // desarrollo local
    'http://localhost:5174', // desarrollo local alternativo
    'https://www.mitvlatina.com',
    'https://mitvlatina.com',
    'https://mse.mitvlatina.com',  // subdominio HTTPS
    'http://mse.mitvlatina.com'    // subdominio HTTP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-usuario-id']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware para obtener usuario_id de headers
app.use((req, res, next) => {
  const usuarioId = req.headers['x-usuario-id'];
  if (usuarioId) {
    req.usuario_id = parseInt(usuarioId);
    // Solo mostrar para endpoints que no sean de polling frecuente
    if (!req.path.includes('/mensajes/no-leidos') && !req.path.includes('/chat/mensajes/')) {
      console.log('🔑 Middleware - Header recibido x-usuario-id:', usuarioId, '-> req.usuario_id:', req.usuario_id);
    }
  } else {
    req.usuario_id = 1;
  }
  next();
});

// Endpoint para eliminar imagen de Cloudinary
app.post('/api/delete-image', async (req, res) => {
  const { publicId } = req.body;
  
  if (!publicId) {
    return res.status(400).json({ success: false, error: 'Public ID es requerido' });
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'Imagen eliminada de Cloudinary exitosamente' });
    } else {
      res.status(400).json({ success: false, error: 'No se pudo eliminar la imagen de Cloudinary' });
    }
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al eliminar imagen' });
  }
});

// Endpoint para crear un nuevo chofer (con validación de código único)
app.post('/api/chofer', async (req, res) => {
  const { codigo_chofer, cedula, nombre, telefonos, imagen } = req.body;
  // Validar campos requeridos
  if (!codigo_chofer || !cedula || !nombre || !telefonos) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos: código, cédula, nombre y teléfonos' });
  }
  try {
    // Verificar que el código no exista
    const [existing] = await pool.query(
      'SELECT codigo_chofer FROM chofer WHERE codigo_chofer = ?',
      [codigo_chofer]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'El código ya existe' });
    }
    // Insertar nuevo chofer con estado por defecto 'ACTIVO' e imagen
    await pool.query(
      'INSERT INTO chofer (codigo_chofer, cedula, nombre, telefonos, imagen, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [codigo_chofer, cedula, nombre, telefonos, imagen || null, 'ACTIVO']
    );
    res.json({ success: true, message: 'Chofer guardado exitosamente', chofer: { codigo_chofer, cedula, nombre, telefonos, imagen } });
  } catch (error) {
    console.error('Error al guardar chofer:', error);
    res.status(500).json({ success: false, error: 'Error al guardar el chofer: ' + error.message });
  }
});

// Endpoint para actualizar un chofer existente
app.put('/api/chofer/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const { cedula, nombre, telefonos, imagen } = req.body;
  
  // Validar campos requeridos
  if (!cedula || !nombre || !telefonos) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos: cédula, nombre y teléfonos' });
  }
  
  try {
    // Verificar que el chofer exista
    const [existing] = await pool.query(
      'SELECT codigo_chofer FROM chofer WHERE codigo_chofer = ?',
      [codigo]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }
    
    // Actualizar chofer
    await pool.query(
      'UPDATE chofer SET cedula = ?, nombre = ?, telefonos = ?, imagen = ? WHERE codigo_chofer = ?',
      [cedula, nombre, telefonos, imagen || null, codigo]
    );
    
    res.json({ success: true, message: 'Conductor actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar chofer:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el conductor: ' + error.message });
  }
});

// Endpoint para eliminar imagen de un chofer específico
app.delete('/api/chofer/:codigo/imagen', async (req, res) => {
  const { codigo } = req.params;
  
  try {
    // Actualizar chofer removiendo la imagen
    await pool.query(
      'UPDATE chofer SET imagen = NULL WHERE codigo_chofer = ?',
      [codigo]
    );
    
    res.json({ success: true, message: 'Imagen eliminada de la base de datos exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen del chofer:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar imagen: ' + error.message });
  }
});
// Endpoint para obtener todos los choferes
app.get('/api/chofer', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chofer ORDER BY codigo_chofer DESC');
    res.json({ success: true, choferes: rows });
  } catch (error) {
    console.error('Error al obtener choferes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener choferes: ' + error.message });
  }
});

// Endpoint para verificar si un conductor tiene boletas relacionadas
app.get('/api/boletas/check-conductor/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM boletas WHERE chofer_c = ?', [codigo]);
    const hasBoletas = rows[0].count > 0;
    res.json({ 
      success: true, 
      hasBoletas, 
      boletascount: rows[0].count 
    });
  } catch (error) {
    console.error('Error al verificar boletas del conductor:', error);
    res.status(500).json({ success: false, error: 'Error al verificar boletas: ' + error.message });
  }
});

// Endpoint para eliminar un conductor
app.delete('/api/chofer/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    // First check if conductor has related boletas
    const [checkRows] = await pool.query('SELECT COUNT(*) as count FROM boletas WHERE chofer_c = ?', [codigo]);
    if (checkRows[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar el conductor porque tiene ${checkRows[0].count} boleta(s) relacionada(s).` 
      });
    }
    
    // If no related boletas, proceed with deletion
    const [deleteResult] = await pool.query('DELETE FROM chofer WHERE codigo_chofer = ?', [codigo]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }
    
    res.json({ 
      success: true, 
      message: 'Conductor eliminado correctamente',
      affectedRows: deleteResult.affectedRows 
    });
  } catch (error) {
    console.error('Error al eliminar conductor:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar conductor: ' + error.message });
  }
});

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Ruta para probar conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    res.json({ tables: rows });
  } catch (error) {
    console.error('Error al conectar o consultar la base de datos:', error);
    res.status(500).json({ error: error.message, details: error });
  }
});

// Endpoint de prueba
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    res.json({ 
      status: 'OK', 
      db_connected: true, 
      usuarios_count: rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      db_connected: false, 
      error: error.message 
    });
  }
});

// Endpoint de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Intento de login:', { username, password: '***' });
  console.log('🔍 DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  });

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos'
    });
  }

  try {
    // Por ahora, autenticación básica sin hash (para desarrollo)
    // TODO: Implementar hash de contraseñas en producción
    const [users] = await pool.query(
      'SELECT id, username, full_name, email, role, is_active FROM usuarios WHERE BINARY username = ? AND password = ? AND is_active = TRUE',
      [username, password] // En producción esto sería hash(password)
    );

    if (users.length === 0) {
      console.log('❌ Login fallido - Credenciales incorrectas');
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const user = users[0];
    console.log('✅ Login exitoso:', { id: user.id, username: user.username, role: user.role });

    // Obtener permisos del usuario
    const [permissions] = await pool.query(`
      SELECT
        pm.modulo,
        pm.submodulo,
        pm.accion,
        pu.permitido
      FROM permisos_usuarios pu
      JOIN permisos_modulos pm ON pu.permiso_modulo_id = pm.id
      WHERE pu.usuario_id = ? AND pu.permitido = TRUE
    `, [user.id]);

    // Obtener configuración del usuario
    const [userConfig] = await pool.query(
      'SELECT clave, valor FROM configuracion_sistema WHERE usuario_id = ?',
      [user.id]
    );

    // Convertir configuración a objeto
    const config = {};
    userConfig.forEach(item => {
      config[item.clave] = item.valor;
    });

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nombre_completo: user.full_name,
        email: user.email,
        rol: user.role
      },
      permissions: permissions,
      config: config,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para procesar reversión de línea (transaccional)
app.post('/api/reversar-linea', async (req, res) => {
  const { manifiesto, boleta, tipo, codigo, descri, cantidad } = req.body;

  if (!manifiesto || !boleta || !tipo || !codigo || typeof cantidad === 'undefined') {
    return res.status(400).json({ success: false, error: 'Parámetros incompletos. Se requiere manifiesto, boleta, tipo, codigo y cantidad.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Verificar y actualizar manifiesto3
    const [manRows] = await conn.query(
      'SELECT cantidad FROM manifiesto3 WHERE boleta = ? AND tipo = ? AND codigo = ? AND manifiesto = ? FOR UPDATE',
      [boleta, tipo, codigo, manifiesto]
    );
    if (!manRows || manRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Error, No se localizo el registro en la tabla manifiesto3' });
    }
    const cantidadActual = parseFloat(manRows[0].cantidad) || 0;
    const qty = parseFloat(cantidad);
    if (qty <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Cantidad a reversar debe ser mayor que cero' });
    }
    if (qty > cantidadActual) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Cantidad a reversar mayor a la cantidad existente en manifiesto3' });
    }

    // Ajustar cantidad en manifiesto3: si la resta deja 0 -> eliminar la fila; si no -> actualizar cantidad
    const newCantidad = cantidadActual - qty;
    let manifiestoUpdatedRows = 0;
    let manifiestoDeletedRows = 0;
    if (newCantidad <= 0) {
      const [delMan] = await conn.query(
        'DELETE FROM manifiesto3 WHERE boleta = ? AND tipo = ? AND codigo = ? AND manifiesto = ?',
        [boleta, tipo, codigo, manifiesto]
      );
      manifiestoDeletedRows = delMan.affectedRows || 0;
    } else {
      const [updMan] = await conn.query(
        'UPDATE manifiesto3 SET cantidad = ? WHERE boleta = ? AND tipo = ? AND codigo = ? AND manifiesto = ?',
        [newCantidad, boleta, tipo, codigo, manifiesto]
      );
      manifiestoUpdatedRows = updMan.affectedRows || 0;
    }

    // 2) Actualizar materiales_proceso
    const [matRows] = await conn.query(
      'SELECT despachado, ebodega FROM materiales_proceso WHERE boleta = ? AND tipo = ? AND codigo = ? FOR UPDATE',
      [boleta, tipo, codigo]
    );
    if (!matRows || matRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Error, No se localizo el registro en la tabla materiales_proceso' });
    }

    const despachadoActual = parseFloat(matRows[0].despachado) || 0;
    if (qty > despachadoActual) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Error, despachado insuficiente en la tabla materiales_proceso' });
    }

    const [updMat] = await conn.query(
      'UPDATE materiales_proceso SET despachado = despachado - ?, ebodega = ebodega + ? WHERE boleta = ? AND tipo = ? AND codigo = ?',
      [qty, qty, boleta, tipo, codigo]
    );

    // 3) Insertar en transa_ar
    const tipoTransa = `Reversión de Manifiesto (${manifiesto}) a Bodega`;
    const hechoPor = 'Admin';
    const [insTransa] = await conn.query(
      'INSERT INTO transa_ar (boleta, codigo, tipox, descri, cantidad, tipo, hecho_por, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [boleta, codigo, tipo, descri || null, qty, tipoTransa, hechoPor]
    );

    await conn.commit();

    return res.json({
      success: true,
      resumen: {
        manifiestoUpdated: manifiestoUpdatedRows,
        manifiestoDeleted: manifiestoDeletedRows,
        materialesUpdated: updMat.affectedRows || 0,
        transaInserted: insTransa.affectedRows || 0,
        cantidadAnterior: cantidadActual,
        cantidadNueva: newCantidad <= 0 ? 0 : newCantidad
      },
      mensaje: 'Reversión procesada correctamente'
    });
  } catch (error) {
    try { await conn.rollback(); } catch (e) { console.error('Rollback error:', e); }
    console.error('Error en /api/reversar-linea:', error);
    return res.status(500).json({ success: false, error: 'Error al procesar reversión: ' + error.message });
  } finally {
    try { conn.release(); } catch { /* ignore */ }
  }
});

// Endpoint para obtener la estructura de la tabla 'chofer'
app.get('/api/estructura-chofer', async (req, res) => {
  try {
    const [rows] = await pool.query('DESCRIBE chofer');
    res.json({ estructura: rows });
  } catch (error) {
    console.error('Error al obtener la estructura de chofer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint genérico para obtener la estructura de cualquier tabla
app.get('/api/estructura/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const [rows] = await pool.query('DESCRIBE ??', [table]);
    res.json({ estructura: rows });
  } catch (error) {
    console.error(`Error al obtener la estructura de ${table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de prueba para verificar conexión
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente', timestamp: new Date().toISOString() });
});

// Endpoint de prueba para verificar conexión a base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ 
      message: 'Conexión a base de datos exitosa', 
      result: rows[0],
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error de conexión a DB:', error);
    res.status(500).json({ 
      error: 'Error de conexión a base de datos', 
      details: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Endpoint para obtener todos los artículos
app.get('/api/articulos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articulos ORDER BY codigo DESC');
    res.json({
      success: true,
      articulos: rows
    });
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    res.status(500).json({ 
      error: 'Error al obtener artículos: ' + error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Endpoint para obtener reporte agrupado de materiales_proceso
app.get('/api/reporte-agrupado', async (req, res) => {
  try {
    console.log('🔍 Generando reporte agrupado de materiales_proceso...');

    // Consulta SQL que lee articulos y suma acumulados de materiales_proceso
    const [rows] = await pool.query(`
      SELECT
        a.codigo,
        a.descri,
        COALESCE(SUM(mp.cantidad), 0) as cantidad_total,
        COALESCE(SUM(mp.ebodega), 0) as ebodega_total,
        COALESCE(SUM(mp.eproceso), 0) as eproceso_total,
        COALESCE(SUM(mp.eterminado), 0) as eterminado_total,
        COALESCE(SUM(mp.despachado), 0) as despachado_total
      FROM articulos a
      LEFT JOIN materiales_proceso mp ON a.codigo = mp.codigo
      GROUP BY a.codigo, a.descri
      ORDER BY a.codigo ASC
    `);

    console.log(`✅ Reporte generado: ${rows.length} artículos agrupados`);

    res.json({
      success: true,
      reporte: rows,
      total_articulos: rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al generar reporte agrupado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte agrupado: ' + error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Endpoint para obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehiculos ORDER BY placa DESC');
    res.json({
      success: true,
      vehiculos: rows
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ 
      error: 'Error al obtener vehículos: ' + error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Endpoint para obtener estado de documentación por conductor
app.get('/api/conductores/document-status', async (req, res) => {
  try {
    // Obtener todos los choferes (normalizar codigo_chofer con TRIM)
    const [choferes] = await pool.query("SELECT TRIM(codigo_chofer) as codigo_chofer, cedula, nombre, telefonos, imagen, estado FROM chofer ORDER BY codigo_chofer DESC");

    // Obtener todos los registros de conductor_documento (normalizar codigo_chofer con TRIM)
    const [conDocRows] = await pool.query("SELECT TRIM(codigo_chofer) as codigo_chofer, id_docu, fecha_vence FROM conductor_documento");

    // Obtener configuraciones de documentos (docu_config)
    const [docConfigRows] = await pool.query('SELECT id, nombre_documento, aviso_vence_dias FROM docu_config');
    const docConfigById = {};
    docConfigRows.forEach(d => { docConfigById[d.id] = d; });

    // Agrupar registros de conductor_documento por codigo_chofer normalizado
    const docsByCodigo = {};
    conDocRows.forEach(d => {
      const raw = d.codigo_chofer || '';
      const key = String(raw).trim().toUpperCase();
      if (!docsByCodigo[key]) docsByCodigo[key] = [];
      docsByCodigo[key].push(d);
    });

    const today = new Date();

    const results = choferes.map(ch => {
      const codigo = ch.codigo_chofer;
      const key = String(codigo).trim().toUpperCase();
      const docs = docsByCodigo[key] || [];

      if (!docs || docs.length === 0) {
        return { ...ch, estado_documentacion: 'Sin Documentos' };
      }

      let estadoConductor = 'Vigente';

      for (const d of docs) {
        const config = docConfigById[d.id_docu];
        const avisoDias = config && typeof config.aviso_vence_dias !== 'undefined' && config.aviso_vence_dias !== null
          ? Number(config.aviso_vence_dias)
          : 0;

        const fechaVence = d.fecha_vence ? new Date(d.fecha_vence) : null;
        if (!fechaVence || isNaN(fechaVence.getTime())) {
          continue;
        }

        const diffMs = fechaVence.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          estadoConductor = 'Doc. Vencidos';
          break;
        }

        if (diffDays <= avisoDias) {
          if (estadoConductor !== 'Doc. Vencidos') estadoConductor = 'Vigente por vencer';
        } else {
          if (estadoConductor === 'Vigente') estadoConductor = 'Vigente';
        }
      }

      return { ...ch, estado_documentacion: estadoConductor };
    });

    // Persistir estado_documentacion en chofer.estado cuando difiera
    try {
      for (const r of results) {
        const codigoKey = String(r.codigo_chofer).trim().toUpperCase();
        // Use UPPER(TRIM(...)) to ensure comparison matches normalization (mayúsculas + sin padding)
        await pool.query('UPDATE chofer SET estado = ? WHERE UPPER(TRIM(codigo_chofer)) = ?', [r.estado_documentacion, codigoKey]);
      }
    } catch (upErr) {
      console.error('Error al persistir estado_documentacion en chofer:', upErr);
    }

    res.json({ success: true, choferes: results });
  } catch (error) {
    console.error('Error en /api/conductores/document-status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para obtener estado de documentación por vehículo
app.get('/api/vehiculos/document-status', async (req, res) => {
  try {
  // Obtener todos los vehículos (normalizar placa con TRIM para evitar padding CHAR)
  const [vehiculos] = await pool.query("SELECT TRIM(placa) as placa, marca, nombre, anotacion, estado FROM vehiculos ORDER BY placa DESC");

  // Obtener todos los registros de vehiculo_documento (normalizar placa con TRIM)
  const [vehDocRows] = await pool.query("SELECT TRIM(placa) as placa, id_docu, fecha_vence FROM vehiculo_documento");

    // Obtener configuraciones de documentos (docu_config)
    const [docConfigRows] = await pool.query('SELECT id, nombre_documento, aviso_vence_dias FROM docu_config');

    // Indexar docu_config por id para lookup rápido
    const docConfigById = {};
    docConfigRows.forEach(d => { docConfigById[d.id] = d; });

    // Agrupar registros de vehiculo_documento por placa normalizada (trim + uppercase)
    const docsByPlaca = {};
    vehDocRows.forEach(d => {
      const rawPlaca = d.placa || '';
      const placaKey = String(rawPlaca).trim().toUpperCase();
      if (!docsByPlaca[placaKey]) docsByPlaca[placaKey] = [];
      docsByPlaca[placaKey].push(d);
    });

    const today = new Date();

    const results = vehiculos.map(v => {
      const placa = v.placa;

      // Filtrar documentos asociados a esta placa usando normalización
      const placaKey = String(placa).trim().toUpperCase();
      const docs = docsByPlaca[placaKey] || [];

      if (!docs || docs.length === 0) {
        return { ...v, estado_documentacion: 'Sin Documentos' };
      }

      // Evaluar estado para cada documento y tomar el más grave
      let placaEstado = 'Vigente';

      for (const d of docs) {
        const config = docConfigById[d.id_docu];
        // Aviso por defecto si no definido: 0 (pero nos indicas que nunca será 0 en tus datos)
        const avisoDias = config && typeof config.aviso_vence_dias !== 'undefined' && config.aviso_vence_dias !== null
          ? Number(config.aviso_vence_dias)
          : 0;

        // Parsear fecha_vence (puede ser Date o string)
        const fechaVence = d.fecha_vence ? new Date(d.fecha_vence) : null;
        if (!fechaVence || isNaN(fechaVence.getTime())) {
          // Si no hay fecha de vencimiento, consideramos vigente
          continue;
        }

        const diffMs = fechaVence.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          placaEstado = 'Doc. Vencidos';
          break; // estado mas grave
        }

        if (diffDays <= avisoDias) {
          // Si ya tenemos 'Vigente por vencer' o 'Doc. Vencidos', respetar prioridad
          if (placaEstado !== 'Doc. Vencidos') placaEstado = 'Vigente por vencer';
        } else {
          // mayor que avisoDias -> Vigente (no cambia si ya es Vigente por vencer)
          if (placaEstado === 'Vigente') placaEstado = 'Vigente';
        }
      }

      return { ...v, estado_documentacion: placaEstado };
    });
    // Persistir estado_documentacion en vehiculos.estado cuando difiera
    try {
      for (const r of results) {
        const placaKey = String(r.placa).trim().toUpperCase();
        // Actualizar usando TRIM(placa) para coincidir con CHAR(10)
        await pool.query('UPDATE vehiculos SET estado = ? WHERE TRIM(placa) = ?', [r.estado_documentacion, placaKey]);
      }
    } catch (upErr) {
      console.error('Error al persistir estado_documentacion en vehiculos:', upErr);
      // no abortamos la respuesta principal; solo logueamos
    }

    // Si se solicita debug, incluir las placas encontradas en vehiculo_documento
    const debugFlag = req.query && (req.query.debug === '1' || req.query.debug === 'true');
    if (debugFlag) {
      const placasEncontradas = Object.keys(docsByPlaca).sort();
      return res.json({ success: true, vehiculos: results, placasEncontradas });
    }

    // Retornar lista actualizada (los cambios en DB serán visibles)
    res.json({ success: true, vehiculos: results });
  } catch (error) {
    console.error('Error en /api/vehiculos/document-status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para crear un nuevo vehículo
app.post('/api/vehiculos', async (req, res) => {
  const { placa, marca, nombre, anotacion } = req.body;

  // Validar campos requeridos
  if (!placa || !marca || !nombre) {
    return res.status(400).json({ 
      success: false,
      error: 'Los campos placa, marca y nombre son requeridos' 
    });
  }

  try {
    // Verificar si la placa ya existe (es clave primaria)
    const [existing] = await pool.query('SELECT placa FROM vehiculos WHERE placa = ?', [placa]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un vehículo con esa placa'
      });
    }

    // Insertar el nuevo vehículo con estado por defecto 'ACTIVO'
    const [result] = await pool.query(
      'INSERT INTO vehiculos (placa, marca, nombre, anotacion, estado) VALUES (?, ?, ?, ?, ?)',
      [placa.toUpperCase(), marca, nombre, anotacion || '', 'ACTIVO']
    );

    res.json({
      success: true,
      message: 'Vehículo guardado exitosamente',
      vehiculo: {
        placa: placa.toUpperCase(),
        marca,
        nombre,
        anotacion: anotacion || '',
        estado: 'ACTIVO'
      }
    });
  } catch (error) {
    console.error('Error al guardar vehículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar el vehículo: ' + error.message
    });
  }
});

// Endpoint para actualizar un vehículo existente
app.put('/api/vehiculos/:placa', async (req, res) => {
  const { placa } = req.params;
  const { marca, nombre, anotacion } = req.body;

  // Validar campos requeridos
  if (!marca || !nombre) {
    return res.status(400).json({ 
      success: false,
      error: 'Los campos marca y nombre son requeridos' 
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar si el vehículo existe
    const [existing] = await connection.query('SELECT placa FROM vehiculos WHERE placa = ?', [placa]);
    if (existing.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Actualizar el vehículo
    await connection.query(
      'UPDATE vehiculos SET marca = ?, nombre = ?, anotacion = ? WHERE placa = ?',
      [marca, nombre, anotacion || '', placa]
    );

    // Actualizar boletas relacionadas de forma atómica
    const [boletasResult] = await connection.query(
      'UPDATE boletas SET camion_n = ? WHERE camion_p = ?',
      [nombre, placa]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Vehículo y boletas actualizadas exitosamente',
      vehiculo: {
        placa,
        marca,
        nombre,
        anotacion: anotacion || ''
      },
      boletasUpdated: boletasResult.affectedRows || 0
    });
  } catch (error) {
    console.error('Error al actualizar vehículo (transacción):', error);
    try {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
    } catch (rbErr) {
      console.error('Error al hacer rollback:', rbErr);
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar el vehículo: ' + error.message
    });
  }
});

// Endpoint para obtener imágenes de un vehículo
app.get('/api/vehiculos/:placa/imagenes', async (req, res) => {
  const { placa } = req.params;

  try {
    const [imagenes] = await pool.query(
      'SELECT id, placa, imagen, detalle_imagen FROM vehiculos_imagen WHERE placa = ? ORDER BY id DESC',
      [placa]
    );

    res.json({
      success: true,
      imagenes: imagenes
    });
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener imágenes: ' + error.message
    });
  }
});

// Endpoint para eliminar un vehículo si no tiene boletas relacionadas
app.delete('/api/vehiculos/:placa', async (req, res) => {
  const { placa } = req.params;

  let connection;
  try {
    // Primero verificar si existen boletas relacionadas
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM boletas WHERE camion_p = ?', [placa]);
    const boletasCount = (countRows && countRows[0] && countRows[0].cnt) ? countRows[0].cnt : 0;

    if (boletasCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Registro NO puede eliminarse porque tiene Boletas Relacionadas',
        boletasCount
      });
    }

    // No hay boletas: procedemos a borrar vehiculo_documento y vehiculos en transacción
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Eliminar documentos asociados
    const [delDocs] = await connection.query('DELETE FROM vehiculo_documento WHERE placa = ?', [placa]);

    // Eliminar vehículo
    const [delVeh] = await connection.query('DELETE FROM vehiculos WHERE placa = ?', [placa]);

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Vehículo eliminado exitosamente',
      vehiculoDeleted: delVeh.affectedRows || 0,
      documentosDeleted: delDocs.affectedRows || 0
    });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    try { if (connection) { await connection.rollback(); connection.release(); } } catch (e) { console.error('rollback err', e); }
    res.status(500).json({ success: false, error: 'Error al eliminar vehículo: ' + error.message });
  }
});

// Endpoint para guardar una imagen de vehículo
app.post('/api/vehiculos/:placa/imagenes', async (req, res) => {
  const { placa } = req.params;
  const { imagen, detalle_imagen } = req.body;

  if (!imagen || !detalle_imagen) {
    return res.status(400).json({
      success: false,
      error: 'Los campos imagen y detalle_imagen son requeridos'
    });
  }

  try {
    // Verificar que el vehículo existe
    const [vehiculo] = await pool.query('SELECT placa FROM vehiculos WHERE placa = ?', [placa]);
    if (vehiculo.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Insertar la imagen
    const [result] = await pool.query(
      'INSERT INTO vehiculos_imagen (placa, imagen, detalle_imagen) VALUES (?, ?, ?)',
      [placa, imagen, detalle_imagen]
    );

    res.json({
      success: true,
      message: 'Imagen guardada exitosamente',
      imagen: {
        id: result.insertId,
        placa,
        imagen,
        detalle_imagen
      }
    });
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar imagen: ' + error.message
    });
  }
});

// Endpoint para insertar o actualizar relación conductor_documento
app.post('/api/conductor-documento', async (req, res) => {
  const { codigo_chofer, documento_id, notas, fecha_emision, fecha_vencimiento } = req.body;

  if (!codigo_chofer || !documento_id) {
    return res.status(400).json({ success: false, error: 'codigo_chofer y documento_id son requeridos' });
  }

  try {
    // Verificar existencia por codigo_chofer + id_docu (documento_id)
    const [existing] = await pool.query(
      'SELECT id, codigo_chofer, id_docu, fecha_emision, fecha_vence, notas FROM conductor_documento WHERE codigo_chofer = ? AND id_docu = ? LIMIT 1',
      [codigo_chofer, documento_id]
    );

    if (existing.length > 0) {
      // Actualizar solo campos que vienen (si no vienen, mantener valor previo)
      const record = existing[0];
      const newFechaEmision = fecha_emision || record.fecha_emision;
      const newFechaVence = fecha_vencimiento || record.fecha_vence;
      const newNotas = (typeof notas !== 'undefined' && notas !== null) ? notas : record.notas;

      await pool.query(
        'UPDATE conductor_documento SET fecha_emision = ?, fecha_vence = ?, notas = ?, updated_at = NOW() WHERE id = ?',
        [newFechaEmision, newFechaVence, newNotas, record.id]
      );

      return res.json({ success: true, action: 'update', id: record.id });
    } else {
      // Insertar nuevo registro; created_at y updated_at se ponen a NOW()
      const [insertResult] = await pool.query(
        'INSERT INTO conductor_documento (codigo_chofer, id_docu, fecha_emision, fecha_vence, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [codigo_chofer, documento_id, fecha_emision || null, fecha_vencimiento || null, notas || null]
      );

      return res.json({ success: true, action: 'insert', id: insertResult.insertId });
    }
  } catch (error) {
    console.error('Error en /api/conductor-documento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para inicializar la tabla vehiculo_documento (CREATE TABLE IF NOT EXISTS)
app.post('/api/init-vehiculo-documento', async (req, res) => {
  try {
    const createSql = `
      CREATE TABLE IF NOT EXISTS vehiculo_documento (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        placa CHAR(10) NOT NULL,
        id_docu INT(11) NOT NULL,
        fecha_emision DATE NULL,
        fecha_vence DATE NULL,
        notas VARCHAR(256) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_placa (placa),
        INDEX idx_id_docu (id_docu),
        INDEX idx_fecha_vence (fecha_vence),
        UNIQUE KEY unique_vehiculo_documento (placa, id_docu)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createSql);
    return res.json({ success: true, message: 'Tabla vehiculo_documento creada o ya existente' });
  } catch (error) {
    console.error('Error creando tabla vehiculo_documento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para insertar o actualizar relación vehiculo_documento (upsert por placa + id_docu)
app.post('/api/vehiculo-documento', async (req, res) => {
  const { placa, documento_id, notas, fecha_emision, fecha_vencimiento } = req.body;

  if (!placa || !documento_id) {
    return res.status(400).json({ success: false, error: 'placa y documento_id son requeridos' });
  }

  try {
    // Verificar existencia por placa + id_docu
    const [existing] = await pool.query(
      'SELECT id, placa, id_docu, fecha_emision, fecha_vence, notas FROM vehiculo_documento WHERE placa = ? AND id_docu = ? LIMIT 1',
      [placa, documento_id]
    );

    if (existing.length > 0) {
      const record = existing[0];
      const newFechaEmision = fecha_emision || record.fecha_emision;
      const newFechaVence = fecha_vencimiento || record.fecha_vence;
      const newNotas = (typeof notas !== 'undefined' && notas !== null) ? notas : record.notas;

      await pool.query(
        'UPDATE vehiculo_documento SET fecha_emision = ?, fecha_vence = ?, notas = ?, updated_at = NOW() WHERE id = ?',
        [newFechaEmision, newFechaVence, newNotas, record.id]
      );

      return res.json({ success: true, action: 'update', id: record.id });
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO vehiculo_documento (placa, id_docu, fecha_emision, fecha_vence, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [placa, documento_id, fecha_emision || null, fecha_vencimiento || null, notas || null]
      );

      return res.json({ success: true, action: 'insert', id: insertResult.insertId });
    }
  } catch (error) {
    console.error('Error en /api/vehiculo-documento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET documents for a specific placa, joined with docu_config
app.get('/api/vehiculo-documento/:placa', async (req, res) => {
  const { placa } = req.params;
  if (!placa) return res.status(400).json({ success: false, message: 'Placa requerida' });
  try {
    // Normalize placa for comparison in DB (trim and upper)
    const normalized = String(placa).trim().toUpperCase();
    const [rows] = await pool.query(
      `SELECT vd.id, TRIM(vd.placa) as placa, vd.id_docu as documento_id, vd.fecha_emision, vd.fecha_vence, vd.notas as nota_vehiculo_doc,
              dc.nombre_documento, dc.nota as nota_documento, dc.autoridad_relacion, dc.aviso_vence_dias
       FROM vehiculo_documento vd
       LEFT JOIN docu_config dc ON dc.id = vd.id_docu
       WHERE UPPER(TRIM(vd.placa)) = ?
       ORDER BY vd.fecha_vence ASC`,
      [normalized]
    );

    // Calcular estado por documento: 'Doc. Vencidos' > 'Vigente por vencer' > 'Vigente'
  const documentosConEstado = rows.map(r => {
      const fechaVence = r.fecha_vence ? new Date(r.fecha_vence) : null;
      let estado = 'Vigente';
      let diasParaVencer = null;
      if (fechaVence) {
        const hoy = new Date();
        // clear time portion for diff
        const diffMs = fechaVence.setHours(0,0,0,0) - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
        diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const aviso = Number(r.aviso_vence_dias) || 0;
        if (diasParaVencer < 0) {
          estado = 'Doc. Vencidos';
        } else if (diasParaVencer <= aviso) {
          estado = 'Vigente por vencer';
        } else {
          estado = 'Vigente';
        }
      } else {
        estado = 'Sin Fecha';
      }
      return { ...r, estado_documento: estado, dias_para_vencer: diasParaVencer };
    });

    res.json({ success: true, placa: normalized, documentos: documentosConEstado });
  } catch (err) {
    console.error('Error fetching vehiculo documentos:', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// GET documents for a specific conductor (codigo_chofer), joined with docu_config
app.get('/api/conductor-documento/:codigo', async (req, res) => {
  const { codigo } = req.params;
  if (!codigo) return res.status(400).json({ success: false, message: 'Código de conductor requerido' });
  try {
    // Normalize to upper case trimmed to match storage (CHAR padding / case differences)
    const normalized = String(codigo).trim().toUpperCase();

    // By default, return only records that belong to this conductor (inner join)
    // If caller passes ?includeAll=1 we return all docu_config rows (left-join) so the UI can show 'Sin Registro'
    const includeAll = req.query && (req.query.includeAll === '1' || req.query.includeAll === 'true');

    if (includeAll) {
      const [rows] = await pool.query(
        `SELECT dc.id as docu_id, dc.nombre_documento, dc.nota as nota_documento, dc.autoridad_relacion, dc.aviso_vence_dias, dc.aplica_a,
                cd.id as cd_id, cd.codigo_chofer, cd.id_docu as documento_id, cd.fecha_emision, cd.fecha_vence, cd.notas as nota_conductor_doc
         FROM docu_config dc
         LEFT JOIN conductor_documento cd ON cd.id_docu = dc.id AND UPPER(TRIM(cd.codigo_chofer)) = ?
         WHERE dc.aplica_a = 'conductor'
         ORDER BY dc.id ASC`,
        [normalized]
      );

      console.log('📄 /api/conductor-documento (left-join docu_config)', { codigo: normalized, totalDocTypes: rows.length });

      const documentosConEstado = rows.map(r => {
        const fechaVence = r.fecha_vence ? new Date(r.fecha_vence) : null;
        let estado = null;
        let diasParaVencer = null;

        if (!r.cd_id) {
          estado = 'Sin Registro';
        } else if (!fechaVence || isNaN(fechaVence.getTime())) {
          estado = 'Sin Fecha';
        } else {
          const hoy = new Date();
          const diffMs = fechaVence.setHours(0,0,0,0) - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
          diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const aviso = Number(r.aviso_vence_dias) || 0;
          if (diasParaVencer < 0) {
            estado = 'Doc. Vencidos';
          } else if (diasParaVencer <= aviso) {
            estado = 'Vigente por vencer';
          } else {
            estado = 'Vigente';
          }
        }

        return {
          id: r.cd_id || null,
          documento_id: r.docu_id,
          nombre_documento: r.nombre_documento,
          nota_documento: r.nota_documento,
          autoridad_relacion: r.autoridad_relacion,
          fecha_emision: r.fecha_emision || null,
          fecha_vence: r.fecha_vence || null,
          nota_conductor_doc: r.nota_conductor_doc || null,
          aplica_a: r.aplica_a,
          estado_documento: estado,
          dias_para_vencer: diasParaVencer
        };
      });

      return res.json({ success: true, codigo: normalized, documentos: documentosConEstado });
    }

    // Default: return only conductor-specific records using INNER JOIN so the modal shows only rows for that conductor
    const [ownRows] = await pool.query(
      `SELECT cd.id as id, TRIM(cd.codigo_chofer) as codigo_chofer, cd.id_docu as documento_id, cd.fecha_emision, cd.fecha_vence, cd.notas as nota_conductor_doc,
              dc.id as docu_id, dc.nombre_documento, dc.nota as nota_documento, dc.autoridad_relacion, dc.aviso_vence_dias
       FROM conductor_documento cd
       INNER JOIN docu_config dc ON dc.id = cd.id_docu
       WHERE UPPER(TRIM(cd.codigo_chofer)) = ?
       ORDER BY cd.fecha_vence ASC`,
      [normalized]
    );

    // Debug: print a small sample to verify the query returned only the conductor's rows
    try {
      console.log('📄 /api/conductor-documento (inner join)', { codigo: normalized, rows: ownRows.length });
      console.log('📄 /api/conductor-documento (inner join) sample rows:', ownRows.slice(0, 10).map(r => ({ id: r.id, codigo_chofer: r.codigo_chofer || r.codigo_chofer, documento_id: r.documento_id || r.id_docu })));
    } catch (dbgErr) {
      console.error('Error logging debug sample for /api/conductor-documento:', dbgErr);
    }

    const documentosConEstado = ownRows.map(r => {
      const fechaVence = r.fecha_vence ? new Date(r.fecha_vence) : null;
      let estado = 'Vigente';
      let diasParaVencer = null;
      if (fechaVence && !isNaN(fechaVence.getTime())) {
        const hoy = new Date();
        const diffMs = fechaVence.setHours(0,0,0,0) - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
        diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const aviso = Number(r.aviso_vence_dias) || 0;
        if (diasParaVencer < 0) {
          estado = 'Doc. Vencidos';
        } else if (diasParaVencer <= aviso) {
          estado = 'Vigente por vencer';
        } else {
          estado = 'Vigente';
        }
      } else {
        estado = 'Sin Fecha';
      }

      return {
        id: r.id,
        documento_id: r.documento_id,
        nombre_documento: r.nombre_documento,
        nota_documento: r.nota_documento,
        autoridad_relacion: r.autoridad_relacion,
        fecha_emision: r.fecha_emision || null,
        fecha_vence: r.fecha_vence || null,
        nota_conductor_doc: r.nota_conductor_doc || null,
        estado_documento: estado,
        dias_para_vencer: diasParaVencer
      };
    });

    res.json({ success: true, codigo: normalized, documentos: documentosConEstado });
  } catch (err) {
    console.error('Error fetching conductor documentos:', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Endpoint para eliminar una imagen
app.delete('/api/vehiculos/imagenes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la imagen antes de eliminarla (para obtener la URL de Cloudinary)
    const [imagen] = await pool.query('SELECT imagen FROM vehiculos_imagen WHERE id = ?', [id]);
    
    if (imagen.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    const cloudinaryUrl = imagen[0].imagen;

    // Eliminar de la base de datos
    await pool.query('DELETE FROM vehiculos_imagen WHERE id = ?', [id]);

    // Extraer public_id de la URL de Cloudinary para eliminar
    let publicId = null;
    let cloudinaryDeleted = false;

    try {
      // URL formato: https://res.cloudinary.com/dbdcyfeew/image/upload/v1234567890/public_id.ext
      const urlParts = cloudinaryUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Obtiene "public_id.ext"
      publicId = fileName.split('.')[0]; // Obtiene solo "public_id"

      // Intentar eliminar de Cloudinary
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        cloudinaryDeleted = result.result === 'ok';
        console.log('Cloudinary deletion result:', result);
      }
    } catch (cloudinaryError) {
      console.error('Error al eliminar de Cloudinary:', cloudinaryError);
      // No fallar la operación si Cloudinary falla
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente de la base de datos' + 
               (cloudinaryDeleted ? ' y Cloudinary' : ' (Cloudinary: error)'),
      cloudinaryUrl: cloudinaryUrl,
      publicId: publicId,
      cloudinaryDeleted: cloudinaryDeleted
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar imagen: ' + error.message
    });
  }
});

// Endpoint para cambiar número de manifiesto
app.put('/api/manifiestos/:numero/cambiar-numero', async (req, res) => {
  const { numero } = req.params; // número antiguo
  const { nuevoNumero } = req.body;

  if (!nuevoNumero) {
    return res.status(400).json({ success: false, error: 'nuevoNumero es requerido' });
  }

  try {
    // Verificar si nuevoNumero ya existe en la tabla manifiestos
    const [existing] = await pool.query('SELECT numero FROM manifiestos WHERE numero = ?', [nuevoNumero]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'El número ya existe en manifiestos' });
    }

    // Iniciar transacción para mantener consistencia entre tablas
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Actualizar tabla manifiestos: reemplazar numero antiguo por nuevo
      await connection.query('UPDATE manifiestos SET numero = ? WHERE numero = ?', [nuevoNumero, numero]);

      // Actualizar tabla manifiesto3: reemplazar campo manifiesto por nuevo
      await connection.query('UPDATE manifiesto3 SET manifiesto = ? WHERE manifiesto = ?', [nuevoNumero, numero]);

      await connection.commit();
      connection.release();

      res.json({ success: true, message: 'Número de manifiesto actualizado correctamente' });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en transacción cambiar-numero:', txErr);
      res.status(500).json({ success: false, error: 'Error al actualizar números en la base de datos' });
    }
  } catch (error) {
    console.error('Error en endpoint cambiar-numero:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint adicional para eliminar solo de Cloudinary (opcional)
app.delete('/api/cloudinary/:publicId', async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    res.json({
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'Imagen eliminada de Cloudinary' : 'No se pudo eliminar de Cloudinary',
      cloudinaryResult: result
    });
  } catch (error) {
    console.error('Error al eliminar de Cloudinary:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar de Cloudinary: ' + error.message
    });
  }
});

// Endpoint para crear un nuevo artículo
app.post('/api/articulos', async (req, res) => {
  const { codigo, descri, unidad, familia, categoria, tipo_cert, tipo_res } = req.body;

  // Validar campos requeridos
  if (!codigo || !descri) {
    return res.status(400).json({ error: 'Los campos código y descripción son requeridos' });
  }

  try {
    // Verificar si el código ya existe
    const [existing] = await pool.query('SELECT codigo FROM articulos WHERE codigo = ?', [codigo]);
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'El código ya existe',
        message: 'Ya existe un artículo con este código'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO articulos (codigo, descri, unidad, familia, categoria, tipo_cert, tipo_res) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [codigo, descri, unidad, familia, categoria, tipo_cert, tipo_res]
    );
    res.json({
      id: result.insertId,
      codigo,
      descri,
      unidad,
      familia,
      categoria,
      tipo_cert,
      tipo_res,
      message: 'Artículo guardado correctamente'
    });
  } catch (error) {
    console.error('Error al guardar artículo:', error);
    res.status(500).json({ error: 'No se pudo guardar el artículo' });
  }
});

// Endpoint para cambiar código de artículo en múltiples tablas
app.put('/api/articulos/cambiar-codigo', async (req, res) => {
  const { codigoActual, codigoNuevo } = req.body;

  if (!codigoActual || !codigoNuevo) {
    return res.status(400).json({ error: 'Se requieren codigoActual y codigoNuevo' });
  }

  if (codigoActual === codigoNuevo) {
    return res.status(400).json({ error: 'El nuevo código debe ser diferente al código actual' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Verificar que el nuevo código NO exista en articulos
    const [existingRows] = await connection.query('SELECT COUNT(*) as count FROM articulos WHERE codigo = ?', [codigoNuevo]);
    if (existingRows[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'El código nuevo ya existe en la tabla articulos' });
    }

    const resultados = {
      articulos: 0,
      materiales_proceso: 0,
      transa_ar: 0,
      manifiesto3: 0,
      articulos_x_cliente: 0
    };

    // 2. Actualizar articulos
    const [artResult] = await connection.query('UPDATE articulos SET codigo = ? WHERE codigo = ?', [codigoNuevo, codigoActual]);
    resultados.articulos = artResult.affectedRows;

    // 3. Actualizar materiales_proceso
    const [mpResult] = await connection.query('UPDATE materiales_proceso SET codigo = ? WHERE codigo = ?', [codigoNuevo, codigoActual]);
    resultados.materiales_proceso = mpResult.affectedRows;

    // 4. Actualizar transa_ar
    const [taResult] = await connection.query('UPDATE transa_ar SET codigo = ? WHERE codigo = ?', [codigoNuevo, codigoActual]);
    resultados.transa_ar = taResult.affectedRows;

    // 5. Actualizar manifiesto3
    const [m3Result] = await connection.query('UPDATE manifiesto3 SET codigo = ? WHERE codigo = ?', [codigoNuevo, codigoActual]);
    resultados.manifiesto3 = m3Result.affectedRows;

    // 6. Actualizar articulos_x_cliente
    const [axcResult] = await connection.query('UPDATE articulos_x_cliente SET codigo = ? WHERE codigo = ?', [codigoNuevo, codigoActual]);
    resultados.articulos_x_cliente = axcResult.affectedRows;

    // Confirmar transacción
    await connection.commit();

    // Preparar resumen de cambios
    const tablasAfectadas = [];
    Object.entries(resultados).forEach(([tabla, registros]) => {
      if (registros > 0) {
        tablasAfectadas.push(`${tabla}: ${registros} registro${registros !== 1 ? 's' : ''}`);
      }
    });

    res.json({
      success: true,
      message: 'Código de artículo cambiado exitosamente',
      resultados,
      tablasAfectadas: tablasAfectadas.length > 0 ? tablasAfectadas : ['Solo se cambió el código en articulos']
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al cambiar código de artículo:', error);
    res.status(500).json({
      error: 'Error al cambiar el código del artículo: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// Endpoint para actualizar un artículo existente (solo campos modificados)
app.put('/api/articulos/:codigo', async (req, res) => {
  const { codigo } = req.params;
  const campos = req.body;
  if (!codigo) {
    return res.status(400).json({ error: 'Código requerido' });
  }
  if (!campos || Object.keys(campos).length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  // Iniciar transacción para asegurar consistencia
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Actualizar tabla principal articulos
    const setStr = Object.keys(campos).map(key => `${key} = ?`).join(', ');
    const values = Object.values(campos);
    const [result] = await connection.query(
      `UPDATE articulos SET ${setStr} WHERE codigo = ?`,
      [...values, codigo]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    // 2. Si se actualizó la descripción, propagar cambios a tablas relacionadas
    if (campos.descri !== undefined) {
      const nuevaDescripcion = campos.descri;

      // Actualizar articulos_x_cliente
      await connection.query(
        'UPDATE articulos_x_cliente SET descri = ? WHERE codigo = ?',
        [nuevaDescripcion, codigo]
      );

      // Actualizar manifiesto3
      await connection.query(
        'UPDATE manifiesto3 SET articulo = ? WHERE codigo = ?',
        [nuevaDescripcion, codigo]
      );

      // Actualizar materiales_proceso
      await connection.query(
        'UPDATE materiales_proceso SET descri = ? WHERE codigo = ?',
        [nuevaDescripcion, codigo]
      );

      // Actualizar transa_ar
      await connection.query(
        'UPDATE transa_ar SET descri = ? WHERE codigo = ?',
        [nuevaDescripcion, codigo]
      );
    }

    // 3. Si se actualizaron tipo_cert o tipo_res, propagar a materiales_proceso
    if (campos.tipo_cert !== undefined || campos.tipo_res !== undefined) {
      const updateFields = [];
      const updateValues = [];

      if (campos.tipo_cert !== undefined) {
        updateFields.push('tipo_cert = ?');
        updateValues.push(campos.tipo_cert);
      }

      if (campos.tipo_res !== undefined) {
        updateFields.push('tipo_res = ?');
        updateValues.push(campos.tipo_res);
      }

      if (updateFields.length > 0) {
        const setStr = updateFields.join(', ');
        await connection.query(
          `UPDATE materiales_proceso SET ${setStr} WHERE codigo = ?`,
          [...updateValues, codigo]
        );
      }
    }

    // Confirmar transacción
    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Artículo actualizado correctamente',
      cambios: campos,
      tablas_actualizadas: campos.descri !== undefined ?
        ['articulos', 'articulos_x_cliente', 'manifiesto3', 'materiales_proceso', 'transa_ar'] :
        (campos.tipo_cert !== undefined || campos.tipo_res !== undefined ?
          ['articulos', 'materiales_proceso'] :
          ['articulos'])
    });

  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    connection.release();

    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'No se pudo actualizar el artículo y sus referencias' });
  }
});

// DELETE - Eliminar artículo por código
app.delete('/api/articulos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [result] = await pool.query('DELETE FROM articulos WHERE codigo = ?', [codigo]);
    
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Artículo eliminado correctamente', affectedRows: result.affectedRows });
    } else {
      res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'Error al eliminar el artículo' });
  }
});

// Endpoint para obtener la lista de familias
app.get('/api/familias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM familia ORDER BY nombref');
    res.json(rows); // Devolver array directamente como en unidades
  } catch (error) {
    console.error('Error al obtener familias:', error);
    // Fallback a datos mock si hay error de conexión
    const familiasMock = [
      { nombref: 'FERRETERIA' },
      { nombref: 'AUTOMOTRIZ' },
      { nombref: 'ELECTRONICA' },
      { nombref: 'OFICINA' },
      { nombref: 'CONSTRUCCION' }
    ];
    res.json(familiasMock); // Array directo también en el mock
  }
});

// Endpoint para obtener la lista de categorías
// Endpoint para obtener la lista de tipos de certificado
app.get('/api/certificado_tipos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM certificado_tipos ORDER BY tipo');
    res.json({ certificado_tipos: rows });
  } catch (error) {
    console.error('Error al obtener tipos de certificado:', error);
    // Fallback a datos mock si hay error de conexión
    const tiposMock = [
      { codigo: 'CT01', tipo: 'CALIDAD' },
      { codigo: 'CT02', tipo: 'GARANTÍA' },
      { codigo: 'CT03', tipo: 'ORIGEN' }
    ];
    res.json({ certificado_tipos: tiposMock, warning: 'Usando datos de prueba - Error de conexión a BD' });
  }
});

// Endpoint para obtener la lista de tipos de certificado
app.get('/api/residuo_x_cert', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM residuo_x_cert ORDER BY nombre');
    res.json({ residuos: rows });
  } catch (error) {
    console.error('Error al obtener residuos_x_cert:', error);
    // Fallback a datos mock si hay error de conexión
    const residuosMock = [
      { codigo_c: 'CT01', codigo_r: 'R01', nombre: 'RESIDUO A' },
      { codigo_c: 'CT02', codigo_r: 'R02', nombre: 'RESIDUO B' },
      { codigo_c: 'CT03', codigo_r: 'R03', nombre: 'RESIDUO C' }
    ];
    res.json({ residuos: residuosMock, warning: 'Usando datos de prueba - Error de conexión a BD' });
  }
});

// ================================
// ENDPOINTS PARA BOLETAS
// ================================

// Endpoint para obtener todas las boletas con paginación y búsqueda
app.get('/api/boletas', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    // Agregar búsqueda si se proporciona
    if (search) {
      whereClause = `WHERE 
        numero LIKE ? OR 
        chofer LIKE ? OR 
        camion_n LIKE ? OR 
        estado LIKE ? OR 
        clienten LIKE ? OR 
        tipo LIKE ?`;
      const searchParam = `%${search}%`;
      queryParams = [searchParam, searchParam, searchParam, searchParam, searchParam, searchParam];
    }

    // Filtrar por código de chofer (chofer_c) si se proporciona
    const chofer_c = req.query.chofer_c || '';
    if (chofer_c) {
      if (whereClause) {
        // ya existe WHERE por search
        whereClause = whereClause + ' AND (chofer_c = ? OR chofer = ?)';
        queryParams.push(chofer_c, chofer_c);
      } else {
        whereClause = 'WHERE (chofer_c = ? OR chofer = ?)';
        queryParams = [chofer_c, chofer_c];
      }
    }

    // Filtrar por placa del camión (camion_p) si se proporciona
    const camion_p = req.query.camion_p || '';
    if (camion_p) {
      if (whereClause) {
        whereClause = whereClause + ' AND (camion_p = ? OR camion_n = ?)';
        queryParams.push(camion_p, camion_p);
      } else {
        whereClause = 'WHERE (camion_p = ? OR camion_n = ?)';
        queryParams = [camion_p, camion_p];
      }
    }

    // Contar total de registros
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM boletas ${whereClause}
    `, queryParams);
    const totalRecords = countResult[0].total;

    let rows;
    if (chofer_c || camion_p) {
      // Si se filtra por conductor, devolver todas las boletas coincidentes (sin paginación)
      const [allRows] = await pool.query(`
        SELECT 
          numero,
          fecha,
          hora,
          chofer,
          chofer_c,
          camion_p,
          camion_n,
          estado,
          despachado,
          clientec,
          clienten,
          manifiesto,
          tipo,
          semana,
          año,
          facturado,
          factura,
          noaplica,
          che,
          peso,
          cambio_pes,
          precio,
          certifica,
          nota,
          intermed
        FROM boletas
        ${whereClause}
        ORDER BY fecha DESC, numero DESC
      `, queryParams);
      rows = allRows;
      // Return all without pagination metadata
      res.json({ boletas: rows, total: rows.length });
      return;
    } else {
      // Obtener registros paginados
      const [pagedRows] = await pool.query(`
        SELECT 
          numero,
          fecha,
          hora,
          chofer,
          chofer_c,
          camion_p,
          camion_n,
          estado,
          despachado,
          clientec,
          clienten,
          manifiesto,
          tipo,
          semana,
          año,
          facturado,
          factura,
          noaplica,
          che,
          peso,
          cambio_pes,
          precio,
          certifica,
          nota,
          intermed
        FROM boletas 
        ${whereClause}
        ORDER BY fecha DESC, numero DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]);

      res.json({
        boletas: pagedRows,
        total: totalRecords,
        page: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit: limit
      });
      return;
    }
  } catch (error) {
    console.error('Error al obtener boletas:', error);
    res.status(500).json({
      error: 'Error al obtener boletas: ' + error.message
    });
  }
});

// Endpoint para exportar todas las boletas (sin paginación)
app.get('/api/boletas/export', async (req, res) => {
  try {
    const search = req.query.search || '';
    let whereClause = '';
    let queryParams = [];

    // Agregar búsqueda si se proporciona
    if (search) {
      whereClause = `WHERE 
        numero LIKE ? OR 
        chofer LIKE ? OR 
        camion_n LIKE ? OR 
        estado LIKE ? OR 
        clienten LIKE ? OR 
        tipo LIKE ?`;
      const searchParam = `%${search}%`;
      queryParams = [searchParam, searchParam, searchParam, searchParam, searchParam, searchParam];
    }

    // Obtener todos los registros para exportación
    const [rows] = await pool.query(`
      SELECT 
        numero, fecha, chofer, camion_n, estado, clienten, tipo
      FROM boletas 
      ${whereClause}
      ORDER BY fecha DESC, numero DESC
    `, queryParams);

    res.json(rows);
  } catch (error) {
    console.error('Error al exportar boletas:', error);
    res.status(500).json({
      error: 'Error al exportar boletas: ' + error.message
    });
  }
});

// Endpoint: lista de clientes (para selects)
app.get('/api/list/clientes', async (req, res) => {
  try {
    // La tabla clientes usa columnas 'codigo' y 'nombre' en este schema
    const [rows] = await pool.query('SELECT codigo, nombre FROM clientes ORDER BY nombre');
    res.json({ clientes: rows });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
  }
});

// Endpoint: lista de conductores
app.get('/api/list/conductores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT codigo_chofer, nombre FROM chofer ORDER BY nombre');
    res.json({ conductores: rows });
  } catch (error) {
    console.error('Error al obtener conductores:', error);
    res.status(500).json({ error: 'Error al obtener conductores: ' + error.message });
  }
});

// Endpoint: lista de vehiculos
app.get('/api/list/vehiculos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT placa, nombre FROM vehiculos ORDER BY placa');
    res.json({ vehiculos: rows });
  } catch (error) {
    console.error('Error al obtener vehiculos:', error);
    res.status(500).json({ error: 'Error al obtener vehiculos: ' + error.message });
  }
});

// Endpoint para reportes de boletas (filtros combinables) - devuelve todas las filas que cumplen
app.get('/api/reportes/boletas', async (req, res) => {
  try {
    const { desde, hasta, clienteId, vehiculoId, conductorId, tipo } = req.query;

    const whereClauses = [];
    const params = [];

    if (desde) {
      whereClauses.push('fecha >= ?');
      params.push(desde);
    }
    if (hasta) {
      whereClauses.push('fecha <= ?');
      params.push(hasta);
    }
    if (clienteId) {
      whereClauses.push('clientec = ? OR clienten = ?');
      params.push(clienteId, clienteId);
    }
    if (vehiculoId) {
      // vehiculoId puede ser placa o nombre del vehículo. Soportar ambos:
      // - comparar con camion_n o camion_p
      // - o buscar placas cuyo nombre coincida con el valor proporcionado
      whereClauses.push('(camion_n = ? OR camion_p = ? OR camion_n IN (SELECT placa FROM vehiculos WHERE nombre = ?))');
      params.push(vehiculoId, vehiculoId, vehiculoId);
    }
    if (conductorId) {
      whereClauses.push('(chofer = ? OR chofer_c = ?)');
      params.push(conductorId, conductorId);
    }
    if (tipo) {
      whereClauses.push('tipo = ?');
      params.push(tipo);
    }

    const where = whereClauses.length ? ('WHERE ' + whereClauses.join(' AND ')) : '';

    const sql = `SELECT numero, tipo, fecha, clienten, camion_n, chofer FROM boletas ${where} ORDER BY fecha DESC, numero DESC`;

    const [rows] = await pool.query(sql, params);

    res.json({ rows, total: rows.length });
  } catch (error) {
    console.error('Error al generar reporte de boletas:', error);
    res.status(500).json({ error: 'Error al generar reporte: ' + error.message });
  }
});

// Endpoint para verificar existencia por numero + tipo (consulta exacta)
// NOTE: use an explicit path so Express does not match it as :numero
app.get('/api/boletas/exists', async (req, res) => {
  try {
    const { numero, tipo } = req.query;
    if (!numero) return res.status(400).json({ error: 'Parametro numero requerido' });
    const [rows] = await pool.query('SELECT numero, tipo FROM boletas WHERE numero = ? AND tipo = ? LIMIT 1', [numero, tipo || '']);
    if (rows && rows.length > 0) {
      return res.json({ exists: true, boleta: rows[0] });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error en /api/boletas/exists:', error);
    res.status(500).json({ error: 'Error verificando boleta' });
  }
});

// Endpoint para obtener una boleta específica por número
app.get('/api/boletas/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        numero,
        fecha,
        hora,
        chofer,
        chofer_c,
        camion_p,
        camion_n,
        estado,
        despachado,
        clientec,
        clienten,
        manifiesto,
        tipo,
        semana,
        año,
        facturado,
        factura,
        noaplica,
        che,
        peso,
        cambio_pes,
        precio,
        certifica,
        nota,
        intermed
      FROM boletas 
      WHERE numero = ?
    `, [numero]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Boleta no encontrada'
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener boleta:', error);
    res.status(500).json({
      error: 'Error al obtener boleta: ' + error.message
    });
  }
});

// Endpoint para obtener una boleta específica por número y tipo (filtrado exacto)
app.get('/api/boletas/:numero/:tipo', async (req, res) => {
  try {
    const { numero, tipo } = req.params;
    if (!numero || !tipo) return res.status(400).json({ error: 'Número y tipo son requeridos' });

    const [rows] = await pool.query(`
      SELECT 
        numero,
        fecha,
        hora,
        chofer,
        chofer_c,
        camion_p,
        camion_n,
        estado,
        despachado,
        clientec,
        clienten,
        manifiesto,
        tipo,
        semana,
        año,
        facturado,
        factura,
        noaplica,
        che,
        peso,
        cambio_pes,
        precio,
        certifica,
        nota,
        intermed
      FROM boletas 
      WHERE numero = ? AND tipo = ?
      LIMIT 1
    `, [numero, tipo]);

    if (rows.length === 0) return res.status(404).json({ error: 'Boleta no encontrada para el tipo especificado' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener boleta por numero+tipo:', error);
    res.status(500).json({ error: 'Error al obtener boleta: ' + error.message });
  }
});

// Endpoint para verificar existencia por numero + tipo (consulta exacta)
// NOTE: route must not conflict with /api/boletas/:numero, so use /exists
app.get('/api/boletas/exists', async (req, res) => {
  try {
    const { numero, tipo } = req.query;
    if (!numero) return res.status(400).json({ error: 'Parametro numero requerido' });
    // tipo puede ser vacío string
    const [rows] = await pool.query('SELECT numero, tipo FROM boletas WHERE numero = ? AND tipo = ? LIMIT 1', [numero, tipo || '']);
    if (rows && rows.length > 0) {
      return res.json({ exists: true, boleta: rows[0] });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error en /api/boletas/check:', error);
    res.status(500).json({ error: 'Error verificando boleta' });
  }
});

// Endpoint para crear una nueva boleta
app.post('/api/boletas', async (req, res) => {
  try {
    const {
      numero,
      fecha,
      hora,
      chofer,
      chofer_c,
      camion_p,
      camion_n,
      estado,
      despachado,
      clientec,
      clienten,
      manifiesto,
      tipo,
      semana,
      año,
      facturado,
      factura,
      noaplica,
      che,
      peso,
      cambio_pes,
      precio,
      certifica,
      nota,
      intermed
    } = req.body;

    // Validar campos requeridos
    if (!numero || !fecha || !chofer || !estado) {
      return res.status(400).json({
        error: 'Los campos número, fecha, chofer y estado son obligatorios'
      });
    }

    // Verificar si ya existe una boleta con ese número y mismo tipo
    // Permitimos boletas con el mismo número si el tipo es distinto
    const [existing] = await pool.query('SELECT numero, tipo FROM boletas WHERE numero = ? AND tipo = ?', [numero, tipo || '']);
    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Ya existe una boleta con ese número y tipo'
      });
    }

    // Insertar la nueva boleta
    const [_result] = await pool.query(`
      INSERT INTO boletas (
        numero, fecha, hora, chofer, chofer_c, camion_p, camion_n, estado, despachado,
        clientec, clienten, manifiesto, tipo, semana, año, facturado, factura,
        noaplica, che, peso, cambio_pes, precio, certifica, nota, intermed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      numero, fecha, hora || '', chofer, chofer_c || 0, camion_p || '', camion_n || '',
      estado, despachado || '', clientec || 0, clienten || '', manifiesto || '',
      tipo || '', semana || 0, año || new Date().getFullYear(), facturado || '',
      factura || 0, noaplica || '', che || 0, peso || 0, cambio_pes || '',
      precio || 0, certifica || '', nota || '', intermed || 0
    ]);

    res.json({
      success: true,
      message: 'Boleta creada exitosamente',
      numero: numero
    });
  } catch (error) {
    console.error('Error al crear boleta:', error);
    res.status(500).json({
      error: 'Error al crear boleta: ' + error.message
    });
  }
});

// Endpoint para actualizar una boleta existente
app.put('/api/boletas/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const body = req.body || {};

    // Campos permitidos para actualizar (orden estable)
    const updatableFields = [
      'fecha','hora','chofer','chofer_c','camion_p','camion_n','estado','despachado',
      'clientec','clienten','manifiesto','tipo','semana','año','facturado','factura',
      'noaplica','che','peso','cambio_pes','precio','certifica','nota','intermed'
    ];

    // Determinar si el caller envió 'tipo' explícitamente (para la verificación por numero+tipo)
    const hasTipoInBody = Object.prototype.hasOwnProperty.call(body, 'tipo') && body.tipo !== undefined && body.tipo !== null && String(body.tipo).trim() !== '';

    // Verificar existencia previa usando numero (+ tipo si el body lo especifica)
    let existing;
    if (hasTipoInBody) {
      [existing] = await pool.query('SELECT numero, tipo FROM boletas WHERE numero = ? AND tipo = ?', [numero, body.tipo]);
    } else {
      [existing] = await pool.query('SELECT numero FROM boletas WHERE numero = ?', [numero]);
    }
    if (existing.length === 0) {
      if (hasTipoInBody) return res.status(404).json({ error: 'Boleta NO encontrada' });
      return res.status(404).json({ error: 'Boleta no encontrada' });
    }

    // Construir UPDATE dinámico solo con los campos presentes en el body
    const setClauses = [];
    const params = [];
    for (const f of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(body, f)) {
        // usar nombres de columna con backticks cuando el nombre contiene caracteres especiales
        const col = f === 'año' ? '`año`' : f;
        setClauses.push(`${col} = ?`);
        params.push(body[f]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    // Preparar WHERE y params finales
    let sql = `UPDATE boletas SET ${setClauses.join(', ')} WHERE numero = ?`;
    if (hasTipoInBody) sql += ' AND tipo = ?';
    params.push(numero);
    if (hasTipoInBody) params.push(body.tipo);

    await pool.query(sql, params);

    return res.json({ success: true, message: 'Boleta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar boleta:', error);
    res.status(500).json({ error: 'Error al actualizar boleta: ' + error.message });
  }
});

// Endpoint para eliminar una boleta
app.delete('/api/boletas/:numero', async (req, res) => {
  try {
    const { numero } = req.params;

    // Verificar si la boleta existe
    const [existing] = await pool.query('SELECT numero FROM boletas WHERE numero = ?', [numero]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Boleta no encontrada'
      });
    }

    // Eliminar la boleta
    const [_result] = await pool.query('DELETE FROM boletas WHERE numero = ?', [numero]);

    res.json({
      success: true,
      message: 'Boleta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar boleta:', error);
    res.status(500).json({
      error: 'Error al eliminar boleta: ' + error.message
    });
  }
});

// ============= ENDPOINTS PARA UNIDADES =============

// GET - Obtener todas las unidades
app.get('/api/unidades', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT nombreu FROM unidad ORDER BY nombreu ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    res.status(500).json({
      error: 'Error al obtener unidades: ' + error.message
    });
  }
});

// POST - Crear nueva unidad
app.post('/api/unidades', async (req, res) => {
  try {
    const { nombreu } = req.body;

    if (!nombreu || nombreu.trim() === '') {
      return res.status(400).json({
        error: 'El nombre de la unidad es requerido'
      });
    }

    // Verificar si ya existe
    const [existing] = await pool.query('SELECT nombreu FROM unidad WHERE nombreu = ?', [nombreu]);
    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Ya existe una unidad con ese nombre'
      });
    }

    // Insertar nueva unidad
    await pool.query('INSERT INTO unidad (nombreu) VALUES (?)', [nombreu]);

    res.json({
      success: true,
      message: 'Unidad creada exitosamente',
      unidad: { nombreu }
    });
  } catch (error) {
    console.error('Error al crear unidad:', error);
    res.status(500).json({
      error: 'Error al crear unidad: ' + error.message
    });
  }
});

// PUT - Actualizar unidad
app.put('/api/unidades/:nombreu', async (req, res) => {
  try {
    const { nombreu: nombreuOriginal } = req.params;
    const { nombreu: nuevoNombreu } = req.body;

    if (!nuevoNombreu || nuevoNombreu.trim() === '') {
      return res.status(400).json({
        error: 'El nombre de la unidad es requerido'
      });
    }

    // Verificar si la unidad original existe
    const [existing] = await pool.query('SELECT nombreu FROM unidad WHERE nombreu = ?', [nombreuOriginal]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Unidad no encontrada'
      });
    }

    // Si el nombre cambió, verificar que el nuevo no exista
    if (nombreuOriginal !== nuevoNombreu) {
      const [duplicate] = await pool.query('SELECT nombreu FROM unidad WHERE nombreu = ?', [nuevoNombreu]);
      if (duplicate.length > 0) {
        return res.status(400).json({
          error: 'Ya existe una unidad con ese nombre'
        });
      }
    }

    // Actualizar la unidad
    await pool.query('UPDATE unidad SET nombreu = ? WHERE nombreu = ?', [nuevoNombreu, nombreuOriginal]);

    res.json({
      success: true,
      message: 'Unidad actualizada exitosamente',
      unidad: { nombreu: nuevoNombreu }
    });
  } catch (error) {
    console.error('Error al actualizar unidad:', error);
    res.status(500).json({
      error: 'Error al actualizar unidad: ' + error.message
    });
  }
});

// DELETE - Eliminar unidad
app.delete('/api/unidades/:nombreu', async (req, res) => {
  try {
    const { nombreu } = req.params;

    // Verificar si la unidad existe
    const [existing] = await pool.query('SELECT nombreu FROM unidad WHERE nombreu = ?', [nombreu]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Unidad no encontrada'
      });
    }

    // Eliminar la unidad
    await pool.query('DELETE FROM unidad WHERE nombreu = ?', [nombreu]);

    res.json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    res.status(500).json({
      error: 'Error al eliminar unidad: ' + error.message
    });
  }
});

// ===== ENDPOINTS PARA FAMILIAS =====

// POST - Crear nueva familia
app.post('/api/familias', async (req, res) => {
  try {
    const { nombref } = req.body;

    // Validar que se proporcione el nombre
    if (!nombref || !nombref.trim()) {
      return res.status(400).json({
        error: 'El nombre de la familia es requerido'
      });
    }

    const familiaName = nombref.trim();

    // Verificar si la familia ya existe
    const [existing] = await pool.query('SELECT nombref FROM familia WHERE nombref = ?', [familiaName]);
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una familia con ese nombre'
      });
    }

    // Crear la nueva familia
    await pool.query('INSERT INTO familia (nombref) VALUES (?)', [familiaName]);

    res.status(201).json({
      success: true,
      message: 'Familia creada exitosamente',
      familia: { nombref: familiaName }
    });
  } catch (error) {
    console.error('Error al crear familia:', error);
    res.status(500).json({
      error: 'Error al crear familia: ' + error.message
    });
  }
});

// PUT - Actualizar familia existente
app.put('/api/familias/:nombref', async (req, res) => {
  try {
    const { nombref: oldName } = req.params;
    const { nombref: newName } = req.body;

    // Validar que se proporcione el nuevo nombre
    if (!newName || !newName.trim()) {
      return res.status(400).json({
        error: 'El nuevo nombre de la familia es requerido'
      });
    }

    const familiaNewName = newName.trim();

    // Verificar si la familia original existe
    const [existing] = await pool.query('SELECT nombref FROM familia WHERE nombref = ?', [oldName]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Familia no encontrada'
      });
    }

    // Si el nombre no cambió, no hacer nada
    if (oldName === familiaNewName) {
      return res.json({
        success: true,
        message: 'No se detectaron cambios'
      });
    }

    // Verificar si el nuevo nombre ya existe
    const [duplicate] = await pool.query('SELECT nombref FROM familia WHERE nombref = ? AND nombref != ?', [familiaNewName, oldName]);
    if (duplicate.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una familia con ese nombre'
      });
    }

    // Actualizar la familia
    await pool.query('UPDATE familia SET nombref = ? WHERE nombref = ?', [familiaNewName, oldName]);

    res.json({
      success: true,
      message: 'Familia actualizada exitosamente',
      familia: { nombref: familiaNewName }
    });
  } catch (error) {
    console.error('Error al actualizar familia:', error);
    res.status(500).json({
      error: 'Error al actualizar familia: ' + error.message
    });
  }
});

// DELETE - Eliminar familia
app.delete('/api/familias/:nombref', async (req, res) => {
  try {
    const { nombref } = req.params;

    // Verificar si la familia existe
    const [existing] = await pool.query('SELECT nombref FROM familia WHERE nombref = ?', [nombref]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Familia no encontrada'
      });
    }

    // Eliminar la familia
    await pool.query('DELETE FROM familia WHERE nombref = ?', [nombref]);

    res.json({
      success: true,
      message: 'Familia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar familia:', error);
    res.status(500).json({
      error: 'Error al eliminar familia: ' + error.message
    });
  }
});

// ===== ENDPOINTS PARA CATEGORÍAS =====

// GET - Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY categoria');
    res.json(rows); // Devolver array directamente
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    // Fallback a datos mock si hay error de conexión
    const categoriasMock = [
      { categoria: 'SERVICIOS' },
      { categoria: 'PRODUCTOS' },
      { categoria: 'SUMINISTROS' },
      { categoria: 'EQUIPOS' },
      { categoria: 'HERRAMIENTAS' }
    ];
    res.json(categoriasMock); // Array directo también en el mock
  }
});

// POST - Crear nueva categoría
app.post('/api/categorias', async (req, res) => {
  try {
    const { categoria } = req.body;

    // Validar que se proporcione el nombre
    if (!categoria || !categoria.trim()) {
      return res.status(400).json({
        error: 'El nombre de la categoría es requerido'
      });
    }

    const categoriaName = categoria.trim();

    // Verificar si la categoría ya existe
    const [existing] = await pool.query('SELECT categoria FROM categorias WHERE categoria = ?', [categoriaName]);
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una categoría con ese nombre'
      });
    }

    // Crear la nueva categoría
    await pool.query('INSERT INTO categorias (categoria) VALUES (?)', [categoriaName]);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      categoria: { categoria: categoriaName }
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      error: 'Error al crear categoría: ' + error.message
    });
  }
});

// PUT - Actualizar categoría existente
app.put('/api/categorias/:categoria', async (req, res) => {
  try {
    const { categoria: oldName } = req.params;
    const { categoria: newName } = req.body;

    // Validar que se proporcione el nuevo nombre
    if (!newName || !newName.trim()) {
      return res.status(400).json({
        error: 'El nuevo nombre de la categoría es requerido'
      });
    }

    const categoriaNewName = newName.trim();

    // Verificar si la categoría original existe
    const [existing] = await pool.query('SELECT categoria FROM categorias WHERE categoria = ?', [oldName]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    // Si el nombre no cambió, no hacer nada
    if (oldName === categoriaNewName) {
      return res.json({
        success: true,
        message: 'No se detectaron cambios'
      });
    }

    // Verificar si el nuevo nombre ya existe
    const [duplicate] = await pool.query('SELECT categoria FROM categorias WHERE categoria = ? AND categoria != ?', [categoriaNewName, oldName]);
    if (duplicate.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una categoría con ese nombre'
      });
    }

    // Actualizar la categoría
    await pool.query('UPDATE categorias SET categoria = ? WHERE categoria = ?', [categoriaNewName, oldName]);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      categoria: { categoria: categoriaNewName }
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      error: 'Error al actualizar categoría: ' + error.message
    });
  }
});

// Endpoint para consultar registros de transa_ar (movimientos de artículos)
app.get('/api/transa_ar', async (req, res) => {
  try {
    const { codigo, boleta, tipox, pageSize = 1000 } = req.query;

    // Construir consulta dinámica
    let sql = 'SELECT * FROM transa_ar WHERE 1=1';
    const params = [];

    if (codigo) {
      sql += ' AND codigo = ?';
      params.push(codigo);
    }

    if (boleta) {
      sql += ' AND boleta = ?';
      params.push(boleta);
    }

    if (tipox) {
      sql += ' AND tipox = ?';
      params.push(tipox);
    }

    // Ordenar por fecha descendente (más reciente primero)
    sql += ' ORDER BY fecha DESC';

    // Limitar resultados
    if (pageSize) {
      sql += ' LIMIT ?';
      params.push(parseInt(pageSize));
    }

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      movimientos: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error consultando transa_ar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al consultar movimientos: ' + error.message
    });
  }
});

// Endpoint para insertar múltiples registros en transa_ar (detalles de boleta)
app.post('/api/transa_ar', async (req, res) => {
  try {
    const { numero, fecha, tipo, lines } = req.body;

    if (!numero || !fecha || !Array.isArray(lines)) {
      return res.status(400).json({ success: false, error: 'Se requieren numero, fecha y lines (array)' });
    }

    if (lines.length === 0) {
      return res.status(400).json({ success: false, error: 'El arreglo lines no puede estar vacío' });
    }

    // Iniciar transacción
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const inserts = [];
      for (const line of lines) {
        // Campos según la especificación del usuario
        const boleta = numero;
        const codigo = line.codigo || '';
        const cantidad = typeof line.cantidad === 'number' ? line.cantidad : parseFloat(line.cantidad) || 0;
        const descri = line.descri || '';
        const tipoFixed = 'Ingreso a Bodega';
        const hecho_por = 'Admin';
        const fechaLinea = fecha; // misma fecha que la boleta
        const tipox = tipo || '';
        const ciiu = line.ciiu || '';
        const simarde = line.simarde || '';

        // Rellenar otros campos con '' o 0 según sean texto o numéricos
        // Asumimos una estructura mínima de columnas: boleta, codigo, cantidad, descri, tipo, hecho_por, fecha, tipox, ciiu, simarde
        // Si la tabla tiene más columnas, se colocan valores por defecto adicionales en la consulta

        inserts.push([
          boleta, codigo, cantidad, descri, tipoFixed, hecho_por, fechaLinea, tipox, ciiu, simarde
        ]);
      }

      // Ejecutar inserciones por lote
      // Ajustar la consulta a la estructura existente de transa_ar; usar INSERT con lista de columnas
      const placeholders = inserts.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = inserts.flat();

      const sql = `INSERT INTO transa_ar (
        boleta, codigo, cantidad, descri, tipo, hecho_por, fecha, tipox, ciiu, simarde
      ) VALUES ${placeholders}`;

      await connection.query(sql, flatValues);

      await connection.commit();
      connection.release();

      res.json({ success: true, inserted: inserts.length });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en transacción transa_ar:', txErr);
      res.status(500).json({ success: false, error: 'Error al insertar transa_ar: ' + txErr.message });
    }
  } catch (error) {
    console.error('Error endpoint /api/transa_ar:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// Endpoint para insertar múltiples registros en materiales_proceso
app.post('/api/materiales_proceso', async (req, res) => {
  try {
    const { numero, fecha, tipo, cliente, clientec, lines } = req.body;

    if (!numero || !fecha || !Array.isArray(lines)) {
      return res.status(400).json({ success: false, error: 'Se requieren numero, fecha y lines (array)' });
    }

    if (lines.length === 0) {
      return res.status(400).json({ success: false, error: 'El arreglo lines no puede estar vacío' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const inserts = [];
      for (const line of lines) {
        const boleta = numero;
        const codigo = line.codigo || '';
        const descri = line.descri || '';
        const ebodega = typeof line.ebodega === 'number' ? line.ebodega : (Number(line.ebodega) || 0);
        const eproceso = typeof line.eproceso === 'number' ? line.eproceso : (Number(line.eproceso) || 0);
        const eterminado = typeof line.eterminado === 'number' ? line.eterminado : (Number(line.eterminado) || 0);
        const cantidad = typeof line.cantidad === 'number' ? line.cantidad : (Number(line.cantidad) || 0);
        const despachado = typeof line.despachado === 'number' ? line.despachado : (Number(line.despachado) || 0);
        const clienteName = cliente || '';
        const clienteC = typeof clientec === 'number' ? clientec : (Number(clientec) || 0);
        const proceso = line.proceso || '';
        const manifiesto = line.manifiesto || '';
        const tipoLine = tipo || '';
        const ciiu = line.ciiu || '';
        const simarde = line.simarde || '';
        const notas = line.notas || '';
        const cambio_pes = line.cambio_pes || '';
        const fechaLinea = fecha;
        const movimiento = line.movimiento || '';
        const cod_move = typeof line.cod_move === 'number' ? line.cod_move : (Number(line.cod_move) || 0);
        const tipo_cert = line.tipo_cert || '';
        const tipo_res = line.tipo_res || '';
        const certifica = line.certifica || '';
        const intermed = typeof line.intermed === 'number' ? line.intermed : (Number(line.intermed) || 0);
        const intermed_n = line.intermed_n || '';
        const unidades = typeof line.unidades === 'number' ? line.unidades : (Number(line.unidades) || 0);
        const trial921 = line.trial921 === undefined ? null : line.trial921;

        inserts.push([
          boleta, codigo, descri, ebodega, eproceso, eterminado, cantidad, despachado,
          clienteName, clienteC, proceso, manifiesto, tipoLine, ciiu, simarde, notas,
          cambio_pes, fechaLinea, movimiento, cod_move, tipo_cert, tipo_res, certifica,
          intermed, intermed_n, unidades, trial921
        ]);
      }

      const placeholders = inserts.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = inserts.flat();

      const sql = `INSERT INTO materiales_proceso (
        boleta, codigo, descri, ebodega, eproceso, eterminado, cantidad, despachado,
        cliente, clientec, proceso, manifiesto, tipo, ciiu, simarde, notas,
        cambio_pes, fecha, movimiento, cod_move, tipo_cert, tipo_res, certifica,
        intermed, intermed_n, unidades, trial921
      ) VALUES ${placeholders}`;

      await connection.query(sql, flatValues);

      await connection.commit();
      connection.release();

      res.json({ success: true, inserted: inserts.length });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en transacción materiales_proceso:', txErr);
      res.status(500).json({ success: false, error: 'Error al insertar materiales_proceso: ' + txErr.message });
    }
  } catch (error) {
    console.error('Error endpoint /api/materiales_proceso:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// GET - Obtener registros de materiales_proceso (opcionalmente con filtros)
app.get('/api/materiales_proceso', async (req, res) => {
  try {
    const { search = '', dateFrom, dateTo, hideZero = 'false', hideZeroField } = req.query;

    const where = [];
    const params = [];

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where.push('(boleta LIKE ? OR cliente LIKE ? OR descri LIKE ?)');
      params.push(s, s, s);
    }

    if (dateFrom) {
      where.push('fecha >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      where.push('fecha <= ?');
      params.push(dateTo);
    }

    // hideZeroField: allow filtering by a specific numeric column != 0 (safe whitelist)
    const allowedZeroFields = ['cantidad','ebodega','eproceso','eterminado','despachado'];
    if (hideZeroField && allowedZeroFields.includes(hideZeroField)) {
      where.push(`${hideZeroField} <> 0`);
    } else if (hideZero === 'true') {
      // default behavior: filter where cantidad != 0
      where.push('cantidad <> 0');
    }

  // Pagination: page (1-based) and pageSize (default 1000)
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const pageSize = Math.max(1, parseInt(req.query.pageSize || '1000', 10));
  const offset = (page - 1) * pageSize;

  // total count with same where conditions
  const countSql = `SELECT COUNT(*) as total FROM materiales_proceso` + (where.length ? ' WHERE ' + where.join(' AND ') : '');
  const countParams = params.slice();
  const [countRows] = await pool.query(countSql, countParams);
  const total = (countRows && countRows[0] && countRows[0].total) ? countRows[0].total : 0;

  // Also compute total without any filters for UI that wants the absolute total
  const [allCountRows] = await pool.query('SELECT COUNT(*) as totalAll FROM materiales_proceso');
  const totalAll = (allCountRows && allCountRows[0] && allCountRows[0].totalAll) ? allCountRows[0].totalAll : 0;

  let sql = `SELECT fecha, boleta, tipo, cliente, descri, cantidad, ebodega, eproceso, eterminado, despachado, clientec, codigo FROM materiales_proceso`;
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY fecha DESC, boleta DESC LIMIT ? OFFSET ?';

  const dataParams = params.slice();
  dataParams.push(pageSize, offset);

  const [rows] = await pool.query(sql, dataParams);
  // Return both filtered total and absolute total
  res.json({ success: true, rows, total, totalAll, page, pageSize });
  } catch (error) {
    console.error('Error GET /api/materiales_proceso:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para aplicar ajustes desde el frontend: actualizar materiales_proceso y registrar movimientos en transa_ar
app.post('/api/materiales_proceso/ajustes', async (req, res) => {
  try {
    // Aceptar cliente y clientec en el payload (vienen de la pestaña Resumen)
    const { numero, fecha, tipo, ajustes, cliente, clientec } = req.body;
    if (!numero || !fecha || !Array.isArray(ajustes)) {
      return res.status(400).json({ success: false, error: 'Se requieren numero, fecha y ajustes (array)' });
    }
    if (ajustes.length === 0) {
      return res.status(400).json({ success: false, error: 'El arreglo ajustes no puede estar vacío' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const transaInserts = [];

      for (const item of ajustes) {
        const codigo = item.codigo;
        const nueva = (item.nueva === undefined || item.nueva === null) ? null : Number(item.nueva);
        const descri = item.descri || '';
        const ciiu = item.ciiu || '';
        const simarde = item.simarde || '';

        if (!codigo || nueva == null || isNaN(nueva)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, error: `Item inválido: codigo y nueva cantidad son requeridos` });
        }

        // Comprobar si existe la fila en materiales_proceso para esta boleta+codigo+tipo
        const [rows] = await connection.query('SELECT cantidad, ebodega FROM materiales_proceso WHERE boleta = ? AND codigo = ? AND tipo = ? LIMIT 1 FOR UPDATE', [numero, codigo, tipo || '']);
        if (rows.length === 0) {
          // No existe -> crear nueva fila en materiales_proceso
          const insertMpSql = `INSERT INTO materiales_proceso (boleta, codigo, descri, ebodega, cantidad, cliente, clientec, fecha, tipo, ciiu, simarde)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          // cliente/clientec vienen del payload (pestaña Resumen). Guardar los valores proporcionados.
          const clienteName = cliente || '';
          const clienteC = typeof clientec === 'number' ? clientec : (Number(clientec) || 0);
          await connection.query(insertMpSql, [numero, codigo, descri, nueva, nueva, clienteName, clienteC, fecha, tipo || '', ciiu, simarde]);

          // Insertar transa_ar con la cantidad completa (línea nueva). Tipo por convención: 'Ingreso a Bodega'
          transaInserts.push([numero, codigo, nueva, descri, 'Ingreso a Bodega', 'Admin', fecha, tipo || '', ciiu, simarde]);
        } else {
          // Existe: calcular diferencia con el valor actual en DB
          const dbCantidad = Number(rows[0].cantidad) || 0;
          const diff = Number(nueva) - dbCantidad;

            if (diff !== 0) {
            // Actualizar materiales_proceso: cantidad, ebodega y también cliente/clientec en caso de que se hayan modificado en la pestaña Resumen
            const clienteName = cliente || '';
            const clienteC = typeof clientec === 'number' ? clientec : (Number(clientec) || 0);
            await connection.query('UPDATE materiales_proceso SET cantidad = ?, ebodega = ?, cliente = ?, clientec = ? WHERE boleta = ? AND codigo = ? AND tipo = ?', [nueva, nueva, clienteName, clienteC, numero, codigo, tipo || '']);

            // Insertar registro en transa_ar con la diferencia. Tipo: 'Ingreso a Bodega (Ajuste)'
            transaInserts.push([numero, codigo, diff, descri, 'Ingreso a Bodega (Ajuste)', 'Admin', fecha, tipo || '', ciiu, simarde]);
          }
          // Si diff === 0 no hacemos nada
        }
      }

      // Ejecutar inserciones en transa_ar si hay
      if (transaInserts.length > 0) {
        const placeholders = transaInserts.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flat = transaInserts.flat();
        const sql = `INSERT INTO transa_ar (boleta, codigo, cantidad, descri, tipo, hecho_por, fecha, tipox, ciiu, simarde) VALUES ${placeholders}`;
        await connection.query(sql, flat);
      }

      await connection.commit();
      connection.release();
      return res.json({ success: true, updated: ajustes.length, inserted_transa_ar: transaInserts.length });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en ajuste materiales_proceso:', txErr);
      return res.status(500).json({ success: false, error: 'Error al aplicar ajustes: ' + String(txErr.message || txErr) });
    }
  } catch (error) {
    console.error('Error endpoint /api/materiales_proceso/ajustes:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + String(error.message || error) });
  }
});

// POST - Transferir cantidad entre columnas de una misma fila (transaccional)
app.post('/api/materiales_proceso/transferir', async (req, res) => {
  try {
    const { boleta, codigo, tipo, tipoTransaAr, fromField, toField, cantidad, manifiestoNumber, fechaMovimiento } = req.body || {};

    // Debug: log received data
    console.log('Transfer request:', { boleta, codigo, tipo, tipoTransaAr, fromField, toField, cantidad, manifiestoNumber, fechaMovimiento });

    // Validaciones básicas
    if (!boleta || !codigo || !tipo) return res.status(400).json({ success: false, error: 'Falta identificador (boleta, codigo o tipo)' });
    const allowed = ['ebodega', 'eproceso', 'eterminado', 'despachado'];
    if (!allowed.includes(fromField) || !allowed.includes(toField)) {
      return res.status(400).json({ success: false, error: 'fromField/toField inválidos' });
    }
    if (fromField === toField) return res.status(400).json({ success: false, error: 'fromField y toField deben ser diferentes' });

    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ success: false, error: 'Cantidad inválida' });

    // Use a dedicated connection to perform transaction + SELECT ... FOR UPDATE
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock the row
      const [rows] = await connection.query(
        `SELECT ebodega, eproceso, eterminado, despachado, cantidad, ciiu, simarde, codigo FROM materiales_proceso WHERE boleta = ? AND codigo = ? AND tipo = ? FOR UPDATE`,
        [boleta, codigo, tipo]
      );

      console.log('Query result:', { rowsFound: rows.length, boleta, codigo, tipo });

      if (!rows || rows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, error: 'Registro no encontrado' });
      }

      const row = rows[0];
      const currentFrom = Number(row[fromField]) || 0;
      const currentTo = Number(row[toField]) || 0;

      if (qty > currentFrom) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, error: 'Cantidad mayor que el disponible en el origen' });
      }

      const newFrom = currentFrom - qty;
      const newTo = currentTo + qty;

      // Optional invariant: sum of columns must equal 'cantidad' field (compute after-values below)

      // Instead of the above complex expression, compute after-values per column
      const afterEb = (fromField === 'ebodega' ? newFrom : (toField === 'ebodega' ? newTo : Number(row.ebodega) || 0));
      const afterEp = (fromField === 'eproceso' ? newFrom : (toField === 'eproceso' ? newTo : Number(row.eproceso) || 0));
      const afterEt = (fromField === 'eterminado' ? newFrom : (toField === 'eterminado' ? newTo : Number(row.eterminado) || 0));
      const afterDs = (fromField === 'despachado' ? newFrom : (toField === 'despachado' ? newTo : Number(row.despachado) || 0));

      const sumAfterFinal = afterEb + afterEp + afterEt + afterDs;
      if (Number(row.cantidad) !== sumAfterFinal) {
        // This should not normally happen, but guard against inconsistent state
        await connection.rollback();
        connection.release();
        return res.status(500).json({ success: false, error: 'Invariante de cantidad inválida tras la operación' });
      }

      // Perform update (safe because fromField/toField were validated against allowed list)
  const updateSql = `UPDATE materiales_proceso SET ${fromField} = ?, ${toField} = ? WHERE boleta = ? AND codigo = ? AND tipo = ?`;
  await connection.query(updateSql, [newFrom, newTo, boleta, codigo, tipo]);

      // Fetch updated row to return
      const [updated] = await connection.query(
        `SELECT fecha, boleta, tipo, cliente, descri, cantidad, ebodega, eproceso, eterminado, despachado, clientec, codigo, ciiu, simarde FROM materiales_proceso WHERE boleta = ? AND codigo = ? AND tipo = ?`,
        [boleta, codigo, tipo]
      );

      const updatedRow = (updated && updated[0]) ? updated[0] : null;

      // Insert into transa_ar within the same transaction
      if (updatedRow) {
        // Usar el tipo descriptivo que viene del frontend
        const transaArTipo = tipoTransaAr || tipo;

        await connection.query(
          `INSERT INTO transa_ar (boleta, conse, codigo, descri, cantidad, tipo, hecho_por, notas, fecha, tipox, ciiu, simarde, despacho, prom_dia, prom_mes, trial951) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            updatedRow.boleta,
            0, // conse
            updatedRow.codigo,
            updatedRow.descri,
            qty, // cantidad transferida
            transaArTipo,
            'Admin',
            ' ', // notas
            updatedRow.fecha,
            updatedRow.tipo, // tipox
            updatedRow.ciiu,
            updatedRow.simarde,
            0, // despacho
            0, // prom_dia
            0, // prom_mes
            '1' // trial951
          ]
        );
      }

      // Insert into manifiestos and manifiesto3 if destination is Despachado - Manifiesto
      if (toField === 'despachado' && manifiestoNumber) {
        // Check if manifiesto exists
        const [manifiestoExists] = await connection.query(
          'SELECT numero FROM manifiestos WHERE numero = ?',
          [manifiestoNumber]
        );

        // Insert manifiesto header if it doesn't exist
        if (manifiestoExists.length === 0) {
          await connection.query(
            `INSERT INTO manifiestos (numero, fecha, notas, tipo) VALUES (?, ?, ?, ?)`,
            [manifiestoNumber, fechaMovimiento, 'Manifiesto creado por admin', 'Abierto']
          );
        }

        // Get next consec globally
        const [consecResult] = await connection.query(
          'SELECT COALESCE(MAX(consec), 0) + 1 as next_consec FROM manifiesto3'
        );
        const nextConsec = consecResult[0].next_consec;

        // Insert detail in manifiesto3
        await connection.query(
          `INSERT INTO manifiesto3 (boleta, codigo, articulo, cantidad, tipo, manifiesto, ciiu, simarde, cliente, ccliente, consec) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            updatedRow.boleta,
            updatedRow.codigo,
            updatedRow.descri,
            qty,
            updatedRow.tipo,
            manifiestoNumber,
            updatedRow.ciiu,
            updatedRow.simarde,
            updatedRow.cliente,
            updatedRow.clientec,
            nextConsec
          ]
        );
      }

      await connection.commit();
      connection.release();

      return res.json({ success: true, row: updatedRow });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en transacción transferir materiales_proceso:', txErr);
      return res.status(500).json({ success: false, error: 'Error en la transacción: ' + txErr.message });
    }
  } catch (error) {
    console.error('Error endpoint /api/materiales_proceso/transferir:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// DELETE - Eliminar categoría
app.delete('/api/categorias/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;

    // Verificar si la categoría existe
    const [existing] = await pool.query('SELECT categoria FROM categorias WHERE categoria = ?', [categoria]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    // Eliminar la categoría
    await pool.query('DELETE FROM categorias WHERE categoria = ?', [categoria]);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      error: 'Error al eliminar categoría: ' + error.message
    });
  }
});

// ============================================
// ENDPOINTS PARA CLIENTES
// ============================================

// DELETE - Eliminar una línea de materiales_proceso (solo si ebodega === cantidad)
app.delete('/api/materiales_proceso', async (req, res) => {
  try {
    const { boleta, codigo, tipo } = req.query || {};

    if (!boleta || !codigo || !tipo) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros: boleta, codigo o tipo' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lock the target row
      const [rows] = await connection.query(
        'SELECT cantidad, ebodega FROM materiales_proceso WHERE boleta = ? AND codigo = ? AND tipo = ? FOR UPDATE',
        [boleta, codigo, tipo]
      );

      if (!rows || rows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ success: false, error: 'Registro no encontrado en materiales_proceso' });
      }

      const row = rows[0];
      const cantidad = Number(row.cantidad) || 0;
      const ebodega = Number(row.ebodega) || 0;

      if (ebodega !== cantidad) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ success: false, error: 'No se puede eliminar: existen movimientos (ebodega != cantidad)' });
      }

      // Delete the materiales_proceso row
      await connection.query('DELETE FROM materiales_proceso WHERE boleta = ? AND codigo = ? AND tipo = ?', [boleta, codigo, tipo]);

      // Delete any matching transa_ar rows (matching boleta, codigo, tipox)
      await connection.query('DELETE FROM transa_ar WHERE boleta = ? AND codigo = ? AND tipox = ?', [boleta, codigo, tipo]);

      await connection.commit();
      connection.release();

      return res.json({ success: true, message: 'Línea eliminada correctamente' });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      console.error('Error en transacción DELETE /api/materiales_proceso:', txErr);
      return res.status(500).json({ success: false, error: 'Error en la transacción: ' + txErr.message });
    }
  } catch (error) {
    console.error('Error endpoint DELETE /api/materiales_proceso:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// GET - Obtener todos los clientes con búsqueda optimizada
app.get('/api/clientes', async (req, res) => {
  try {
    const { search = '', order = 'asc' } = req.query;
    
    let query = 'SELECT codigo, nombre, dire, telefonos, email, contacto1, comenta, contacto2, contacto3, email2 FROM clientes';
    let params = [];
    
    if (search.trim()) {
      // Estrategia optimizada: usar LIKE con comodines más eficientes
      // Si la búsqueda empieza con número, priorizar código
      const searchTerm = search.trim();
      const isNumeric = /^\d/.test(searchTerm);
      
      if (isNumeric) {
        // Búsqueda numérica: priorizar código (más eficiente)
        query += ' WHERE codigo LIKE ? OR telefonos LIKE ? OR nombre LIKE ? OR email LIKE ? OR contacto1 LIKE ?';
        const searchPattern = `${searchTerm}%`; // Prefijo más eficiente que %texto%
        const wildcardPattern = `%${searchTerm}%`;
        params = [searchPattern, searchPattern, wildcardPattern, wildcardPattern, wildcardPattern];
      } else {
        // Búsqueda de texto: priorizar nombre
        query += ' WHERE nombre LIKE ? OR contacto1 LIKE ? OR email LIKE ? OR codigo LIKE ? OR telefonos LIKE ?';
        const searchPattern = `${searchTerm}%`; // Prefijo más eficiente
        const wildcardPattern = `%${searchTerm}%`;
        params = [searchPattern, searchPattern, searchPattern, wildcardPattern, wildcardPattern];
      }
      query += ` ORDER BY CAST(codigo AS UNSIGNED) ${order.toUpperCase()}`;
    } else {
      // Carga inicial optimizada sin límite
      query += ` ORDER BY CAST(codigo AS UNSIGNED) ${order.toUpperCase()}`;
    }
    
    const [clientes] = await pool.query(query, params);
    res.json({
      success: true,
      clientes: clientes,
      total: clientes.length
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      error: 'Error al obtener clientes: ' + error.message
    });
  }
});

// GET - Obtener clientes básico (solo código y nombre) para grids
app.get('/api/clientes-basico', async (req, res) => {
  try {
    const query = 'SELECT codigo, nombre FROM clientes ORDER BY codigo ASC';
    const [clientes] = await pool.query(query);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes básico:', error);
    res.status(500).json({
      error: 'Error al obtener clientes básico: ' + error.message
    });
  }
});

// GET - Obtener el siguiente código disponible para clientes
app.get('/api/clientes/next-code', async (req, res) => {
  try {
    const query = 'SELECT MAX(CAST(codigo AS UNSIGNED)) as maxCode FROM clientes';
    const [result] = await pool.query(query);
    const maxCode = result[0].maxCode || 0;
    const nextCode = maxCode + 1;
    res.json({ nextCode });
  } catch (error) {
    console.error('Error al obtener siguiente código:', error);
    res.status(500).json({
      error: 'Error al obtener siguiente código: ' + error.message
    });
  }
});

// POST - Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { codigo, nombre, dire = '', telefonos = '', email = '', contacto1 = '', comenta = '', contacto2 = '', contacto3 = '', email2 = '' } = req.body;

    // Validar campos requeridos
    if (!codigo || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Código y nombre son campos requeridos'
      });
    }

    // Verificar si el código ya existe
    const [existing] = await pool.query('SELECT codigo FROM clientes WHERE codigo = ?', [codigo]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un cliente con este código'
      });
    }

    // Insertar el nuevo cliente
    const query = `
      INSERT INTO clientes (codigo, nombre, dire, telefonos, email, contacto1, comenta, contacto2, contacto3, email2)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [codigo, nombre, dire, telefonos, email, contacto1, comenta, contacto2, contacto3, email2]);

    res.json({
      success: true,
      message: 'Cliente creado exitosamente'
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cliente: ' + error.message
    });
  }
});

// PUT - Actualizar un cliente existente
app.put('/api/clientes', async (req, res) => {
  try {
    const { codigo, ...updateFields } = req.body;

    // Validar que se proporcione el código
    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Código del cliente es requerido para actualizar'
      });
    }

    // Verificar que el cliente existe
    const [existing] = await pool.query('SELECT codigo FROM clientes WHERE codigo = ?', [codigo]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Construir la consulta de actualización dinámica
    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateFields[field]);
    values.push(codigo); // Agregar el código al final para el WHERE

    const query = `UPDATE clientes SET ${setClause} WHERE codigo = ?`;

    const [result] = await pool.query(query, values);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        updatedFields: fields.length
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cliente no encontrado o no se realizaron cambios'
      });
    }

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cliente: ' + error.message
    });
  }
});

// DELETE - Eliminar un cliente
app.delete('/api/clientes/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    // Validar que se proporcione el código
    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Código del cliente es requerido para eliminar'
      });
    }

    // Verificar que el cliente existe
    const [existing] = await pool.query('SELECT codigo, nombre FROM clientes WHERE codigo = ?', [codigo]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Verificar que el cliente no esté siendo usado en otras tablas
    // 1. Verificar en tabla Boletas (campo clientec)
    const [boletasCheck] = await pool.query('SELECT COUNT(*) as count FROM boletas WHERE clientec = ?', [codigo]);
    if (boletasCheck[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: `No se puede eliminar el cliente porque está siendo utilizado en ${boletasCheck[0].count} boleta(s).`
      });
    }

    // Si pasa todas las validaciones, eliminar el cliente
    const query = 'DELETE FROM clientes WHERE codigo = ?';
    const [result] = await pool.query(query, [codigo]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: `Cliente "${existing[0].codigo} - ${existing[0].nombre}" eliminado exitosamente`,
        clienteEliminado: {
          codigo: existing[0].codigo,
          nombre: existing[0].nombre
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cliente: ' + error.message
    });
  }
});

// GET - Obtener boletas relacionadas con un cliente específico
app.get('/api/boletas-x-cliente/:codigoCliente', async (req, res) => {
  try {
    const { codigoCliente } = req.params;

    // Validar que se proporcione el código del cliente
    if (!codigoCliente) {
      return res.status(400).json({
        success: false,
        error: 'Código del cliente es requerido'
      });
    }

    // Consulta para obtener boletas relacionadas con el cliente
    const query = `
      SELECT
        numero,
        tipo,
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
        chofer,
        camion_n,
        estado
      FROM boletas
      WHERE clientec = ?
      ORDER BY fecha DESC, numero DESC
    `;

    const [boletas] = await pool.query(query, [codigoCliente]);

    res.json({
      success: true,
      boletas: boletas,
      total: boletas.length
    });

  } catch (error) {
    console.error('Error al obtener boletas del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener boletas del cliente: ' + error.message
    });
  }
});

// GET - Obtener materiales de una boleta específica
app.get('/api/materiales-boleta/:numero/:tipo', async (req, res) => {
  try {
    const { numero, tipo } = req.params;

    // Validar que se proporcionen los parámetros
    if (!numero || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'Número de boleta y tipo son requeridos'
      });
    }

    // Consulta para obtener materiales de la boleta específica
    const query = `
      SELECT
        codigo,
        descri,
        cantidad,
        ebodega,
        eproceso,
        eterminado,
        despachado
      FROM materiales_proceso
      WHERE boleta = ? AND tipo = ?
      ORDER BY codigo ASC
    `;

    const [materiales] = await pool.query(query, [numero, tipo]);

    res.json({
      success: true,
      materiales: materiales,
      total: materiales.length,
      boleta: numero,
      tipo: tipo
    });

  } catch (error) {
    console.error('Error al obtener materiales de la boleta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener materiales de la boleta: ' + error.message
    });
  }
});

// GET - Obtener artículos asignados a un cliente específico
app.get('/api/articulos-x-cliente/:codigoCliente', async (req, res) => {
  try {
    const { codigoCliente } = req.params;
    const query = 'SELECT codigo, descri, code_cli, ciiu, simarde, tipo_cert, tipo_res, `select` FROM articulos_x_cliente WHERE code_cli = ? ORDER BY codigo ASC';
    const [articulos] = await pool.query(query, [codigoCliente]);
    res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos del cliente:', error);
    res.status(500).json({
      error: 'Error al obtener artículos del cliente: ' + error.message
    });
  }
});

// DELETE - Eliminar un artículo específico asignado a un cliente
app.delete('/api/articulos-x-cliente/:codigoCliente/:codigoArticulo', async (req, res) => {
  try {
    const { codigoCliente, codigoArticulo } = req.params;
    const query = 'DELETE FROM articulos_x_cliente WHERE code_cli = ? AND codigo = ?';
    const [result] = await pool.query(query, [codigoCliente, codigoArticulo]);
    
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Artículo eliminado correctamente', affectedRows: result.affectedRows });
    } else {
      res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar artículo del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar artículo del cliente: ' + error.message
    });
  }
});

// DELETE - Eliminar todas las relaciones de un artículo (sin importar cliente)
app.delete('/api/articulos_x_cliente/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const query = 'DELETE FROM articulos_x_cliente WHERE codigo = ?';
    const [result] = await pool.query(query, [codigo]);
    
    res.json({ success: true, message: 'Relaciones eliminadas correctamente', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Error al eliminar relaciones del artículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar relaciones del artículo: ' + error.message
    });
  }
});

// Endpoint para obtener artículos para asignación (codigo, descri, tipo_cert, tipo_res)
app.get('/api/articulos-para-asignacion', async (req, res) => {
  try {
    const query = 'SELECT codigo, descri, tipo_cert, tipo_res FROM articulos ORDER BY codigo ASC';
    const [articulos] = await pool.query(query);
    res.json(articulos);
  } catch (error) {
    console.error('Error al obtener artículos para asignación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener artículos para asignación: ' + error.message
    });
  }
});

// POST - Asignar artículo a cliente (con verificación de duplicados)
app.post('/api/asignar-articulo', async (req, res) => {
  try {
    const { codigo, descri, code_cli, ciiu, simarde, tipo_cert, tipo_res } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!codigo || !code_cli) {
      return res.status(400).json({
        success: false,
        error: 'Código de artículo y código de cliente son requeridos'
      });
    }
    
    // Verificar si ya existe la asignación
    const checkQuery = 'SELECT COUNT(*) as count FROM articulos_x_cliente WHERE codigo = ? AND code_cli = ?';
    const [existingRows] = await pool.query(checkQuery, [codigo, code_cli]);
    
    if (existingRows[0].count > 0) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message: 'Este artículo ya está asignado a este cliente'
      });
    }
    
    // Si no existe, insertar el nuevo registro
    // Asignar valores por defecto si ciiu o simarde están vacíos
    const ciiuValue = ciiu && ciiu.trim() !== '' ? ciiu : '';
    const simardeValue = simarde && simarde.trim() !== '' ? simarde : '';
    
    const insertQuery = `
      INSERT INTO articulos_x_cliente (codigo, descri, code_cli, ciiu, simarde, tipo_cert, tipo_res)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(insertQuery, [codigo, descri, code_cli, ciiuValue, simardeValue, tipo_cert, tipo_res]);
    
    res.json({
      success: true,
      message: 'Artículo asignado exitosamente al cliente'
    });
    
  } catch (error) {
    console.error('Error al asignar artículo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al asignar artículo: ' + error.message
    });
  }
});

// ============ ENDPOINTS PARA TIPO_BOLETAS ============

// Obtener todos los tipos de boletas
app.get('/api/tipo-boletas', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT nombre FROM tipo_boletas ORDER BY nombre');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener tipos de boletas:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al obtener tipos de boletas' });
  }
});

// Crear un nuevo tipo de boleta
app.post('/api/tipo-boletas', async (req, res) => {
  const { nombre } = req.body;
  
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ success: false, error: 'El nombre es requerido' });
  }
  
  if (nombre.length > 20) {
    return res.status(400).json({ success: false, error: 'El nombre no puede exceder 20 caracteres' });
  }
  
  try {
    // Verificar si ya existe
    const [existing] = await pool.execute('SELECT nombre FROM tipo_boletas WHERE nombre = ?', [nombre.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Ya existe un tipo de boleta con ese nombre' });
    }
    
    await pool.execute('INSERT INTO tipo_boletas (nombre) VALUES (?)', [nombre.trim()]);
    res.json({ success: true, message: 'Tipo de boleta creado exitosamente' });
  } catch (error) {
    console.error('Error al crear tipo de boleta:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al crear tipo de boleta' });
  }
});

// Actualizar un tipo de boleta
app.put('/api/tipo-boletas', async (req, res) => {
  const { nombreOriginal, nombreNuevo } = req.body;
  
  if (!nombreOriginal || !nombreNuevo) {
    return res.status(400).json({ success: false, error: 'El nombre original y el nombre nuevo son requeridos' });
  }
  
  if (nombreNuevo.length > 20) {
    return res.status(400).json({ success: false, error: 'El nombre no puede exceder 20 caracteres' });
  }
  
  try {
    // Verificar si el nuevo nombre ya existe (y no es el mismo registro)
    if (nombreOriginal !== nombreNuevo) {
      const [existing] = await pool.execute('SELECT nombre FROM tipo_boletas WHERE nombre = ?', [nombreNuevo.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'Ya existe un tipo de boleta con ese nombre' });
      }
    }
    
    // Iniciar transacción para asegurar consistencia
    await pool.execute('START TRANSACTION');
    
    try {
      // 1. Actualizar la tabla tipo_boletas
      const [resultTipos] = await pool.execute('UPDATE tipo_boletas SET nombre = ? WHERE nombre = ?', [nombreNuevo.trim(), nombreOriginal]);

      if (resultTipos.affectedRows === 0) {
        await pool.execute('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Tipo de boleta no encontrado' });
      }

      // 2. Actualizar todas las boletas que usan este tipo
      const [resultBoletas] = await pool.execute('UPDATE boletas SET tipo = ? WHERE tipo = ?', [nombreNuevo.trim(), nombreOriginal]);

      // 3. Actualizar manifiesto3.tipo
      const [rMan] = await pool.execute('UPDATE manifiesto3 SET tipo = ? WHERE tipo = ?', [nombreNuevo.trim(), nombreOriginal]);
      const resultManifiesto = rMan;

      // 4. Actualizar materiales_proceso.tipo
      const [rMat] = await pool.execute('UPDATE materiales_proceso SET tipo = ? WHERE tipo = ?', [nombreNuevo.trim(), nombreOriginal]);
      const resultMateriales = rMat;

      // 5. Actualizar transa_ar.tipox
      const [rTra] = await pool.execute('UPDATE transa_ar SET tipox = ? WHERE tipox = ?', [nombreNuevo.trim(), nombreOriginal]);
      const resultTransa = rTra;

      // Confirmar la transacción
      await pool.execute('COMMIT');

      res.json({ 
        success: true, 
        message: `Tipo de boleta actualizado exitosamente. Se actualizaron ${resultBoletas.affectedRows} boleta(s).`,
        boletasActualizadas: resultBoletas.affectedRows,
        manifiestoActualizados: resultManifiesto.affectedRows || 0,
        materialesActualizados: resultMateriales.affectedRows || 0,
        transaActualizados: resultTransa.affectedRows || 0
      });

    } catch (transactionError) {
      // Rollback en caso de error en la transacción
      await pool.execute('ROLLBACK');
      throw transactionError;
    }
    
  } catch (error) {
    console.error('Error al actualizar tipo de boleta:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al actualizar tipo de boleta' });
  }
});

// Eliminar un tipo de boleta
app.delete('/api/tipo-boletas/:nombre', async (req, res) => {
  const { nombre } = req.params;
  
  if (!nombre) {
    return res.status(400).json({ success: false, error: 'El nombre es requerido' });
  }
  
  try {
    // Verificar si el tipo de boleta está siendo usado en la tabla boletas (columna 'tipo')
    const [boletasUsando] = await pool.execute('SELECT COUNT(*) as count FROM boletas WHERE tipo = ?', [nombre]);
    
    if (boletasUsando[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar el tipo de boleta "${nombre}" porque está siendo utilizado en ${boletasUsando[0].count} boleta(s).`,
        isInUse: true
      });
    }
    
    const [result] = await pool.execute('DELETE FROM tipo_boletas WHERE nombre = ?', [nombre]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Tipo de boleta no encontrado' });
    }
    
    res.json({ success: true, message: 'Tipo de boleta eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tipo de boleta:', error);
    res.status(500).json({ success: false, error: 'Error del servidor al eliminar tipo de boleta' });
  }
});

// Endpoint que cuenta cuántos registros serían afectados por cambiar un tipo
app.get('/api/tipo-boletas/counts/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });

    // Contar en boletas
    const [cb] = await pool.execute('SELECT COUNT(*) as cnt FROM boletas WHERE tipo = ?', [nombre]);
    const boletasCount = cb[0]?.cnt || 0;

    // Contar en manifiesto3 (si existe la columna tipo)
    let manifiestoCount = 0;
    try {
      const [cm] = await pool.execute('SELECT COUNT(*) as cnt FROM manifiesto3 WHERE tipo = ?', [nombre]);
      manifiestoCount = cm[0]?.cnt || 0;
    } catch (e) {
      // si la tabla o columna no existe, dejamos en 0
      manifiestoCount = 0;
    }

    // Contar en materiales_proceso
    let materialesCount = 0;
    try {
      const [cmat] = await pool.execute('SELECT COUNT(*) as cnt FROM materiales_proceso WHERE tipo = ?', [nombre]);
      materialesCount = cmat[0]?.cnt || 0;
    } catch (e) {
      materialesCount = 0;
    }

    // Contar en transa_ar (campo tipox)
    let transaCount = 0;
    try {
      const [ct] = await pool.execute('SELECT COUNT(*) as cnt FROM transa_ar WHERE tipox = ?', [nombre]);
      transaCount = ct[0]?.cnt || 0;
    } catch (e) {
      transaCount = 0;
    }

    res.json({ success: true, counts: { boletas: boletasCount, manifiesto: manifiestoCount, materiales: materialesCount, transa: transaCount } });
  } catch (error) {
    console.error('Error contando registros para tipo-boletas:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// ================================
// ENDPOINTS PARA MANIFIESTOS
// ================================

// Endpoint para obtener detalles de manifiesto3 por número de manifiesto
app.get('/api/manifiesto3/:numero', async (req, res) => {
  try {
    const { numero } = req.params;

    if (!numero) {
      return res.status(400).json({
        error: 'Número de manifiesto es requerido',
        timestamp: new Date().toISOString()
      });
    }

    // Primero verificar si existe el campo 'manifiesto'
    const [checkRows] = await pool.query(`
      SHOW COLUMNS FROM manifiesto3 LIKE 'manifiesto'
    `);

    let whereClause = '1=1'; // Default: mostrar todos
    let queryParams = [];

    if (checkRows.length > 0) {
      // Si existe el campo manifiesto, filtrar por él (con TRIM para manejar espacios)
      whereClause = 'TRIM(manifiesto) = TRIM(?)';
      queryParams = [numero];
    }

    const [rows] = await pool.query(`
      SELECT
        boleta,
        tipo,
        codigo,
        articulo,
        cantidad,
        simarde,
        ccliente,
        cliente
      FROM manifiesto3
      WHERE ${whereClause}
      ORDER BY cliente ASC, boleta ASC
    `, queryParams);

    res.json({
      detalles: rows,
      total: rows.length,
      manifiesto: numero,
      campo_manifiesto_existe: checkRows.length > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener detalles de manifiesto3:', error);
    res.status(500).json({
      error: 'Error al obtener detalles: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener detalles de manifiesto3 por número de BOLETA
app.get('/api/manifiesto3/boleta/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    if (!numero) {
      return res.status(400).json({ error: 'Número de boleta es requerido' });
    }

    const [rows] = await pool.query(`
      SELECT
        boleta,
        tipo,
        codigo,
        articulo,
        cantidad,
        simarde,
        ccliente,
        cliente,
        manifiesto
      FROM manifiesto3
      WHERE boleta = ?
      ORDER BY manifiesto ASC, codigo ASC
    `, [numero]);

    res.json({ detalles: rows, total: rows.length, boleta: numero, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error al obtener manifiesto3 por boleta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar estructura de manifiesto3
app.get('/api/manifiesto3-test', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM manifiesto3 LIMIT 5
    `);

    res.json({
      estructura: rows.length > 0 ? Object.keys(rows[0]) : [],
      datos: rows,
      total: rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al verificar estructura:', error);
    res.status(500).json({
      error: 'Error al verificar estructura: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para validar si existe un manifiesto
app.get('/api/manifiestos/validate/:numero', async (req, res) => {
  try {
    const { numero } = req.params;

    if (!numero) {
      return res.status(400).json({
        error: 'Número de manifiesto es requerido',
        timestamp: new Date().toISOString()
      });
    }

    const [rows] = await pool.query(
      'SELECT numero FROM manifiestos WHERE numero = ?',
      [numero]
    );

    res.json({
      exists: rows.length > 0,
      numero: numero,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al validar manifiesto:', error);
    res.status(500).json({
      error: 'Error al validar manifiesto: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener todos los manifiestos desde tabla manifiestos
app.get('/api/manifiestos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        numero,
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
        tipo,
        peso_local,
        notas,
        articulo,
        clienten as cliente,
        cantidad
      FROM manifiestos
      WHERE fecha IS NOT NULL
      ORDER BY fecha DESC, numero DESC
    `);

    res.json({
      manifiestos: rows,
      total: rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener manifiestos:', error);
    res.status(500).json({
      error: 'Error al obtener manifiestos: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para actualizar la nota de un manifiesto
app.put('/api/manifiestos/:numero/nota', async (req, res) => {
  try {
    const { numero } = req.params;
    const { nota } = req.body;

    if (!numero) {
      return res.status(400).json({
        error: 'Número de manifiesto es requerido',
        timestamp: new Date().toISOString()
      });
    }

    // Actualizar la nota en la tabla manifiestos
    const [result] = await pool.execute(
      'UPDATE manifiestos SET notas = ? WHERE numero = ?',
      [nota || '', numero]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Manifiesto no encontrado',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Nota actualizada para manifiesto ${numero}: "${nota}"`);

    res.json({
      success: true,
      message: 'Nota actualizada correctamente',
      manifiesto: numero,
      nota: nota,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al actualizar nota de manifiesto:', error);
    res.status(500).json({
      error: 'Error al actualizar la nota: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para actualizar el estado de un manifiesto
app.put('/api/manifiestos/:numero/estado', async (req, res) => {
  try {
    const { numero } = req.params;
    const { estado } = req.body;

    if (!numero) {
      return res.status(400).json({
        error: 'Número de manifiesto es requerido',
        timestamp: new Date().toISOString()
      });
    }

    if (!estado || !['ABIERTO', 'CERRADO'].includes(estado.toUpperCase())) {
      return res.status(400).json({
        error: 'Estado inválido. Debe ser "ABIERTO" o "CERRADO"',
        timestamp: new Date().toISOString()
      });
    }

    // Actualizar el estado (campo TIPO) en la tabla manifiestos
    const [result] = await pool.execute(
      'UPDATE manifiestos SET tipo = ? WHERE numero = ?',
      [estado.toUpperCase(), numero]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Manifiesto no encontrado',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Estado actualizado para manifiesto ${numero}: "${estado.toUpperCase()}"`);

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      manifiesto: numero,
      estado: estado.toUpperCase(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al actualizar estado de manifiesto:', error);
    res.status(500).json({
      error: 'Error al actualizar el estado: ' + error.message
    });
  }
});

// Endpoint para verificar si un código existe en materiales_proceso
app.get('/api/materiales_proceso/exists/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM materiales_proceso WHERE codigo = ?', [codigo]);
    const exists = rows[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error verificando materiales_proceso:', error);
    res.status(500).json({ error: 'Error al verificar materiales_proceso' });
  }
});

// Endpoint para verificar si un código existe en transa_ar
app.get('/api/transa_ar/exists/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM transa_ar WHERE codigo = ?', [codigo]);
    const exists = rows[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error verificando transa_ar:', error);
    res.status(500).json({ error: 'Error al verificar transa_ar' });
  }
});

// PUT - Cambiar código de artículo en todas las tablas relacionadas


// ===== ENDPOINTS PARA TRAZABILIDAD DE ARTÍCULOS =====

// Endpoint para obtener boletas relacionadas con un artículo específico
app.get('/api/materiales_proceso/boletas-por-articulo', async (req, res) => {
  try {
    const { codigo } = req.query;

    if (!codigo) {
      return res.status(400).json({ success: false, error: 'Código de artículo es requerido' });
    }

    // Obtener todas las boletas que contienen este artículo
    const [rows] = await pool.query(`
      SELECT DISTINCT
        boleta,
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
        tipo,
        cantidad,
        cliente,
        manifiesto
      FROM materiales_proceso
      WHERE codigo = ?
      ORDER BY fecha DESC, boleta DESC
    `, [codigo]);

    res.json({
      success: true,
      boletas: rows
    });
  } catch (error) {
    console.error('Error obteniendo boletas por artículo:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint para obtener trazabilidad completa de un artículo en una boleta específica
app.get('/api/materiales_proceso/trazabilidad', async (req, res) => {
  try {
    const { boleta, codigo } = req.query;

    if (!boleta || !codigo) {
      return res.status(400).json({ success: false, error: 'Boleta y código de artículo son requeridos' });
    }

    // Obtener movimientos de materiales_proceso
    const [materialesRows] = await pool.query(`
      SELECT
        'materiales_proceso' as origen,
        DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha,
        tipo,
        ebodega as bodega,
        eproceso as proceso,
        eterminado as terminado,
        despachado,
        cantidad,
        cliente,
        manifiesto,
        notas as nota,
        movimiento as descripcion
      FROM materiales_proceso
      WHERE boleta = ? AND codigo = ?
      ORDER BY fecha ASC
    `, [boleta, codigo]);

    // Obtener movimientos de transa_ar
    const [transaRows] = await pool.query(`
      SELECT
        'transa_ar' as origen,
        DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha,
        tipo,
        cantidad,
        tipo as estado,
        notas as nota,
        tipox as tipo_movimiento,
        hecho_por as usuario
      FROM transa_ar
      WHERE boleta = ? AND codigo = ?
      ORDER BY fecha ASC
    `, [boleta, codigo]);

    // Combinar y ordenar todos los movimientos
    const trazabilidad = [...materialesRows, ...transaRows]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    res.json({
      success: true,
      trazabilidad: trazabilidad
    });
  } catch (error) {
    console.error('Error obteniendo trazabilidad:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint para obtener movimientos de transa_ar por boleta, tipox y artículo
app.get('/api/materiales_proceso/movimientos-transa-ar', async (req, res) => {
  try {
    const { boleta, tipox, codigo } = req.query;

    if (!boleta) {
      return res.status(400).json({ success: false, error: 'Boleta es requerida' });
    }

    // Construir la consulta con filtros opcionales
    let query = `
      SELECT
        DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha,
        boleta,
        codigo,
        tipo,
        tipox,
        conse,
        cantidad,
        hecho_por as usuario
      FROM transa_ar
      WHERE boleta = ?
    `;

    const params = [boleta];

    // Agregar filtro por código de artículo si se proporciona
    if (codigo) {
      query += ' AND codigo = ?';
      params.push(codigo);
    }

    // Agregar filtro por tipox (tipo de artículo) si se proporciona
    if (tipox) {
      query += ' AND tipox = ?';
      params.push(tipox);
    }

    query += ' ORDER BY fecha ASC';

    // Obtener movimientos de transa_ar filtrados
    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      movimientos: rows
    });
  } catch (error) {
    console.error('Error obteniendo movimientos transa_ar:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Endpoint para anular una boleta (transacción atómica)
app.post('/api/anular-boleta', async (req, res) => {
  const { numero, tipo } = req.body;

  if (!numero || !tipo) {
    return res.status(400).json({ error: 'Número y tipo de boleta son requeridos' });
  }

  const connection = await pool.getConnection();

  try {
    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Actualizar el estado de la boleta a "ANULADA" y modificar el número agregando "-anulada"
    const nuevoNumero = `${numero}-anulada`;
    const [boletaResult] = await connection.query(
      'UPDATE boletas SET estado = ?, numero = ? WHERE numero = ? AND tipo = ?',
      ['ANULADA', nuevoNumero, numero, tipo]
    );

    if (boletaResult.affectedRows === 0) {
      throw new Error('Boleta no encontrada o ya anulada');
    }

    // 2. Actualizar materiales_proceso: cantidad=0, ebodega=0 para todos los artículos de esta boleta
    const [materialesResult] = await connection.query(
      'UPDATE materiales_proceso SET cantidad = 0, ebodega = 0 WHERE boleta = ? AND tipo = ?',
      [numero, tipo]
    );

    // 3. Eliminar físicamente todos los registros de transa_ar relacionados con la boleta
    const [transaResult] = await connection.query(
      'DELETE FROM transa_ar WHERE boleta = ? AND tipox = ?',
      [numero, tipo]
    );

    // Confirmar transacción
    await connection.commit();

    console.log(`✅ Boleta ${numero} (${tipo}) anulada exitosamente. Número actualizado a: ${nuevoNumero}. ${materialesResult.affectedRows} materiales ajustados, ${transaResult.affectedRows} registros de transa_ar eliminados.`);

    res.json({
      success: true,
      message: `Boleta ${numero} anulada exitosamente. Número actualizado a: ${nuevoNumero}`,
      boletaActualizada: boletaResult.affectedRows,
      nuevoNumero: nuevoNumero,
      materialesAjustados: materialesResult.affectedRows,
      registrosTransaEliminados: transaResult.affectedRows
    });

  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('❌ Error al anular boleta:', error);
    res.status(500).json({ error: error.message || 'Error al anular la boleta' });
  } finally {
    // Liberar conexión
    connection.release();
  }
});

// Endpoint para cambiar tipo de boleta
app.post('/api/cambiar-tipo-boleta', async (req, res) => {
  const { numero, tipoActual, tipoNuevo } = req.body;

  if (!numero || !tipoActual || !tipoNuevo) {
    return res.status(400).json({ error: 'Número, tipo actual y tipo nuevo son requeridos' });
  }

  if (tipoActual === tipoNuevo) {
    return res.status(400).json({ error: 'El tipo nuevo debe ser diferente al tipo actual' });
  }

  const connection = await pool.getConnection();

  try {
    // Iniciar transacción
    await connection.beginTransaction();

    // 1. Verificar que la boleta existe con el tipo actual
    const [boletaExistente] = await connection.query(
      'SELECT * FROM boletas WHERE numero = ? AND tipo = ?',
      [numero, tipoActual]
    );

    if (boletaExistente.length === 0) {
      throw new Error('Boleta no encontrada con el tipo especificado');
    }

    // 2. Verificar que no exista otra boleta con el mismo número y tipo nuevo
    const [boletaDuplicada] = await connection.query(
      'SELECT * FROM boletas WHERE numero = ? AND tipo = ?',
      [numero, tipoNuevo]
    );

    if (boletaDuplicada.length > 0) {
      throw new Error(`Ya existe una boleta con número ${numero} y tipo ${tipoNuevo}`);
    }

    // 3. Actualizar el tipo de la boleta
    const [boletaResult] = await connection.query(
      'UPDATE boletas SET tipo = ? WHERE numero = ? AND tipo = ?',
      [tipoNuevo, numero, tipoActual]
    );

    // 4. Actualizar el tipo en materiales_proceso
    const [materialesResult] = await connection.query(
      'UPDATE materiales_proceso SET tipo = ? WHERE boleta = ? AND tipo = ?',
      [tipoNuevo, numero, tipoActual]
    );

    // 5. Actualizar el tipo en transa_ar
    const [transaResult] = await connection.query(
      'UPDATE transa_ar SET tipox = ? WHERE boleta = ? AND tipox = ?',
      [tipoNuevo, numero, tipoActual]
    );

    // 6. Actualizar el tipo en manifiesto3 para TODAS las filas que coincidan con boleta + tipo
    const [manifiestoResult] = await connection.query(
      'UPDATE manifiesto3 SET tipo = ? WHERE boleta = ? AND tipo = ?',
      [tipoNuevo, numero, tipoActual]
    );

    // Confirmar transacción
    await connection.commit();

    console.log(`✅ Tipo de boleta ${numero} cambiado de ${tipoActual} a ${tipoNuevo}. ${materialesResult.affectedRows} materiales actualizados, ${transaResult.affectedRows} registros transa_ar actualizados, ${manifiestoResult.affectedRows} registros manifiesto3 actualizados.`);

    res.json({
      success: true,
      message: `Tipo de boleta ${numero} cambiado de ${tipoActual} a ${tipoNuevo}`,
      boletaActualizada: boletaResult.affectedRows,
      materialesActualizados: materialesResult.affectedRows,
      registrosTransaActualizados: transaResult.affectedRows,
      registrosManifiestoActualizados: manifiestoResult.affectedRows
    });

  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('❌ Error al cambiar tipo de boleta:', error);
    res.status(500).json({ error: error.message || 'Error al cambiar tipo de boleta' });
  } finally {
    // Liberar conexión
    connection.release();
  }
});

// ============================================
// ENDPOINTS PARA SISTEMA DE EMAILS
// ============================================

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Función para encriptar contraseñas (versión simplificada para desarrollo)
const encrypt = (text) => {
  try {
    // Para desarrollo, usar encriptación simple con Base64
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    console.error('Error al encriptar:', error);
    return text; // Fallback: devolver texto sin encriptar
  }
};

// Función para desencriptar contraseñas (versión simplificada para desarrollo)
const decrypt = (encryptedText) => {
  try {
    return decodeURIComponent(escape(atob(encryptedText)));
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return encryptedText; // Fallback: devolver texto como está
  }
};

// GET - Obtener todas las cuentas de email
app.get('/api/email-accounts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, email, provider, smtp_host, smtp_port, smtp_secure, 
             is_default, is_active, created_at, updated_at
      FROM email_accounts
      WHERE is_active = 1
      ORDER BY is_default DESC, created_at DESC
    `);

    res.json({
      success: true,
      accounts: rows,
      total: rows.length
    });

  } catch (error) {
    console.error('Error al obtener cuentas de email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las cuentas de email',
      error: error.message 
    });
  }
});

// POST - Crear nueva cuenta de email
app.post('/api/email-accounts', async (req, res) => {
  const { 
    nombre, email, provider, smtp_host, smtp_port, smtp_secure, 
    password, app_password, is_default 
  } = req.body;

  try {
    console.log('📧 Creando cuenta de email:', { nombre, email, provider, smtp_host, smtp_port });
    
    // Validaciones básicas
    if (!nombre || !email || !provider || !smtp_host || !smtp_port) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben estar completos'
      });
    }

    // Verificar si el email ya existe
    const [existing] = await pool.query(
      'SELECT id FROM email_accounts WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cuenta con este email'
      });
    }

    // Encriptar contraseñas si existen
    const encryptedPassword = password ? encrypt(password) : null;
    const encryptedAppPassword = app_password ? encrypt(app_password) : null;

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await pool.query('UPDATE email_accounts SET is_default = 0');
    }

    // Insertar nueva cuenta
    const [result] = await pool.query(`
      INSERT INTO email_accounts 
      (nombre, email, provider, smtp_host, smtp_port, smtp_secure, 
       password_encrypted, app_password, is_default, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      nombre, email, provider, smtp_host, smtp_port, smtp_secure,
      encryptedPassword, encryptedAppPassword, is_default || false
    ]);

    res.json({
      success: true,
      message: 'Cuenta de email creada exitosamente',
      accountId: result.insertId
    });

  } catch (error) {
    console.error('Error al crear cuenta de email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear la cuenta de email',
      error: error.message 
    });
  }
});

// PUT - Actualizar cuenta de email
app.put('/api/email-accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    nombre, email, provider, smtp_host, smtp_port, smtp_secure, 
    password, app_password, is_default 
  } = req.body;

  try {
    // Verificar que la cuenta existe
    const [existing] = await pool.query(
      'SELECT id FROM email_accounts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de email no encontrada'
      });
    }

    // Verificar email único (excluyendo la cuenta actual)
    const [emailExists] = await pool.query(
      'SELECT id FROM email_accounts WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otra cuenta con este email'
      });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (is_default) {
      await pool.query('UPDATE email_accounts SET is_default = 0');
    }

    // Preparar datos de actualización
    let updateFields = [
      'nombre = ?', 'email = ?', 'provider = ?', 'smtp_host = ?', 
      'smtp_port = ?', 'smtp_secure = ?', 'is_default = ?'
    ];
    let updateValues = [
      nombre, email, provider, smtp_host, smtp_port, smtp_secure, is_default || false
    ];

    // Actualizar contraseñas solo si se proporcionan
    if (password) {
      updateFields.push('password_encrypted = ?');
      updateValues.push(encrypt(password));
    }

    if (app_password) {
      updateFields.push('app_password = ?');
      updateValues.push(encrypt(app_password));
    }

    updateValues.push(id);

    await pool.query(`
      UPDATE email_accounts 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues);

    res.json({
      success: true,
      message: 'Cuenta de email actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar cuenta de email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar la cuenta de email',
      error: error.message 
    });
  }
});

// DELETE - Eliminar cuenta de email
app.delete('/api/email-accounts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la cuenta existe
    const [existing] = await pool.query(
      'SELECT id, is_default FROM email_accounts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de email no encontrada'
      });
    }

    // No permitir eliminar la cuenta predeterminada si hay otras cuentas
    if (existing[0].is_default) {
      const [otherAccounts] = await pool.query(
        'SELECT COUNT(*) as count FROM email_accounts WHERE id != ? AND is_active = 1',
        [id]
      );

      if (otherAccounts[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la cuenta predeterminada. Establece otra cuenta como predeterminada primero.'
        });
      }
    }

    // Marcar como inactiva en lugar de eliminar (para preservar historial)
    await pool.query(
      'UPDATE email_accounts SET is_active = 0, is_default = 0 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Cuenta de email eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cuenta de email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar la cuenta de email',
      error: error.message 
    });
  }
});

// PUT - Establecer cuenta como predeterminada
app.put('/api/email-accounts/:id/default', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la cuenta existe
    const [existing] = await pool.query(
      'SELECT id FROM email_accounts WHERE id = ? AND is_active = 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de email no encontrada'
      });
    }

    // Desmarcar todas las cuentas como predeterminadas
    await pool.query('UPDATE email_accounts SET is_default = 0');

    // Marcar la cuenta seleccionada como predeterminada
    await pool.query(
      'UPDATE email_accounts SET is_default = 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Cuenta establecida como predeterminada exitosamente'
    });

  } catch (error) {
    console.error('Error al establecer cuenta predeterminada:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al establecer la cuenta como predeterminada',
      error: error.message 
    });
  }
});

// POST - Probar conexión de email
app.post('/api/email-accounts/test', async (req, res) => {
  const { 
    email, smtp_host, smtp_port, smtp_secure, 
    password, app_password, provider 
  } = req.body;

  try {
    // Determinar qué contraseña usar
    const authPassword = app_password || password;

    if (!authPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una contraseña o contraseña de aplicación'
      });
    }

    // Crear configuración del transporter
    const transporterConfig = {
      host: smtp_host,
      port: smtp_port,
      secure: smtp_port === 465, // true para port 465, false para otros puertos
      auth: {
        user: email,
        pass: authPassword
      },
      // Configuración adicional para manejar certificados SSL/TLS
      tls: {
        rejectUnauthorized: false, // Aceptar certificados auto-firmados
        ciphers: 'SSLv3'
      },
      // Configuración específica para Gmail y otros proveedores
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    };

    // Para Gmail, agregar configuración específica
    if (provider === 'gmail') {
      transporterConfig.service = 'gmail';
    }

    // Crear transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verificar conexión
    await transporter.verify();

    res.json({
      success: true,
      message: 'Conexión exitosa al servidor de email'
    });

  } catch (error) {
    console.error('Error al probar conexión de email:', error);
    
    let errorMessage = 'Error de conexión desconocido';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Credenciales de autenticación incorrectas';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'No se pudo conectar al servidor SMTP';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

// =====================================================
// ENDPOINTS PARA SISTEMA DE EMAILS
// =====================================================

// Endpoint para obtener plantillas de email
app.get('/api/email-templates', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, subject_template, body_template, 
             created_at, updated_at
      FROM email_templates 
      ORDER BY nombre ASC
    `);
    
    res.json({
      success: true,
      templates: rows
    });
  } catch (error) {
    console.error('Error al obtener plantillas de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener plantillas de email'
    });
  }
});

// Endpoint para crear plantilla de email
app.post('/api/email-templates', async (req, res) => {
  const { nombre, descripcion, subject_template, body_template } = req.body;
  
  if (!nombre || !subject_template || !body_template) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, asunto y cuerpo son requeridos'
    });
  }
  
  try {
    const [result] = await pool.query(`
      INSERT INTO email_templates (nombre, descripcion, subject_template, body_template)
      VALUES (?, ?, ?, ?)
    `, [nombre, descripcion, subject_template, body_template]);
    
    res.json({
      success: true,
      message: 'Plantilla de email creada exitosamente',
      templateId: result.insertId
    });
  } catch (error) {
    console.error('Error al crear plantilla de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear plantilla de email'
    });
  }
});

// Endpoint para enviar email
app.post('/api/send-email', async (req, res) => {
  const { cuentaId, para, cc, cco, asunto, cuerpo, clienteCodigo } = req.body;
  
  // Validaciones
  if (!cuentaId || !para || !asunto || !cuerpo) {
    return res.status(400).json({
      success: false,
      message: 'Cuenta de envío, destinatario, asunto y cuerpo son requeridos'
    });
  }

  try {
    // Importar nodemailer dinámicamente
    const nodemailer = await import('nodemailer');
    
    // Obtener configuración de la cuenta de email
    const [cuentaRows] = await pool.query(`
      SELECT id, nombre, email, smtp_host, smtp_port, app_password, password_encrypted, 
             smtp_secure, is_default
      FROM email_accounts 
      WHERE id = ? AND is_active = 1
    `, [cuentaId]);
    
    if (cuentaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta de email no encontrada o inactiva'
      });
    }
    
    const cuenta = cuentaRows[0];
    
    // Usar la contraseña de app o la encriptada
    let password;
    try {
      if (cuenta.app_password) {
        password = Buffer.from(cuenta.app_password, 'base64').toString('utf8');
      } else if (cuenta.password_encrypted) {
        password = Buffer.from(cuenta.password_encrypted, 'base64').toString('utf8');
      } else {
        throw new Error('No hay contraseña configurada');
      }
    } catch (decryptError) {
      console.error('Error al desencriptar contraseña:', decryptError);
      return res.status(500).json({
        success: false,
        message: 'Error al acceder a la configuración de email'
      });
    }
    
    // Configurar transportador SMTP con configuraciones mejoradas
    const transporterConfig = {
      host: cuenta.smtp_host,
      port: cuenta.smtp_port,
      secure: cuenta.smtp_port == 465, // true solo para puerto 465 (SSL)
      auth: {
        user: cuenta.email, // Usar el email como usuario
        pass: password
      },
      // Configuraciones adicionales para mayor compatibilidad
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      // Pool de conexiones para evitar errores ECONNRESET
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // máximo 14 emails por segundo
      // Timeouts para evitar conexiones colgadas
      connectionTimeout: 60000, // 60s
      greetingTimeout: 30000,   // 30s
      socketTimeout: 60000      // 60s
    };
    
    const transporter = nodemailer.default.createTransport(transporterConfig);
    
    // Verificar conexión antes de intentar enviar
    try {
      await transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
    } catch (verifyError) {
      console.error('❌ Error al verificar conexión SMTP:', verifyError);
      throw new Error(`Error de conexión SMTP: ${verifyError.message}`);
    }
    
    // Configurar opciones del email
    const mailOptions = {
      from: `"${cuenta.nombre}" <${cuenta.email}>`,
      to: para,
      subject: asunto,
      text: cuerpo,
      html: cuerpo.replace(/\n/g, '<br>')
    };
    
    // Agregar CC y CCO si existen
    if (cc && cc.trim()) {
      mailOptions.cc = cc;
    }
    if (cco && cco.trim()) {
      mailOptions.bcc = cco;
    }
    
    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    // Guardar historial de email enviado
    await pool.query(`
      INSERT INTO email_history (
        account_id, cliente_codigo, to_email, cc_email, bcc_email,
        subject, body_text, status, message_id, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, NOW())
    `, [
      cuentaId, 
      clienteCodigo || null, 
      para, 
      cc || null, 
      cco || null, 
      asunto, 
      cuerpo, 
      info.messageId
    ]);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Error al enviar email:', error);
    
    // Guardar error en historial si tenemos cuenta
    if (cuentaId) {
      try {
        await pool.query(`
          INSERT INTO email_history (
            account_id, cliente_codigo, to_email, cc_email, bcc_email,
            subject, body_text, status, error_message, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', ?, NOW())
        `, [
          cuentaId, 
          clienteCodigo || null, 
          para, 
          cc || null, 
          cco || null, 
          asunto, 
          cuerpo, 
          error.message
        ]);
      } catch (historyError) {
        console.error('Error al guardar historial de error:', historyError);
      }
    }
    
    let errorMessage = 'Error al enviar email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verifica las credenciales de la cuenta de email.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
      errorMessage = 'Error de conexión con el servidor SMTP. Verifica la configuración de red y firewall.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Tiempo de espera agotado. El servidor SMTP no responde.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Servidor SMTP no encontrado. Verifica la dirección del servidor.';
    } else if (error.responseCode >= 500) {
      errorMessage = 'Error del servidor de email. Intenta nuevamente más tarde.';
    } else if (error.responseCode >= 400) {
      errorMessage = 'Error en los datos del email. Verifica destinatarios y contenido.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

// Endpoint para obtener historial de emails
app.get('/api/email-history', async (req, res) => {
  const { limit = 50, offset = 0, clienteCodigo, accountId } = req.query;
  
  try {
    let query = `
      SELECT eh.id, eh.account_id, eh.cliente_codigo, eh.to_email,
             eh.cc_email, eh.bcc_email, eh.subject, eh.body_text, eh.status,
             eh.message_id, eh.error_message, eh.sent_at,
             ea.nombre as account_name, ea.email as account_email
      FROM email_history eh
      LEFT JOIN email_accounts ea ON eh.account_id = ea.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (clienteCodigo) {
      query += ` AND eh.cliente_codigo = ?`;
      params.push(clienteCodigo);
    }
    
    if (accountId) {
      query += ` AND eh.account_id = ?`;
      params.push(accountId);
    }
    
    query += ` ORDER BY eh.sent_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.query(query, params);
    
    // Obtener total de registros
    let countQuery = `
      SELECT COUNT(*) as total
      FROM email_history eh
      WHERE 1=1
    `;
    
    const countParams = [];
    if (clienteCodigo) {
      countQuery += ` AND eh.cliente_codigo = ?`;
      countParams.push(clienteCodigo);
    }
    
    if (accountId) {
      countQuery += ` AND eh.account_id = ?`;
      countParams.push(accountId);
    }
    
    const [countRows] = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      emails: rows,
      total: countRows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al obtener historial de emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener historial de emails'
    });
  }
});

// ================================
// ENDPOINTS PARA DOCU_CONFIG
// ================================

// GET - Obtener todas las configuraciones de documentos
app.get('/api/docu-config', async (req, res) => {
  try {
    const { aplica_a } = req.query;
    
    let query = 'SELECT * FROM docu_config';
    let params = [];
    
    if (aplica_a) {
      query += ' WHERE aplica_a = ?';
      params.push(aplica_a);
    }
    
    query += ' ORDER BY aplica_a, nombre_documento';
    
    const [rows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      documentos: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error al obtener configuraciones de documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener configuraciones de documentos'
    });
  }
});

// GET - Obtener una configuración específica por ID
app.get('/api/docu-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM docu_config WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de documento no encontrada'
      });
    }
    
    res.json({
      success: true,
      documento: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener configuración de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener configuración de documento'
    });
  }
});

// POST - Crear nueva configuración de documento
app.post('/api/docu-config', async (req, res) => {
  try {
    const {
      aplica_a,
      nombre_documento,
      fecha_creado_renovado,
      fecha_vencimiento,
      nota,
      aviso_vence_dias,
      autoridad_relacion
    } = req.body;
    
    // Validar campos requeridos
    if (!aplica_a || !nombre_documento) {
      return res.status(400).json({
        success: false,
        message: 'Los campos aplica_a y nombre_documento son requeridos'
      });
    }
    
    // Verificar si ya existe un documento con el mismo nombre y aplica_a
    const [existing] = await pool.execute(
      'SELECT id FROM docu_config WHERE aplica_a = ? AND nombre_documento = ?',
      [aplica_a, nombre_documento]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un documento con el nombre "${nombre_documento}" para ${aplica_a === 'vehiculo' ? 'Vehículo' : 'Conductor'}`
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO docu_config 
       (aplica_a, nombre_documento, fecha_creado_renovado, fecha_vencimiento, 
        nota, aviso_vence_dias, autoridad_relacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        aplica_a,
        nombre_documento,
        fecha_creado_renovado || null,
        fecha_vencimiento || null,
        nota || null,
        aviso_vence_dias || 30,
        autoridad_relacion || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Configuración de documento creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear configuración de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear configuración de documento'
    });
  }
});

// PUT - Actualizar configuración de documento
app.put('/api/docu-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      aplica_a,
      nombre_documento,
      fecha_creado_renovado,
      fecha_vencimiento,
      nota,
      aviso_vence_dias,
      autoridad_relacion
    } = req.body;
    
    // Validar campos requeridos
    if (!aplica_a || !nombre_documento) {
      return res.status(400).json({
        success: false,
        message: 'Los campos aplica_a y nombre_documento son requeridos'
      });
    }
    
    const [result] = await pool.execute(
      `UPDATE docu_config 
       SET aplica_a = ?, nombre_documento = ?, fecha_creado_renovado = ?, 
           fecha_vencimiento = ?, nota = ?, aviso_vence_dias = ?, 
           autoridad_relacion = ?
       WHERE id = ?`,
      [
        aplica_a,
        nombre_documento,
        fecha_creado_renovado || null,
        fecha_vencimiento || null,
        nota || null,
        aviso_vence_dias || 30,
        autoridad_relacion || null,
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de documento no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuración de documento actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar configuración de documento'
    });
  }
});

// DELETE - Eliminar configuración de documento
// GET - Verificar relaciones de una configuración de documento
app.get('/api/docu-config/:id/check-relations', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la configuración exista y obtener aplica_a
    const [cfgRows] = await pool.execute('SELECT aplica_a FROM docu_config WHERE id = ?', [id]);
    if (cfgRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Configuración no encontrada' });
    }

    // Consultar conteos en ambas tablas (si existen)
    const [vehRows] = await pool.execute('SELECT COUNT(*) as cnt FROM vehiculo_documento WHERE id_docu = ?', [id]);
    const [choRows] = await pool.execute('SELECT COUNT(*) as cnt FROM conductor_documento WHERE id_docu = ?', [id]);

    const vehiculos = vehRows && vehRows[0] ? vehRows[0].cnt : 0;
    const conductores = choRows && choRows[0] ? choRows[0].cnt : 0;

    res.json({ success: true, aplica_a: cfgRows[0].aplica_a, vehiculos, conductores });
  } catch (error) {
    console.error('Error al verificar relaciones de docu_config:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al verificar relaciones' });
  }
});

// DELETE - Eliminar configuración de documento
app.delete('/api/docu-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM docu_config WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de documento no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuración de documento eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar configuración de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar configuración de documento'
    });
  }
});

// ============================================
// ENDPOINTS - CONFIGURACIÓN SISTEMA
// ============================================

// GET - Obtener configuración por clave
app.get('/api/configuracion/:clave', async (req, res) => {
  const { clave } = req.params;
  const usuario_id = req.usuario_id;
  
  console.log('🔍 Servidor - Buscando configuración:', { clave, usuario_id });
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      [clave, usuario_id]
    );
    
    console.log('🔍 Servidor - Resultado de búsqueda:', rows);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    res.json({
      success: true,
      configuracion: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener configuración'
    });
  }
});

// POST - Guardar/actualizar configuración
app.post('/api/configuracion', async (req, res) => {
  const { clave, valor, descripcion } = req.body;
  const usuario_id = req.usuario_id;
  
  console.log('💾 Servidor - Guardando configuración:', { clave, valor, descripcion, usuario_id });
  
  if (!clave || !valor) {
    return res.status(400).json({
      success: false,
      message: 'Clave y valor son requeridos'
    });
  }
  
  try {
    await pool.query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        valor = ?,
        descripcion = ?,
        fecha_modificacion = CURRENT_TIMESTAMP
    `, [clave, valor, descripcion || null, usuario_id, valor, descripcion || null]);
    
    res.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al guardar configuración',
      error: error.message
    });
  }
});

// GET - Obtener todas las configuraciones
app.get('/api/configuraciones', async (req, res) => {
  const usuario_id = req.usuario_id;
  
  console.log('📋 Servidor - Obteniendo todas las configuraciones para usuario:', usuario_id);
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM configuracion_sistema WHERE usuario_id = ? ORDER BY clave',
      [usuario_id]
    );
    
    res.json({
      success: true,
      configuraciones: rows
    });
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener configuraciones'
    });
  }
});

// ============================================
// ENDPOINTS NOTICIAS RSS
// ============================================

// GET /api/noticias - Obtener noticias de los feeds RSS configurados
app.get('/api/noticias', async (req, res) => {
  const usuario_id = 1; // Por defecto: admin
  
  try {
    // Obtener configuración de fuentes RSS
    const [config] = await pool.query(
      'SELECT valor FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
      ['noticias_fuentes_rss', usuario_id]
    );
    
    if (!config || config.length === 0) {
      // Si no hay configuración, devolver fuentes por defecto
      const fuentesPorDefecto = [
        {
          nombre: 'BBC Mundo',
          url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
          categoria: 'Internacional'
        }
      ];
      
      const noticiasDefecto = await obtenerNoticiasDeFeeds(fuentesPorDefecto);
      return res.json({
        success: true,
        noticias: noticiasDefecto,
        total: noticiasDefecto.length,
        fuentes: fuentesPorDefecto
      });
    }
    
    const fuentes = JSON.parse(config[0].valor);
    
    if (!Array.isArray(fuentes) || fuentes.length === 0) {
      return res.json({
        success: true,
        noticias: [],
        total: 0,
        fuentes: []
      });
    }
    
    // Obtener noticias de todas las fuentes
    const noticias = await obtenerNoticiasDeFeeds(fuentes);
    
    res.json({
      success: true,
      noticias,
      total: noticias.length,
      fuentes
    });
    
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener noticias RSS',
      error: error.message
    });
  }
});

// Función auxiliar para obtener noticias de múltiples feeds
async function obtenerNoticiasDeFeeds(fuentes) {
  const todasLasNoticias = [];
  
  for (const fuente of fuentes) {
    try {
      const feed = await rssParser.parseURL(fuente.url);
      
      const noticiasDelFeed = feed.items.slice(0, 10).map(item => ({
        titulo: item.title || 'Sin título',
        descripcion: item.contentSnippet || item.description || 'Sin descripción',
        link: item.link || '#',
        fecha: item.pubDate || item.isoDate || new Date().toISOString(),
        fuente: fuente.nombre,
        categoria: fuente.categoria || 'General',
        imagen: extraerImagen(item)
      }));
      
      todasLasNoticias.push(...noticiasDelFeed);
    } catch (error) {
      console.error(`Error al parsear feed ${fuente.nombre}:`, error.message);
      // Continuar con las demás fuentes aunque una falle
    }
  }
  
  // Ordenar por fecha (más recientes primero)
  todasLasNoticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  return todasLasNoticias;
}

// Función auxiliar para extraer imagen del feed RSS
function extraerImagen(item) {
  // Intentar obtener imagen de diferentes campos posibles
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }
  
  if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url;
  }
  
  // Buscar imagen en el contenido HTML
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }
  
  return null; // Sin imagen
}

// ============================================
// ENDPOINTS RECORDATORIOS
// ============================================

// GET /api/recordatorios - Obtener todas las notas activas
app.get('/api/recordatorios', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, texto, fecha_creacion FROM recordatorios WHERE activo = TRUE ORDER BY fecha_creacion DESC LIMIT 12'
    );
    
    res.json({ 
      success: true, 
      recordatorios: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error al obtener recordatorios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener recordatorios'
    });
  }
});

// POST /api/recordatorios - Crear nueva nota
app.post('/api/recordatorios', async (req, res) => {
  try {
    const { texto } = req.body;
    
    // Validar que el texto exista
    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'El texto es requerido' 
      });
    }
    
    // Validar longitud máxima de 100 caracteres
    if (texto.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El texto no puede estar vacío' 
      });
    }
    
    if (texto.length > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'El texto no puede exceder 100 caracteres' 
      });
    }
    
    // Verificar límite de 12 notas activas
    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM recordatorios WHERE activo = TRUE'
    );
    
    if (count[0].total >= 12) {
      return res.status(400).json({ 
        success: false, 
        error: 'Límite de 12 notas alcanzado. Elimina una nota para crear otra.' 
      });
    }
    
    // Insertar nueva nota
    const [result] = await pool.query(
      'INSERT INTO recordatorios (texto) VALUES (?)',
      [texto.trim()]
    );
    
    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Recordatorio creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear recordatorio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear recordatorio'
    });
  }
});

// DELETE /api/recordatorios/:id - Eliminar nota (soft delete)
app.delete('/api/recordatorios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID inválido' 
      });
    }
    
    // Verificar que la nota existe y está activa
    const [existing] = await pool.query(
      'SELECT id FROM recordatorios WHERE id = ? AND activo = TRUE',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recordatorio no encontrado' 
      });
    }
    
    // Soft delete: marcar como inactivo
    await pool.query(
      'UPDATE recordatorios SET activo = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true,
      message: 'Recordatorio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar recordatorio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar recordatorio'
    });
  }
});

// ============================================
// ENDPOINTS DE PERMISOS Y USUARIOS
// ============================================

// Obtener permisos de un usuario específico
app.get('/api/permisos/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [permisos] = await pool.query(`
      SELECT
        pm.modulo,
        pm.submodulo,
        pm.accion,
        pm.descripcion,
        COALESCE(pu.permitido, FALSE) as permitido
      FROM permisos_modulos pm
      LEFT JOIN permisos_usuarios pu ON pm.id = pu.permiso_modulo_id AND pu.usuario_id = ?
      WHERE pm.activo = TRUE
      ORDER BY pm.modulo, pm.submodulo, pm.accion
    `, [usuarioId]);

    res.json(permisos);
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ error: 'Error al obtener permisos del usuario' });
  }
});

// Actualizar permisos de un usuario
app.put('/api/permisos/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { permisos } = req.body; // Array de { modulo, submodulo, accion, permitido }

    // Usar transacción para actualizar múltiples permisos
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const permiso of permisos) {
        // Buscar o crear el permiso en permisos_modulos
        const [moduloResult] = await connection.query(`
          SELECT id FROM permisos_modulos
          WHERE modulo = ? AND submodulo = ? AND accion = ?
        `, [permiso.modulo, permiso.submodulo, permiso.accion]);

        let permisoModuloId;
        if (moduloResult.length > 0) {
          permisoModuloId = moduloResult[0].id;
        } else {
          // Crear nuevo permiso si no existe
          const [insertResult] = await connection.query(`
            INSERT INTO permisos_modulos (modulo, submodulo, accion, descripcion)
            VALUES (?, ?, ?, ?)
          `, [permiso.modulo, permiso.submodulo, permiso.accion, permiso.descripcion || '']);
          permisoModuloId = insertResult.insertId;
        }

        // Actualizar o insertar permiso del usuario
        await connection.query(`
          INSERT INTO permisos_usuarios (usuario_id, permiso_modulo_id, permitido)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)
        `, [usuarioId, permisoModuloId, permiso.permitido]);
      }

      await connection.commit();
      res.json({ success: true, message: 'Permisos actualizados correctamente' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error actualizando permisos:', error);
    res.status(500).json({ error: 'Error al actualizar permisos' });
  }
});

// Obtener lista de usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        id, 
        username, 
        full_name as nombre_completo, 
        email, 
        role as rol, 
        is_active as activo, 
        created_at as fecha_creacion, 
        last_login as ultimo_acceso
      FROM usuarios
      ORDER BY full_name
    `);

    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener lista de usuarios' });
  }
});

// Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { username, nombre_completo, email, password, rol } = req.body;

    // Validar campos requeridos
    if (!username || !password || !nombre_completo) {
      return res.status(400).json({
        success: false,
        error: 'Username, password y nombre completo son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Insertar usuario usando los nombres de columna correctos de la BD
    const [result] = await pool.query(`
      INSERT INTO usuarios (username, password, full_name, email, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      username,
      password, // Guardar directamente (TODO: implementar bcrypt)
      nombre_completo,
      email || null,
      rol || 'user',  // Nota: la BD usa 'user' no 'usuario'
      1  // is_active = TRUE
    ]);

    const usuarioId = result.insertId;

    // SI EL USUARIO ES ADMINISTRADOR, ASIGNAR TODOS LOS PERMISOS AUTOMÁTICAMENTE
    if (rol === 'admin') {
      try {
        // Obtener todos los permisos disponibles
        const [todosPermisos] = await pool.query('SELECT id FROM permisos_modulos');

        // Asignar todos los permisos al nuevo administrador
        for (const permiso of todosPermisos) {
          await pool.query(`
            INSERT INTO permisos_usuarios (usuario_id, permiso_modulo_id, permitido)
            VALUES (?, ?, TRUE)
            ON DUPLICATE KEY UPDATE permitido = TRUE
          `, [usuarioId, permiso.id]);
        }

        console.log(`✅ Administrador creado con ${todosPermisos.length} permisos asignados automáticamente`);

      } catch (permisosError) {
        console.error('Error asignando permisos al administrador:', permisosError);
        // No fallar la creación del usuario por error en permisos
      }
    }

    res.json({
      success: true,
      message: rol === 'admin'
        ? 'Usuario administrador creado correctamente con acceso total al sistema'
        : 'Usuario creado correctamente',
      usuarioId: usuarioId
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario: ' + error.message
    });
  }
});

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name, nombre_completo, email, role, rol, is_active, activo } = req.body;

    // Mapeo de campos frontend a backend
    const fullName = full_name || nombre_completo;
    const userRole = role || rol;
    const active = is_active !== undefined ? is_active : (activo !== undefined ? activo : true);

    // Si hay password, incluirlo en la actualización
    if (password) {
      await pool.query(`
        UPDATE usuarios
        SET password = ?, full_name = ?, email = ?, role = ?, is_active = ?
        WHERE id = ?
      `, [password, fullName, email, userRole, active, id]);
    } else {
      // Sin cambio de contraseña
      await pool.query(`
        UPDATE usuarios
        SET full_name = ?, email = ?, role = ?, is_active = ?
        WHERE id = ?
      `, [fullName, email, userRole, active, id]);
    }

    res.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario (desactivar)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE usuarios
      SET activo = FALSE
      WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Obtener catálogo de módulos y acciones disponibles
app.get('/api/permisos/modulos', async (req, res) => {
  try {
    const [modulos] = await pool.query(`
      SELECT modulo, submodulo, accion, descripcion
      FROM permisos_modulos
      WHERE activo = TRUE
      ORDER BY modulo, submodulo, accion
    `);

    // Agrupar por módulo y sub-módulo
    const estructura = {};
    modulos.forEach(modulo => {
      if (!estructura[modulo.modulo]) {
        estructura[modulo.modulo] = {};
      }
      if (!estructura[modulo.modulo][modulo.submodulo]) {
        estructura[modulo.modulo][modulo.submodulo] = [];
      }
      estructura[modulo.modulo][modulo.submodulo].push({
        accion: modulo.accion,
        descripcion: modulo.descripcion
      });
    });

    res.json(estructura);
  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    res.status(500).json({ error: 'Error al obtener catálogo de módulos' });
  }
});

// ENDPOINTS PARA CHAT INTERNO
// Obtener lista de usuarios para chat (solo activos, excluyendo al usuario actual)
app.get('/api/chat/usuarios', async (req, res) => {
  try {
    // Obtener ID del usuario actual desde headers
    const usuarioActualId = req.headers['x-usuario-id'];

    // Actualizar last_login del usuario actual si está presente
    if (usuarioActualId) {
      await pool.query(
        'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
        [usuarioActualId]
      );
    }

    let query = `
      SELECT
        id,
        full_name as nombre,
        username,
        role as rol,
        last_login as ultimo_acceso
      FROM usuarios
      WHERE is_active = TRUE
    `;

    const params = [];

    // Si hay usuario actual, excluirlo de la lista
    if (usuarioActualId) {
      query += ' AND id != ?';
      params.push(usuarioActualId);
    }

    query += ' ORDER BY full_name';

    const [usuarios] = await pool.query(query, params);

    // Determinar estado basado en último acceso con lógica mejorada
    const usuariosConEstado = usuarios.map(usuario => {
      let estado = 'offline';

      if (usuario.ultimo_acceso) {
        const ultimaActividad = new Date(usuario.ultimo_acceso);
        const ahora = new Date();
        const minutosDesdeUltimoAcceso = (ahora - ultimaActividad) / (1000 * 60);

        // Lógica mejorada: online si actividad en últimos 3 minutos, away si en últimos 15 minutos
        if (minutosDesdeUltimoAcceso < 3) {
          estado = 'online';
        } else if (minutosDesdeUltimoAcceso < 15) {
          estado = 'away';
        }
        // Si pasaron más de 15 minutos, permanece offline
      }

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
        estado: estado,
        ultimo_acceso: usuario.ultimo_acceso
      };
    });

    res.json({
      success: true,
      usuarios: usuariosConEstado
    });
  } catch (error) {
    console.error('Error obteniendo usuarios para chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener lista de usuarios'
    });
  }
});

// ENDPOINTS PARA MENSAJES DE CHAT
// Enviar mensaje
app.post('/api/chat/mensajes', async (req, res) => {
  try {
    const { remitente_id, destinatario_id, mensaje } = req.body;

    // Validaciones básicas
    if (!remitente_id || !destinatario_id || !mensaje) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: remitente_id, destinatario_id, mensaje'
      });
    }

    if (mensaje.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje no puede exceder 500 caracteres'
      });
    }

    // Verificar que ambos usuarios existen y están activos
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE id IN (?, ?) AND is_active = TRUE',
      [remitente_id, destinatario_id]
    );

    if (usuarios.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Uno o ambos usuarios no existen o no están activos'
      });
    }

    // Insertar mensaje
    const [result] = await pool.query(`
      INSERT INTO chat_mensajes (remitente_id, destinatario_id, mensaje, fecha, leido)
      VALUES (?, ?, ?, NOW(), FALSE)
    `, [remitente_id, destinatario_id, mensaje]);

    const mensajeId = result.insertId;

    // Obtener el mensaje insertado con información completa
    const [mensajeCompleto] = await pool.query(`
      SELECT
        cm.id,
        cm.remitente_id,
        cm.destinatario_id,
        cm.mensaje,
        cm.fecha,
        cm.leido,
        u.full_name as remitente_nombre
      FROM chat_mensajes cm
      JOIN usuarios u ON cm.remitente_id = u.id
      WHERE cm.id = ?
    `, [mensajeId]);

    res.json({
      success: true,
      mensaje: mensajeCompleto[0]
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje: ' + error.message
    });
  }
});

// Obtener conteo de mensajes no leídos por conversación
app.get('/api/chat/mensajes/no-leidos', async (req, res) => {
  try {
    const currentUserId = req.headers['x-usuario-id'];

    console.log('🔄 SERVIDOR: Solicitud de mensajes no leídos para usuario:', currentUserId);

    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID del usuario actual'
      });
    }

    // Obtener conteo de mensajes no leídos agrupados por remitente
    const [result] = await pool.query(`
      SELECT
        remitente_id,
        COUNT(*) as no_leidos
      FROM chat_mensajes
      WHERE destinatario_id = ? AND leido = false AND fecha >= DATE_SUB(NOW(), INTERVAL 5 DAY)
      GROUP BY remitente_id
    `, [currentUserId]);

    // Convertir a objeto para fácil acceso
    const noLeidosPorUsuario = {};
    result.forEach(row => {
      noLeidosPorUsuario[row.remitente_id] = row.no_leidos;
    });

    console.log('📊 SERVIDOR: Mensajes no leídos encontrados:', noLeidosPorUsuario);

    res.json({
      success: true,
      no_leidos: noLeidosPorUsuario
    });

  } catch (error) {
    console.error('Error obteniendo mensajes no leídos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes no leídos: ' + error.message
    });
  }
});

// Obtener mensajes entre dos usuarios
app.get('/api/chat/mensajes/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const currentUserId = req.headers['x-usuario-id'];

    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID del usuario actual'
      });
    }

    // MARCAR MENSAJES COMO LEÍDOS: Todos los mensajes del usuarioId al currentUserId
    await pool.query(`
      UPDATE chat_mensajes
      SET leido = 1
      WHERE remitente_id = ? AND destinatario_id = ? AND leido = 0
    `, [usuarioId, currentUserId]);

    console.log(`📖 SERVIDOR: Mensajes marcados como leídos - De ${usuarioId} para ${currentUserId}`);

    // Obtener mensajes entre los dos usuarios (últimos 5 días)
    const [mensajes] = await pool.query(`
      SELECT
        cm.id,
        cm.remitente_id,
        cm.destinatario_id,
        cm.mensaje,
        cm.fecha,
        cm.leido,
        u.full_name as remitente_nombre
      FROM chat_mensajes cm
      JOIN usuarios u ON cm.remitente_id = u.id
      WHERE ((cm.remitente_id = ? AND cm.destinatario_id = ?) OR (cm.remitente_id = ? AND cm.destinatario_id = ?))
        AND cm.fecha >= DATE_SUB(NOW(), INTERVAL 5 DAY)
      ORDER BY cm.fecha ASC
    `, [currentUserId, usuarioId, usuarioId, currentUserId]);

    res.json({
      success: true,
      mensajes: mensajes
    });

  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes: ' + error.message
    });
  }
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler: send back index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Endpoint temporal para pruebas de chat
app.get('/test-chat', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Notificaciones Chat</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0056b3;
        }
        .result {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-family: monospace;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
        }
        .success {
            background: #d4edda;
            color: #155724;
        }
    </style>
</head>
<body>
    <h1>🧪 Prueba del Sistema de Notificaciones de Chat</h1>

    <div class="test-section">
        <h2>1. Probar Endpoint de Mensajes No Leídos</h2>
        <button onclick="testEndpoint()">Probar API</button>
        <div id="api-result" class="result"></div>
    </div>

    <div class="test-section">
        <h2>2. Verificar Estado de la Base de Datos</h2>
        <button onclick="testDatabase()">Ver Mensajes en DB</button>
        <div id="db-result" class="result"></div>
    </div>

    <div class="test-section">
        <h2>3. Simular Notificación</h2>
        <button onclick="simulateNotification()">Mostrar Notificación de Prueba</button>
        <div id="notification-result" class="result"></div>
    </div>

    <div class="test-section">
        <h2>4. Abrir Aplicación Principal</h2>
        <button onclick="openApp()">Ir a MSEPlus</button>
        <p>Una vez en la aplicación, deberías ver:</p>
        <ul>
            <li>Un badge rojo en el botón de chat con el número de mensajes no leídos</li>
            <li>Una notificación toast si hay mensajes y el chat está cerrado</li>
            <li>Los mensajes marcados como leídos al abrir una conversación</li>
        </ul>
    </div>

    <script>
        const API_BASE = 'http://localhost:4000';

        async function testEndpoint() {
            const resultDiv = document.getElementById('api-result');
            resultDiv.innerHTML = '🔄 Probando endpoint...';

            try {
                const response = await fetch(\`\${API_BASE}/api/chat/mensajes/no-leidos\`, {
                    headers: {
                        'x-usuario-id': '1'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        ✅ Endpoint funcionando correctamente<br>
                        📊 Mensajes no leídos: \${JSON.stringify(data.no_leidos, null, 2)}<br>
                        🔢 Total: \${Object.values(data.no_leidos || {}).reduce((sum, count) => sum + count, 0)}
                    \`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`❌ Respuesta no exitosa: \${JSON.stringify(data)}\`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`❌ Error de conexión: \${error.message}\`;
            }
        }

        async function testDatabase() {
            const resultDiv = document.getElementById('db-result');
            resultDiv.innerHTML = '🔄 Consultando base de datos...';

            try {
                const response = await fetch(\`\${API_BASE}/api/chat/mensajes/1\`, {
                    headers: {
                        'x-usuario-id': '1'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    const mensajes = data.mensajes || [];
                    const noLeidos = mensajes.filter(m => !m.leido).length;

                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        ✅ Base de datos accesible<br>
                        📨 Total mensajes en conversación: \${mensajes.length}<br>
                        📬 Mensajes no leídos: \${noLeidos}
                    \`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`❌ Error en consulta: \${JSON.stringify(data)}\`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`❌ Error de conexión: \${error.message}\`;
            }
        }

        function simulateNotification() {
            const resultDiv = document.getElementById('notification-result');

            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('🔔 MSEPlus - Mensaje Nuevo', {
                            body: 'Tienes mensajes nuevos en el chat',
                            icon: '/vite.svg'
                        });

                        resultDiv.className = 'result success';
                        resultDiv.innerHTML = '✅ Notificación del navegador mostrada';
                    } else {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = '❌ Permiso de notificaciones denegado';
                    }
                });
            } else {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = '❌ El navegador no soporta notificaciones';
            }
        }

        function openApp() {
            window.open('http://localhost:5173', '_blank');
        }

        // Auto-probar al cargar la página
        window.addEventListener('load', () => {
            setTimeout(testEndpoint, 1000);
        });
    </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
