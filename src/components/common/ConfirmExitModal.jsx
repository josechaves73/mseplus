import React from 'react';
import './ConfirmExitModal.css';

const ConfirmExitModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-exit-overlay">
      <div className="confirm-exit-container">
        <div className="confirm-exit-header">
          <h3>Desea Salir... ?</h3>
        </div>
        <div className="confirm-exit-body">
          <p>Si sale ahora se perderán los cambios no guardados.</p>
        </div>
        <div className="confirm-exit-footer">
          <button className="btn-exit-no" onClick={onClose}><span className="btn-icon">✕</span> No</button>
          <button className="btn-exit-si" onClick={() => { onConfirm && onConfirm(); onClose(); }}><span className="btn-icon">✅</span> Si</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmExitModal;
