import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Simple toast-like flash
export function showGlobalFlash(type, message, duration = 3000) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function Flash() {
    useEffect(() => {
      const t = setTimeout(() => {
        try { root.unmount(); } catch (err) { console.error('flash unmount error', err); }
        if (container.parentNode) container.parentNode.removeChild(container);
      }, duration);
      return () => {
        clearTimeout(t);
        try { root.unmount(); } catch (err) { console.error('flash unmount error', err); }
        if (container.parentNode) container.parentNode.removeChild(container);
      };
    }, []);

    return (
      <div className="flash-modal-overlay">
        <div className={`flash-modal ${type === 'success' ? 'success' : 'error'}`}>
          {message}
        </div>
      </div>
    );
  }

  root.render(React.createElement(Flash));
}

// Alert modal (larger, with title)
export function showGlobalAlert({ title = '', message = '', type = 'error', duration = 5000 } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function Alert() {
    useEffect(() => {
      const t = setTimeout(() => {
        try { root.unmount(); } catch (err) { console.error('alert unmount error', err); }
        if (container.parentNode) container.parentNode.removeChild(container);
      }, duration);
      return () => {
        clearTimeout(t);
        try { root.unmount(); } catch (err) { console.error('alert unmount error', err); }
        if (container.parentNode) container.parentNode.removeChild(container);
      };
    }, []);

    return (
      <div className="flash-modal-overlay">
        <div className={`flash-modal alert ${type === 'success' ? 'success' : 'error'}`}>
          <div className="modal-title">{title}</div>
          <div className="modal-body">{message}</div>
        </div>
      </div>
    );
  }

  root.render(React.createElement(Alert));
}

// Confirm modal returns a Promise<boolean>
export function showGlobalConfirm({ title = 'Confirmar', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  return new Promise((resolve) => {
    function Confirm() {
      useEffect(() => {
        return () => {
          try { root.unmount(); } catch (err) { console.error('confirm unmount error', err); }
          if (container.parentNode) container.parentNode.removeChild(container);
        };
      }, []);

      const onConfirm = () => {
        resolve(true);
        try {
          root.unmount();
        } catch (err) {
          console.error('confirm unmount error', err);
        }
        if (container.parentNode) container.parentNode.removeChild(container);
      };
      const onCancel = () => {
        resolve(false);
        try {
          root.unmount();
        } catch (err) {
          console.error('confirm unmount error', err);
        }
        if (container.parentNode) container.parentNode.removeChild(container);
      };

      return (
        <div className="flash-modal-overlay">
          <div className="flash-modal confirm">
            <div className="modal-title">{title}</div>
            <div className="modal-body">{message}</div>
            <div className="modal-actions">
              <button className="btn-action btn-eliminar" onClick={onConfirm}>🗑️ {confirmText}</button>
              <button className="btn-action btn-editar" onClick={onCancel}>✖️ {cancelText}</button>
            </div>
          </div>
        </div>
      );
    }

    root.render(React.createElement(Confirm));
  });
}

export default showGlobalFlash;
