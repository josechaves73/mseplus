import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import DocumentacionWidget from './DocumentacionWidget';
import RecordatoriosWidget from './RecordatoriosWidget';
import CalculadoraButton from './CalculadoraButton';
import CalendarioButton from './CalendarioButton';
import EstadoTiempoButton from './EstadoTiempoButton';
import NoticiasButton from './NoticiasButton';
import ChatButton from './ChatButton';
import RelojAnalogico from './RelojAnalogico';
import { useAuth } from '../contexts/AuthContext';

const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" />
    <path d="M7 8h10M7 12h10M7 16h6" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M21 6v12a1 1 0 0 1-1 1H6l-3 2V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
    <path d="M8 10h8M8 14h6" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="11" cy="11" r="5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
    <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M16 11a4 4 0 1 0-8 0" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </svg>
);

const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
    <path d="M14 3v6h6" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M1 3h13v13H1z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none"/>
    <path d="M14 8h6l3 4v4h-9" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none"/>
    <circle cx="6" cy="19" r="1.6" fill="rgba(255,255,255,0.95)" />
    <circle cx="18" cy="19" r="1.6" fill="rgba(255,255,255,0.95)" />
  </svg>
);

const IconDriver = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="8" r="3" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
    <path d="M4 20c1-4 7-4 8-4s7 0 8 4" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" fill="none" />
    <path d="M3 6l9 7 9-7" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);

const ShortcutButton = ({ onClick, children, className = '', title, icon, backgroundColor, glassmorphism = false }) => {
  return (
    <button
      type="button"
      className={`db-shortcut-btn ${className} ${glassmorphism ? 'glassmorphism-effect' : ''}`}
      onClick={onClick}
      aria-label={title || (typeof children === 'string' ? children : 'Acceso directo')}
      title={title}
      style={backgroundColor ? { 
        '--btn-bg-color': backgroundColor,
        '--btn-hover-color': adjustColorBrightness(backgroundColor, -20)
      } : {}}
    >
      <span className="btn-icon" aria-hidden>{icon}</span>
      <span className="btn-text">{children}</span>
    </button>
  );
};

// Función helper para ajustar brillo del color para hover
const adjustColorBrightness = (color, percent) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
};

