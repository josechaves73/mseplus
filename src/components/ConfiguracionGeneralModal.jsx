import React, { useState, useEffect, useCallback } from 'react';
import './ConfiguracionGeneralModal.css';
import { useAuth } from '../contexts/AuthContext';

// Paleta de colores disponibles
const coloresPaleta = [
  { nombre: 'Celeste', valor: '#0ea5e9' },
  { nombre: 'Azul', valor: '#3b82f6' },
  { nombre: 'Verde', valor: '#22c55e' },
  { nombre: 'Verde Oscuro', valor: '#0d4a0d' },
  { nombre: 'Naranja', valor: '#f97316' },
  { nombre: 'Naranja Oscuro', valor: '#c2410c' },
  { nombre: 'Fucsia', valor: '#ec4899' },
  { nombre: 'Fucsia Oscuro', valor: '#9f1239' },
  { nombre: 'Turquesa', valor: '#14b8a6' },
  { nombre: 'Negro', valor: '#000000' },
  { nombre: 'Gris Oscuro', valor: '#374151' }
];

// Lista de países con códigos ISO
const paisesList = [
  { nombre: 'Ecuador', codigo: 'EC', ciudad: 'Quito' },
  { nombre: 'Estados Unidos', codigo: 'US', ciudad: 'New York' },
  { nombre: 'España', codigo: 'ES', ciudad: 'Madrid' },
  { nombre: 'México', codigo: 'MX', ciudad: 'Ciudad de México' },
  { nombre: 'Colombia', codigo: 'CO', ciudad: 'Bogotá' },
  { nombre: 'Perú', codigo: 'PE', ciudad: 'Lima' },
  { nombre: 'Argentina', codigo: 'AR', ciudad: 'Buenos Aires' },
  { nombre: 'Chile', codigo: 'CL', ciudad: 'Santiago' },
  { nombre: 'Venezuela', codigo: 'VE', ciudad: 'Caracas' },
  { nombre: 'Brasil', codigo: 'BR', ciudad: 'Brasilia' },
  { nombre: 'Uruguay', codigo: 'UY', ciudad: 'Montevideo' },
  { nombre: 'Paraguay', codigo: 'PY', ciudad: 'Asunción' },
  { nombre: 'Bolivia', codigo: 'BO', ciudad: 'La Paz' },
  { nombre: 'Panamá', codigo: 'PA', ciudad: 'Panamá' },
  { nombre: 'Costa Rica', codigo: 'CR', ciudad: 'San José' },
  { nombre: 'Guatemala', codigo: 'GT', ciudad: 'Ciudad de Guatemala' },
  { nombre: 'Honduras', codigo: 'HN', ciudad: 'Tegucigalpa' },
  { nombre: 'Nicaragua', codigo: 'NI', ciudad: 'Managua' },
  { nombre: 'El Salvador', codigo: 'SV', ciudad: 'San Salvador' },
  { nombre: 'República Dominicana', codigo: 'DO', ciudad: 'Santo Domingo' },
  { nombre: 'Cuba', codigo: 'CU', ciudad: 'La Habana' },
  { nombre: 'Puerto Rico', codigo: 'PR', ciudad: 'San Juan' },
  { nombre: 'Francia', codigo: 'FR', ciudad: 'París' },
  { nombre: 'Alemania', codigo: 'DE', ciudad: 'Berlín' },
  { nombre: 'Italia', codigo: 'IT', ciudad: 'Roma' },
  { nombre: 'Reino Unido', codigo: 'GB', ciudad: 'Londres' },
  { nombre: 'Portugal', codigo: 'PT', ciudad: 'Lisboa' },
  { nombre: 'Canadá', codigo: 'CA', ciudad: 'Ottawa' },
  { nombre: 'Japón', codigo: 'JP', ciudad: 'Tokio' },
  { nombre: 'China', codigo: 'CN', ciudad: 'Pekín' },
  { nombre: 'India', codigo: 'IN', ciudad: 'Nueva Delhi' },
  { nombre: 'Australia', codigo: 'AU', ciudad: 'Sídney' },
  { nombre: 'Rusia', codigo: 'RU', ciudad: 'Moscú' }
];

// Colores disponibles para el reloj
const coloresReloj = [
  { nombre: 'Azul', valor: '#3b82f6' },
  { nombre: 'Celeste', valor: '#0ea5e9' },
  { nombre: 'Verde', valor: '#22c55e' },
  { nombre: 'Rosa', valor: '#ec4899' },
  { nombre: 'Dorado', valor: '#d4af37' },
  { nombre: 'Blanco', valor: '#ffffff' },
  { nombre: 'Negro', valor: '#000000' },
  { nombre: 'Púrpura', valor: '#8b5cf6' }
];

