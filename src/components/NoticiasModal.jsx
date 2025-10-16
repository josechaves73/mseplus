import React, { useState, useEffect } from 'react';
import './NoticiasModal.css';

const NoticiasModal = ({ onClose }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  console.log('📰 NoticiasModal renderizado - Loading:', loading, 'Noticias:', noticias.length);

  useEffect(() => {
    cargarNoticias();
    
    // Auto-refresh cada 15 minutos
    const intervalId = setInterval(() => {
      console.log('🔄 Actualizando noticias...');
      cargarNoticias();
    }, 900000); // 15 minutos

    return () => clearInterval(intervalId);
  }, []);

  const cargarNoticias = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/noticias');
      const data = await response.json();

      if (data.success) {
        setNoticias(data.noticias || []);
      } else {
        setError('No se pudieron cargar las noticias');
      }
    } catch (err) {
      console.error('Error al cargar noticias:', err);
      setError('Error de conexión al cargar noticias');
    } finally {
      setLoading(false);
    }
  };

  const categorias = ['Todas', ...new Set(noticias.map(n => n.categoria))];
  const noticiasFiltradas = filtroCategoria === 'Todas' 
    ? noticias 
    : noticias.filter(n => n.categoria === filtroCategoria);

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora - date) / 1000); // diferencia en segundos

    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="noticias-overlay" onClick={onClose}>
      <div className="noticias-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="noticias-header">
          <h2>📰 Noticias Recientes</h2>
          <button className="noticias-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Filtros de categoría */}
        {categorias.length > 1 && (
          <div className="noticias-filtros">
            {categorias.map(cat => (
              <button
                key={cat}
                className={`filtro-btn ${filtroCategoria === cat ? 'activo' : ''}`}
                onClick={() => setFiltroCategoria(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Cuerpo del modal */}
        <div className="noticias-body">
          {loading && (
            <div className="noticias-loading">
              <div className="loading-spinner"></div>
              <p>Cargando noticias...</p>
            </div>
          )}

          {error && (
            <div className="noticias-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={cargarNoticias}>
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && noticiasFiltradas.length === 0 && (
            <div className="noticias-vacio">
              <span className="vacio-icon">📭</span>
              <p>No hay noticias disponibles</p>
              <small>Configura tus fuentes RSS en Configuración General</small>
            </div>
          )}

          {!loading && !error && noticiasFiltradas.length > 0 && (
            <div className="noticias-lista">
              {noticiasFiltradas.map((noticia, index) => (
                <div key={`${noticia.link}-${index}`} className="noticia-card">
                  {noticia.imagen && (
                    <div className="noticia-imagen">
                      <img 
                        src={noticia.imagen} 
                        alt={noticia.titulo}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <div className="noticia-contenido">
                    <div className="noticia-meta">
                      <span className="noticia-fuente">{noticia.fuente}</span>
                      <span className="noticia-separador">•</span>
                      <span className="noticia-fecha">{formatearFecha(noticia.fecha)}</span>
                    </div>

                    <h3 className="noticia-titulo">{noticia.titulo}</h3>
                    
                    <p className="noticia-descripcion">{noticia.descripcion}</p>

                    <a 
                      href={noticia.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="noticia-link"
                    >
                      Leer más →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con info */}
        <div className="noticias-footer">
          <span className="footer-icon">💡</span>
          <small>
            Mostrando {noticiasFiltradas.length} noticia{noticiasFiltradas.length !== 1 ? 's' : ''}
            {filtroCategoria !== 'Todas' && ` de ${filtroCategoria}`}
          </small>
        </div>
      </div>
    </div>
  );
};

export default NoticiasModal;