const Dashboard = ({
  onOpenListaArticulos,
  onOpenListaBoletas,
  onOpenTrazabilidad,
  onOpenListaClientes,
  onOpenListaManifiestos,
  onOpenListaVehiculos,
  onOpenListaConductores,
  onOpenEnviarEmail,
}) => {
  const { user } = useAuth();
  
  console.log('🏠 Dashboard - Renderizado con usuario:', user);

  const [wallpaperConfig, setWallpaperConfig] = useState({
    url: '',
    overlayOpacity: 0.0, // Sin opacidad por defecto
    showWallpaper: true
  });

  const [colorBotones, setColorBotones] = useState('#0d4a0d');

  // Estado para visibilidad de widgets del dashboard
  const [widgetVisibility, setWidgetVisibility] = useState({
    mostrarDocumentacion: true,
    mostrarRecordatorios: true,
    mostrarReloj: true,
    colorReloj: '#ffffff',
    intensidadBlurReloj: 20,
    glassmorphismBotones: false
  });

  // Función helper para llamadas API con usuario
  const apiCall = useCallback(async (url, options = {}) => {
    const userId = user?.id || 1;
    console.log('🔑 Dashboard - apiCall con usuario:', userId, 'user completo:', user);
    
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

  // Función para cargar configuración de widgets
  const cargarVisibilidadWidgets = useCallback(async () => {
    const userId = user?.id || 1;
    console.log('🔍 Dashboard - Cargando widgets para usuario:', userId);
    
    try {
      const response = await apiCall('/api/configuracion/dashboard_widgets_visibility');
      const data = await response.json();
      
      console.log('🔍 Dashboard - Respuesta widgets:', data);
      
      if (data.success && data.configuracion) {
        const configCargada = JSON.parse(data.configuracion.valor);
        console.log('🔍 Dashboard - Configuración cargada:', configCargada, 'para usuario:', userId);
        // Merge con valores por defecto para asegurar que todas las propiedades estén presentes
        const configFinal = {
          mostrarDocumentacion: true,
          mostrarRecordatorios: true,
          mostrarReloj: true,
          colorReloj: '#ffffff',
          intensidadBlurReloj: 20,
          glassmorphismBotones: false,
          ...configCargada
        };
        setWidgetVisibility(configFinal);
      } else {
        // No hay configuración guardada - crear una por defecto para este usuario
        console.log('⚠️ Dashboard - No hay configuración guardada para usuario:', userId, '- Creando configuración por defecto');
        
        const configPorDefecto = {
          mostrarDocumentacion: true,
          mostrarRecordatorios: true,
          mostrarReloj: true,
          colorReloj: '#ffffff',
          intensidadBlurReloj: 20,
          glassmorphismBotones: false
        };
        
        setWidgetVisibility(configPorDefecto);
        
        // Guardar configuración por defecto en el servidor
        await apiCall('/api/configuracion', {
          method: 'POST',
          body: JSON.stringify({
            clave: 'dashboard_widgets_visibility',
            valor: JSON.stringify(configPorDefecto),
            descripcion: 'Configuración de visibilidad de widgets del Dashboard'
          })
        });
        
        console.log('✅ Dashboard - Configuración por defecto creada para usuario:', userId);
      }
    } catch (error) {
      console.error('Error al cargar configuración de widgets:', error);
    }
  }, [apiCall, user?.id]);

  // Función para cargar color de botones
  const cargarColorBotones = useCallback(async () => {
    const userId = user?.id || 1;
    console.log('🎨 Dashboard - Cargando color botones para usuario:', userId);
    
    try {
      const response = await apiCall('/api/configuracion/dashboard_color_botones');
      const data = await response.json();
      
      console.log('🎨 Dashboard - Respuesta color botones:', data);
      
      if (data.success && data.configuracion) {
        console.log('🎨 Dashboard - Color cargado:', data.configuracion.valor, 'para usuario:', userId);
        setColorBotones(data.configuracion.valor);
      } else {
        // No hay color guardado - crear configuración por defecto
        console.log('⚠️ Dashboard - No hay color guardado para usuario:', userId, '- Creando color por defecto');
        
        const colorPorDefecto = '#0d4a0d'; // Verde oscuro por defecto
        setColorBotones(colorPorDefecto);
        
        // Guardar color por defecto en el servidor
        await apiCall('/api/configuracion', {
          method: 'POST',
          body: JSON.stringify({
            clave: 'dashboard_color_botones',
            valor: colorPorDefecto,
            descripcion: 'Color de fondo de los botones de acceso directo del Dashboard'
          })
        });
        
        console.log('✅ Dashboard - Color por defecto creado para usuario:', userId);
      }
    } catch (error) {
      console.error('Error al cargar color de botones:', error);
    }
  }, [apiCall, user?.id]);

  // Cargar configuración de visibilidad de widgets desde backend
  useEffect(() => {
    console.log('🔄 Dashboard - useEffect widgets ejecutado con user:', user);
    if (user?.id) {
      console.log('✅ Dashboard - Usuario disponible, cargando widgets para:', user.id);
      cargarVisibilidadWidgets();
    } else {
      console.log('⏳ Dashboard - Usuario no disponible aún, esperando...');
    }

    // Escuchar cambios desde ConfiguracionGeneralModal
    const handleWidgetsUpdate = (event) => {
      console.log('🔄 Dashboard - Evento recibido:', event.detail);
      console.log('🔄 Dashboard - glassmorphismBotones:', event.detail.glassmorphismBotones);
      // Merge con valores por defecto para asegurar que todas las propiedades estén presentes
      const configFinal = {
        mostrarDocumentacion: true,
        mostrarRecordatorios: true,
        mostrarReloj: true,
        colorReloj: '#ffffff',
        intensidadBlurReloj: 20,
        glassmorphismBotones: false,
        ...event.detail
      };
      setWidgetVisibility(configFinal);
    };

    window.addEventListener('dashboard-widgets-updated', handleWidgetsUpdate);
    return () => window.removeEventListener('dashboard-widgets-updated', handleWidgetsUpdate);
  }, [cargarVisibilidadWidgets, user]);

  // Cargar color de botones desde backend
  useEffect(() => {
    console.log('🔄 Dashboard - useEffect color ejecutado con user:', user);
    if (user?.id) {
      cargarColorBotones();
    }

    // Escuchar cambios de color desde ConfiguracionGeneralModal
    const handleColorUpdate = (event) => {
      setColorBotones(event.detail.color);
    };

    window.addEventListener('dashboard-color-updated', handleColorUpdate);
    return () => window.removeEventListener('dashboard-color-updated', handleColorUpdate);
  }, [cargarColorBotones, user]);

  // Cargar configuración del wallpaper desde localStorage
  useEffect(() => {
    const loadWallpaperConfig = () => {
      const currentUserId = user?.id || 1;
      const url = localStorage.getItem(`dashboard-wallpaper-url-${currentUserId}`) || 
                  'https://picsum.photos/seed/default-wallpaper/1920/1080'; // Wallpaper por defecto de Picsum
      const opacity = localStorage.getItem(`dashboard-overlay-opacity-${currentUserId}`) || '0.0';
      const show = localStorage.getItem(`dashboard-show-wallpaper-${currentUserId}`) !== 'false';
      
      setWallpaperConfig({
        url,
        overlayOpacity: parseFloat(opacity),
        showWallpaper: show
      });
    };

    loadWallpaperConfig();

    // Escuchar cambios de configuración
    const handleConfigUpdate = () => {
      loadWallpaperConfig();
    };

    window.addEventListener('dashboard-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('dashboard-config-updated', handleConfigUpdate);
  }, [user?.id]);

  return (
    <div className="dashboard-root">
      {console.log('🏠 Dashboard render - wallpaperConfig:', wallpaperConfig)}
      <div className="dashboard-left">
        <div 
          className={`shortcuts-card ${widgetVisibility.glassmorphismBotones ? 'glassmorphism-active' : ''}`}
          style={{
            backgroundImage: wallpaperConfig.showWallpaper 
              ? `url(${wallpaperConfig.url})` 
              : 'none',
            backgroundSize: 'cover', // Cubrir completamente sin espacios vacíos
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div 
            className="shortcuts-header"
            style={{
              '--header-bg-color': colorBotones,
              '--header-bg-color-dark': adjustColorBrightness(colorBotones, -15)
            }}
          >
            <h3>Accesos Directos</h3>
          </div>

          <div className="shortcuts-body">
            <ShortcutButton onClick={onOpenListaArticulos} title="Abrir Lista de Artículos" icon={<IconBox />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista Artículos</ShortcutButton>
            <ShortcutButton onClick={onOpenListaBoletas} title="Abrir Lista de Boletas" icon={<IconReceipt />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista Boletas</ShortcutButton>
            <ShortcutButton onClick={onOpenTrazabilidad} title="Abrir Trazabilidad" icon={<IconSearch />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Trazabilidad</ShortcutButton>
            <ShortcutButton onClick={onOpenListaClientes} title="Abrir Lista de Clientes" icon={<IconUsers />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista de Clientes</ShortcutButton>
            <ShortcutButton onClick={onOpenListaManifiestos} title="Abrir Lista de Manifiestos" icon={<IconFile />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista de Manifiestos</ShortcutButton>
            <ShortcutButton onClick={onOpenListaVehiculos} title="Abrir Lista de Vehículos" icon={<IconTruck />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista de Vehículos</ShortcutButton>
            <ShortcutButton onClick={onOpenListaConductores} title="Abrir Lista de Conductores" icon={<IconDriver />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Lista Conductores</ShortcutButton>
            <ShortcutButton onClick={onOpenEnviarEmail} title="Abrir Enviar Email" icon={<IconMail />} backgroundColor={colorBotones} glassmorphism={widgetVisibility.glassmorphismBotones}>Enviar Email</ShortcutButton>
          </div>
        </div>
      </div>

      <div className="dashboard-right">
        <div 
          className="widget-placeholder"
          style={{
            backgroundImage: wallpaperConfig.showWallpaper ? `url(${wallpaperConfig.url})` : 'none',
            backgroundSize: 'cover', // Cubrir completamente sin espacios vacíos
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {wallpaperConfig.showWallpaper && (
            <div 
              className="widget-overlay" 
              style={{ opacity: wallpaperConfig.overlayOpacity }}
            ></div>
          )}
          <CalculadoraButton />
          <CalendarioButton />
          <EstadoTiempoButton />
          <NoticiasButton />
          <ChatButton />
          {widgetVisibility.mostrarReloj && (
            <RelojAnalogico 
              color={widgetVisibility.colorReloj} 
              intensidadBlur={widgetVisibility.intensidadBlurReloj} 
            />
          )}
          <div className="widget-content-container">
            {widgetVisibility.mostrarDocumentacion && <DocumentacionWidget />}
            {widgetVisibility.mostrarRecordatorios && <RecordatoriosWidget />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
