import React, { useState, useEffect, useCallback } from 'react';
import './ConfiguracionDashboardModal.css';
import MensajeModal from './MensajeModal';
import { useAuth } from '../contexts/AuthContext';

const ConfiguracionDashboardModal = ({ isOpen, onClose }) => {
  const [wallpapers, setWallpapers] = useState([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ show: false, texto: '', tipo: '' });
  const [currentWallpaperUrl, setCurrentWallpaperUrl] = useState(null);
  const [showWallpaper, setShowWallpaper] = useState(true);

  // Usuario actual del contexto de autenticación
  const { user } = useAuth();
  const currentUserId = user?.id || 1;

  // Cargar configuración actual del wallpaper
  const loadCurrentWallpaper = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/configuracion/dashboard_wallpaper_url`, {
        headers: {
          'x-usuario-id': currentUserId.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.configuracion) {
          setCurrentWallpaperUrl(data.configuracion.valor);
        }
      }
      
      // Cargar estado de mostrar/ocultar wallpaper
      const showWallpaperValue = localStorage.getItem(`dashboard-show-wallpaper-${currentUserId}`);
      setShowWallpaper(showWallpaperValue !== 'false');
    } catch (error) {
      console.error('Error cargando configuración de wallpaper:', error);
    }
  }, [currentUserId]);

  // Función para guardar el estado de mostrar/ocultar wallpaper
  const handleToggleWallpaper = async () => {
    const newShowState = !showWallpaper;
    setShowWallpaper(newShowState);
    
    // Guardar en localStorage
    localStorage.setItem(`dashboard-show-wallpaper-${currentUserId}`, newShowState.toString());
    
    // Disparar evento para actualizar el dashboard
    window.dispatchEvent(new CustomEvent('dashboard-config-updated'));
    
    // Mostrar mensaje de éxito
    setMensaje({
      show: true,
      texto: `✅ Wallpaper ${newShowState ? 'activado' : 'desactivado'} correctamente`,
      tipo: 'success'
    });
  };

  // Generar wallpapers aleatorios
  const handleRecargarFondos = () => {
    generateWallpapers();
  };

  const generateWallpapers = () => {
    setLoading(true);
    const newWallpapers = [];

    // Generar seeds únicos para consistencia pero alta resolución garantizada
    const timestamp = Date.now();

    for (let i = 0; i < 8; i++) {
      const seed = timestamp + i;
      // Usar URLs sin ID específico para garantizar resolución FHD+
      const fullResUrl = `https://picsum.photos/seed/${seed}/1920/1080`;
      const thumbnailUrl = `https://picsum.photos/seed/${seed}/400/225`;

      newWallpapers.push({
        id: i,
        url: fullResUrl,
        thumbnailUrl: thumbnailUrl,
        seed: seed,
        selected: false
      });
    }

    setWallpapers(newWallpapers);
    setSelectedWallpaper(null);
    setLoading(false);
  };

  // Inicializar wallpapers y cargar configuración actual al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCurrentWallpaper();
      generateWallpapers();
    }
  }, [isOpen, currentUserId, loadCurrentWallpaper]);

  const handleSelectWallpaper = (wallpaperId) => {
    setSelectedWallpaper(wallpaperId);
    setWallpapers(prev => prev.map(w => ({
      ...w,
      selected: w.id === wallpaperId
    })));
  };

  const handleSave = async () => {
    if (selectedWallpaper !== null && !saving) {
      setSaving(true);
      const selected = wallpapers.find(w => w.id === selectedWallpaper);

      if (selected) {
        try {
          // Guardar en la base de datos usando la API de configuraciones
          const response = await fetch('http://localhost:4000/api/configuracion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clave: 'dashboard_wallpaper_url',
              valor: selected.url,
              descripcion: 'URL del wallpaper seleccionado para el dashboard',
              usuario_id: currentUserId
            })
          });

          if (response.ok) {
            // También guardar localStorage como respaldo (por compatibilidad)
            localStorage.setItem(`dashboard-wallpaper-url-${currentUserId}`, selected.url);

            // Disparar evento para actualizar el dashboard
            window.dispatchEvent(new CustomEvent('dashboard-config-updated'));

            // Mostrar mensaje de éxito y cerrar modal
            setMensaje({
              show: true,
              texto: '✅ Wallpaper guardado correctamente',
              tipo: 'success'
            });

          } else {
            throw new Error('Error al guardar la configuración');
          }
        } catch (error) {
          console.error('Error guardando wallpaper:', error);
          alert('❌ Error al guardar el wallpaper. Inténtalo de nuevo.');
        } finally {
          setSaving(false);
        }
      }
    }
  };

  if (!isOpen) return null;  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '16px',
        color: 'white'
      }} onClick={(e) => e.stopPropagation()}>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>⚙️ Configuración del Dashboard</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>🖼️ Selecciona un Wallpaper</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showWallpaper}
                  onChange={handleToggleWallpaper}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ color: 'white', fontSize: '14px' }}>Mostrar Wallpaper</span>
              </label>
              <button 
                onClick={handleRecargarFondos}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    e.target.style.background = 'linear-gradient(135deg, #5a67d8, #6b46c1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(0.95)';
                    e.target.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.6)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: loading ? '#666' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  transform: 'scale(1)',
                  boxShadow: 'none',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '⏳ Cargando...' : '🔄 Recargar Fondos'}
              </button>
            </div>
          </div>

          {currentWallpaperUrl && (
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'white' }}>🎨 Wallpaper Actual:</h4>
              <div style={{
                width: '100%',
                height: '120px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#333'
              }}>
                <img
                  src={currentWallpaperUrl}
                  alt="Wallpaper actual"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">Wallpaper no disponible</div>';
                  }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '300px',
              color: 'white' 
            }}>
              Cargando wallpapers...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {wallpapers.map((wallpaper) => (
                <div
                  key={wallpaper.id}
                  onClick={() => handleSelectWallpaper(wallpaper.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: wallpaper.selected ? '3px solid #ff8c00' : '3px solid transparent',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    transform: 'scale(1)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                    if (!wallpaper.selected) {
                      e.currentTarget.style.border = '3px solid rgba(255, 140, 0, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    if (!wallpaper.selected) {
                      e.currentTarget.style.border = '3px solid transparent';
                    }
                  }}
                >
                  <img
                    src={wallpaper.thumbnailUrl}
                    alt={`Wallpaper ${wallpaper.id + 1}`}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.log(`❌ Error cargando imagen ${wallpaper.imageId}:`, wallpaper.thumbnailUrl);
                      e.target.style.display = 'none';
                      // Mostrar un placeholder
                      e.target.parentElement.innerHTML = `
                        <div style="
                          width: 100%;
                          height: 150px;
                          background: linear-gradient(45deg, #667eea, #764ba2);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 12px;
                          border-radius: 8px;
                        ">
                          Imagen ${wallpaper.imageId}<br/>No disponible
                        </div>
                      `;
                    }}
                  />
                  {wallpaper.selected && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#ff8c00',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedWallpaper === null || saving}
            style={{
              padding: '10px 20px',
              background: (selectedWallpaper !== null && !saving) ? '#34c759' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (selectedWallpaper !== null && !saving) ? 'pointer' : 'not-allowed',
              opacity: (selectedWallpaper !== null && !saving) ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar Selección
              </>
            )}
          </button>
        </div>
      </div>

      {/* MensajeModal para éxito/error */}
      <MensajeModal
        isOpen={mensaje.show}
        onClose={() => {
          setMensaje({ show: false, texto: '', tipo: '' });
          onClose(); // Cerrar el modal principal después de cerrar el mensaje
        }}
        title={mensaje.tipo === 'success' ? '✓ Éxito' : '✕ Error'}
        size="small"
        className={mensaje.tipo === 'success' ? 'mensaje-success' : 'mensaje-error'}
      >
        <p style={{ textAlign: 'center', fontSize: '16px', margin: '20px 0' }}>
          {mensaje.texto}
        </p>
      </MensajeModal>
    </div>
  );
};

export default ConfiguracionDashboardModal;
