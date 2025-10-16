import React from 'react';
import { createPortal } from 'react-dom';
import './MensajeModal.css';

const MensajeModal = ({
  isOpen,
  onClose,
  title,
  children,
  buttons = [],
  size = 'medium', // small, medium, large
  showCloseButton = true,
  loading = false,
  className = ''
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="mensaje-modal-overlay" 
      onClick={handleOverlayClick}
    >
      <div 
        className={`mensaje-modal mensaje-modal-${size} ${className}`}
      >
        <>
          {/* Header */}
          <div className="mensaje-modal-header">
            <h2 className="mensaje-modal-title">
              {title && (
                <>
                  <span className="mensaje-modal-icon">📊</span>
                  {title}
                </>
              )}
            </h2>
            {showCloseButton && onClose && (
              <button className="mensaje-modal-close" onClick={onClose}>
                ✕
              </button>
            )}
          </div>

          {/* Body */}
          <div className="mensaje-modal-body">
            {children}
          </div>

          {/* Footer con botones */}
          {buttons && buttons.length > 0 && (
            <div className="mensaje-modal-footer">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  className={`mensaje-modal-btn ${button.className || ''}`}
                  onClick={button.onClick}
                  disabled={loading || button.disabled}
                  type={button.type || 'button'}
                >
                  {button.icon && <span className="btn-icon">{button.icon}</span>}
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );

  // Render via portal so the modal is appended to document.body and avoids parent stacking contexts
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default MensajeModal;