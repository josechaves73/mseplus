import React from 'react';
import './ConfirmDeleteModal.css';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType = "elemento" }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-container">
        {/* Header */}
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon">
            <span className="warning-icon">⚠️</span>
          </div>
          <h3>Confirmar Eliminación</h3>
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <p className="confirm-message">
            ¿Está seguro de que desea eliminar el {itemType}:
          </p>
          <p className="confirm-item-name">
            "<strong>{itemName}</strong>"
          </p>
          <p className="confirm-warning">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Footer con botones */}
        <div className="confirm-modal-footer">
          <button 
            className="confirm-btn-cancel"
            onClick={handleCancel}
          >
            <span className="btn-icon">✕</span>
            Cancelar
          </button>
          <button 
            className="confirm-btn-delete"
            onClick={handleConfirm}
          >
            <span className="btn-icon">🗑️</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
