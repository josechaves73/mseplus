import React, { useState, useEffect } from 'react';
import './CambiarTipoBoletaModal.css';

const CambiarTipoBoletaModal = ({ isOpen, onClose, boleta }) => {
  const [tiposBoleta, setTiposBoleta] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar tipos de boleta al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchTiposBoleta();
      if (boleta) {
        setSelectedTipo(boleta.tipo || '');
      }
      setError('');
      setSuccess(false);
    }
  }, [isOpen, boleta]);

  const fetchTiposBoleta = async () => {
    try {
      const response = await fetch('/api/tipo-boletas');
      if (!response.ok) throw new Error('Error al cargar tipos de boleta');
      const data = await response.json();
      setTiposBoleta(data.data || []);
    } catch (err) {
      console.error('Error fetching tipos boleta:', err);
      setError('Error al cargar tipos de boleta');
    }
  };

  const handleCambiarTipo = async () => {
    if (!selectedTipo || !boleta) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/cambiar-tipo-boleta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numero: boleta.numero,
            tipoActual: boleta.tipo,
            tipoNuevo: selectedTipo,
            codigo: boleta.codigo || boleta.cod || null,
            manifiesto: boleta.manifiesto || null
          })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar tipo de boleta');
      }

      const result = await response.json();
      console.log('✅ Tipo de boleta cambiado:', result);
      setSuccess(true);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Error al cambiar tipo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cambiar-tipo-modal-overlay">
      <div className="cambiar-tipo-modal">
        <div className="cambiar-tipo-modal-header">
          <h2 className="cambiar-tipo-modal-title">🔄 Cambiar Tipo de Boleta</h2>
          <button className="cambiar-tipo-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cambiar-tipo-modal-body">
          <div className="boleta-info-section">
            <h3>Información de la Boleta</h3>
            <div className="boleta-info">
              <div className="info-field">
                <label>Número:</label>
                <span>{boleta?.numero || 'N/A'}</span>
              </div>
              <div className="info-field">
                <label>Tipo Actual:</label>
                <span>{boleta?.tipo || 'N/A'}</span>
              </div>
              <div className="info-field info-field-full">
                <label>Cliente:</label>
                <span>{boleta?.clienten || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="tipo-selection-section">
            <h3>Seleccionar Nuevo Tipo</h3>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="tipo-select"
              disabled={loading}
            >
              <option value="">-- Seleccionar Tipo --</option>
              {tiposBoleta.map((tipo) => (
                <option key={tipo.id || tipo.nombre} value={tipo.nombre}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              ✅ Tipo de boleta cambiado exitosamente
            </div>
          )}

          <div className="action-buttons-container">
            <button
              className="action-btn cancelar"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="action-btn confirmar"
              onClick={handleCambiarTipo}
              disabled={!selectedTipo || selectedTipo === boleta?.tipo || loading || success}
            >
              {loading ? '🔄 Cambiando...' : '✅ Confirmar Cambio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CambiarTipoBoletaModal;
