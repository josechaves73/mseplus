import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './FloatingMessage.css';

// FloatingMessage: now stays visible until the user clicks Aceptar.
const FloatingMessage = ({ message, type = 'info', isVisible, onClose, onCloseAction, action }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible && message) {
      // show immediately
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isVisible, message]);

  if (!message || !show) return null;

  const floatingMessageElement = (
    <div className="floating-message-overlay">
      <div className={`floating-message ${type} ${show ? 'show' : ''}`} role="dialog" aria-live="polite">
        {/* Header */}
        <div className="floating-message-header">
          <h2 className="floating-message-title">
            <span className="floating-message-icon">
              {type === 'success' && '✓'}
              {type === 'error' && '✕'}
              {type === 'warning' && '⚠'}
              {type === 'info' && 'ℹ'}
            </span>
            {type === 'success' && 'Éxito'}
            {type === 'error' && 'Error'}
            {type === 'warning' && 'Advertencia'}
            {type === 'info' && 'Información'}
          </h2>
        </div>

        {/* Body */}
        <div className="floating-message-body">
          <p>{message}</p>
        </div>

        {/* Footer */}
        <div className="floating-message-actions">
          {action === 'aplicar_ajustes' ? (
            <button className="floating-message-btn" onClick={() => { setShow(false); if (onClose) onClose(); if (onCloseAction) onCloseAction(); }}>Cerrar</button>
          ) : (
            <button className="floating-message-btn" onClick={() => { setShow(false); if (onClose) onClose(); }}>Aceptar</button>
          )}
        </div>
      </div>
    </div>
  );

  // Render using portal to avoid z-index issues
  return createPortal(floatingMessageElement, document.body);
};

export default FloatingMessage;
