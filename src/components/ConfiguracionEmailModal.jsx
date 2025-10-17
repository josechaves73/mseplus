import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ConfiguracionEmailModal.css';
import FloatingMessage from './common/FloatingMessage';

// Configuraciones predeterminadas por proveedor (fuera del componente para evitar re-renders)
const PROVIDER_CONFIGS = {
  gmail: {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: true,
    requiresAppPassword: true,
    helpText: 'Para Gmail, necesitas generar una contraseña de aplicación en tu cuenta de Google.'
  },
  outlook: {
    smtp_host: 'smtp-mail.outlook.com',
    smtp_port: 587,
    smtp_secure: true,
    requiresAppPassword: true,
    helpText: 'Para Outlook, necesitas generar una contraseña de aplicación en tu cuenta de Microsoft.'
  },
  hotmail: {
    smtp_host: 'smtp-mail.outlook.com',
    smtp_port: 587,
    smtp_secure: true,
    requiresAppPassword: true,
    helpText: 'Hotmail usa los mismos servidores que Outlook.'
  },
  yahoo: {
    smtp_host: 'smtp.mail.yahoo.com',
    smtp_port: 587,
    smtp_secure: true,
    requiresAppPassword: true,
    helpText: 'Para Yahoo, necesitas generar una contraseña de aplicación.'
  },
  custom: {
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    requiresAppPassword: false,
    helpText: 'Configura manualmente los parámetros SMTP de tu proveedor.'
  }
};

