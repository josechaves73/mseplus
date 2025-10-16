import React, { useState, useEffect } from 'react';
import './ClientePorArticulosModal.css';
import { useClienteArticulos } from '../hooks/useClienteArticulos';

const ClientePorArticulosModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('clientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [asignacionEnabled, setAsignacionEnabled] = useState(false);
  const [clientesAsignadosEnabled, setClientesAsignadosEnabled] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState(null);
  const [eliminarButtonEnabled, setEliminarButtonEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticulo, setDeletingArticulo] = useState(false);

  // Estados para la pestaña de asignación
  const [selectedArticuloParaAsignar, setSelectedArticuloParaAsignar] = useState(null);
  const [ciiuValue, setCiiuValue] = useState('');
  const [simardeValue, setSimardeValue] = useState('');
  const [searchArticulosTerm, setSearchArticulosTerm] = useState('');

  // Estados para los modales
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [assigningArticulo, setAssigningArticulo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAssignedArticulo, setLastAssignedArticulo] = useState(null);
  const [error, setError] = useState('');

  // Hook personalizado para manejar datos
  const {
    clientes,
    loadingClientes,
    articulosAsignados,
    loadingArticulos,
    articulosParaAsignar,
    loadingArticulosParaAsignar,
    fetchClientes,
    checkClienteArticulos,
    loadArticulosParaAsignar,
    asignarArticulo,
    eliminarArticulo,
    setArticulosAsignados
  } = useClienteArticulos();

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab('clientes');
      setSelectedCliente(null);
      setButtonsEnabled(false);
      setAsignacionEnabled(false);
      setClientesAsignadosEnabled(false);
      setSelectedArticulo(null);
      setEliminarButtonEnabled(false);
      setShowDeleteModal(false);
      setDeletingArticulo(false);
      setSelectedArticuloParaAsignar(null);
      setCiiuValue('');
      setSimardeValue('');
      setError('');
      setSearchTerm('');
      setSearchArticulosTerm('');
      setShowWarningModal(false);
      setAssigningArticulo(false);
      setShowSuccessModal(false);
      setLastAssignedArticulo(null);
    }
  }, [isOpen, setArticulosAsignados]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);

    // Cargar artículos cuando se activa la pestaña de asignación
    if (tabName === 'asignacion') {
      loadArticulosParaAsignar();
    }
  };

  const handleClienteSelect = (cliente) => {
    setSelectedCliente(cliente);
    setButtonsEnabled(true);
    setAsignacionEnabled(true);

    // Verificar si el cliente tiene artículos asignados
    checkClienteArticulos(cliente.codigo, (hasArticulos) => {
      setClientesAsignadosEnabled(hasArticulos);
    });
  };

  // Manejar selección de artículo para asignar
  const handleArticuloParaAsignarSelect = (articulo) => {
    setSelectedArticuloParaAsignar(articulo);
    // Limpiar campos editables cuando se selecciona un nuevo artículo
    setCiiuValue('');
    setSimardeValue('');
  };

  const handleCancelar = () => {
    setSelectedCliente(null);
    setButtonsEnabled(false);
    setAsignacionEnabled(false);
    setClientesAsignadosEnabled(false);
    setSelectedArticulo(null);
    setEliminarButtonEnabled(false);
  };

  // Función para el botón "Asignar Artículos" en la pestaña Clientes
  const handleIrAsignacion = () => {
    if (selectedCliente) {
      setActiveTab('asignacion');
      loadArticulosParaAsignar();
    }
  };

  const handleAsignarArticulos = async () => {
    // Validar que se haya seleccionado un artículo y un cliente
    if (!selectedArticuloParaAsignar || !selectedCliente) {
      setError('Debe seleccionar un artículo y tener un cliente seleccionado');
      return;
    }

    setAssigningArticulo(true);
    setError('');

    try {
      const result = await asignarArticulo(
        selectedArticuloParaAsignar,
        selectedCliente,
        ciiuValue,
        simardeValue
      );

      if (result.duplicate) {
        setShowWarningModal(true);
      } else if (result.success) {
        setLastAssignedArticulo({
          codigo: selectedArticuloParaAsignar.codigo,
          descri: selectedArticuloParaAsignar.descri
        });

        // Limpiar formulario
        setSelectedArticuloParaAsignar(null);
        setCiiuValue('');
        setSimardeValue('');

        // Mostrar modal de éxito
        setShowSuccessModal(true);
      } else {
        setError(result.error || 'Error al asignar el artículo');
      }
    } catch (error) {
      console.error('Error al asignar artículo:', error);
      setError('Error de conexión al asignar el artículo');
    } finally {
      setAssigningArticulo(false);
    }
  };

  const handleCloseWarningModal = () => {
    setShowWarningModal(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setLastAssignedArticulo(null);
  };

  const handleArticuloSelect = (articulo) => {
    setSelectedArticulo(articulo);
    setEliminarButtonEnabled(true); // Habilitar botón eliminar
  };

  const handleEliminarArticulo = () => {
    if (selectedArticulo) {
      setShowDeleteModal(true);
    }
  };

  const confirmarEliminarArticulo = async () => {
    if (!selectedArticulo || !selectedCliente) return;

    setDeletingArticulo(true);
    try {
      const result = await eliminarArticulo(selectedCliente.codigo, selectedArticulo.codigo);

      if (result.success) {
        // Si ya no quedan artículos, deshabilitar la pestaña
        if (articulosAsignados.length <= 1) {
          setClientesAsignadosEnabled(false);
          setActiveTab('clientes'); // Volver a la pestaña de clientes
        }

        // Limpiar selección
        setSelectedArticulo(null);
        setEliminarButtonEnabled(false);
      } else {
        console.error('Error al eliminar artículo');
      }
    } catch (error) {
      console.error('Error al eliminar artículo:', error);
    } finally {
      setDeletingArticulo(false);
      setShowDeleteModal(false);
    }
  };

  const cancelarEliminarArticulo = () => {
    setShowDeleteModal(false);
  };

  // Cargar clientes cuando se abra el modal y esté en la pestaña de clientes
  useEffect(() => {
    if (isOpen && activeTab === 'clientes') {
      fetchClientes();
    }
  }, [isOpen, activeTab, fetchClientes]);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClientes = React.useMemo(() => {
    // Primero eliminamos duplicados de los datos originales
    const uniqueClientes = clientes.filter((cliente, index, self) => 
      index === self.findIndex(c => c.codigo === cliente.codigo)
    );

    if (!searchTerm.trim()) {
      return uniqueClientes;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return uniqueClientes.filter(cliente => {
      // Limpiar y normalizar los datos
      const codigo = cliente.codigo ? cliente.codigo.toString().toLowerCase().trim() : '';
      const nombre = cliente.nombre ? cliente.nombre.toLowerCase().trim() : '';
      
      // Verificar si el código coincide exactamente al inicio
      if (codigo.startsWith(term)) {
        return true;
      }
      
      // Verificar si el nombre completo empieza con el término
      if (nombre.startsWith(term)) {
        return true;
      }
      
      // Verificar cada palabra del nombre individualmente
      const palabras = nombre.split(/\s+/).filter(palabra => palabra.length > 0);
      return palabras.some(palabra => palabra.startsWith(term));
    });
  }, [clientes, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Barra de título con botón cerrar */}
        <div className="modal-header">
          <h2 className="modal-title">Cliente por Artículos</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tres pestañas horizontales con diferentes colores e iconos */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => handleTabClick('clientes')}
          >
            <span className="tab-icon">👥</span> Clientes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'asignacion' ? 'active' : ''} ${!asignacionEnabled ? 'disabled' : ''}`}
            onClick={() => handleTabClick('asignacion')}
            disabled={!asignacionEnabled}
          >
            <span className="tab-icon">🔗</span> Asignación
          </button>
          <button 
            className={`tab-btn ${activeTab === 'asignados' ? 'active' : ''} ${!clientesAsignadosEnabled ? 'disabled' : ''}`}
            onClick={() => handleTabClick('asignados')}
            disabled={!clientesAsignadosEnabled}
          >
            <span className="tab-icon">✅</span> Artículos Asignados
          </button>
        </div>

        {/* Contenido de las pestañas */}
        <div className="tab-content">
          {activeTab === 'clientes' && (
            <div className="tab-panel">
              <h3>Lista de Clientes</h3>
              <div className="clientes-layout">
                {/* Zona izquierda - Grid de Clientes */}
                <div className="clientes-grid-container">
                  {error && <div className="error-message" style={{marginBottom: '10px', color: '#e74c3c'}}>Error: {error}</div>}
                  
                  {/* Textbox de búsqueda */}
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Buscar por código o nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  {loadingClientes ? (
                    <div className="loading" style={{textAlign: 'center', padding: '20px'}}>Cargando clientes...</div>
                  ) : (
                    <div className="clientes-grid">
                      <div className="grid-header">
                        <div className="grid-header-cell">Código</div>
                        <div className="grid-header-cell">Nombre</div>
                      </div>
                      <div className="grid-body">
                        {filteredClientes.length === 0 ? (
                          <div style={{textAlign: 'center', padding: '20px', color: '#9ca3af'}}>
                            {searchTerm ? 'No se encontraron clientes con esos criterios' : 'No se encontraron clientes'}
                          </div>
                        ) : (
                          filteredClientes.map((cliente, index) => (
                            <div 
                              key={`${cliente.codigo}-${index}`} 
                              className={`grid-row ${selectedCliente && selectedCliente.codigo === cliente.codigo ? 'selected' : ''}`}
                              onClick={() => handleClienteSelect(cliente)}
                            >
                              <div className="grid-cell">{cliente.codigo}</div>
                              <div className="grid-cell">{cliente.nombre}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Zona derecha - Información del cliente seleccionado */}
                <div className="clientes-right-panel">
                  <div className="cliente-info">
                    <div className="campo-container">
                      <label className="campo-label">Código de Cliente</label>
                      <input
                        type="text"
                        value={selectedCliente ? selectedCliente.codigo : ''}
                        readOnly
                        className="campo-input codigo-input"
                        placeholder="Seleccione un cliente"
                      />
                    </div>
                    <div className="campo-container">
                      <label className="campo-label">Nombre de Cliente</label>
                      <input
                        type="text"
                        value={selectedCliente ? selectedCliente.nombre : ''}
                        readOnly
                        className="campo-input nombre-input"
                        placeholder="Seleccione un cliente"
                      />
                    </div>
                  </div>
                  
                  {/* Botones en la parte inferior */}
                  <div className="buttons-container">
                    <button
                      className={`action-btn asignar-btn ${!buttonsEnabled ? 'disabled' : ''}`}
                      onClick={handleIrAsignacion}
                      disabled={!buttonsEnabled}
                    >
                      <span className="btn-icon">📦</span>
                      Asignar Artículos
                    </button>
                    <button
                      className={`action-btn cancelar-btn ${!buttonsEnabled ? 'disabled' : ''}`}
                      onClick={handleCancelar}
                      disabled={!buttonsEnabled}
                    >
                      <span className="btn-icon">❌</span>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'asignacion' && (
            <div className="tab-panel">
              <h3>Asignación de Artículos para: 
                <input
                  type="text"
                  value={selectedCliente ? selectedCliente.nombre : ''}
                  readOnly
                  className="cliente-asignacion-input"
                  placeholder="Seleccione un cliente"
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    backgroundColor: '#1e3a8a',
                    color: '#fbbf24',
                    fontSize: '16px',
                    fontWeight: '600',
                    minWidth: '340px'
                  }}
                />
              </h3>
              
              <div className="asignacion-container">
                {/* Grid de artículos en la zona izquierda */}
                <div className="articulos-grid-section">
                  <div className="section-header">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Buscar artículos disponibles..."
                      value={searchArticulosTerm}
                      onChange={(e) => setSearchArticulosTerm(e.target.value)}
                    />
                    {loadingArticulosParaAsignar && <span className="loading-text">Cargando...</span>}
                  </div>
                  
                  {loadingArticulosParaAsignar ? (
                    <div className="loading-message">Cargando artículos...</div>
                  ) : articulosParaAsignar.length > 0 ? (
                    (() => {
                      const filteredArticulos = articulosParaAsignar.filter(articulo => 
                        articulo.codigo.toLowerCase().includes(searchArticulosTerm.toLowerCase()) ||
                        articulo.descri.toLowerCase().includes(searchArticulosTerm.toLowerCase())
                      );
                      
                      return filteredArticulos.length > 0 ? (
                        <div className="articulos-grid">
                          <div className="articulos-grid-header">
                            <div className="articulos-grid-column">Código</div>
                            <div className="articulos-grid-column">Descripción</div>
                          </div>
                          <div className="articulos-grid-body">
                            {filteredArticulos.map((articulo) => (
                              <div 
                                key={articulo.codigo} 
                                className={`articulos-grid-row ${selectedArticuloParaAsignar && selectedArticuloParaAsignar.codigo === articulo.codigo ? 'selected' : ''}`}
                                onClick={() => handleArticuloParaAsignarSelect(articulo)}
                              >
                                <div className="articulos-grid-cell">{articulo.codigo}</div>
                                <div className="articulos-grid-cell">{articulo.descri}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="no-data-message">
                          {searchArticulosTerm ? 'No se encontraron artículos que coincidan con la búsqueda' : 'No hay artículos disponibles'}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="no-data-message">No hay artículos disponibles</div>
                  )}
                </div>
                
                {/* Panel de asignación en la zona derecha */}
                <div className="asignacion-panel-section">
                  <div className="section-header">
                    <h4>Panel de Asignación</h4>
                  </div>
                  
                  {selectedArticuloParaAsignar ? (
                    <div className="asignacion-form">
                      {/* Campos readonly */}
                      <div className="campo-row">
                        <div className="campo-container">
                          <label className="campo-label">Código</label>
                          <input
                            type="text"
                            value={selectedArticuloParaAsignar.codigo || ''}
                            readOnly
                            className="campo-input readonly-input"
                          />
                        </div>
                        <div className="campo-container">
                          <label className="campo-label">Descripción</label>
                          <input
                            type="text"
                            value={selectedArticuloParaAsignar.descri || ''}
                            readOnly
                            className="campo-input readonly-input"
                          />
                        </div>
                      </div>

                      <div className="campo-row">
                        <div className="campo-container">
                          <label className="campo-label">Tipo Certificación</label>
                          <input
                            type="text"
                            value={selectedArticuloParaAsignar.tipo_cert || ''}
                            readOnly
                            className="campo-input readonly-input"
                          />
                        </div>
                        <div className="campo-container">
                          <label className="campo-label">Tipo Resolución</label>
                          <input
                            type="text"
                            value={selectedArticuloParaAsignar.tipo_res || ''}
                            readOnly
                            className="campo-input readonly-input"
                          />
                        </div>
                      </div>

                      {/* Campos editables */}
                      <div className="campo-row">
                        <div className="campo-container">
                          <label className="campo-label">CIIU</label>
                          <input
                            type="text"
                            value={ciiuValue}
                            onChange={(e) => setCiiuValue(e.target.value)}
                            className="campo-input editable-input"
                            placeholder="Ingrese CIIU"
                          />
                        </div>
                        <div className="campo-container">
                          <label className="campo-label">Código SIMARDE</label>
                          <input
                            type="text"
                            value={simardeValue}
                            onChange={(e) => setSimardeValue(e.target.value)}
                            className="campo-input editable-input"
                            placeholder="Ingrese Código SIMARDE"
                          />
                        </div>
                      </div>

                      {/* Botón de asignar */}
                      <div className="asignar-button-container">
                        <button
                          className="asignar-articulo-btn"
                          onClick={handleAsignarArticulos}
                          disabled={assigningArticulo || !selectedArticuloParaAsignar}
                        >
                          <span className="btn-icon">{assigningArticulo ? '⏳' : '➕'}</span>
                          {assigningArticulo ? 'Asignando...' : 'Asignar Artículo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-container">
                      <p>Selecciona un artículo para asignar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'asignados' && (
            <div className="tab-panel">
              <h3>Artículos Asignados</h3>
              
              {/* Subtítulo con nombre del cliente */}
              <div className="cliente-asignado-header">
                <span className="subtitle">Mostrando Artículos asignados al Cliente: </span>
                <input
                  type="text"
                  value={selectedCliente ? selectedCliente.nombre : ''}
                  readOnly
                  className="cliente-readonly"
                  placeholder="No hay cliente seleccionado"
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    backgroundColor: '#1e3a8a',
                    color: '#fbbf24',
                    fontSize: '16px',
                    fontWeight: '600',
                    minWidth: '400px'
                  }}
                />
              </div>

              {/* Grid de artículos asignados */}
              <div className="articulos-asignados-container">
                {loadingArticulos ? (
                  <div className="loading" style={{textAlign: 'center', padding: '20px'}}>Cargando artículos...</div>
                ) : (
                  <div className="clientes-asignados-grid">
                    <div className="clientes-asignados-grid-header">
                      <div className="clientes-asignados-grid-header-cell">Código</div>
                      <div className="clientes-asignados-grid-header-cell">Descripción</div>
                      <div className="clientes-asignados-grid-header-cell">CIIU</div>
                      <div className="clientes-asignados-grid-header-cell">Simarde</div>
                      <div className="clientes-asignados-grid-header-cell">Tipo Cert.</div>
                      <div className="clientes-asignados-grid-header-cell">Tipo Res.</div>
                    </div>
                    <div className="clientes-asignados-grid-body">
                      {articulosAsignados.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '20px', color: '#9ca3af'}}>
                          No hay artículos asignados a este cliente
                        </div>
                      ) : (
                        articulosAsignados.map((articulo, index) => (
                          <div 
                            key={`${articulo.codigo}-${index}`} 
                            className={`clientes-asignados-grid-row ${selectedArticulo && selectedArticulo.codigo === articulo.codigo ? 'selected' : ''}`}
                            onClick={() => handleArticuloSelect(articulo)}
                          >
                            <div className="clientes-asignados-grid-cell">{articulo.codigo}</div>
                            <div className="clientes-asignados-grid-cell">{articulo.descri}</div>
                            <div className="clientes-asignados-grid-cell">{articulo.ciiu}</div>
                            <div className="clientes-asignados-grid-cell">{articulo.simarde}</div>
                            <div className="clientes-asignados-grid-cell">{articulo.tipo_cert}</div>
                            <div className="clientes-asignados-grid-cell">{articulo.tipo_res}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Contador y botón eliminar */}
              <div className="articulos-bottom-section">
                <div className="articulos-counter">
                  Total de artículos: {articulosAsignados.length}
                </div>
                <button
                  className={`eliminar-btn ${!eliminarButtonEnabled ? 'disabled' : ''}`}
                  onClick={handleEliminarArticulo}
                  disabled={!eliminarButtonEnabled}
                >
                  <span className="btn-icon">🗑️</span>
                  Eliminar Artículo Seleccionado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal de confirmación para eliminar artículo */}
    {showDeleteModal && (
      <div className="delete-modal-overlay">
        <div className="delete-modal">
          <div className="delete-modal-header">
            <h3>Confirmar Eliminación</h3>
          </div>
          <div className="delete-modal-body">
            <p>¿Desea Eliminar el Artículo:</p>
            <div className="articulo-to-delete">
              {selectedArticulo ? selectedArticulo.descri : ''}
            </div>
          </div>
          <div className="delete-modal-footer">
            <button
              className="delete-confirm-btn"
              onClick={confirmarEliminarArticulo}
              disabled={deletingArticulo}
            >
              {deletingArticulo ? 'Eliminando...' : 'Sí'}
            </button>
            <button
              className="delete-cancel-btn"
              onClick={cancelarEliminarArticulo}
              disabled={deletingArticulo}
            >
              No
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Advertencia para Duplicados */}
    {showWarningModal && (
      <div className="warning-modal-overlay">
        <div className="warning-modal">
          <div className="warning-modal-header">
            <span className="warning-modal-icon">⚠️</span>
            <h3 className="warning-modal-title">Artículo Ya Asignado</h3>
          </div>
          <div className="warning-modal-content">
            <p>
              El artículo <strong>{selectedArticuloParaAsignar?.codigo}</strong> - 
              {selectedArticuloParaAsignar?.descri} ya está asignado al cliente <strong>{selectedCliente?.nombre}</strong>.
            </p>
            <p>No se pueden tener artículos duplicados para el mismo cliente.</p>
          </div>
          <div className="warning-modal-actions">
            <button
              className="warning-modal-btn primary"
              onClick={handleCloseWarningModal}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Éxito para Asignación Correcta */}
    {showSuccessModal && (
      <div className="success-modal-overlay">
        <div className="success-modal">
          <div className="success-modal-header">
            <span className="success-modal-icon">✅</span>
            <h3 className="success-modal-title">¡Asignación Exitosa!</h3>
          </div>
          <div className="success-modal-content">
            <p>
              El artículo <strong>{lastAssignedArticulo?.codigo}</strong> - 
              {lastAssignedArticulo?.descri} ha sido asignado correctamente al cliente:
            </p>
            <p className="success-modal-client-name">
              {selectedCliente?.nombre}
            </p>
          </div>
          <div className="success-modal-actions">
            <button
              className="success-modal-btn primary"
              onClick={handleCloseSuccessModal}
            >
              ACEPTAR
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ClientePorArticulosModal;
