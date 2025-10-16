import React, { useState, useEffect, useRef } from 'react';
import './TiposDeBoletaModal.css';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

const TiposDeBoletaModal = ({ isOpen, onClose }) => {
  const [tiposBoletas, setTiposBoletas] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNuevoMode, setIsNuevoMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmCounts, setConfirmCounts] = useState(null); // { boletas, manifiesto, materiales, transa }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successResult, setSuccessResult] = useState(null); // same structure with counts
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados para notificaciones (como en FamiliasModal)
  const [notification, setNotification] = useState(null);
  
  // Estado para el modal de confirmación
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Referencia para el textbox
  const textboxRef = useRef(null);

  // Función para mostrar notificaciones (como en FamiliasModal)
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000); // Se oculta después de 4 segundos
  };

  // Cargar tipos de boletas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarTiposBoletas();
      resetearEstados();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetearEstados = () => {
    setSelectedTipo(null);
    setNombreEdit('');
    setIsEditing(false);
    setIsNuevoMode(false);
  };

  const cargarTiposBoletas = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/tipo-boletas');
      const data = await response.json();
      
      if (data.success) {
        setTiposBoletas(data.data);
      } else {
        console.error('Error al cargar tipos de boletas:', data.error);
        showNotification('Error al cargar los datos', 'error');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      showNotification('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (tipo) => {
    if (isNuevoMode) {
      // Si estamos en modo nuevo, cancelar y resetear
      setIsNuevoMode(false);
      setIsEditing(false);
    }
    setSelectedTipo(tipo);
    setNombreEdit(tipo.nombre);
  };

  const handleNuevo = () => {
    setSelectedTipo(null);
    setNombreEdit('');
    setIsEditing(true);
    setIsNuevoMode(true);
    
    // Poner foco en el textbox después de un pequeño delay
    setTimeout(() => {
      if (textboxRef.current) {
        textboxRef.current.focus();
      }
    }, 100);
  };

  const handleGuardarNuevo = async () => {
    if (!nombreEdit.trim()) {
      showNotification('El nombre no puede estar vacío', 'error');
      return;
    }
    
    if (nombreEdit.length > 20) {
      showNotification('El nombre no puede exceder 20 caracteres', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/tipo-boletas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nombreEdit.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('✅ Tipo de boleta creado exitosamente', 'success');
        cargarTiposBoletas();
        resetearEstados();
      } else {
        showNotification(`❌ ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error al crear tipo de boleta:', error);
      showNotification('❌ Error de conexión con el servidor', 'error');
    }
  };

  const handleEditar = () => {
    if (!selectedTipo) {
      showNotification('⚠️ Debe seleccionar un tipo de boleta', 'warning');
      return;
    }
    setIsEditing(true);
    setIsNuevoMode(false);
    
    // Poner foco en el textbox
    setTimeout(() => {
      if (textboxRef.current) {
        textboxRef.current.focus();
      }
    }, 100);
  };

  const handleGuardarEdicion = async () => {
    if (!nombreEdit.trim()) {
      showNotification('❌ El nombre no puede estar vacío', 'error');
      return;
    }
    
    if (nombreEdit.length > 20) {
      showNotification('❌ El nombre no puede exceder 20 caracteres', 'error');
      return;
    }

    // Antes de ejecutar la actualización, pedir contadores y confirmar con el usuario
    try {
      const countsResp = await fetch(`http://localhost:4000/api/tipo-boletas/counts/${encodeURIComponent(selectedTipo.nombre)}`);
      if (!countsResp.ok) throw new Error('No se pudieron obtener conteos previos');
      const countsData = await countsResp.json();
      if (!countsData.success) throw new Error('Error al obtener conteos');

  const { boletas, manifiesto, materiales, transa } = countsData.counts || {};
  // Abrir modal de confirmación elegante
      setConfirmCounts({ boletas, manifiesto, materiales, transa });
      setShowConfirmModal(true);
      return;
    } catch (error) {
      console.error('Error al obtener conteos o actualizar:', error);
      showNotification('❌ Error al obtener conteos o actualizar el tipo', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ejecutar la actualización después de la confirmación del usuario
  const executeUpdateAfterConfirm = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:4000/api/tipo-boletas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreOriginal: selectedTipo.nombre, nombreNuevo: nombreEdit.trim() })
      });
      const data = await response.json();
      if (data.success) {
        // Mostrar success modal con detalles y no cerrar automáticamente
        setSuccessResult({ boletas: data.boletasActualizadas||0, manifiesto: data.manifiestoActualizados||0, materiales: data.materialesActualizados||0, transa: data.transaActualizados||0 });
        setShowSuccessModal(true);
        cargarTiposBoletas();
        resetearEstados();
      } else {
        showNotification(`❌ ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('Error en la actualización:', err);
      showNotification('❌ Error al ejecutar la actualización', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Modales inline: ConfirmCountsModal y SuccessResultModal
  const ConfirmCountsModal = ({ counts, onCancel, onConfirm }) => {
    if (!counts) return null;
    return (
      <div className="confirm-overlay">
        <div className="confirm-modal">
          <h3>Confirmar actualización de tipo</h3>
          <p>Se van a actualizar los siguientes registros si continúa la operación:</p>
          <ul>
            <li><strong>{counts.boletas}</strong> registro(s) en <strong>Tabla de Boletas</strong></li>
            <li><strong>{counts.manifiesto}</strong> registro(s) en <strong>Tabla de Manifiestos (manifiesto3)</strong></li>
            <li><strong>{counts.materiales}</strong> registro(s) en <strong>Tabla de Existencias (materiales_proceso)</strong></li>
            <li><strong>{counts.transa}</strong> registro(s) en <strong>Tabla de trazabilidad (transa_ar)</strong></li>
          </ul>
          <div className="confirm-actions">
            <button className="confirm-cancel" onClick={onCancel} disabled={isProcessing}>Cancelar</button>
            <button className="confirm-ok" onClick={onConfirm} disabled={isProcessing}>Ejecutar actualización</button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessResultModal = ({ result, onClose }) => {
    if (!result) return null;
    return (
      <div className="confirm-overlay">
        <div className="success-modal">
          <h2>Actualización completada</h2>
          <p>Se actualizaron los siguientes registros:</p>
          <div className="success-grid">
            <div className="success-item"><div className="success-count">{result.boletas}</div><div className="success-label">Tabla de Boletas</div></div>
            <div className="success-item"><div className="success-count">{result.manifiesto}</div><div className="success-label">Tabla de Manifiestos (manifiesto3)</div></div>
            <div className="success-item"><div className="success-count">{result.materiales}</div><div className="success-label">Tabla de Existencias (materiales_proceso)</div></div>
            <div className="success-item"><div className="success-count">{result.transa}</div><div className="success-label">Tabla de trazabilidad (transa_ar)</div></div>
          </div>
          <div className="success-actions">
            <button className="success-close" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  const handleCancelar = () => {
    if (isNuevoMode) {
      resetearEstados();
    } else {
      setNombreEdit(selectedTipo ? selectedTipo.nombre : '');
      setIsEditing(false);
    }
  };

  const handleEliminar = () => {
    if (!selectedTipo) {
      showNotification('⚠️ Debe seleccionar un tipo de boleta', 'warning');
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmDelete(true);
  };

  const confirmarEliminacion = async () => {
    if (!selectedTipo) return;

    try {
      const response = await fetch(`http://localhost:4000/api/tipo-boletas/${encodeURIComponent(selectedTipo.nombre)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('🗑️ Tipo de boleta eliminado exitosamente', 'success');
        cargarTiposBoletas();
        resetearEstados();
      } else {
        if (data.isInUse) {
          showNotification(`⚠️ ${data.error}`, 'warning');
        } else {
          showNotification(`❌ ${data.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error al eliminar tipo de boleta:', error);
      showNotification('❌ Error de conexión con el servidor', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-tipos">
      <div className="modal-container-tipos">
        <div className="modal-header-tipos">
          <h2>Tipos de Boleta</h2>
          <button className="close-button-tipos" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-content-tipos">
          {/* Grid de tipos de boletas */}
          <div className="grid-section-tipos">
            <div className="grid-container-tipos">
              {loading ? (
                <div className="loading-tipos">Cargando...</div>
              ) : (
                <table className="grid-table-tipos">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposBoletas.map((tipo, index) => (
                      <tr 
                        key={index}
                        className={selectedTipo?.nombre === tipo.nombre ? 'selected-tipos' : ''}
                        onClick={() => handleRowClick(tipo)}
                      >
                        <td>{tipo.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="action-buttons-tipos">
              <button 
                className="action-btn-tipos nuevo-tipos" 
                onClick={handleNuevo}
                disabled={isProcessing}
              >
                Nuevo
              </button>
              <button 
                className={`action-btn-tipos editar-tipos ${!selectedTipo ? 'disabled-tipos' : ''}`}
                onClick={handleEditar}
                disabled={!selectedTipo || isProcessing}
              >
                Editar
              </button>
              <button 
                className={`action-btn-tipos eliminar-tipos ${!selectedTipo ? 'disabled-tipos' : ''}`}
                onClick={handleEliminar}
                disabled={!selectedTipo || isProcessing}
              >
                Eliminar
              </button>
            </div>
          </div>

          {/* Textbox para edición */}
          <div className="edit-section-tipos">
            <div className="textbox-container-tipos">
              <label>Nombre del tipo de boleta:</label>
              <input
                ref={textboxRef}
                type="text"
                className="textbox-tipos"
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                maxLength="20"
                disabled={!isEditing}
                placeholder={isNuevoMode ? "Ingrese el nombre del nuevo tipo" : "Seleccione un tipo y presione Editar"}
              />
              
              {isEditing && (
                <div className="edit-buttons-tipos">
                  <button 
                    className="save-btn-tipos"
                    onClick={isNuevoMode ? handleGuardarNuevo : handleGuardarEdicion}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (isNuevoMode ? 'Creando...' : 'Guardando...') : (isNuevoMode ? 'Crear' : 'Guardar')}
                  </button>
                  <button 
                    className="cancel-btn-tipos"
                    onClick={handleCancelar}
                    disabled={isProcessing}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmación elegante antes de ejecutar la actualización */}
      {showConfirmModal && (
        <ConfirmCountsModal
          counts={confirmCounts}
          onCancel={() => { setShowConfirmModal(false); setConfirmCounts(null); }}
          onConfirm={() => executeUpdateAfterConfirm()}
        />
      )}

      {/* Modal de resultado (persistente) */}
      {showSuccessModal && (
        <SuccessResultModal
          result={successResult}
          onClose={() => { setShowSuccessModal(false); setSuccessResult(null); }}
        />
      )}

      {/* Componente de Notificación (como en FamiliasModal) */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: notification.type === 'success' ? '#28a745' : 
                          notification.type === 'error' ? '#dc3545' : 
                          notification.type === 'warning' ? '#ffc107' : '#007bff',
          color: notification.type === 'warning' ? '#000' : '#fff',
          padding: '20px 28px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
          maxWidth: '450px',
          minWidth: '300px',
          fontSize: '15px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeInScale 0.3s ease-out',
          border: `2px solid ${notification.type === 'success' ? '#1e7e34' : 
                                notification.type === 'error' ? '#bd2130' : 
                                notification.type === 'warning' ? '#d39e00' : '#0056b3'}`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            {notification.type === 'success' ? '✓' : 
             notification.type === 'error' ? '✕' : 
             notification.type === 'warning' ? '⚠' : 'ℹ'}
          </div>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '16px',
              cursor: 'pointer',
              marginLeft: 'auto',
              opacity: 0.7,
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal 
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmarEliminacion}
        itemName={selectedTipo?.nombre || ''}
        itemType="tipo de boleta"
      />
    </div>
  );
};

export default TiposDeBoletaModal;