const ConfiguracionEmailModal = ({ isOpen, onClose }) => {
  console.log('📧 ConfiguracionEmailModal - isOpen:', isOpen, 'renderizando:', isOpen ? 'SÍ' : 'NO');

  // Estados principales
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    provider: 'gmail',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    password: '',
    app_password: '',
    is_default: false
  });

  // Estados de UI
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [floatMsg, setFloatMsg] = useState({ message: '', type: 'info', isVisible: false });

  // Referencia para foco automático
  const nombreInputRef = useRef(null);

  // Función para mostrar notificaciones
  const showNotification = useCallback((message, type = 'info') => {
    setFloatMsg({ message, type, isVisible: true });
  }, []);

  // Función para obtener las cuentas
  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/email-accounts');
      if (!response.ok) {
        throw new Error('Error al obtener las cuentas de email');
      }
      const data = await response.json();
      setCuentas(data.accounts || []);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      setError(error.message);
      showNotification('Error al cargar las cuentas de email', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Cargar cuentas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchCuentas();
      // Dar foco al campo nombre
      setTimeout(() => {
        if (nombreInputRef.current) {
          nombreInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, fetchCuentas]);

  // Actualizar configuración cuando cambia el proveedor
  useEffect(() => {
    if (formData.provider && PROVIDER_CONFIGS[formData.provider]) {
      const config = PROVIDER_CONFIGS[formData.provider];
      setFormData(prev => ({
        ...prev,
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_secure: config.smtp_secure
      }));
    }
  }, [formData.provider]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  // Función para manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      email: '',
      provider: 'gmail',
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: true,
      password: '',
      app_password: '',
      is_default: false
    });
    setEditingId(null);
    setShowPassword(false);
    setShowAppPassword(false);
  };

  // Función para editar una cuenta
  const handleEditar = (cuenta) => {
    setFormData({
      nombre: cuenta.nombre,
      email: cuenta.email,
      provider: cuenta.provider,
      smtp_host: cuenta.smtp_host,
      smtp_port: cuenta.smtp_port,
      smtp_secure: cuenta.smtp_secure,
      password: '', // No mostrar contraseñas por seguridad
      app_password: '',
      is_default: cuenta.is_default
    });
    setEditingId(cuenta.id);
  };

  // Función para guardar cuenta
  const handleGuardar = async () => {
    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        showNotification('El nombre es requerido', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showNotification('El email es requerido', 'error');
        return;
      }
      if (!formData.smtp_host.trim()) {
        showNotification('El servidor SMTP es requerido', 'error');
        return;
      }

      const url = editingId 
        ? `/api/email-accounts/${editingId}`
        : '/api/email-accounts';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la cuenta');
      }

      const message = editingId ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente';
      showNotification(message, 'success');
      
      // Recargar lista y limpiar formulario
      await fetchCuentas();
      limpiarFormulario();

    } catch (error) {
      console.error('Error al guardar cuenta:', error);
      showNotification(error.message, 'error');
    }
  };

  // Función para eliminar cuenta
  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta de email?')) {
      return;
    }

    try {
      const response = await fetch(`/api/email-accounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la cuenta');
      }

      showNotification('Cuenta eliminada exitosamente', 'success');
      await fetchCuentas();
      
      // Si estábamos editando esta cuenta, limpiar formulario
      if (editingId === id) {
        limpiarFormulario();
      }

    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      showNotification(error.message, 'error');
    }
  };

  // Función para establecer como predeterminada
  const handleSetDefault = async (id) => {
    try {
      const response = await fetch(`/api/email-accounts/${id}/default`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al establecer cuenta predeterminada');
      }

      showNotification('Cuenta establecida como predeterminada', 'success');
      await fetchCuentas();

    } catch (error) {
      console.error('Error al establecer cuenta predeterminada:', error);
      showNotification(error.message, 'error');
    }
  };

  // Función para probar conexión
  const handleProbarConexion = async () => {
    try {
      if (!formData.email || !formData.smtp_host) {
        showNotification('Completa al menos el email y servidor SMTP', 'error');
        return;
      }

      showNotification('Probando conexión...', 'info');

      const response = await fetch('/api/email-accounts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification('✅ Conexión exitosa', 'success');
      } else {
        showNotification(`❌ Error de conexión: ${result.message}`, 'error');
      }

    } catch (error) {
      console.error('Error al probar conexión:', error);
      showNotification('Error al probar la conexión', 'error');
    }
  };

  const currentConfig = PROVIDER_CONFIGS[formData.provider] || {};

  return (
    <div className="config-email-modal-overlay" onClick={onClose}>
      <div className="config-email-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="config-email-modal-header">
          <h2 className="config-email-modal-title">⚙️ Configuración de Emails</h2>
          <button className="config-email-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="config-email-modal-body">
          {/* Formulario de configuración */}
          <div className="email-form-section">
            <h3 className="section-title">
              {editingId ? 'Editar Cuenta de Email' : 'Nueva Cuenta de Email'}
            </h3>
            
            <div className="form-grid">
              {/* Nombre descriptivo */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre de la cuenta</label>
                <input
                  ref={nombreInputRef}
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Ej: Email Principal, Ventas, Soporte..."
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Dirección de email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="usuario@dominio.com"
                />
              </div>

              {/* Proveedor */}
              <div className="form-group">
                <label htmlFor="provider">Proveedor</label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                >
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="hotmail">Hotmail</option>
                  <option value="yahoo">Yahoo</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Servidor SMTP */}
              <div className="form-group">
                <label htmlFor="smtp_host">Servidor SMTP</label>
                <input
                  type="text"
                  id="smtp_host"
                  value={formData.smtp_host}
                  onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  disabled={formData.provider !== 'custom'}
                />
              </div>

              {/* Puerto SMTP */}
              <div className="form-group">
                <label htmlFor="smtp_port">Puerto SMTP</label>
                <input
                  type="number"
                  id="smtp_port"
                  value={formData.smtp_port}
                  onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                  placeholder="587"
                  disabled={formData.provider !== 'custom'}
                />
              </div>

              {/* SSL/TLS */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.smtp_secure}
                    onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
                    disabled={formData.provider !== 'custom'}
                  />
                  <span className="checkmark"></span>
                  Usar SSL/TLS
                </label>
              </div>

              {/* Contraseña normal */}
              {!currentConfig.requiresAppPassword && (
                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Contraseña de tu email"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
              )}

              {/* Contraseña de aplicación */}
              {currentConfig.requiresAppPassword && (
                <div className="form-group">
                  <label htmlFor="app_password">Contraseña de aplicación</label>
                  <div className="password-input-container">
                    <input
                      type={showAppPassword ? "text" : "password"}
                      id="app_password"
                      value={formData.app_password}
                      onChange={(e) => handleInputChange('app_password', e.target.value)}
                      placeholder="Contraseña de aplicación"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowAppPassword(!showAppPassword)}
                    >
                      {showAppPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cuenta predeterminada */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => handleInputChange('is_default', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Establecer como predeterminada
                </label>
              </div>
            </div>

            {/* Texto de ayuda */}
            {currentConfig.helpText && (
              <div className="help-text">
                💡 {currentConfig.helpText}
              </div>
            )}

            {/* Botones de acción del formulario */}
            <div className="form-actions">
              <button className="btn-probar" onClick={handleProbarConexion}>
                🔧 Probar Conexión
              </button>
              <button className="btn-guardar" onClick={handleGuardar}>
                {editingId ? '✏️ Actualizar' : '💾 Guardar'}
              </button>
              {editingId && (
                <button className="btn-cancelar" onClick={limpiarFormulario}>
                  ❌ Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Lista de cuentas existentes */}
          <div className="cuentas-list-section">
            <h3 className="section-title">Cuentas Configuradas</h3>
            
            {loading && <p className="loading">Cargando cuentas...</p>}
            {error && <p className="error">Error: {error}</p>}
            
            {!loading && !error && cuentas.length === 0 && (
              <p className="no-cuentas">No hay cuentas configuradas aún.</p>
            )}

            {!loading && !error && cuentas.length > 0 && (
              <div className="cuentas-grid">
                {cuentas.map((cuenta) => (
                  <div key={cuenta.id} className={`cuenta-card ${cuenta.is_default ? 'default' : ''}`}>
                    <div className="cuenta-header">
                      <h4 className="cuenta-nombre">{cuenta.nombre}</h4>
                      {cuenta.is_default && <span className="default-badge">Predeterminada</span>}
                    </div>
                    <div className="cuenta-details">
                      <p><strong>Email:</strong> {cuenta.email}</p>
                      <p><strong>Proveedor:</strong> {cuenta.provider}</p>
                      <p><strong>Servidor:</strong> {cuenta.smtp_host}:{cuenta.smtp_port}</p>
                      <p><strong>Estado:</strong> {cuenta.is_active ? '✅ Activa' : '❌ Inactiva'}</p>
                    </div>
                    <div className="cuenta-actions">
                      <button 
                        className="btn-editar"
                        onClick={() => handleEditar(cuenta)}
                      >
                        ✏️ Editar
                      </button>
                      {!cuenta.is_default && (
                        <button 
                          className="btn-default"
                          onClick={() => handleSetDefault(cuenta.id)}
                        >
                          ⭐ Predeterminada
                        </button>
                      )}
                      <button 
                        className="btn-eliminar"
                        onClick={() => handleEliminar(cuenta.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="config-email-modal-footer">
          <button className="btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* Notificaciones flotantes */}
        <FloatingMessage
          message={floatMsg.message}
          type={floatMsg.type}
          isVisible={floatMsg.isVisible}
          onClose={() => setFloatMsg(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </div>
  );
};

export default ConfiguracionEmailModal;
