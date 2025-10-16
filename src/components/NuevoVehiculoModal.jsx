import React, { useState, useEffect } from 'react';
import './NuevoVehiculoModal.css';

const NuevoVehiculoModal = ({ isOpen, onClose, editData = null }) => {
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    nombre: '',
    anotacion: ''
  });
  
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);
  
  // Determinar si estamos en modo edición
  const isEditMode = editData !== null;

  // Cargar datos cuando se abre en modo edición
  useEffect(() => {
    if (isEditMode && editData) {
      setFormData({
        placa: editData.placa || '',
        marca: editData.marca || '',
        nombre: editData.nombre || '',
        anotacion: editData.anotacion || ''
      });
    } else {
      // Limpiar formulario en modo nuevo
      setFormData({
        placa: '',
        marca: '',
        nombre: '',
        anotacion: ''
      });
    }
  }, [isEditMode, editData, isOpen]);

  // Limpiar imágenes temporales cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Limpiar imágenes temporales cuando el modal se cierra
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000); // Ocultar después de 4 segundos
  };

  const handleGuardar = async () => {
    // Validar campos requeridos
    if (!formData.placa.trim() || !formData.marca.trim() || !formData.nombre.trim()) {
      showNotification('Por favor complete todos los campos requeridos (Placa, Marca y Nombre)', 'error');
      return;
    }

    try {
      const url = isEditMode 
        ? `http://localhost:4000/api/vehiculos/${formData.placa}`
        : 'http://localhost:4000/api/vehiculos';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        const message = isEditMode 
          ? 'Vehículo actualizado exitosamente' 
          : 'Vehículo guardado exitosamente';
        showNotification(message, 'success');
        
        if (isEditMode) {
          // En modo edición: NO limpiar campos y poner foco en marca
          setTimeout(() => {
            const marcaInput = document.getElementById('marca');
            if (marcaInput) marcaInput.focus();
          }, 100);
        } else {
          // En modo nuevo: limpiar el formulario
          setFormData({
            placa: '',
            marca: '',
            nombre: '',
            anotacion: ''
          });
        }
      } else {
        showNotification('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      showNotification('Error de conexión al guardar el vehículo', 'error');
    }
  };

  return (
    <div className="nuevo-vehiculo-modal-overlay">
      <div className="nuevo-vehiculo-modal">
        <div className="nuevo-vehiculo-modal-header">
          <h2 className="nuevo-vehiculo-modal-title">
            {isEditMode ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button className="nuevo-vehiculo-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Notificación */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-icon">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              <span className="notification-message">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="nuevo-vehiculo-modal-body">
          <div className="form-container">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="placa">Placa:</label>
                <input
                  type="text"
                  id="placa"
                  maxLength="10"
                  value={formData.placa}
                  onChange={(e) => handleInputChange('placa', e.target.value)}
                  className={`form-input ${isEditMode ? 'readonly' : ''}`}
                  readOnly={isEditMode}
                />
              </div>
              <div className="form-group">
                <label htmlFor="marca">Marca:</label>
                <input
                  type="text"
                  id="marca"
                  maxLength="20"
                  value={formData.marca}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="anotacion">Anotación:</label>
                <textarea
                  id="anotacion"
                  maxLength="500"
                  rows="4"
                  value={formData.anotacion}
                  onChange={(e) => handleInputChange('anotacion', e.target.value)}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="form-buttons">
              <button 
                className="btn-guardar"
                onClick={handleGuardar}
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoVehiculoModal;
