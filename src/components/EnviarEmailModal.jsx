import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EnviarEmailModal.css';
import FloatingMessage from './common/FloatingMessage';
import ClienteSelectorModal from './ClienteSelectorModal';

const EnviarEmailModal = ({ isOpen, onClose, clientePreseleccionado = null, emailPreseleccionado = null }) => {
  console.log('📧 EnviarEmailModal - isOpen:', isOpen, 'cliente:', clientePreseleccionado, 'email:', emailPreseleccionado);

  // Estados principales
  const [cuentasEmail, setCuentasEmail] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    cuentaEnvio: '', // ID de la cuenta de email a usar
    para: emailPreseleccionado || '',
    cc: '',
    cco: '',
    asunto: '',
    cuerpo: '',
    plantillaSeleccionada: ''
  });

  // Estados de UI
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clientePreseleccionado);
  const [floatMsg, setFloatMsg] = useState({ message: '', type: 'info', isVisible: false });

  // Referencias
  const paraInputRef = useRef(null);

  // Función para mostrar notificaciones
  const showNotification = useCallback((message, type = 'info') => {
    setFloatMsg({ message, type, isVisible: true });
  }, []);

  // Función para obtener cuentas de email
  const fetchCuentasEmail = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/api/email-accounts');
      if (!response.ok) {
        throw new Error('Error al obtener cuentas de email');
      }
      const data = await response.json();
      const cuentasActivas = data.accounts || [];
      setCuentasEmail(cuentasActivas);
      
      // Seleccionar cuenta predeterminada automáticamente
      const cuentaPredeterminada = cuentasActivas.find(cuenta => cuenta.is_default);
      if (cuentaPredeterminada) {
        setFormData(prev => ({
          ...prev,
          cuentaEnvio: cuentaPredeterminada.id.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      showNotification('Error al cargar las cuentas de email', 'error');
    }
  }, [showNotification]);

  // Función para obtener plantillas
  const fetchPlantillas = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/api/email-templates');
      if (!response.ok) {
        throw new Error('Error al obtener plantillas');
      }
      const data = await response.json();
      setPlantillas(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('Error al cargar las plantillas', 'error');
    }
  }, [showNotification]);

  // Cargar cuentas de email y plantillas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchCuentasEmail();
      fetchPlantillas();
      
      // Establecer datos preseleccionados
      if (clientePreseleccionado && emailPreseleccionado) {
        setFormData(prev => ({
          ...prev,
          para: emailPreseleccionado,
          asunto: `Contacto desde MSEPlus - Cliente: ${clientePreseleccionado.nombre || 'Cliente'}`
        }));
        setClienteSeleccionado(clientePreseleccionado);
      }

      // Dar foco al campo apropiado
      setTimeout(() => {
        if (paraInputRef.current && !emailPreseleccionado) {
          paraInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, clientePreseleccionado, emailPreseleccionado, fetchCuentasEmail, fetchPlantillas]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        cuentaEnvio: '',
        para: '',
        cc: '',
        cco: '',
        asunto: '',
        cuerpo: '',
        plantillaSeleccionada: ''
      });
      setClienteSeleccionado(null);
      setShowClienteSelector(false);
    }
  }, [isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  // Función para manejar selección de cliente
  const handleClienteSeleccionado = (cliente, emailSeleccionado) => {
    setClienteSeleccionado(cliente);
    setFormData(prev => ({
      ...prev,
      para: emailSeleccionado,
      asunto: `Contacto desde MSEPlus - Cliente: ${cliente.nombre}`
    }));
    showNotification(`Cliente "${cliente.nombre}" seleccionado`, 'success');
  };
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para seleccionar plantilla
  const handleSeleccionarPlantilla = (plantilla) => {
    const variables = {
      cliente_nombre: clienteSeleccionado?.nombre || '[Nombre Cliente]',
      cliente_codigo: clienteSeleccionado?.codigo || '[Código Cliente]',
      usuario_nombre: 'Usuario MSEPlus',
      fecha_actual: new Date().toLocaleDateString('es-ES')
    };

    // Reemplazar variables en asunto y cuerpo
    let asunto = plantilla.subject_template || '';
    let cuerpo = plantilla.body_template || '';

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      asunto = asunto.replace(regex, value);
      cuerpo = cuerpo.replace(regex, value);
    });

    setFormData(prev => ({
      ...prev,
      asunto,
      cuerpo,
      plantillaSeleccionada: plantilla.id.toString()
    }));

    showNotification(`Plantilla "${plantilla.nombre}" aplicada`, 'success');
  };

  // Función para enviar email
  const handleEnviarEmail = async () => {
    try {
      // Validaciones
      if (!formData.cuentaEnvio) {
        showNotification('Selecciona una cuenta de envío', 'error');
        return;
      }
      if (!formData.para.trim()) {
        showNotification('El campo "Para" es requerido', 'error');
        return;
      }
      if (!formData.asunto.trim()) {
        showNotification('El asunto es requerido', 'error');
        return;
      }
      if (!formData.cuerpo.trim()) {
        showNotification('El cuerpo del mensaje es requerido', 'error');
        return;
      }

      setEnviando(true);
      showNotification('Enviando email...', 'info');

      const emailData = {
        cuentaId: parseInt(formData.cuentaEnvio),
        para: formData.para,
        cc: formData.cc || null,
        cco: formData.cco || null,
        asunto: formData.asunto,
        cuerpo: formData.cuerpo,
        clienteCodigo: clienteSeleccionado?.codigo || null
      };

      const response = await fetch('http://localhost:4000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar email');
      }

      showNotification('✅ Email enviado exitosamente', 'success');
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error al enviar email:', error);
      showNotification(`Error al enviar email: ${error.message}`, 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Función para limpiar formulario
  const handleLimpiarFormulario = () => {
    setFormData({
      cuentaEnvio: formData.cuentaEnvio, // Mantener cuenta seleccionada
      para: '',
      cc: '',
      cco: '',
      asunto: '',
      cuerpo: '',
      plantillaSeleccionada: ''
    });
    setClienteSeleccionado(null);
  };

  return (
    <div className="enviar-email-modal-overlay" onClick={onClose}>
      <div className="enviar-email-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="enviar-email-modal-header">
          <h2 className="enviar-email-modal-title">📧 Enviar Email</h2>
          <button className="enviar-email-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="enviar-email-modal-body">
          {/* Sección de configuración */}
          <div className="email-config-section">
            <div className="config-row">
              {/* Cuenta de envío */}
              <div className="form-group">
                <label htmlFor="cuentaEnvio">Enviar desde</label>
                <select
                  id="cuentaEnvio"
                  value={formData.cuentaEnvio}
                  onChange={(e) => handleInputChange('cuentaEnvio', e.target.value)}
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentasEmail.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre} ({cuenta.email})
                      {cuenta.is_default && ' - Predeterminada'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plantilla */}
              <div className="form-group">
                <label htmlFor="plantilla">Plantilla</label>
                <select
                  id="plantilla"
                  value={formData.plantillaSeleccionada}
                  onChange={(e) => {
                    const plantillaId = e.target.value;
                    if (plantillaId) {
                      const plantilla = plantillas.find(p => p.id.toString() === plantillaId);
                      if (plantilla) {
                        handleSeleccionarPlantilla(plantilla);
                      }
                    }
                  }}
                >
                  <option value="">Sin plantilla</option>
                  {plantillas.map((plantilla) => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección de destinatarios */}
          <div className="destinatarios-section">
            {/* Para */}
            <div className="form-group">
              <label htmlFor="para">Para *</label>
              <div className="para-input-container">
                <input
                  ref={paraInputRef}
                  type="email"
                  id="para"
                  value={formData.para}
                  onChange={(e) => handleInputChange('para', e.target.value)}
                  placeholder="destinatario@email.com"
                />
                <button
                  type="button"
                  className="btn-selector-cliente"
                  onClick={() => setShowClienteSelector(true)}
                  title="Seleccionar cliente"
                >
                  👥
                </button>
              </div>
              {clienteSeleccionado && (
                <div className="cliente-seleccionado">
                  📋 Cliente: <strong>{clienteSeleccionado.nombre}</strong> ({clienteSeleccionado.codigo})
                </div>
              )}
            </div>

            {/* CC */}
            <div className="form-group">
              <label htmlFor="cc">CC</label>
              <input
                type="email"
                id="cc"
                value={formData.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                placeholder="copia@email.com (opcional)"
              />
            </div>

            {/* CCO */}
            <div className="form-group">
              <label htmlFor="cco">CCO</label>
              <input
                type="email"
                id="cco"
                value={formData.cco}
                onChange={(e) => handleInputChange('cco', e.target.value)}
                placeholder="copia-oculta@email.com (opcional)"
              />
            </div>
          </div>

          {/* Sección de contenido */}
          <div className="contenido-section">
            {/* Asunto */}
            <div className="form-group">
              <label htmlFor="asunto">Asunto *</label>
              <input
                type="text"
                id="asunto"
                value={formData.asunto}
                onChange={(e) => handleInputChange('asunto', e.target.value)}
                placeholder="Asunto del email"
              />
            </div>

            {/* Cuerpo */}
            <div className="form-group">
              <label htmlFor="cuerpo">Mensaje *</label>
              <textarea
                id="cuerpo"
                value={formData.cuerpo}
                onChange={(e) => handleInputChange('cuerpo', e.target.value)}
                placeholder="Escribe aquí tu mensaje..."
                rows="8"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="enviar-email-modal-footer">
          <div className="footer-left">
            <button 
              className="btn-limpiar" 
              onClick={handleLimpiarFormulario}
              disabled={enviando}
            >
              🗑️ Limpiar
            </button>
          </div>
          <div className="footer-right">
            <button 
              className="btn-cancelar" 
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button 
              className="btn-enviar" 
              onClick={handleEnviarEmail}
              disabled={enviando || !formData.para || !formData.asunto || !formData.cuerpo}
            >
              {enviando ? '📤 Enviando...' : '📧 Enviar Email'}
            </button>
          </div>
        </div>

        {/* Notificaciones flotantes */}
        <FloatingMessage
          message={floatMsg.message}
          type={floatMsg.type}
          isVisible={floatMsg.isVisible}
          onClose={() => setFloatMsg(prev => ({ ...prev, isVisible: false }))}
        />

        {/* TODO: Integrar ClienteSelectorModal cuando esté creado */}
        {showClienteSelector && (
          <ClienteSelectorModal
            isOpen={showClienteSelector}
            onClose={() => setShowClienteSelector(false)}
            onSelectCliente={handleClienteSeleccionado}
          />
        )}
      </div>
    </div>
  );
};

export default EnviarEmailModal;