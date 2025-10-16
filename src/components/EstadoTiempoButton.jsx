import React, { useState, useEffect } from 'react';
import EstadoTiempoModal from './EstadoTiempoModal';
import './EstadoTiempoButton.css';

const EstadoTiempoButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Emitir evento cuando el modal se abre o cierra
  useEffect(() => {
    const evento = new CustomEvent('estado-tiempo-modal-changed', { 
      detail: { isOpen } 
    });
    window.dispatchEvent(evento);
  }, [isOpen]);

  return (
    <div className="estado-tiempo-btn-container">
      <button 
        className="estado-tiempo-btn" 
        onClick={handleToggle}
        title="Abrir estado del tiempo"
      >
        <span className="et-btn-icon">🌤️</span>
        <span className="et-btn-text">Estado del Tiempo</span>
      </button>

      {isOpen && <EstadoTiempoModal onClose={handleClose} />}
    </div>
  );
};

export default EstadoTiempoButton;
