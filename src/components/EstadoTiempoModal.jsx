import React, { useState, useEffect, useCallback } from 'react';
import './EstadoTiempoModal.css';
import { useAuth } from '../contexts/AuthContext';

const EstadoTiempoModal = ({ onClose }) => {
  const { user } = useAuth();

  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    ciudad: 'Quito',
    pais: 'EC',
    unidades: 'metric',
    apiKey: '' // API Key configurable desde Configuración General
  });

  // Función helper para llamadas API con usuario
  const apiCall = useCallback(async (url, options = {}) => {
    const userId = user?.id || 1;
    console.log('🔑 EstadoTiempoModal - apiCall con usuario:', userId, 'user completo:', user);
    
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

  // Función para cargar configuración
  const cargarConfiguracion = useCallback(async () => {
    try {
      const response = await apiCall('/api/configuracion/estado_tiempo_config');
      const data = await response.json();
      
      if (data.success && data.configuracion) {
        const configGuardada = JSON.parse(data.configuracion.valor);
        setConfig(configGuardada);
      }
    } catch (err) {
      console.log('No hay configuración guardada, usando valores por defecto', err);
    }
  }, [apiCall]);

  // Cargar configuración del usuario desde el backend
  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  // Cargar datos del clima cuando cambie la configuración
  useEffect(() => {
    // Datos de ejemplo para cuando no hay API key
    const getDatosEjemplo = () => ({
      name: config.ciudad,
      sys: { country: config.pais },
      main: {
        temp: 18,
        feels_like: 17,
        humidity: 65,
        pressure: 1013
      },
      weather: [{
        description: 'parcialmente nublado',
        icon: '02d',
        main: 'Clouds'
      }],
      wind: { speed: 3.5 },
      clouds: { all: 40 }
    });

    const getPronosticoEjemplo = () => [
      { dt_txt: '2025-10-11 12:00:00', main: { temp: 19 }, weather: [{ icon: '01d' }] },
      { dt_txt: '2025-10-12 12:00:00', main: { temp: 20 }, weather: [{ icon: '02d' }] },
      { dt_txt: '2025-10-13 12:00:00', main: { temp: 18 }, weather: [{ icon: '03d' }] },
      { dt_txt: '2025-10-14 12:00:00', main: { temp: 17 }, weather: [{ icon: '04d' }] },
      { dt_txt: '2025-10-15 12:00:00', main: { temp: 19 }, weather: [{ icon: '02d' }] }
    ];
    
    const obtenerClima = async () => {
      setLoading(true);
      setError(null);

      try {
        // Usar API Key configurada por el usuario, o mostrar datos de ejemplo
        const API_KEY = config.apiKey;
        
        // Si no hay API Key configurada, usar datos de ejemplo
        if (!API_KEY || API_KEY.trim() === '') {
          console.log('⚠️ No hay API Key configurada. Mostrando datos de ejemplo.');
          setWeatherData(getDatosEjemplo());
          setForecast(getPronosticoEjemplo());
          setLoading(false);
          return;
        }
        
        // WeatherAPI: datos actuales + pronóstico 5 días en una sola llamada
        const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${config.ciudad},${config.pais}&days=5&lang=es`;

        const response = await fetch(weatherUrl).catch(() => null);

        if (response && response.ok) {
          const data = await response.json();
          
          // Adaptar formato de WeatherAPI a nuestro componente
          const currentData = {
            name: data.location.name,
            sys: { country: data.location.country },
            main: {
              temp: data.current.temp_c,
              feels_like: data.current.feelslike_c,
              humidity: data.current.humidity,
              pressure: data.current.pressure_mb
            },
            weather: [{
              description: data.current.condition.text,
              icon: data.current.condition.icon,
              main: data.current.condition.text
            }],
            wind: { speed: data.current.wind_kph / 3.6 }, // convertir kph a m/s
            clouds: { all: data.current.cloud }
          };

          // Pronóstico de 5 días
          const forecastData = data.forecast.forecastday.map(day => ({
            dt_txt: day.date,
            main: { temp: day.day.avgtemp_c },
            weather: [{ icon: day.day.condition.icon, description: day.day.condition.text }]
          }));

          setWeatherData(currentData);
          setForecast(forecastData);
        } else {
          // Datos de ejemplo si falla la API o no hay key configurada
          setWeatherData(getDatosEjemplo());
          setForecast(getPronosticoEjemplo());
        }

        setLoading(false);
      } catch (err) {
        console.error('Error al obtener clima:', err);
        setError('No se pudo cargar la información del clima');
        // Usar datos de ejemplo en caso de error
        setWeatherData(getDatosEjemplo());
        setForecast(getPronosticoEjemplo());
        setLoading(false);
      }
    };

    obtenerClima();
    
    // Auto-refresh cada 10 minutos (600,000 ms) mientras el modal esté abierto
    const intervalId = setInterval(() => {
      console.log('🔄 Actualizando datos del clima...');
      obtenerClima();
    }, 600000); // 10 minutos

    // Limpiar intervalo cuando se desmonte el componente o cambie la config
    return () => {
      clearInterval(intervalId);
    };
  }, [config]);

  const getWeatherIcon = (iconCode) => {
    // Mapeo de condiciones comunes a emojis
    if (typeof iconCode === 'string' && iconCode.includes('http')) {
      // WeatherAPI devuelve URLs de iconos, usaremos emojis según descripción
      return '🌤️';
    }
    
    // Mapeo de iconos de OpenWeatherMap a emojis (por compatibilidad)
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  const formatFecha = (dateString) => {
    const fecha = new Date(dateString);
    return fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="estado-tiempo-overlay" onClick={onClose}>
        <div className="estado-tiempo-modal loading" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner"></div>
          <p>Cargando información del clima...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="estado-tiempo-overlay" onClick={onClose}>
      <div className="estado-tiempo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="estado-tiempo-header">
          <h2>🌤️ Estado del Tiempo</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {weatherData && (
          <div className="estado-tiempo-body">
            {/* Clima actual */}
            <div className="clima-actual">
              <div className="ciudad-info">
                <h3>{weatherData.name}, {weatherData.sys.country}</h3>
                <p className="descripcion">{weatherData.weather[0].description}</p>
              </div>
              
              <div className="temperatura-principal">
                <span className="icono-grande">{getWeatherIcon(weatherData.weather[0].icon)}</span>
                <span className="temp-numero">{Math.round(weatherData.main.temp)}°</span>
                <span className="temp-unidad">C</span>
              </div>

              <div className="detalles-clima">
                <div className="detalle-item">
                  <span className="detalle-icono">🌡️</span>
                  <div className="detalle-info">
                    <span className="detalle-label">Sensación térmica</span>
                    <span className="detalle-valor">{Math.round(weatherData.main.feels_like)}°C</span>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-icono">💧</span>
                  <div className="detalle-info">
                    <span className="detalle-label">Humedad</span>
                    <span className="detalle-valor">{weatherData.main.humidity}%</span>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-icono">💨</span>
                  <div className="detalle-info">
                    <span className="detalle-label">Viento</span>
                    <span className="detalle-valor">{weatherData.wind.speed} m/s</span>
                  </div>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-icono">📊</span>
                  <div className="detalle-info">
                    <span className="detalle-label">Presión</span>
                    <span className="detalle-valor">{weatherData.main.pressure} hPa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pronóstico de 5 días */}
            <div className="pronostico-container">
              <h4>📅 Pronóstico de 5 días</h4>
              <div className="pronostico-grid">
                {forecast.map((day, index) => (
                  <div key={index} className="pronostico-dia">
                    <span className="dia-nombre">{formatFecha(day.dt_txt)}</span>
                    <span className="dia-icono">{getWeatherIcon(day.weather[0].icon)}</span>
                    <span className="dia-temp">{Math.round(day.main.temp)}°C</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nota informativa */}
            <div className="clima-nota">
              <p>💡 <strong>Nota:</strong> Para configurar tu ubicación, ve a <strong>Configuración General</strong> en el menú principal.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadoTiempoModal;
