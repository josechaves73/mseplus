import React, { useState, useEffect } from 'react';
import './ManifiestoEditarNotaModal.css';
import MensajeModal from './MensajeModal';

const ManifiestoEditarNotaModal = ({ isOpen, onClose, manifiesto, onNotaUpdated }) => {
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar la nota actual cuando se abre el modal
  useEffect(() => {
    if (isOpen && manifiesto) {
      setNota(manifiesto.notas || '');
    }
  }, [isOpen, manifiesto]);

  // Función para mostrar mensajes usando MensajeModal
  const showMessageModal = (type, text) => {
    if (type === 'success') {
      setSuccessMessage(text);
      setShowSuccessModal(true);
    } else {
      setErrorMessage(text);
      setShowErrorModal(true);
    }
  };

  // Función para actualizar la nota
  const handleActualizarNota = async () => {
    if (!manifiesto || !manifiesto.numero) {
      showMessageModal('error', 'No se pudo identificar el manifiesto seleccionado');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/manifiestos/${manifiesto.numero}/nota`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nota: nota.trim() })
      });

      if (response.ok) {
        showMessageModal('success', 'Nota actualizada correctamente');
        // Llamar a la función de callback para actualizar la lista
        if (onNotaUpdated) {
          onNotaUpdated(manifiesto.numero, nota.trim());
        }
        // NO cerrar automáticamente el modal - dejar que el usuario lo cierre manualmente
      } else {
        const errorData = await response.json();
        showMessageModal('error', errorData.error || 'Error al actualizar la nota');
      }
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      showMessageModal('error', 'Error de conexión al actualizar la nota');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar modal (solo con la X)
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="manifiesto-editar-nota-modal-overlay">
        <div className="manifiesto-editar-nota-modal">
          <div className="manifiesto-editar-nota-modal-header">
            <h2 className="manifiesto-editar-nota-modal-title">Editar Nota de Manifiesto</h2>
            <button
              className="manifiesto-editar-nota-modal-close"
              onClick={handleClose}
              disabled={loading}
            >
              ✕
            </button>
          </div>

          <div className="manifiesto-editar-nota-modal-body">
            {/* Campo de solo lectura: Número de manifiesto */}
            <div className="form-group">
              <label className="form-label">Número de Manifiesto:</label>
              <input
                type="text"
                value={manifiesto?.numero || ''}
                readOnly
                className="form-input readonly"
              />
            </div>

            {/* Campo editable: Nota */}
            <div className="form-group">
              <label className="form-label">Nota:</label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ingrese la nota del manifiesto..."
                className="form-textarea"
                rows="4"
                disabled={loading}
              />
            </div>
          </div>

          <div className="manifiesto-editar-nota-modal-footer">
            <button
              className="btn-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="btn-save"
              onClick={handleActualizarNota}
              disabled={loading || !manifiesto}
            >
              {loading ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de éxito usando MensajeModal */}
      <MensajeModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Operación Exitosa"
        buttons={[
          {
            label: 'Aceptar',
            icon: '✅',
            onClick: () => setShowSuccessModal(false),
            className: 'btn-aceptar'
          }
        ]}
        size="small"
      >
        <p style={{ textAlign: 'center', margin: '20px 0' }}>{successMessage}</p>
      </MensajeModal>

      {/* Modal de error usando MensajeModal */}
      <MensajeModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        buttons={[
          {
            label: 'Entendido',
            icon: '⚠️',
            onClick: () => setShowErrorModal(false),
            className: 'btn-error'
          }
        ]}
        size="small"
      >
        <p style={{ textAlign: 'center', margin: '20px 0' }}>{errorMessage}</p>
      </MensajeModal>
    </>
  );
};

export default ManifiestoEditarNotaModal;
