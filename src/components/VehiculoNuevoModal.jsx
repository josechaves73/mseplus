import React, { useEffect, useState, useRef } from 'react';
import './VehiculoNuevoModal.css';
import MensajeModal from './MensajeModal';

const VehiculoNuevoModal = ({ isOpen, onClose, editData = null, onUpdated = () => {} }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Evitar que ESC cierre el modal: interceptamos y evitamos la acción
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    // Mantener scroll bloqueado en el fondo
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    nombre: '',
    anotacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const placaRef = useRef(null);

  // Prefill when opening in edit mode
  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        placa: editData.placa || '',
        marca: editData.marca || '',
        nombre: editData.nombre || '',
        anotacion: editData.anotacion || ''
      });
      // focus marca by default in edit mode
      setTimeout(() => {
        const marcaInput = document.getElementById('marca');
        if (marcaInput) marcaInput.focus();
      }, 100);
    } else if (isOpen && !editData) {
      // Clear form data when opening in NEW mode
      setFormData({
        placa: '',
        marca: '',
        nombre: '',
        anotacion: ''
      });
      // Focus on placa field when opening in NEW mode
      setTimeout(() => {
        if (placaRef.current) placaRef.current.focus();
      }, 100);
    }
  }, [isOpen, editData]);

  // Clear all notifications and modal states when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowSuccessModal(false);
      setShowErrorModal(false);
      setSuccessMessage('');
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGuardar = async () => {
    // Validar campos obligatorios
    const placa = (formData.placa || '').toString().trim();
    const marca = (formData.marca || '').toString().trim();
    const nombre = (formData.nombre || '').toString().trim();

    if (!placa || !marca || !nombre) {
      alert('Por favor complete los campos obligatorios: Placa, Marca, Nombre');
      return;
    }

    setLoading(true);

    try {
      if (!editData) {
        // Intentar crear el vehículo directamente
        const payload = {
          placa,
          marca,
          nombre,
          anotacion: formData.anotacion || ''
        };

        const saveRes = await fetch('/api/vehiculos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await saveRes.json().catch(() => null);

        if (saveRes.ok && result && result.success) {
          console.log('✅ Vehículo creado exitosamente');
          setShowSuccessModal(true);
          // Notificar padre para refrescar lista
          onUpdated();
          setLoading(false);
          // NO cerrar automáticamente el modal
        } else {
          // Verificar si es error de placa duplicada
          const errorMsg = (result && result.error) ? result.error : (result && result.message) ? result.message : 'Error al guardar vehículo';

          if (saveRes.status === 400 && (errorMsg.toLowerCase().includes('placa') || errorMsg.toLowerCase().includes('existe'))) {
            console.log('❌ Placa duplicada detectada, mostrando modal de error');
            setErrorMessage('Ya existe un vehículo con esa placa. Por favor, use una placa diferente.');
            setShowErrorModal(true);
            // Poner foco en placa
            if (placaRef.current) placaRef.current.focus();
            setLoading(false);
            return;
          } else {
            // Otro tipo de error de validación
            console.error('Error al guardar vehículo:', errorMsg);
            setErrorMessage(`Error de validación: ${errorMsg}`);
            setShowErrorModal(true);
            setLoading(false);
            return;
          }
        }
      } else {
        // Modo EDICIÓN: placa no se modifica; enviamos PUT y esperamos que el backend haga la transacción atómica (vehiculos + boletas)
        const placaEd = editData.placa;
        const payload = {
          marca,
          nombre,
          anotacion: formData.anotacion || ''
        };

        const updateRes = await fetch(`/api/vehiculos/${encodeURIComponent(placaEd)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const updateResult = await updateRes.json().catch(() => null);

        if (updateRes.ok && updateResult && updateResult.success) {
          // Mostrar cuántas boletas fueron actualizadas; mantener el modal abierto para que el usuario vea el mensaje
          const boletasUpdated = (typeof updateResult.boletasUpdated === 'number') ? updateResult.boletasUpdated : 0;
          setSuccessMessage(`Vehículo actualizado correctamente — boletas actualizadas: ${boletasUpdated}`);
          setShowSuccessModal(true);
          // Notificar al padre para que refresque la lista, pero NO cerrar el modal automáticamente
          onUpdated();
          setLoading(false);
        } else {
          const err = (updateResult && updateResult.error) ? updateResult.error : (updateResult && updateResult.message) ? updateResult.message : 'Error al actualizar vehículo';
          console.error('Error al actualizar vehículo:', err);
          setErrorMessage(`Error al actualizar vehículo: ${err}`);
          setShowErrorModal(true);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error en handleGuardar:', error);
      setErrorMessage('Error inesperado al procesar la solicitud. Por favor, inténtelo de nuevo.');
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  return (
    <div className="vehiculo-nuevo-overlay">
      <div className="vehiculo-nuevo-modal" role="dialog" aria-modal="true">
        <div className="vehiculo-nuevo-header">
          <h2 className="vehiculo-nuevo-title"> Mantenimiento de Vehículos </h2>
          <button
            className="vehiculo-nuevo-close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="vehiculo-nuevo-body">
          <div className="vehiculo-nuevo-form">
            <div className="form-row">
              <label htmlFor="placa">Placa</label>
              <input
                ref={placaRef}
                className="input-placa"
                id="placa"
                type="text"
                value={formData.placa}
                onChange={handleChange('placa')}
                maxLength={10}
                readOnly={!!editData}
              />
            </div>
            <div className="form-row">
              <label htmlFor="marca">Marca</label>
              <input className="input-marca" id="marca" type="text" value={formData.marca} onChange={handleChange('marca')} maxLength={20} />
            </div>
            <div className="form-row">
              <label htmlFor="nombre">Nombre</label>
              <input className="input-nombre" id="nombre" type="text" value={formData.nombre} onChange={handleChange('nombre')} maxLength={20} />
            </div>
            <div className="form-row">
              <label htmlFor="anotacion">Anotaciones</label>
              <textarea className="input-anotacion" id="anotacion" value={formData.anotacion} onChange={handleChange('anotacion')} rows={6} maxLength={500} />
            </div>

            <div className="form-actions">
              <button className="btn-guardar" type="button" onClick={handleGuardar} disabled={loading}>
                💾 {loading ? (editData ? 'Actualizando...' : 'Guardando...') : (editData ? 'ACTUALIZAR' : 'GUARDAR')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal using MensajeModal */}
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

      {/* Error modal for duplicate placa */}
      <MensajeModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error de Validación"
        buttons={[
          {
            label: 'Entendido',
            icon: '⚠️',
            onClick: () => {
              setShowErrorModal(false);
            },
            className: 'btn-error'
          }
        ]}
        size="small"
      >
        <p style={{ textAlign: 'center', margin: '20px 0' }}>{errorMessage}</p>
      </MensajeModal>
    </div>
  );
};

export default VehiculoNuevoModal;
