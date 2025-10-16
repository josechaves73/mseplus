import React, { useState } from 'react';
import './CambiarEstadoModal.css';

const CambiarEstadoModal = ({ isOpen, onClose, manifiesto, onEstadoUpdated }) => {
  // Estado para controlar el mensaje de éxito
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !manifiesto) return null;

  // Determinar el estado actual basado en el campo TIPO
  const estadoActual = manifiesto.tipo || '';
  const esAbierto = estadoActual.toUpperCase() === 'ABIERTO';

  // Determinar el estado objetivo
  const estadoObjetivo = esAbierto ? 'CERRADO' : 'ABIERTO';

  // Función para manejar el cambio de estado
  const handleAplicarCambio = async () => {
    try {
      console.log(`🔄 Aplicando cambio de estado: ${estadoActual} → ${estadoObjetivo} para manifiesto ${manifiesto.numero}`);

      // Hacer la llamada a la API para actualizar el estado
      const response = await fetch(`http://localhost:4000/api/manifiestos/${manifiesto.numero}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: estadoObjetivo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado');
      }

      const data = await response.json();
      console.log('✅ Estado actualizado exitosamente:', data);

      // Mostrar mensaje de éxito primero
      setSuccessMessage(`Cambio de estado exitoso: ${estadoActual} → ${estadoObjetivo}`);
      setShowSuccessMessage(true);

      // El callback se ejecutará cuando el usuario haga clic en "Aceptar"
      // No lo ejecutamos aquí para evitar interferir con el mensaje de éxito

    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      alert('Error al cambiar el estado del manifiesto: ' + error.message);
    }
  };

  // Función para cerrar el mensaje de éxito y el modal
  const handleAceptarSuccess = () => {
    // Ejecutar el callback para refrescar los datos antes de cerrar
    if (onEstadoUpdated) {
      onEstadoUpdated();
    }

    setShowSuccessMessage(false);
    onClose();
  };

  const handleOverlayClick = (e) => {
    // No cerrar el modal al hacer clic en el overlay
    e.stopPropagation();
  };

  return (
    <div className="cambiar-estado-modal-overlay" onClick={handleOverlayClick}>
      <div className="cambiar-estado-modal">
        <div className="cambiar-estado-modal-header">
          <h2 className="cambiar-estado-modal-title">Cambiar Estado del Manifiesto</h2>
          <button className="cambiar-estado-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cambiar-estado-modal-body">
          {/* Sección de información del manifiesto */}
          <div className="estado-info-section">
            <h3>Información del Manifiesto</h3>

            {/* Campos de formulario en fila para mejor alineación */}
            <div className="form-row">
              <div className="form-group numero-field">
                <label className="form-label">Número:</label>
                <input
                  type="text"
                  value={manifiesto.numero || ''}
                  readOnly
                  className="form-input readonly numero-input"
                />
              </div>

              <div className="form-group estado-field">
                <label className="form-label">Estado Actual:</label>
                <input
                  type="text"
                  value={estadoActual}
                  readOnly
                  className={`form-input readonly estado-input estado-${estadoActual.toLowerCase()}`}
                />
              </div>
            </div>

            {/* Indicador visual del cambio de estado */}
            <div className="estado-cambio-info">
              <div className="cambio-indicador">
                <span className="estado-actual">{estadoActual}</span>
                <span className="flecha-cambio">→</span>
                <span className="estado-objetivo">{estadoObjetivo}</span>
              </div>
              <p className="cambio-descripcion">
                Se cambiará el estado del manifiesto de <strong>{estadoActual}</strong> a <strong>{estadoObjetivo}</strong>
              </p>
            </div>
          </div>

          {/* Sección de botones de acción */}
          <div className="cambiar-estado-modal-actions">
            <button
              className="btn-aplicar-cambio"
              onClick={handleAplicarCambio}
            >
              <span className="btn-icon">✅</span>
              <span className="btn-text">Aplicar Cambio</span>
            </button>
            <button className="btn-cancelar" onClick={onClose}>
              <span className="btn-icon">❌</span>
              <span className="btn-text">Cancelar</span>
            </button>
          </div>
        </div>

        {/* Modal de mensaje de éxito */}
        {showSuccessMessage && (
          <div className="success-message-overlay" onClick={handleOverlayClick}>
            <div className="success-message-modal">
              <div className="success-icon">✅</div>
              <h3>Cambio Exitoso</h3>
              <p>{successMessage}</p>
              <button className="btn-aceptar" onClick={handleAceptarSuccess}>
                <span className="btn-icon">👍</span>
                <span className="btn-text">Aceptar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CambiarEstadoModal;