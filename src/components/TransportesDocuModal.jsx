import React, { useState, useEffect } from 'react';
import './TransportesDocuModal.css';
import showGlobalFlash, { showGlobalAlert, showGlobalConfirm } from '../utils/flashService';

const TransportesDocuModal = ({ isOpen, onClose, onOpenNuevoDocumento }) => {
  const [activeTab, setActiveTab] = useState('vehiculos');
  const [docuConfig, setDocuConfig] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para pestaña Conductores
  const [choferes, setChoferes] = useState([]);
  // Estados para pestaña Vehículos (se manejan cuando se implemente paso a paso)
  const [vehiculos, setVehiculos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [searchChofer, setSearchChofer] = useState('');
  const [selectedChofer, setSelectedChofer] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [notas, setNotas] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [loadingChoferes, setLoadingChoferes] = useState(false);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  // placeholder para futuros estados de vehiculos
  const [errorChoferes, setErrorChoferes] = useState(null);
  const [errorDocumentos, setErrorDocumentos] = useState(null);
  // placeholder para futuros estados de vehiculos
  const [isSaving, setIsSaving] = useState(false);
  // use global flash modal
  const showToast = (type, message) => showGlobalFlash(type, message, 3000);

  // handleVehiculoSelect será implementado paso a paso

  const handleDocumentoSelect = (documento) => {
    setSelectedDocumento(selectedDocumento?.id === documento.id ? null : documento);
  };

  const handleChoferSelect = (chofer) => {
    setSelectedChofer(selectedChofer?.codigo_chofer === chofer.codigo_chofer ? null : chofer);
  };

  const handleVehiculoSelect = (veh) => {
    setSelectedVehiculo(selectedVehiculo?.placa === veh.placa ? null : veh);
    // also clear selectedDocumento when switching vehicle
    setSelectedDocumento(null);
  };

  const handleRowSelect = (row) => {
    setSelectedRow(selectedRow?.id === row.id ? null : row);
  };

  const fetchDocuConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/docu-config');
      const data = await response.json();
      if (data.success) {
        const sortedData = data.documentos.sort((a, b) => {
          if (a.aplica_a !== b.aplica_a) {
            if (a.aplica_a === 'conductor' && b.aplica_a === 'vehiculo') return -1;
            if (a.aplica_a === 'vehiculo' && b.aplica_a === 'conductor') return 1;
          }
          return a.nombre_documento.localeCompare(b.nombre_documento);
        });
        setDocuConfig(sortedData);
      } else {
        setError('Error al cargar configuraciones');
      }
    } catch (err) {
      console.error('Error al obtener docu_config:', err);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchChoferes = async () => {
    setLoadingChoferes(true);
    setErrorChoferes(null);
    try {
      const response = await fetch('/api/chofer');
      const data = await response.json();
      if (data.success) {
        setChoferes(data.choferes);
      } else {
        setErrorChoferes('Error al cargar choferes');
      }
    } catch (err) {
      console.error('Error al obtener choferes:', err);
      setErrorChoferes('Error de conexión al servidor');
    } finally {
      setLoadingChoferes(false);
    }
  };

  const fetchDocumentos = async (aplica = 'vehiculo') => {
    setLoadingDocumentos(true);
    setErrorDocumentos(null);
    try {
      const response = await fetch('/api/docu-config');
      const data = await response.json();
      if (data.success) {
        const documentosFiltrados = data.documentos.filter(doc => doc.aplica_a === aplica);
        setDocumentos(documentosFiltrados);
      } else {
        setErrorDocumentos('Error al cargar documentos');
      }
    } catch (err) {
      console.error('Error al obtener documentos:', err);
      setErrorDocumentos('Error de conexión al servidor');
    } finally {
      setLoadingDocumentos(false);
    }
  };


  // Cargar datos de docu_config cuando se abra la pestaña configurar
  useEffect(() => {
    if (isOpen && activeTab === 'configurar') {
      fetchDocuConfig();
    }
  }, [isOpen, activeTab]);

  // Cargar datos de conductores cuando se abra la pestaña conductores
  useEffect(() => {
    if (isOpen && activeTab === 'conductores') {
      fetchChoferes();
      fetchDocumentos('conductor');
    }
  }, [isOpen, activeTab]);

  // Cuando abrimos vehiculos, solo cargamos documentos (si se necesita se implementará paso a paso)
  useEffect(() => {
    if (isOpen && activeTab === 'vehiculos') {
      fetchDocumentos('vehiculo');
    }
  }, [isOpen, activeTab]);

  // Cargar vehiculos cuando se abra la pestaña vehiculos
  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const res = await fetch('/api/vehiculos');
        const data = await res.json();
        if (data.vehiculos) setVehiculos(data.vehiculos);
      } catch (err) {
        console.error('Error cargando vehiculos:', err);
      }
    };

    if (isOpen && activeTab === 'vehiculos') fetchVehiculos();
  }, [isOpen, activeTab]);

  // Prefill notas cuando cambia la selección de documento o chofer
  useEffect(() => {
    if (selectedDocumento) {
      // Si el documento ya trae un campo notas, precargarlo
      setNotas(selectedDocumento.notas || '');
      setFechaEmision(selectedDocumento.fecha_emision ? selectedDocumento.fecha_emision.split('T')[0] : '');
      setFechaVencimiento(selectedDocumento.fecha_vencimiento ? selectedDocumento.fecha_vencimiento.split('T')[0] : '');
    } else {
      setNotas('');
      setFechaEmision('');
      setFechaVencimiento('');
    }
  }, [selectedDocumento]);

  // saveVehiculoDocumento será implementado paso a paso cuando retomemos Vehículos
  const saveVehiculoDocumento = async () => {
    if (!selectedVehiculo || !selectedDocumento) {
      showToast('error', 'Selecciona un vehículo y un documento antes de guardar.');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    if (!fechaEmision || !fechaVencimiento) {
      showToast('error', 'Selecciona Fecha Emisión y Fecha Vencimiento antes de guardar.');
      setIsSaving(false);
      return;
    }
    const d1 = new Date(fechaEmision);
    const d2 = new Date(fechaVencimiento);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      showToast('error', 'Las fechas no son válidas.');
      setIsSaving(false);
      return;
    }
    if (d1 > d2) {
      showToast('error', 'Fecha Emisión no puede ser posterior a Fecha Vencimiento.');
      setIsSaving(false);
      return;
    }

    const payload = {
      placa: selectedVehiculo.placa,
      documento_id: selectedDocumento.id,
      notas: notas ? String(notas).slice(0, 256) : null,
      fecha_emision: fechaEmision || null,
      fecha_vencimiento: fechaVencimiento || null,
    };

    try {
      const res = await fetch('/api/vehiculo-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDocumento(prev => prev ? { ...prev, notas: payload.notas, fecha_emision: payload.fecha_emision, fecha_vencimiento: payload.fecha_vencimiento } : prev);
        showToast('success', 'Documento guardado correctamente');
        setTimeout(() => {
          setNotas('');
          setFechaEmision('');
          setFechaVencimiento('');
          setSelectedDocumento(null);
          setSelectedVehiculo(null);
        }, 550);
      } else {
        console.error('Error guardando relación vehiculo-documento:', data);
        showToast('error', 'Error al guardar la relación. Revisa la consola.');
      }
    } catch (err) {
      console.error('Error en fetch guardar relación vehiculo:', err);
      showToast('error', 'Error de conexión al guardar la relación.');
    }

    setIsSaving(false);
  };

  // Guardar relación conductor-documento (asume endpoint en backend)
  const saveConductorDocumento = async () => {
    if (!selectedChofer || !selectedDocumento) {
      showToast('error', 'Selecciona un conductor y un documento antes de guardar.');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    // Validar fechas: ambas deben existir y fechaEmision <= fechaVencimiento
    if (!fechaEmision || !fechaVencimiento) {
      showToast('error', 'Selecciona Fecha Emisión y Fecha Vencimiento antes de guardar.');
      setIsSaving(false);
      return;
    }
    const d1 = new Date(fechaEmision);
    const d2 = new Date(fechaVencimiento);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      showToast('error', 'Las fechas no son válidas.');
      setIsSaving(false);
      return;
    }
    if (d1 > d2) {
      showToast('error', 'Fecha Emisión no puede ser posterior a Fecha Vencimiento.');
      setIsSaving(false);
      return;
    }

    const payload = {
      codigo_chofer: selectedChofer.codigo_chofer,
      documento_id: selectedDocumento.id,
      notas: notas ? String(notas).slice(0, 256) : null,
      fecha_emision: fechaEmision || null,
      fecha_vencimiento: fechaVencimiento || null,
    };

    try {
      const res = await fetch('/api/conductor-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Actualizar nota localmente para reflejar el guardado
        setSelectedDocumento(prev => prev ? { ...prev, notas: payload.notas, fecha_emision: payload.fecha_emision, fecha_vencimiento: payload.fecha_vencimiento } : prev);
  showToast('success', 'Documento guardado correctamente');
        // Esperar un momento para que el toast sea visible, luego limpiar campos y deseleccionar
        setTimeout(() => {
          setNotas('');
          setFechaEmision('');
          setFechaVencimiento('');
          setSelectedDocumento(null);
          setSelectedChofer(null);
        }, 550);
      } else {
        console.error('Error guardando relación:', data);
  showToast('error', 'Error al guardar la relación. Revisa la consola.');
      }
    } catch (err) {
      console.error('Error en fetch guardar relación:', err);
      showToast('error', 'Error de conexión al guardar la relación.');
    }
    setIsSaving(false);
  };

  const handleEditDocument = () => {
    if (selectedRow) {
      onOpenNuevoDocumento(true, selectedRow); // Pasar modo edición y datos
    }
  };

  // Verificar relaciones y eliminar configuración si procede
  const handleDeleteConfig = async () => {
    if (!selectedRow) return;
    try {
      const res = await fetch(`/api/docu-config/${selectedRow.id}/check-relations`);
      const data = await res.json();
      if (!data.success) {
        showToast('error', 'Error verificando relaciones');
        return;
      }

      // Si existen relaciones, informar según aplica_a
      if ((data.vehiculos && data.vehiculos > 0) || (data.conductores && data.conductores > 0)) {
        const aplic = data.aplica_a === 'vehiculo' ? 'vehiculos' : 'conductores';
        // Mostrar alerta estilizada con título
        showGlobalAlert({ title: 'No se permite Eliminar Documento', message: `Documento relacionado con (${aplic})`, type: 'error', duration: 6000 });
        return;
      }

      // No hay relaciones -> preguntar confirmación con modal estilizado
      const ok = await showGlobalConfirm({ title: 'Confirmar eliminación', message: '¿Desea eliminar esta configuración de documento? Esta acción es irreversible.', confirmText: 'Eliminar', cancelText: 'Cancelar' });
      if (!ok) return;

      // Proceder a eliminar
      const delRes = await fetch(`/api/docu-config/${selectedRow.id}`, { method: 'DELETE' });
      const delData = await delRes.json();
      if (delData.success) {
        showGlobalFlash('success', 'Configuración eliminada', 3000);
        // actualizar lista localmente
        setDocuConfig(prev => prev.filter(r => r.id !== selectedRow.id));
        setSelectedRow(null);
      } else {
        showGlobalFlash('error', delData.message || 'Error al eliminar', 4000);
      }
    } catch (err) {
      console.error('Error en eliminar configuración:', err);
      showToast('error', 'Error de conexión al eliminar');
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  if (!isOpen) return null;

  return (
    <div className="transportes-docu-modal-overlay">
      <div className="transportes-docu-modal">
        {/* Barra de título */}
        <div className="transportes-docu-header">
          <h2>📄 Documentación de Transportes</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Pestañas */}
        <div className="transportes-docu-tabs">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'vehiculos' ? 'active' : ''}`}
              onClick={() => handleTabClick('vehiculos')}
            >
              🚗 Vehículos
            </button>
            <button
              className={`tab-button ${activeTab === 'conductores' ? 'active' : ''}`}
              onClick={() => handleTabClick('conductores')}
            >
              🧑‍✈️ Conductores
            </button>
            <button
              className={`tab-button ${activeTab === 'configurar' ? 'active' : ''}`}
              onClick={() => handleTabClick('configurar')}
            >
              ⚙️ Configurar
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div className="tabs-content">
            {activeTab === 'vehiculos' && (
              <div className="tab-panel" data-tab="vehiculos">
                <div className="panel-header">
                  <h3>📋 Documentación de Vehículos</h3>
                  <p>Gestión de documentos para vehículos de la flota</p>
                </div>
                <div className="panel-content">
                  <div className="conductores-container">
                    {/* Left placeholder: Vehículos grid (30%) */}
                    <div className="conductores-placeholder vehiculos-grid">
                      <h4>🚗 Lista de Vehículos</h4>
                      <div className="search-container">
                        <input
                          type="text"
                          placeholder="Buscar por placa o marca..."
                          value={searchChofer} /* reutilizamos searchChofer temporalmente */
                          onChange={(e) => setSearchChofer(e.target.value)}
                          className="search-input"
                        />
                      </div>

                      <div className="choferes-grid-content vehiculos-grid-content">
                        <div className="grid-header">
                          <div className="grid-col col-placa">Placa</div>
                          <div className="grid-col col-marca">Marca</div>
                        </div>

                        <div className="grid-body">
                          {/** Cargar vehiculos desde API y mostrar filas seleccionables */}
                          {vehiculos && vehiculos.length === 0 && (
                            <div className="no-data"><p>No hay vehículos disponibles</p></div>
                          )}

                          {vehiculos && vehiculos.filter(v => (
                            (v.placa || '').toLowerCase().includes((searchChofer||'').toLowerCase()) ||
                            (v.marca || '').toLowerCase().includes((searchChofer||'').toLowerCase())
                          )).map((v) => (
                            <div
                              key={v.placa}
                              className={`grid-row ${selectedVehiculo?.placa === v.placa ? 'selected' : ''}`}
                              onClick={() => handleVehiculoSelect(v)}
                            >
                              <div className="grid-col col-placa">{v.placa}</div>
                              <div className="grid-col col-marca">{v.marca}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Middle and right placeholders kept empty for now */}
                    <div className="conductores-placeholder documentos-grid">
                      <h4>📄 Lista de Documentos</h4>
                      <div className="documentos-grid-content">
                        <div className="grid-header">
                          <div className="grid-col col-documento">Nombre del Documento</div>
                        </div>
                        <div className="grid-body">
                          {(!documentos || documentos.length === 0) ? (
                            <div className="no-data"><p>No hay documentos disponibles</p></div>
                          ) : (
                            documentos.map((documento) => (
                              <div
                                key={documento.id}
                                className={`grid-row ${selectedDocumento?.id === documento.id ? 'selected' : ''}`}
                                onClick={() => handleDocumentoSelect(documento)}
                              >
                                <div className="grid-col col-documento">{documento.nombre_documento}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="conductores-placeholder future-implementation">
                      <div className="future-header">
                        <h4>🔎 Detalle del Documento a Relacionar</h4>
                      </div>
                      <div className="future-content">
                        <div className="details-grid">
                          <div className="detail-cell">
                            <label>Placa</label>
                            <input className="input-small" type="text" readOnly value={selectedVehiculo?.placa || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>Marca</label>
                            <input className="input-large" type="text" readOnly value={selectedVehiculo?.marca || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>ID Documento</label>
                            <input className="input-small" type="text" readOnly value={selectedDocumento?.id || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>Nombre Documento</label>
                            <input className="input-large" type="text" readOnly value={selectedDocumento?.nombre_documento || ''} />
                          </div>
                        </div>

                        {(!selectedVehiculo && !selectedDocumento) && (
                          <div className="empty-placeholder" style={{marginTop:12}}>
                            <p>Selecciona un vehículo y un documento para ver detalles</p>
                          </div>
                        )}
                        <div className="dates-row">
                          <div className="date-cell">
                            <label>Fecha Emisión</label>
                            <input
                              type="date"
                              value={fechaEmision}
                              onChange={(e) => setFechaEmision(e.target.value)}
                            />
                          </div>
                          <div className="date-cell">
                            <label>Fecha Vencimiento</label>
                            <input
                              type="date"
                              value={fechaVencimiento}
                              onChange={(e) => setFechaVencimiento(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="notes-row" style={{ width: '100%', maxWidth: 640, marginTop: 12 }}>
                          <label style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 6, textAlign: 'left' }}>NOTAS</label>
                          <textarea
                            maxLength={256}
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Notas (máx 256 caracteres)"
                            style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 6, background: '#0b1220', color: '#fff', border: '1px solid #243447', boxSizing: 'border-box' }}
                          />

                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                              className="btn-action btn-guardar"
                              onClick={saveVehiculoDocumento}
                              type="button"
                              disabled={!selectedVehiculo || !selectedDocumento || isSaving}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                background: (!selectedVehiculo || !selectedDocumento || isSaving) ? '#94d3a2' : '#16a34a',
                                color: '#fff',
                                border: 'none',
                                cursor: (!selectedVehiculo || !selectedDocumento || isSaving) ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8
                              }}
                            >
                              {isSaving ? '⏳ Guardando...' : '💾 Guardar Documento'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'conductores' && (
              <div className="tab-panel" data-tab="conductores">
                <div className="panel-header">
                  <h3>👨‍💼 Documentación de Conductores</h3>
                  <p>Gestión de documentos para conductores y personal</p>
                </div>
                <div className="panel-content">
                  <div className="conductores-container">
                    {/* Placeholder 1: Grid de Choferes (30% izquierda) */}
                    <div className="conductores-placeholder choferes-grid">
                      <h4>👨‍💼 Lista de Conductores</h4>
                      <div className="search-container">
                        <input
                          type="text"
                          placeholder="Buscar chofer..."
                          value={searchChofer}
                          onChange={(e) => setSearchChofer(e.target.value)}
                          className="search-input"
                        />
                      </div>
                      
                      {loadingChoferes && (
                        <div className="loading-message">
                          <p>🔄 Cargando choferes...</p>
                        </div>
                      )}
                      
                      {errorChoferes && (
                        <div className="error-message">
                          <p>❌ {errorChoferes}</p>
                        </div>
                      )}
                      
                      {!loadingChoferes && !errorChoferes && (
                        <div className="choferes-grid-content">
                          <div className="grid-header">
                            <div className="grid-col col-nombre">Nombre de Conductor</div>
                          </div>
                          
                          <div className="grid-body">
                            {choferes
                              .filter(chofer => 
                                chofer.nombre.toLowerCase().includes(searchChofer.toLowerCase())
                              )
                              .map((chofer) => (
                                <div 
                                  key={chofer.codigo_chofer}
                                  className={`grid-row ${
                                    selectedChofer?.codigo_chofer === chofer.codigo_chofer ? 'selected' : ''
                                  }`}
                                  onClick={() => handleChoferSelect(chofer)}
                                >
                                  <div className="grid-col col-nombre">
                                    {chofer.nombre}
                                  </div>
                                </div>
                              ))
                            }
                            {choferes.filter(chofer => 
                              chofer.nombre.toLowerCase().includes(searchChofer.toLowerCase())
                            ).length === 0 && (
                              <div className="no-data">
                                <p>No hay choferes disponibles</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Placeholder 2: Grid de Documentos (30% centro) */}
                    <div className="conductores-placeholder documentos-grid">
                      <h4>📄 Lista de Documentos</h4>
                      
                      {loadingDocumentos && (
                        <div className="loading-message">
                          <p>🔄 Cargando documentos...</p>
                        </div>
                      )}
                      
                      {errorDocumentos && (
                        <div className="error-message">
                          <p>❌ {errorDocumentos}</p>
                        </div>
                      )}
                      
                      {!loadingDocumentos && !errorDocumentos && (
                        <div className="documentos-grid-content">
                          <div className="grid-header">
                            <div className="grid-col col-documento">Nombre del Documento</div>
                          </div>
                          
                          <div className="grid-body">
                            {documentos.length === 0 ? (
                              <div className="no-data">
                                <p>No hay documentos disponibles</p>
                              </div>
                            ) : (
                              documentos.map((documento) => (
                                <div 
                                  key={documento.id}
                                  className={`grid-row ${
                                    selectedDocumento?.id === documento.id ? 'selected' : ''
                                  }`}
                                  onClick={() => handleDocumentoSelect(documento)}
                                >
                                  <div className="grid-col col-documento">
                                    {documento.nombre_documento}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Placeholder 3: Espacio para implementación futura (40% derecha) */}
                    <div className="conductores-placeholder future-implementation">
                      <div className="future-header">
                        <h4>🔎 Detalle del Documento a Relacionar</h4>
                      </div>
                      <div className="future-content">
                        <div className="details-grid">
                          <div className="detail-cell">
                            <label>Codigo de Conductor</label>
                            <input className="input-small" type="text" readOnly value={selectedChofer?.codigo_chofer || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>Nombre Conductor</label>
                            <input className="input-large" type="text" readOnly value={selectedChofer?.nombre || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>ID</label>
                            <input className="input-small" type="text" readOnly value={selectedDocumento?.id || ''} />
                          </div>
                          <div className="detail-cell">
                            <label>Nombre Documento</label>
                            <input className="input-large" type="text" readOnly value={selectedDocumento?.nombre_documento || ''} />
                          </div>
                        </div>

                        {(!selectedChofer && !selectedDocumento) && (
                          <div className="empty-placeholder" style={{marginTop:12}}>
                            <p>Selecciona un conductor o un documento para ver detalles</p>
                          </div>
                        )}
                        {/* Fechas: Emisión y Vencimiento */}
                        <div className="dates-row">
                          <div className="date-cell">
                            <label>Fecha Emisión</label>
                            <input
                              type="date"
                              value={fechaEmision}
                              onChange={(e) => setFechaEmision(e.target.value)}
                            />
                          </div>
                          <div className="date-cell">
                            <label>Fecha Vencimiento</label>
                            <input
                              type="date"
                              value={fechaVencimiento}
                              onChange={(e) => setFechaVencimiento(e.target.value)}
                            />
                          </div>
                        </div>
                        {/* Notas y acciones */}
                        <div className="notes-row" style={{ width: '100%', maxWidth: 640, marginTop: 12 }}>
                          <label style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 6, textAlign: 'left' }}>NOTAS</label>
                          <textarea
                            maxLength={256}
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Notas (máx 256 caracteres)"
                            style={{ width: '100%', minHeight: 80, padding: 8, borderRadius: 6, background: '#0b1220', color: '#fff', border: '1px solid #243447', boxSizing: 'border-box' }}
                          />

                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                              className="btn-action btn-guardar"
                              onClick={saveConductorDocumento}
                              type="button"
                              disabled={!selectedChofer || !selectedDocumento || isSaving}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                background: (!selectedChofer || !selectedDocumento || isSaving) ? '#94d3a2' : '#16a34a',
                                color: '#fff',
                                border: 'none',
                                cursor: (!selectedChofer || !selectedDocumento || isSaving) ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8
                              }}
                            >
                              {isSaving ? '⏳ Guardando...' : '💾 Guardar Documento'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configurar' && (
              <div className="tab-panel" data-tab="configurar">
                <div className="panel-header">
                  <h3>⚙️ Configuración de Documentación</h3>
                  <p>Configuraciones generales del sistema de documentación</p>
                </div>
                <div className="panel-content">
                  <div className="config-container">
                    {/* Grid de configuraciones - izquierda */}
                    <div className="config-grid-container">
                      <h4>Lista de Configuraciones ({docuConfig.length})</h4>
                      
                      {loading && (
                        <div className="loading-message">
                          <p>🔄 Cargando configuraciones...</p>
                        </div>
                      )}
                      
                      {error && (
                        <div className="error-message">
                          <p>❌ {error}</p>
                        </div>
                      )}
                      
                      {!loading && !error && (
                        <div className="docu-grid">
                          <div className="grid-header">
                            <div className="grid-col col-aplica">Aplicado a</div>
                            <div className="grid-col col-documento">Nombre del Documento</div>
                            <div className="grid-col col-nota">Notas</div>
                            <div className="grid-col col-autoridad">Autoridad Gestora</div>
                          </div>
                          
                          <div className="grid-body">
                            {docuConfig.length === 0 ? (
                              <div className="no-data">
                                <p>No hay configuraciones disponibles</p>
                              </div>
                            ) : (
                              docuConfig.map((row) => (
                                <div 
                                  key={row.id}
                                  className={`grid-row ${
                                    selectedRow?.id === row.id ? 'selected' : ''
                                  }`}
                                  onClick={() => handleRowSelect(row)}
                                >
                                  <div className="grid-col col-aplica">
                                    <span className={`aplica-badge ${row.aplica_a}`}>
                                      {row.aplica_a === 'vehiculo' ? '🚗 Vehículo' : '👨‍✈️ Conductor'}
                                    </span>
                                  </div>
                                  <div className="grid-col col-documento">
                                    {row.nombre_documento}
                                  </div>
                                  <div className="grid-col col-nota">
                                    {row.nota || '-'}
                                  </div>
                                  <div className="grid-col col-autoridad">
                                    {row.autoridad_relacion || '-'}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Zona de botones de acción - derecha */}
                    <div className="config-actions">
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-nuevo"
                          onClick={() => onOpenNuevoDocumento(false, null)}
                        >
                          ➕ Nuevo Documento
                        </button>
                        <button 
                          className="btn-action btn-editar"
                          disabled={!selectedRow}
                          onClick={handleEditDocument}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn-action btn-eliminar"
                          disabled={!selectedRow}
                          onClick={async () => {
                            // delegar a handler específico
                            await handleDeleteConfig();
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                        <button className="btn-action btn-actualizar">
                          🔄 Actualizar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportesDocuModal;
