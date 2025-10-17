import React, { useState, useEffect, useCallback } from 'react';
import './ClienteSelectorModal.css';
import FloatingMessage from './common/FloatingMessage';

const ClienteSelectorModal = ({ isOpen, onClose, onSelectCliente }) => {
  console.log('👥 ClienteSelectorModal - isOpen:', isOpen);

  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de UI
  const [floatMsg, setFloatMsg] = useState({ message: '', type: 'info', isVisible: false });

  // Función para mostrar notificaciones
  const showNotification = useCallback((message, type = 'info') => {
    setFloatMsg({ message, type, isVisible: true });
  }, []);

  // Función para obtener clientes
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clientes');
      if (!response.ok) {
        throw new Error('Error al obtener clientes');
      }
      const data = await response.json();
      const clientesList = data.clientes || [];
      
      // Filtrar solo clientes que tengan al menos un email (email o email2)
      const clientesConEmail = clientesList.filter(cliente => 
        (cliente.email && cliente.email.trim() !== '') || 
        (cliente.email2 && cliente.email2.trim() !== '')
      );
      
      setClientes(clientesConEmail);
      setFilteredClientes(clientesConEmail);
      
      if (clientesConEmail.length === 0) {
        showNotification('No se encontraron clientes con email configurado', 'warning');
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
      showNotification('Error al cargar los clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (isOpen && clientes.length === 0) {
      fetchClientes();
    }
  }, [isOpen, clientes.length, fetchClientes]);

  // Filtrar clientes según búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email2?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [clientes, searchTerm]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  // Función para seleccionar cliente
  const handleSelectCliente = (cliente, emailType = 'email') => {
    const emailSeleccionado = emailType === 'email2' ? cliente.email2 : cliente.email;
    
    if (!emailSeleccionado || emailSeleccionado.trim() === '') {
      showNotification('Este cliente no tiene email configurado', 'error');
      return;
    }

    const clienteData = {
      ...cliente,
      emailSeleccionado
    };

    console.log('🎯 Cliente seleccionado:', clienteData);
    onSelectCliente(clienteData, emailSeleccionado);
    onClose();
  };

  // Función para renderizar emails del cliente
  const renderEmailOptions = (cliente) => {
    const emails = [];
    
    if (cliente.email && cliente.email.trim() !== '') {
      emails.push({
        email: cliente.email,
        type: 'email',
        label: 'Email Principal'
      });
    }
    
    if (cliente.email2 && cliente.email2.trim() !== '') {
      emails.push({
        email: cliente.email2,
        type: 'email2',
        label: 'Email Secundario'
      });
    }

    return emails;
  };

  return (
    <div className="cliente-selector-modal-overlay" onClick={onClose}>
      <div className="cliente-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cliente-selector-modal-header">
          <h2 className="cliente-selector-modal-title">👥 Seleccionar Cliente</h2>
          <button className="cliente-selector-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Buscador */}
        <div className="cliente-selector-search">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, código o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Body */}
        <div className="cliente-selector-modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando clientes...</p>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="no-results">
              <p>📭 No se encontraron clientes con email configurado</p>
              {searchTerm && (
                <p className="search-hint">
                  Intenta buscar con otros términos o verifica que los clientes tengan emails configurados
                </p>
              )}
            </div>
          ) : (
            <div className="clientes-list">
              {filteredClientes.map((cliente, index) => {
                const emailOptions = renderEmailOptions(cliente);
                
                return (
                  <div 
                    key={`${cliente.codigo}-${index}`} 
                    className="cliente-item"
                  >
                    <div className="cliente-info">
                      <div className="cliente-header">
                        <h3 className="cliente-nombre">{cliente.nombre}</h3>
                        <span className="cliente-codigo">#{cliente.codigo}</span>
                      </div>
                      
                      <div className="cliente-emails">
                        {emailOptions.map((emailOption, emailIndex) => (
                          <div key={emailIndex} className="email-option">
                            <div className="email-info">
                              <span className="email-label">{emailOption.label}:</span>
                              <span className="email-address">{emailOption.email}</span>
                            </div>
                            <button
                              className="btn-select-email"
                              onClick={() => handleSelectCliente(cliente, emailOption.type)}
                              title={`Seleccionar ${emailOption.label}`}
                            >
                              📧 Seleccionar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cliente-selector-modal-footer">
          <div className="footer-info">
            <span>📊 {filteredClientes.length} cliente(s) encontrado(s)</span>
          </div>
          <button className="btn-cancelar" onClick={onClose}>
            Cancelar
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

export default ClienteSelectorModal;
