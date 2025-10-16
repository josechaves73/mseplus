# MSEPlus - Instrucciones para Agentes de IA

## Arquitectura del Proyecto

**MSEPlus** es una aplicación de gestión logística full-stack con arquitectura modular:

### Frontend (React + Vite)
- **Ubicación**: `src/`
- **Patrón**: Múltiples modales independientes para cada entidad
- **Ejemplos**: `ListaManifiestosModal`, `ListaVehiculosModal`, `NuevoConductorModal`
- **Estado**: useState/useEffect para gestión de datos y UI

### Backend (Express.js + MySQL)
- **Ubicación**: `server/`
- **Puerto**: 4000 (http://localhost:4000)
- **Base de datos**: MySQL con pool de conexiones
- **APIs**: RESTful con endpoints como `/api/manifiestos`, `/api/chofer`

### Patrón de Comunicación
```javascript
// Frontend -> Backend
const response = await fetch('http://localhost:4000/api/manifiestos');
const data = await response.json();

// Backend -> Frontend
res.json({ manifiestos: rows, total: rows.length });
```

## Patrones de Desarrollo

### 1. Estructura de Modales
```jsx
// Patrón consistente en todos los modales
const [entidad, setEntidad] = useState([]);
const [filteredEntidad, setFilteredEntidad] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
```

### 2. Manejo de Estados
- **Carga inicial**: useEffect con `isOpen && entidad.length === 0`
- **Filtrado**: useEffect con dependencias `[entidad, searchTerm]`
- **Keys únicas**: `key={`${item.id}-${index}`}` para evitar warnings de React

### 3. APIs del Backend
```javascript
// Endpoint típico con agregación
app.get('/api/manifiestos', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT manifiesto as numero, DATE_FORMAT(MIN(fecha), '%Y-%m-%d') as fecha,
           SUM(peso) as peso_local, tipo, GROUP_CONCAT(nota) as notas
    FROM boletas
    WHERE manifiesto IS NOT NULL
    GROUP BY manifiesto, tipo
    ORDER BY MIN(fecha) DESC
  `);
  res.json({ manifiestos: rows });
});
```

## Flujos de Trabajo Críticos

### Desarrollo Local
```bash
# Frontend (puerto 5173)
npm run dev

# Backend (puerto 4000)
cd server && npm run dev
```

### Debugging
- **Console logs**: Usa `console.log('🔍', variable)` para debugging
- **Estado**: Monitorea cambios con useEffect de debug
- **API**: Verifica responses con Postman o browser dev tools

### Convenciones del Proyecto
- **Idioma**: Español para nombres de variables, funciones y comentarios
- **Nombres**: `ListaEntidadModal`, `NuevoEntidadModal`, `handleOpenListaEntidad`
- **CSS**: Archivos `.css` separados con clases descriptivas
- **Imports**: Agrupa React hooks, luego componentes, luego utilidades

## Entidades Principales
- **Manifiestos**: Agrupación de boletas por número y tipo
- **Boletas**: Registros individuales de transporte
- **Choferes**: Conductores con código único y datos personales
- **Vehículos**: Flota de transporte
- **Clientes**: Entidades comerciales
- **Artículos**: Productos transportados

## Consideraciones Especiales
- **Cloudinary**: Integración para manejo de imágenes de choferes
- **MySQL**: Consultas con agregaciones complejas (SUM, GROUP BY, DATE_FORMAT)
- **Exportación**: Funcionalidad XLSX para exportar datos
- **Navegación**: Soporte de teclado (flechas, Enter) en tablas

## Archivos Clave para Referencia
- `src/App.jsx`: Estructura principal y manejo de modales
- `server/index.js`: APIs del backend y lógica de negocio
- `src/components/ListaManifiestosModal.jsx`: Ejemplo completo de modal con búsqueda
- `server/db.js`: Configuración de conexión MySQL
