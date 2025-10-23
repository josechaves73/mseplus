import React, { useState, useEffect } from 'react';
import './RecordatoriosWidget.css';
import { API_BASE_URL } from '../config/api';

const RecordatoriosWidget = () => {
  const [recordatorios, setRecordatorios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar recordatorios al montar
  useEffect(() => {
    cargarRecordatorios();
  }, []);

  // Rotación automática cada 10 segundos
  useEffect(() => {
    if (recordatorios.length === 0) return;

    const rotationInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recordatorios.length);
      setProgress(0); // Reiniciar progreso
    }, 10000);

    return () => clearInterval(rotationInterval);
  }, [recordatorios.length]);

  // Barra de progreso (actualiza cada 100ms)
  useEffect(() => {
    if (recordatorios.length === 0) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1; // 100 steps en 10 segundos = 1% cada 100ms
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [recordatorios.length, currentIndex]);

  const cargarRecordatorios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recordatorios`);
      const data = await response.json();

      if (data.success) {
        setRecordatorios(data.recordatorios);
        setCurrentIndex(0);
        setProgress(0);
      }
    } catch (error) {
      console.error('Error al cargar recordatorios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearRecordatorio = async (e) => {
    e.preventDefault();
    
    if (!nuevoTexto.trim()) {
      mostrarMensaje('error', 'El texto no puede estar vacío');
      return;
    }

    if (nuevoTexto.length > 100) {
      mostrarMensaje('error', 'El texto no puede exceder 100 caracteres');
      return;
    }

    setCreando(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recordatorios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nuevoTexto.trim() })
      });

      const data = await response.json();

      if (data.success) {
        mostrarMensaje('success', 'Recordatorio creado exitosamente');
        setNuevoTexto('');
        setShowCreateForm(false);
        await cargarRecordatorios();
      } else {
        mostrarMensaje('error', data.error || 'Error al crear recordatorio');
      }
    } catch (error) {
      console.error('Error al crear recordatorio:', error);
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarRecordatorio = async () => {
    if (recordatorios.length === 0) return;

    const recordatorioActual = recordatorios[currentIndex];
    
    setEliminando(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recordatorios/${recordatorioActual.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        mostrarMensaje('success', 'Recordatorio eliminado');
        await cargarRecordatorios();
      } else {
        mostrarMensaje('error', data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setEliminando(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const recordatorioActual = recordatorios[currentIndex];

  return (
    <div className="recordatorios-widget">
      {/* Header */}
      <div className="recordatorios-header">
        <div className="header-left">
          <div className="header-icon">📝</div>
          <h3 className="header-title">Recordatorios</h3>
        </div>
        <div className="header-buttons">
          <button
            className="header-btn btn-crear"
            onClick={() => setShowCreateForm(!showCreateForm)}
            title="Crear recordatorio"
            disabled={recordatorios.length >= 12}
          >
            ➕
          </button>
          <button
            className="header-btn btn-eliminar"
            onClick={handleEliminarRecordatorio}
            title="Eliminar recordatorio actual"
            disabled={recordatorios.length === 0 || eliminando}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="create-form">
          <form onSubmit={handleCrearRecordatorio}>
            <div className="form-group">
              <textarea
                className="create-input"
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                placeholder="Escribe tu recordatorio (máx 100 caracteres)..."
                maxLength={100}
                rows={2}
                disabled={creando}
              />
              <div className="char-counter">
                {nuevoTexto.length}/100
              </div>
            </div>
            <div className="form-buttons">
              <button
                type="submit"
                className="form-btn btn-guardar"
                disabled={creando || !nuevoTexto.trim()}
              >
                {creando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="form-btn btn-cancelar"
                onClick={() => {
                  setShowCreateForm(false);
                  setNuevoTexto('');
                }}
                disabled={creando}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensaje de feedback */}
      {mensaje.texto && (
        <div className={`feedback-message ${mensaje.tipo}`}>
          {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Contenido */}
      <div className="recordatorios-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando recordatorios...</p>
          </div>
        ) : recordatorios.length === 0 ? (
          <div className="empty-state">
            <p>Sin Recordatorios</p>
          </div>
        ) : (
          <>
            <div className="nota-container" key={currentIndex}>
              <div className="nota-icon">📌</div>
              <div className="nota-texto">
                {recordatorioActual?.texto}
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Dots de navegación */}
            <div className="dots-navigation">
              {recordatorios.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  title={`Ver recordatorio ${index + 1}`}
                />
              ))}
            </div>

            {/* Contador */}
            <div className="contador">
              {currentIndex + 1} de {recordatorios.length} notas
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecordatoriosWidget;
