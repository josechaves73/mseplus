import React, { useState, useEffect, useRef, useCallback } from 'react';
import MensajeModal from './MensajeModal';
import './NuevoClienteModal.css';

const NuevoClienteModal = ({ isOpen, onClose, editData = null }) => {

  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    dire: '',
    telefonos: '',
    email: '',
    contacto1: '',
    comenta: '',
    contacto2: '',
    contacto3: '',
    email2: ''
  });

  // Estado para notificaciones con MensajeModal
  const [mensajeModal, setMensajeModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onAccept: null
  });

  // Estado para controlar cambios en modo edición
  const [originalData, setOriginalData] = useState({});

  // Estados para validación de emails
  const [emailValidation, setEmailValidation] = useState({
    email: { isValid: true, message: '' },
    email2: { isValid: true, message: '' }
  });

  // Referencia para el campo nombre (para foco automático)
  const nombreInputRef = useRef(null);

  // Determinar si estamos en modo edición
  const isEditMode = editData !== null;

  // Generar código automáticamente al abrir modal en modo creación
  useEffect(() => {
    if (isOpen && !isEditMode) {
      generateNextCode();
    }
  }, [isOpen, isEditMode]);

  // Reiniciar estado del modal de notificación al abrir el modal principal
  useEffect(() => {
    if (isOpen) {
      setMensajeModal({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onAccept: null
      });
    }
  }, [isOpen]);

  // Dar foco al campo nombre al abrir el modal
  useEffect(() => {
    if (isOpen && nombreInputRef.current) {
      setTimeout(() => {
        nombreInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && !isEditMode) {
      setFormData({
        codigo: '',
        nombre: '',
        dire: '',
        telefonos: '',
        email: '',
        contacto1: '',
        comenta: '',
        contacto2: '',
        contacto3: '',
        email2: ''
      });
    }
  }, [isOpen, isEditMode]);

  // Cargar datos en modo edición
  useEffect(() => {
    if (isEditMode && editData) {
      const editFormData = {
        codigo: editData.codigo || '',
        nombre: editData.nombre || '',
        dire: editData.dire || '',
        telefonos: editData.telefonos || '',
        email: editData.email || '',
        contacto1: editData.contacto1 || '',
        comenta: editData.comenta || '',
        contacto2: editData.contacto2 || '',
        contacto3: editData.contacto3 || '',
        email2: editData.email2 || ''
      };
      setFormData(editFormData);
      setOriginalData(editFormData); // Guardar datos originales para comparación
    }
  }, [isEditMode, editData]);

  // Función para validar email (simplificada)
  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return { isValid: true, message: '' }; // Email vacío es válido (opcional)
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      message: isValid ? '' : 'Formato de email inválido. Debe contener @'
    };
  };



  // Función para generar el siguiente código automáticamente
  const generateNextCode = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/clientes/next-code');
      if (response.ok) {
        const data = await response.json();
        const nextCode = data.nextCode || 1;
        setFormData(prev => ({
          ...prev,
          codigo: nextCode.toString()
        }));
      } else {
        // Si falla la API, usar código básico
        setFormData(prev => ({
          ...prev,
          codigo: '1'
        }));
      }
    } catch (error) {
      console.error('Error generando código:', error);
      setFormData(prev => ({
        ...prev,
        codigo: '1'
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validar emails en tiempo real
    if (field === 'email' || field === 'email2') {
      const validation = validateEmail(value);
      setEmailValidation(prev => ({
        ...prev,
        [field]: validation
      }));
    }
  };

  // Función para preparar el formulario para crear un nuevo cliente
  const prepareNewClient = useCallback(async () => {
    try {
      // Generar nuevo código
      await generateNextCode();
      
      // Limpiar campos del formulario (excepto código que ya se generó)
      setFormData(prev => ({
        ...prev,
        nombre: '',
        dire: '',
        telefonos: '',
        email: '',
        contacto1: '',
        comenta: '',
        contacto2: '',
        contacto3: '',
        email2: ''
      }));
      
      // Limpiar datos originales para modo creación
      setOriginalData({});
      
      // Dar foco al campo nombre después de un breve delay
      setTimeout(() => {
        if (nombreInputRef.current) {
          nombreInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error al preparar nuevo cliente:', error);
    }
  }, []);

  // Función para mostrar notificaciones con MensajeModal
  const showNotification = useCallback((message, type = 'info') => {
    const title = type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información';

    const newMensajeModal = {
      isOpen: true,
      title,
      message,
      type,
      onAccept: () => {
        setMensajeModal(prev => ({ ...prev, isOpen: false }));
        // Cerrar modal después de aceptar
        setTimeout(() => {
          if (isEditMode) {
            onClose(false);
          } else {
            prepareNewClient();
            onClose(true);
          }
        }, 100);
      }
    };

    setMensajeModal(newMensajeModal);
  }, [isEditMode, onClose, prepareNewClient]);

  const handleGuardar = async () => {
    // Validar campos requeridos
    if (!formData.nombre) {
      showNotification('El campo Nombre del Cliente es requerido', 'error');
      return;
    }

    try {
      // Preparar datos a enviar
      let dataToSend = {};

      if (isEditMode) {
        // Modo edición: solo enviar campos que cambiaron (excluyendo código)
        const changedFields = {};
        Object.keys(formData).forEach(key => {
          if (key !== 'codigo' && formData[key] !== originalData[key]) {
            changedFields[key] = formData[key];
          }
        });

        // Si no hay cambios, no enviar nada
        if (Object.keys(changedFields).length === 0) {
          showNotification('No se detectaron cambios para guardar', 'error');
          return;
        }

        dataToSend = {
          ...changedFields,
          codigo: formData.codigo // Incluir código para identificar el registro
        };
      } else {
        // Modo creación: enviar todos los campos requeridos
        dataToSend = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          dire: formData.dire || '',
          telefonos: formData.telefonos || '',
          email: formData.email || '',
          contacto1: formData.contacto1 || '',
          comenta: formData.comenta || '',
          contacto2: formData.contacto2 || '',
          contacto3: formData.contacto3 || '',
          email2: formData.email2 || ''
        };
      }

      const url = 'http://localhost:4000/api/clientes';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification(isEditMode ? 'Cliente actualizado exitosamente' : 'Cliente guardado exitosamente', 'success');
      } else {
        // Error del servidor (código duplicado, etc.)
        showNotification(result.error || 'Error al guardar cliente', 'error');
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      showNotification('Error de conexión al guardar', 'error');
    }
  };

  // No renderizar el modal si no está abierto
  if (!isOpen) return null;

  return (
    <div>
      <div className="nuevo-cliente-modal-overlay">
        <div className="nuevo-cliente-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="nuevo-cliente-modal-header">
            <h2 className="nuevo-cliente-modal-title">Mantenimiento de Clientes</h2>
            <button className="nuevo-cliente-modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="nuevo-cliente-modal-body">
            {/* Formulario */}
            <div className="form-grid">
            <div className="form-group">
              <label htmlFor="codigo">Código de Cliente *</label>
              <input
                type="text"
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                placeholder="Código generado automáticamente"
                readOnly
                disabled={isEditMode} // No permitir cambiar código en edición
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre del Cliente *</label>
              <input
                type="text"
                id="nombre"
                ref={nombreInputRef}
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ingrese el nombre del cliente"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="dire">Dirección</label>
              <input
                type="text"
                id="dire"
                value={formData.dire}
                onChange={(e) => handleInputChange('dire', e.target.value)}
                placeholder="Ingrese la dirección del cliente"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefonos">Teléfonos</label>
              <input
                type="text"
                id="telefonos"
                value={formData.telefonos}
                onChange={(e) => handleInputChange('telefonos', e.target.value)}
                placeholder="Teléfonos principales"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="email-input-container">
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email principal"
                  className={`email-input ${!emailValidation.email.isValid ? 'invalid' : formData.email && emailValidation.email.isValid ? 'valid' : ''}`}
              />
              </div>
              {!emailValidation.email.isValid && (
                <span className="email-error-message">{emailValidation.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contacto1">Contacto 1</label>
              <input
                type="text"
                id="contacto1"
                value={formData.contacto1}
                onChange={(e) => handleInputChange('contacto1', e.target.value)}
                placeholder="Primer contacto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contacto2">Contacto 2</label>
              <input
                type="text"
                id="contacto2"
                value={formData.contacto2}
                onChange={(e) => handleInputChange('contacto2', e.target.value)}
                placeholder="Segundo contacto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contacto3">Contacto 3</label>
              <input
                type="text"
                id="contacto3"
                value={formData.contacto3}
                onChange={(e) => handleInputChange('contacto3', e.target.value)}
                placeholder="Tercer contacto"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email2">Email 2</label>
              <div className="email-input-container">
                <input
                  type="email"
                  id="email2"
                  value={formData.email2}
                  onChange={(e) => handleInputChange('email2', e.target.value)}
                  placeholder="Email secundario"
                  className={`email-input ${!emailValidation.email2.isValid ? 'invalid' : formData.email2 && emailValidation.email2.isValid ? 'valid' : ''}`}
              />
              </div>
              {!emailValidation.email2.isValid && (
                <span className="email-error-message">{emailValidation.email2.message}</span>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="comenta">Comentarios</label>
              <textarea
                id="comenta"
                value={formData.comenta}
                onChange={(e) => handleInputChange('comenta', e.target.value)}
                placeholder="Comentarios adicionales sobre el cliente"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="nuevo-cliente-modal-footer">
          <button className="btn-guardar" onClick={handleGuardar}>
            💾 {isEditMode ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>

    {/* Notificaciones con MensajeModal */}
    {console.log('🎯 Rendering MensajeModal with state:', mensajeModal)}
    <MensajeModal
      isOpen={mensajeModal.isOpen}
      onClose={() => {
        setMensajeModal(prev => ({ ...prev, isOpen: false }));
      }}
      title={mensajeModal.title}
      showCloseButton={false}
      buttons={[
        {
          label: 'Aceptar',
          onClick: mensajeModal.onAccept,
          className: 'btn-success'
        }
      ]}
    >
      <p style={{ textAlign: 'center', margin: 0 }}>{mensajeModal.message}</p>
    </MensajeModal>
    </div>
  );
};

export default NuevoClienteModal;