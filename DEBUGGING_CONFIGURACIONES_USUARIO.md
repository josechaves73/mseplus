# 🐛 Debugging: Configuraciones por Usuario

## 📋 **Problema Reportado**

Las configuraciones del Dashboard (reloj, colores, widgets, glassmorphism) se aplican a **TODOS** los usuarios en lugar de ser individuales por usuario.

**Ejemplo:**
- Usuario `Admin` desactiva el reloj → Usuario `Olga` también ve el reloj desactivado
- Usuario `Admin` cambia color de botones → Usuario `Olga` ve el mismo color

## 🔍 **Elementos que deben ser por usuario:**

1. ✅ **Reloj del Dashboard** (`mostrarReloj`)
2. ✅ **Color de botones de acceso directo** (`dashboard_color_botones`)
3. ✅ **Visibilidad de widgets** (`mostrarDocumentacion`, `mostrarRecordatorios`)
4. ✅ **Efecto Glassmorphism** (`glassmorphismBotones`)
5. ✅ **Color del reloj** (`colorReloj`)
6. ✅ **Intensidad de blur** (`intensidadBlurReloj`)

## 🛠️ **Solución Implementada**

### **1. Backend (server/index.js)**

✅ **Middleware para extraer usuario_id:**
```javascript
app.use((req, res, next) => {
  const usuarioId = req.headers['x-usuario-id'];
  if (usuarioId) {
    req.usuario_id = parseInt(usuarioId);
    console.log('🔑 Middleware - Header recibido x-usuario-id:', usuarioId);
  } else {
    req.usuario_id = 1; // Default: admin
    console.log('⚠️ Middleware - No header, usando default:', req.usuario_id);
  }
  next();
});
```

✅ **Endpoint POST /api/configuracion:**
```javascript
app.post('/api/configuracion', async (req, res) => {
  const { clave, valor, descripcion } = req.body;
  const usuario_id = req.usuario_id; // ← Del header
  
  await pool.query(`
    INSERT INTO configuracion_sistema (clave, valor, descripcion, usuario_id)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE valor = ?, descripcion = ?
  `, [clave, valor, descripcion, usuario_id, valor, descripcion]);
});
```

✅ **Endpoint GET /api/configuracion/:clave:**
```javascript
app.get('/api/configuracion/:clave', async (req, res) => {
  const { clave } = req.params;
  const usuario_id = req.usuario_id; // ← Del header
  
  const [rows] = await pool.query(
    'SELECT * FROM configuracion_sistema WHERE clave = ? AND usuario_id = ?',
    [clave, usuario_id]
  );
});
```

### **2. Frontend - ConfiguracionGeneralModal.jsx**

✅ **Función apiCall con header x-usuario-id:**
```javascript
const apiCall = useCallback(async (url, options = {}) => {
  const userId = user?.id || 1;
  console.log('🔑 apiCall con usuario:', userId);
  
  const headers = {
    'Content-Type': 'application/json',
    'x-usuario-id': userId.toString(), // ← Header del usuario
    ...options.headers
  };

  return fetch(url, { ...options, headers });
}, [user]);
```

✅ **Logs en handleGuardarColor:**
```javascript
const handleGuardarColor = async () => {
  const userId = user?.id || 1;
  console.log('💾 Guardando color para usuario:', userId, 'Color:', colorSeleccionado);
  
  const response = await apiCall('http://localhost:4000/api/configuracion', {
    method: 'POST',
    body: JSON.stringify({
      clave: 'dashboard_color_botones',
      valor: colorSeleccionado,
      descripcion: 'Color de fondo de los botones...'
    })
  });
};
```

✅ **Logs en handleGuardarDashboard:**
```javascript
const handleGuardarDashboard = async () => {
  const userId = user?.id || 1;
  console.log('💾 Guardando dashboard config para usuario:', userId, 'Config:', configToSave);
  
  const response = await apiCall('http://localhost:4000/api/configuracion', {
    method: 'POST',
    body: JSON.stringify({
      clave: 'dashboard_widgets_visibility',
      valor: JSON.stringify(configToSave),
      descripcion: 'Configuración de visibilidad de widgets...'
    })
  });
};
```

### **3. Frontend - Dashboard.jsx**

✅ **apiCall con usuario:**
```javascript
const apiCall = useCallback(async (url, options = {}) => {
  const userId = user?.id || 1;
  const headers = {
    'Content-Type': 'application/json',
    'x-usuario-id': userId.toString(),
    ...options.headers
  };
  return fetch(url, { ...options, headers });
}, [user?.id]);
```

✅ **cargarVisibilidadWidgets con logs:**
```javascript
const cargarVisibilidadWidgets = useCallback(async () => {
  const userId = user?.id || 1;
  console.log('🔍 Dashboard - Cargando widgets para usuario:', userId);
  
  const response = await apiCall('http://localhost:4000/api/configuracion/dashboard_widgets_visibility');
  const data = await response.json();
  
  console.log('🔍 Dashboard - Respuesta widgets:', data);
  console.log('🔍 Dashboard - Config cargada para usuario:', userId);
}, [apiCall, user?.id]);
```

