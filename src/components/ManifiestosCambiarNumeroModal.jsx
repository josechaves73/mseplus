import React, { useState } from 'react';
import './ManifiestosCambiarNumeroModal.css';

const ManifiestosCambiarNumeroModal = ({ isOpen, onClose, manifiesto, onCambioAplicado }) => {
  const [nuevoNumero, setNuevoNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !manifiesto) return null;

  const handleAplicar = async () => {
    if (!nuevoNumero || nuevoNumero.trim() === '') {
      setWarning('Debe ingresar un nuevo número');
      return;
    }

    setLoading(true);
    setWarning('');
    try {
      const resp = await fetch(`http://localhost:4000/api/manifiestos/${manifiesto.numero}/cambiar-numero`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoNumero: nuevoNumero.trim() })
      });

      const data = await resp.json();
      if (!resp.ok) {
        // Si el número ya existe, mostrar advertencia flotante
        setWarning(data.error || 'Error al aplicar el cambio');
        setLoading(false);
        return;
      }

      // Éxito
      setSuccess(data.message || 'Cambio de número exitoso');
      setLoading(false);
    } catch (err) {
      console.error('Error al aplicar cambio:', err);
      setWarning('Error del servidor al aplicar el cambio');
      setLoading(false);
    }
  };

  const handleAceptarSuccess = () => {
    setSuccess('');
    if (onCambioAplicado) onCambioAplicado();
    onClose();
  };

  return (
    <div className="mcnum-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="mcnum-modal">
        <div className="mcnum-header">
          <h2>Cambiar Número de Manifiesto</h2>
          <button className="mcnum-close" onClick={onClose}>✕</button>
        </div>

        <div className="mcnum-body">
          <div className="form-row">
            <label>Número actual:</label>
            <input type="text" value={manifiesto.numero || ''} readOnly className="readonly" />
          </div>

          <div className="form-row">
            <label>Nuevo número:</label>
            <input
              type="text"
              value={nuevoNumero}
              onChange={(e) => setNuevoNumero(e.target.value)}
              placeholder="Ingrese nuevo número"
            />
          </div>

          <div className="mcnum-actions">
            <button className="btn-apply" onClick={handleAplicar} disabled={loading}>
              <span className="btn-icon">✅</span>
              <span className="btn-text">{loading ? 'Aplicando...' : 'Aplicar Cambio'}</span>
            </button>
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              <span className="btn-icon">❌</span>
              <span className="btn-text">Cancelar</span>
            </button>
          </div>

          {/* Mensajes flotantes */}
          {warning && (
            <div className="mcnum-warning-overlay">
              <div className="mcnum-warning">
                <p>{warning}</p>
                <button onClick={() => setWarning('')}>
                  <span className="btn-icon">⚠️</span>
                  <span className="btn-text">Aceptar</span>
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mcnum-success-overlay">
              <div className="mcnum-success">
                <p>{success}</p>
                <button onClick={handleAceptarSuccess}>
                  <span className="btn-icon">👍</span>
                  <span className="btn-text">Aceptar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManifiestosCambiarNumeroModal;
