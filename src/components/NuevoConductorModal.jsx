import React, { useState, useEffect } from 'react';

// NuevoConductorModal — minimal, validated component
export default function NuevoConductorModal({ isOpen, onClose, editData = null }) {
  const [formData, setFormData] = useState({ codigo_chofer: '', nombre: '', cedula: '', telefonos: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        codigo_chofer: editData.codigo_chofer || '',
        nombre: editData.nombre || '',
        cedula: editData.cedula || '',
        telefonos: editData.telefonos || ''
      });
    }
  }, [editData]);

  const onChange = (k) => (e) => setFormData(prev => ({ ...prev, [k]: e.target.value }));

  const onSave = async () => {
    if (!formData.codigo_chofer || !formData.nombre) {
      setNotification({ type: 'error', message: 'Código y nombre son requeridos' });
      return;
    }
    try {
      const res = await fetch('http://localhost:4000/api/chofer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (res.ok) setNotification({ type: 'success', message: 'Guardado' });
      else setNotification({ type: 'error', message: 'Error al guardar' });
    } catch {
      setNotification({ type: 'error', message: 'Error de conexión' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nuevo-conductor-modal-overlay">
      <div className="nuevo-conductor-modal">
        <div className="nuevo-conductor-modal-header">
          <h2>{editData ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="nuevo-conductor-modal-body">
          <label htmlFor="codigo">Código</label>
          <input id="codigo" value={formData.codigo_chofer} onChange={onChange('codigo_chofer')} />

          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" value={formData.nombre} onChange={onChange('nombre')} />

          <label htmlFor="cedula">Cédula</label>
          <input id="cedula" value={formData.cedula} onChange={onChange('cedula')} />

          <label htmlFor="telefonos">Teléfonos</label>
          <input id="telefonos" value={formData.telefonos} onChange={onChange('telefonos')} />

          <div style={{ marginTop: 12 }}>
            <button onClick={onSave}>Guardar</button>
            <button onClick={onClose} style={{ marginLeft: 8 }}>Cancelar</button>
          </div>

          {notification && <div className={`notification ${notification.type}`}>{notification.message}</div>}
        </div>
      </div>
    </div>
  );
}