const ConfiguracionGeneralModal = ({ isOpen, onClose }) => {
  console.log('🔄 ConfiguracionGeneralModal - Componente renderizado, isOpen:', isOpen);

  const { user } = useAuth();
  console.log('👤 ConfiguracionGeneralModal - Usuario actual:', user);

  // Cleanup effect para debug
  useEffect(() => {
    console.log('🔄 ConfiguracionGeneralModal - Componente montado, usuario:', user);
    return () => {
      console.log('🔄 ConfiguracionGeneralModal - Componente desmontado');
    };
  }, [user]);
  const [colorSeleccionado, setColorSeleccionado] = useState('#0d4a0d');
  const [guardando, setGuardando] = useState(false);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  
  // Estados para configuración del clima
  const [climaConfig, setClimaConfig] = useState({
    ciudad: 'Quito',
    pais: 'EC',
    unidades: 'metric',
    apiKey: '' // API Key de WeatherAPI.com
  });
  const [guardandoClima, setGuardandoClima] = useState(false);
  const [mostrarMensajeClima, setMostrarMensajeClima] = useState(false);

  // Estados para configuración de noticias RSS
  const [noticiasConfig, setNoticiasConfig] = useState([
    { nombre: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', categoria: 'Internacional' }
  ]);
  const [guardandoNoticias, setGuardandoNoticias] = useState(false);
  const [mostrarMensajeNoticias, setMostrarMensajeNoticias] = useState(false);
  const [nuevaFuente, setNuevaFuente] = useState({ nombre: '', url: '', categoria: '' });

  // Estados para configuración de elementos del dashboard
  const [dashboardConfig, setDashboardConfig] = useState({
    mostrarDocumentacion: true,
    mostrarRecordatorios: true,
    mostrarReloj: true,
    colorReloj: '#ffffff',
    intensidadBlurReloj: 20,
    glassmorphismBotones: false
  });
  const [guardandoDashboard, setGuardandoDashboard] = useState(false);
  const [mostrarMensajeDashboard, setMostrarMensajeDashboard] = useState(false);

  // Función helper para llamadas API con usuario
  const apiCall = useCallback(async (url, options = {}) => {
    const userId = user?.id || 1;
    console.log('🔑 ConfiguracionGeneralModal - apiCall con usuario:', userId, 'user completo:', user);
    
    const headers = {
      'Content-Type': 'application/json',
      'x-usuario-id': userId.toString(),
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  }, [user]);

  const cargarColorGuardado = useCallback(async () => {
    try {
      const response = await apiCall('/api/configuracion/dashboard_color_botones');
      const data = await response.json();
      
      if (data.success && data.configuracion) {
        setColorSeleccionado(data.configuracion.valor);
      }
    } catch (error) {
      console.error('Error al cargar color guardado:', error);
    }
  }, [apiCall]);

  const cargarConfiguracionClima = useCallback(async () => {
    try {
      const response = await apiCall('/api/configuracion/estado_tiempo_config');
      const data = await response.json();
      
      if (data.success && data.configuracion) {
        const configGuardada = JSON.parse(data.configuracion.valor);
        setClimaConfig(configGuardada);
      }
    } catch (err) {
      console.log('No hay configuración de clima guardada, usando valores por defecto', err);
    }
  }, [apiCall]);

  const cargarConfiguracionNoticias = useCallback(async () => {
    try {
      const response = await apiCall('/api/configuracion/noticias_fuentes_rss');
      const data = await response.json();
      
      if (data.success && data.configuracion) {
        const configGuardada = JSON.parse(data.configuracion.valor);
        setNoticiasConfig(configGuardada);
      }
    } catch (err) {
      console.log('No hay configuración de noticias guardada, usando valores por defecto', err);
    }
  }, [apiCall]);

  const handleGuardarColor = async () => {
    setGuardando(true);
    
    const userId = user?.id || 1;
    console.log('💾 ConfiguracionGeneralModal - Guardando color para usuario:', userId, 'Color:', colorSeleccionado);
    
    try {
      const response = await apiCall('/api/configuracion', {
        method: 'POST',
        body: JSON.stringify({
          clave: 'dashboard_color_botones',
          valor: colorSeleccionado,
          descripcion: 'Color de fondo de los botones de acceso directo del Dashboard'
        })
      });

      const data = await response.json();
      console.log('✅ ConfiguracionGeneralModal - Respuesta guardar color:', data);

      if (data.success) {
        // Disparar evento para actualizar Dashboard
        window.dispatchEvent(new CustomEvent('dashboard-color-updated', {
          detail: { color: colorSeleccionado }
        }));
        
        // Mostrar mensaje de éxito
        setMostrarMensaje(true);
        
        // Ocultar mensaje automáticamente después de 2 segundos
        setTimeout(() => {
          setMostrarMensaje(false);
        }, 2000);
      } else {
        alert('❌ Error al guardar color');
      }
    } catch (error) {
      console.error('Error al guardar color:', error);
      alert('❌ Error al guardar color');
    } finally {
      setGuardando(false);
    }
  };

  const handlePaisChange = (codigoPais) => {
    const paisSeleccionado = paisesList.find(p => p.codigo === codigoPais);
    if (paisSeleccionado) {
      setClimaConfig({
        ...climaConfig, // Mantener apiKey existente
        ciudad: paisSeleccionado.ciudad,
        pais: paisSeleccionado.codigo,
        unidades: 'metric'
      });
    }
  };

  const handleGuardarClima = async () => {
    setGuardandoClima(true);
    
    try {
      const response = await apiCall('/api/configuracion', {
        method: 'POST',
        body: JSON.stringify({
          clave: 'estado_tiempo_config',
          valor: JSON.stringify(climaConfig),
          descripcion: 'Configuración del widget Estado del Tiempo'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Mostrar mensaje de éxito
        setMostrarMensajeClima(true);
        
        // Ocultar mensaje automáticamente después de 2 segundos
        setTimeout(() => {
          setMostrarMensajeClima(false);
        }, 2000);
      } else {
        alert('❌ Error al guardar configuración del clima');
      }
    } catch (error) {
      console.error('Error al guardar configuración del clima:', error);
      alert('❌ Error al guardar configuración del clima');
    } finally {
      setGuardandoClima(false);
    }
  };

  const handleAgregarFuente = () => {
    if (!nuevaFuente.nombre || !nuevaFuente.url || !nuevaFuente.categoria) {
      alert('⚠️ Por favor completa todos los campos');
      return;
    }
    
    setNoticiasConfig([...noticiasConfig, nuevaFuente]);
    setNuevaFuente({ nombre: '', url: '', categoria: '' });
  };

  const handleEliminarFuente = (index) => {
    const nuevasFuentes = noticiasConfig.filter((_, i) => i !== index);
    setNoticiasConfig(nuevasFuentes);
  };

  const handleGuardarNoticias = async () => {
    if (noticiasConfig.length === 0) {
      alert('⚠️ Debe haber al menos una fuente RSS configurada');
      return;
    }

    setGuardandoNoticias(true);
    
    try {
      const response = await apiCall('/api/configuracion', {
        method: 'POST',
        body: JSON.stringify({
          clave: 'noticias_fuentes_rss',
          valor: JSON.stringify(noticiasConfig),
          descripcion: 'Configuración de fuentes RSS para el widget de Noticias'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Mostrar mensaje de éxito
        setMostrarMensajeNoticias(true);
        
        // Ocultar mensaje automáticamente después de 2 segundos
        setTimeout(() => {
          setMostrarMensajeNoticias(false);
        }, 2000);
      } else {
        alert('❌ Error al guardar configuración de noticias');
      }
    } catch (error) {
      console.error('Error al guardar configuración de noticias:', error);
      alert('❌ Error al guardar configuración de noticias');
    } finally {
      setGuardandoNoticias(false);
    }
  };

  const cargarConfiguracionDashboard = useCallback(async () => {
    try {
      const response = await apiCall('/api/configuracion/dashboard_widgets_visibility');
      const data = await response.json();
      
      if (data.success && data.configuracion) {
        const configGuardada = JSON.parse(data.configuracion.valor);
        // Merge con valores por defecto para asegurar que todas las propiedades estén presentes
        const configFinal = {
          mostrarDocumentacion: true,
          mostrarRecordatorios: true,
          mostrarReloj: true,
          colorReloj: '#ffffff',
          intensidadBlurReloj: 20,
          glassmorphismBotones: false,
          ...configGuardada
        };
        setDashboardConfig(configFinal);
      }
    } catch (err) {
      console.log('No hay configuración de dashboard guardada, usando valores por defecto', err);
    }
  }, [apiCall]);

  // Cargar configuraciones al abrir modal
  useEffect(() => {
    if (isOpen) {
      cargarColorGuardado();
      cargarConfiguracionClima();
      cargarConfiguracionNoticias();
      cargarConfiguracionDashboard();
    }
  }, [isOpen, cargarColorGuardado, cargarConfiguracionClima, cargarConfiguracionNoticias, cargarConfiguracionDashboard]);

  const handleGuardarDashboard = async () => {
    // Asegurar que todos los campos estén presentes antes de guardar
    const configToSave = {
      mostrarDocumentacion: true,
      mostrarRecordatorios: true,
      mostrarReloj: true,
      colorReloj: '#ffffff',
      intensidadBlurReloj: 20,
      glassmorphismBotones: false,
      ...dashboardConfig
    };
    
    const userId = user?.id || 1;
    console.log('💾 ConfiguracionGeneralModal - Guardando dashboard config para usuario:', userId, 'Config:', configToSave);
    
    setGuardandoDashboard(true);
    
    try {
      const response = await apiCall('/api/configuracion', {
        method: 'POST',
        body: JSON.stringify({
          clave: 'dashboard_widgets_visibility',
          valor: JSON.stringify(configToSave),
          descripcion: 'Configuración de visibilidad de widgets del Dashboard'
        })
      });

      const data = await response.json();
      console.log('✅ ConfiguracionGeneralModal - Respuesta del servidor:', data);

      if (data.success) {
        // Disparar evento para actualizar Dashboard
        window.dispatchEvent(new CustomEvent('dashboard-widgets-updated', {
          detail: configToSave
        }));
        
        // Mostrar mensaje de éxito
        setMostrarMensajeDashboard(true);
        
        // Ocultar mensaje automáticamente después de 2 segundos
        setTimeout(() => {
          setMostrarMensajeDashboard(false);
        }, 2000);
      } else {
        alert('❌ Error al guardar configuración del dashboard');
      }
    } catch (error) {
      console.error('Error al guardar configuración del dashboard:', error);
      alert('❌ Error al guardar configuración del dashboard');
    } finally {
      setGuardandoDashboard(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="config-general-overlay">
      <div className="config-general-modal">
        {/* Header/Barra de título */}
        <div className="config-general-header">
          <h2>⚙️ Configuración General</h2>
          <button 
            className="config-general-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Mensaje de éxito flotante */}
        {mostrarMensaje && (
          <div className="config-mensaje-exito">
            <span className="mensaje-icono">✅</span>
            <span className="mensaje-texto">Color guardado exitosamente</span>
          </div>
        )}
        
        {mostrarMensajeClima && (
          <div className="config-mensaje-exito">
            <span className="mensaje-icono">✅</span>
            <span className="mensaje-texto">Configuración del clima guardada</span>
          </div>
        )}

        {mostrarMensajeNoticias && (
          <div className="config-mensaje-exito">
            <span className="mensaje-icono">✅</span>
            <span className="mensaje-texto">Configuración de noticias guardada</span>
          </div>
        )}

        {mostrarMensajeDashboard && (
          <div className="config-mensaje-exito">
            <span className="mensaje-icono">✅</span>
            <span className="mensaje-texto">Configuración del dashboard guardada</span>
          </div>
        )}

        {/* Body del modal */}
        <div className="config-general-body">
          {/* Contenedor de placeholders en dos columnas */}
          <div className="config-placeholders-grid">
            {/* Placeholder: Configuración de Color de Botones */}
            <div className="config-color-placeholder">
              <div className="config-color-header">
                <h3>Botones Acceso Directo - Color</h3>
              </div>
              
              <div className="config-color-content">
                <label className="config-color-label">
                  Seleccione color:
                </label>
                
                {/* Grilla de colores visual */}
                <div className="config-color-grid">
                  {coloresPaleta.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      className={`color-grid-item ${colorSeleccionado === color.valor ? 'active' : ''}`}
                      onClick={() => setColorSeleccionado(color.valor)}
                      title={color.nombre}
                    >
                      <div 
                        className="color-grid-box"
                        style={{ backgroundColor: color.valor }}
                      ></div>
                      <span className="color-grid-name">{color.nombre}</span>
                    </button>
                  ))}
                </div>

                {/* Preview del color seleccionado */}
                <div className="config-color-preview">
                  <span>Vista previa:</span>
                  <div 
                    className="color-preview-box"
                    style={{ backgroundColor: colorSeleccionado }}
                  ></div>
                </div>

                <button 
                  className="config-color-guardar-btn"
                  onClick={handleGuardarColor}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Placeholder: Configuración de Estado del Tiempo */}
            <div className="config-color-placeholder">
              <div className="config-color-header">
                <h3>🌤️ Estado del Tiempo - Configuración</h3>
              </div>
              
              <div className="config-color-content">
                <div className="config-clima-form">
                  <div className="form-group">
                    <label className="config-color-label" style={{color: '#d4af37'}}>Selecciona el País:</label>
                    <select
                      className="config-clima-select"
                      value={climaConfig.pais}
                      onChange={(e) => handlePaisChange(e.target.value)}
                    >
                      <option value="">-- Seleccionar País --</option>
                      {paisesList.map((pais) => (
                        <option key={pais.codigo} value={pais.codigo}>
                          {pais.nombre} ({pais.codigo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="config-color-label" style={{color: '#d4af37'}}>API Key de WeatherAPI.com:</label>
                    <input
                      type="text"
                      className="config-clima-input"
                      value={climaConfig.apiKey}
                      onChange={(e) => setClimaConfig({...climaConfig, apiKey: e.target.value})}
                      placeholder="Pega tu API Key aquí (opcional)"
                    />
                    <small className="form-hint">
                      Obtén tu clave gratis en:{' '}
                      <a 
                        href="https://www.weatherapi.com/signup.aspx" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{color: '#d4af37', textDecoration: 'underline'}}
                      >
                        weatherapi.com/signup
                      </a>
                    </small>
                  </div>
                </div>

                <button 
                  className="config-color-guardar-btn"
                  onClick={handleGuardarClima}
                  disabled={guardandoClima}
                >
                  {guardandoClima ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>

            {/* Placeholder: Configuración de Noticias RSS */}
            <div className="config-color-placeholder">
              <div className="config-color-header">
                <h3>📰 Noticias - Fuentes RSS</h3>
              </div>
              
              <div className="config-color-content">
                <div className="config-clima-form">
                  {/* Formulario para agregar nueva fuente */}
                  <div className="form-group">
                    <label className="config-color-label" style={{color: '#d4af37'}}>Nombre de la Fuente:</label>
                    <input
                      type="text"
                      className="config-clima-input"
                      value={nuevaFuente.nombre}
                      onChange={(e) => setNuevaFuente({...nuevaFuente, nombre: e.target.value})}
                      placeholder="Ej: BBC Mundo"
                    />
                  </div>

                  <div className="form-group">
                    <label className="config-color-label" style={{color: '#d4af37'}}>URL del RSS:</label>
                    <input
                      type="url"
                      className="config-clima-input"
                      value={nuevaFuente.url}
                      onChange={(e) => setNuevaFuente({...nuevaFuente, url: e.target.value})}
                      placeholder="https://feeds.ejemplo.com/rss.xml"
                    />
                  </div>

                  <div className="form-group">
                    <label className="config-color-label" style={{color: '#d4af37'}}>Categoría:</label>
                    <select
                      className="config-clima-select"
                      value={nuevaFuente.categoria}
                      onChange={(e) => setNuevaFuente({...nuevaFuente, categoria: e.target.value})}
                    >
                      <option value="">-- Seleccionar Categoría --</option>
                      <option value="Nacional">Nacional</option>
                      <option value="Internacional">Internacional</option>
                      <option value="Economía">Economía</option>
                      <option value="Tecnología">Tecnología</option>
                      <option value="Deportes">Deportes</option>
                      <option value="Cultura">Cultura</option>
                    </select>
                  </div>

                  {/* Botones de acción en la misma fila */}
                  <div className="config-noticias-botones">
                    <button 
                      className="config-noticias-agregar-btn"
                      onClick={handleAgregarFuente}
                      type="button"
                    >
                      ➕ Agregar Fuente
                    </button>

                    <button 
                      className="config-noticias-guardar-btn"
                      onClick={handleGuardarNoticias}
                      disabled={guardandoNoticias}
                      type="button"
                    >
                      {guardandoNoticias ? 'Guardando...' : '💾 Guardar Configuración'}
                    </button>
                  </div>

                  {/* Lista de fuentes configuradas */}
                  {noticiasConfig.length > 0 && (
                    <div className="config-fuentes-lista">
                      <h4 style={{marginBottom: '10px', fontSize: '0.9em', color: '#d4af37', fontWeight: '600'}}>
                        Fuentes Configuradas:
                      </h4>
                      {noticiasConfig.map((fuente, index) => (
                        <div key={index} className="config-fuente-item">
                          <div className="fuente-info">
                            <strong>{fuente.nombre}</strong>
                            <span className="fuente-categoria">({fuente.categoria})</span>
                            <small className="fuente-url">{fuente.url}</small>
                          </div>
                          <button
                            className="fuente-eliminar-btn"
                            onClick={() => handleEliminarFuente(index)}
                            type="button"
                            title="Eliminar fuente"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Placeholder: Configuración de Elementos del Dashboard */}
            <div className="config-color-placeholder">
              <div className="config-color-header">
                <h3>📊 Elementos del Dashboard</h3>
              </div>
              
              <div className="config-color-content">
                <div className="config-clima-form">
                  {/* Contenedor horizontal para los checkboxes */}
                  <div className="config-dashboard-checkboxes-row">
                    <label className="config-dashboard-checkbox-label">
                      <input
                        type="checkbox"
                        checked={dashboardConfig.mostrarDocumentacion}
                        onChange={(e) => setDashboardConfig({
                          ...dashboardConfig,
                          mostrarDocumentacion: e.target.checked
                        })}
                        className="config-dashboard-checkbox"
                      />
                      <span style={{color: '#d4af37', marginLeft: '10px'}}>
                        Mostrar Widget de Documentación
                      </span>
                    </label>

                    <label className="config-dashboard-checkbox-label">
                      <input
                        type="checkbox"
                        checked={dashboardConfig.mostrarRecordatorios}
                        onChange={(e) => setDashboardConfig({
                          ...dashboardConfig,
                          mostrarRecordatorios: e.target.checked
                        })}
                        className="config-dashboard-checkbox"
                      />
                      <span style={{color: '#d4af37', marginLeft: '10px'}}>
                        Mostrar Widget de Recordatorios
                      </span>
                    </label>
                  </div>

                  {/* Checkbox para efecto Glassmorphism */}
                  <div className="config-dashboard-checkbox-row">
                    <label className="config-dashboard-checkbox-label">
                      <input
                        type="checkbox"
                        checked={dashboardConfig.glassmorphismBotones}
                        onChange={(e) => {
                          setDashboardConfig({
                            ...dashboardConfig,
                            glassmorphismBotones: e.target.checked
                          });
                        }}
                        className="config-dashboard-checkbox"
                      />
                      <span style={{color: '#d4af37', marginLeft: '10px'}}>
                        Efecto Glassmorphism en Botones
                      </span>
                    </label>
                  </div>

                  {/* Checkbox del reloj debajo de las opciones de widgets */}
                  <div className="config-dashboard-checkbox-row">
                    <label className="config-dashboard-checkbox-label">
                      <input
                        type="checkbox"
                        checked={dashboardConfig.mostrarReloj}
                        onChange={(e) => setDashboardConfig({
                          ...dashboardConfig,
                          mostrarReloj: e.target.checked
                        })}
                        className="config-dashboard-checkbox"
                      />
                      <span style={{color: '#d4af37', marginLeft: '10px'}}>
                        Mostrar Reloj Analógico
                      </span>
                    </label>
                  </div>

                  {/* Opciones adicionales del reloj (solo visibles si está habilitado) */}
                  {dashboardConfig.mostrarReloj && (
                    <div className="config-reloj-opciones">
                      <div className="form-group">
                        <label className="config-color-label" style={{color: '#d4af37'}}>
                          Color del Reloj:
                        </label>
                        <div className="config-color-grid">
                          {coloresReloj.map((color) => (
                            <button
                              key={color.valor}
                              type="button"
                              className={`color-grid-item ${dashboardConfig.colorReloj === color.valor ? 'active' : ''}`}
                              onClick={() => setDashboardConfig({
                                ...dashboardConfig,
                                colorReloj: color.valor
                              })}
                              title={color.nombre}
                            >
                              <div
                                className="color-grid-box"
                                style={{ backgroundColor: color.valor }}
                              ></div>
                              <span className="color-grid-name">{color.nombre}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="config-color-label" style={{color: '#d4af37'}}>
                          Intensidad Blur: {dashboardConfig.intensidadBlurReloj}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={dashboardConfig.intensidadBlurReloj}
                          onChange={(e) => setDashboardConfig({
                            ...dashboardConfig,
                            intensidadBlurReloj: parseInt(e.target.value)
                          })}
                          className="config-transparencia-slider"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className="config-color-guardar-btn"
                  onClick={handleGuardarDashboard}
                  disabled={guardandoDashboard}
                >
                  {guardandoDashboard ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionGeneralModal;