✅ **cargarColorBotones con logs:**
```javascript
const cargarColorBotones = useCallback(async () => {
  const userId = user?.id || 1;
  console.log('🎨 Dashboard - Cargando color botones para usuario:', userId);
  
  const response = await apiCall('http://localhost:4000/api/configuracion/dashboard_color_botones');
  const data = await response.json();
  
  console.log('🎨 Dashboard - Color cargado:', data.configuracion.valor, 'para usuario:', userId);
}, [apiCall, user?.id]);
```

✅ **useEffect con verificación de user:**
```javascript
useEffect(() => {
  console.log('🔄 Dashboard - useEffect ejecutado con user:', user);
  if (user?.id) {
    cargarVisibilidadWidgets();
  }
}, [cargarVisibilidadWidgets, user]);

useEffect(() => {
  console.log('🔄 Dashboard - useEffect color ejecutado con user:', user);
  if (user?.id) {
    cargarColorBotones();
  }
}, [cargarColorBotones, user]);
```

## 📊 **Logs para Debugging**

### **Flujo esperado al guardar configuración:**

```
Frontend (ConfiguracionGeneralModal):
🔑 ConfiguracionGeneralModal - apiCall con usuario: 4 user completo: {id: 4, username: "Olga"}
💾 ConfiguracionGeneralModal - Guardando dashboard config para usuario: 4

Backend (server/index.js):
🔑 Middleware - Header recibido x-usuario-id: 4 -> req.usuario_id: 4
💾 Servidor - Guardando configuración: {clave: "dashboard_widgets_visibility", usuario_id: 4}
✅ ConfiguracionGeneralModal - Respuesta del servidor: {success: true}
```

### **Flujo esperado al cargar configuración:**

```
Frontend (Dashboard):
🏠 Dashboard - Renderizado con usuario: {id: 4, username: "Olga"}
🔄 Dashboard - useEffect ejecutado con user: {id: 4}
🔍 Dashboard - Cargando widgets para usuario: 4

Backend (server/index.js):
🔑 Middleware - Header recibido x-usuario-id: 4
🔍 Servidor - Buscando configuración: {clave: "dashboard_widgets_visibility", usuario_id: 4}
🔍 Servidor - Resultado de búsqueda: [{id: 25, clave: "dashboard_widgets_visibility", usuario_id: 4}]

Frontend (Dashboard):
🔍 Dashboard - Respuesta widgets: {success: true, configuracion: {...}}
🔍 Dashboard - Config cargada para usuario: 4
```

## 🧪 **Prueba Manual**

1. **Login como Admin (id: 1)**
   - Cambiar color de botones a Fucsia
   - Desactivar reloj
   - Activar Glassmorphism
   - Verificar en consola: `usuario_id: 1`

2. **Logout y Login como Olga (id: 4)**
   - Verificar que tenga configuración por defecto
   - Cambiar color de botones a Verde
   - Activar reloj
   - Verificar en consola: `usuario_id: 4`

3. **Volver a Admin**
   - Verificar que vea Fucsia, sin reloj, con Glassmorphism
   - Verificar en consola: `usuario_id: 1`

4. **Volver a Olga**
   - Verificar que vea Verde, con reloj, sin Glassmorphism
   - Verificar en consola: `usuario_id: 4`

## ✅ **Verificación en Base de Datos**

```sql
-- Ver configuraciones por usuario
SELECT id, clave, LEFT(valor, 50) as valor_preview, usuario_id, fecha_modificacion
FROM configuracion_sistema
WHERE clave IN ('dashboard_color_botones', 'dashboard_widgets_visibility')
ORDER BY usuario_id, clave;
```

**Resultado esperado:**
```
+----+------------------------------+------------------+------------+---------------------+
| id | clave                        | valor_preview    | usuario_id | fecha_modificacion  |
+----+------------------------------+------------------+------------+---------------------+
|  1 | dashboard_color_botones      | #9f1239          |          1 | 2025-10-14 08:30:00 |
| 23 | dashboard_widgets_visibility | {"mostrarReloj"...|          1 | 2025-10-14 08:30:00 |
| 94 | dashboard_color_botones      | #22c55e          |          4 | 2025-10-14 08:35:00 |
| 95 | dashboard_widgets_visibility | {"mostrarReloj"...|          4 | 2025-10-14 08:35:00 |
+----+------------------------------+------------------+------------+---------------------+
```

## 🎯 **Estado Actual**

- ✅ Backend: Middleware configurado
- ✅ Backend: Endpoints usando `req.usuario_id`
- ✅ Frontend: `apiCall` enviando header `x-usuario-id`
- ✅ Frontend: Logs de debugging agregados
- ✅ Dashboard: Verificación de `user?.id` antes de cargar
- 🔄 **Pendiente: Probar en navegador y verificar logs**

## 📝 **Próximos Pasos**

1. ✅ Abrir DevTools en navegador
2. ✅ Login como Admin
3. ✅ Ver logs en consola al cargar Dashboard
4. ✅ Cambiar configuración y ver logs al guardar
5. ✅ Logout y login como Olga
6. ✅ Verificar que cargue configuración diferente
7. ✅ Verificar en base de datos las configuraciones por usuario

---

**Fecha:** 2025-10-14  
**Build:** ✅ Exitoso (1.79s)  
**Estado:** 🔄 Listo para pruebas en navegador
