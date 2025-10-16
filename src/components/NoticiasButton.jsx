import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import NoticiasModal from './NoticiasModal';
import './NoticiasButton.css';

const NoticiasButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Controla la visibilidad del botón

  const handleToggle = () => {
    console.log('📰 Toggle Noticias Modal - Estado actual:', isOpen, '→ Nuevo estado:', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    console.log('📰 Cerrando Noticias Modal');
    setIsOpen(false);
  };

  // Escuchar eventos del modal de Estado del Tiempo
  useEffect(() => {
    const handleEstadoTiempoChange = (event) => {
      const { isOpen: estadoTiempoAbierto } = event.detail;
      console.log('📰 Estado del Tiempo modal cambió:', estadoTiempoAbierto);
      setIsVisible(!estadoTiempoAbierto); // Ocultar botón cuando Estado del Tiempo está abierto
    };

    window.addEventListener('estado-tiempo-modal-changed', handleEstadoTiempoChange);

    return () => {
      window.removeEventListener('estado-tiempo-modal-changed', handleEstadoTiempoChange);
    };
  }, []);

  console.log('📰 NoticiasButton renderizado - isOpen:', isOpen, 'isVisible:', isVisible);

  // Si el botón no debe ser visible, no renderizar nada
  if (!isVisible) {
    return null;
  }

  return (
    <div className="noticias-btn-container">
      <button 
        className="noticias-btn" 
        onClick={handleToggle}
        title="Ver noticias recientes"
      >
        <span className="noticias-btn-icon">📰</span>
        <span className="noticias-btn-text">Noticias</span>
      </button>

      {isOpen && ReactDOM.createPortal(
        <NoticiasModal onClose={handleClose} />,
        document.body
      )}
    </div>
  );
};

export default NoticiasButton;
