import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import './ListaConductoresModal.css';
import MensajeModal from './MensajeModal';
import ConductorDocumentosModal from './ConductorDocumentosModal';
import BoletasRelacionadasModal from './BoletasRelacionadasModal';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const ListaConductoresModal = ({ isOpen, onClose, onOpenNuevoConductor }) => {
  const { hasPermission } = useAuth();
  const [conductores, setConductores] = useState([]);
  const [filteredConductores, setFilteredConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todo');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ codigo_chofer: null, nombre: null });
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docsTarget, setDocsTarget] = useState(null);
  const [showBoletasModal, setShowBoletasModal] = useState(false);
  const [boletasTarget, setBoletasTarget] = useState(null);
  const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, accion: '' });

  // Función helper para mostrar mensaje de permisos denegados
  const mostrarMensajePermisoDenegado = useCallback((accion) => {
    setPermisoDenegadoMensaje({ show: true, accion });
  }, []);

  const cerrarMensajePermisoDenegado = useCallback(() => {
    setPermisoDenegadoMensaje({ show: false, accion: '' });
  }, []);

  useEffect(() => {
    if (isOpen) fetchConductores();
  }, [isOpen]);

  useEffect(() => {
    let filtered = conductores;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        String(c.codigo_chofer).toLowerCase().includes(term) ||
        (c.nombre || '').toLowerCase().includes(term) ||
        (c.telefonos || '').toLowerCase().includes(term)
      );
    }

    // Apply estado filter (Todo means no filter)
    if (estadoFilter && estadoFilter !== 'Todo') {
      filtered = filtered.filter(c => (c.estado || 'Sin Documentos') === estadoFilter);
    }
    setFilteredConductores(filtered);
    setSelectedIndex(-1);
  }, [conductores, searchTerm, estadoFilter]);


  const fetchConductores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/chofer`);
      if (!response.ok) throw new Error('Error al cargar conductores');
      const data = await response.json();
      setConductores(data.choferes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = index => setSelectedIndex(index);

  const handleEditarConductor = useCallback(() => {
    console.log('🔍 Verificando permiso para editar conductor:', hasPermission('Transportes', 'Lista de Conductores', 'editar'));
    if (!hasPermission('Transportes', 'Lista de Conductores', 'editar')) {
      mostrarMensajePermisoDenegado('Editar Conductor');
      return;
    }
    if (selectedIndex >= 0 && filteredConductores[selectedIndex]) {
      const conductorSeleccionado = filteredConductores[selectedIndex];
      console.log('🔧 Editando conductor:', conductorSeleccionado);
      
      // Llamar función para abrir modal de edición con los datos
      if (onOpenNuevoConductor) {
        onOpenNuevoConductor(conductorSeleccionado);
      }
    } else {
      alert('Selecciona un conductor para editar');
    }
  }, [selectedIndex, filteredConductores, onOpenNuevoConductor, hasPermission, mostrarMensajePermisoDenegado]);

  const handleKeyDown = useCallback((event) => {
    // If Boletas modal is open, don't handle keys here so modal can capture them
    if (showBoletasModal) return;
    if (!filteredConductores.length) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev < filteredConductores.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (selectedIndex >= 0) handleEditarConductor();
        break;
      default:
        break;
    }
  }, [filteredConductores, selectedIndex, handleEditarConductor, showBoletasModal]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleExportClick = () => {
    console.log('🔍 Verificando permiso para exportar conductores:', hasPermission('Transportes', 'Lista de Conductores', 'exportar'));
    if (!hasPermission('Transportes', 'Lista de Conductores', 'exportar')) {
      mostrarMensajePermisoDenegado('Exportar Conductores');
      return;
    }
    setShowExportModal(true);
  };
  const handleExportToExcel = () => {
    const exportData = filteredConductores.map(c => ({
      'Código': c.codigo_chofer,
      'Nombre': c.nombre,
      'Teléfonos': c.telefonos,
      'Estado': c.estado || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conductores');
    const now = new Date();
    const ts = now.toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
    XLSX.writeFile(workbook, `conductores_${ts}.xlsx`);
    setShowExportModal(false);
  };
  const handleCloseExportModal = () => setShowExportModal(false);
  const handleActualizarClick = () => fetchConductores();

  const handleBoletasRelacionadas = () => {
    console.log('🔍 Verificando permiso para ver boletas relacionadas:', hasPermission('Transportes', 'Lista de Conductores', 'boletas_relacionadas'));
    if (!hasPermission('Transportes', 'Lista de Conductores', 'boletas_relacionadas')) {
      mostrarMensajePermisoDenegado('Ver Boletas Relacionadas');
      return;
    }
    if (selectedIndex >= 0 && filteredConductores[selectedIndex]) {
      const conductor = filteredConductores[selectedIndex];
      setBoletasTarget(conductor);
      setShowBoletasModal(true);
    } else {
      alert('Selecciona un conductor para ver boletas relacionadas');
    }
  };
  // Al hacer clic en Nuevo, abrir el modal de nuevo conductor
  const handleNuevoConductor = () => {
    console.log('� Verificando permiso para nuevo conductor:', hasPermission('Transportes', 'Lista de Conductores', 'nuevo'));
    if (!hasPermission('Transportes', 'Lista de Conductores', 'nuevo')) {
      mostrarMensajePermisoDenegado('Nuevo Conductor');
      return;
    }
    console.log('�🔄 handleNuevoConductor llamado, onOpenNuevoConductor:', onOpenNuevoConductor);
    if (onOpenNuevoConductor) {
      console.log('🚀 Ejecutando onOpenNuevoConductor()');
      onOpenNuevoConductor();
    } else {
      console.log('❌ onOpenNuevoConductor no está definido');
    }
  };

  const handleEliminarConductor = () => {
    console.log('🔍 Verificando permiso para eliminar conductor:', hasPermission('Transportes', 'Lista de Conductores', 'eliminar'));
    if (!hasPermission('Transportes', 'Lista de Conductores', 'eliminar')) {
      mostrarMensajePermisoDenegado('Eliminar Conductor');
      return;
    }
    if (selectedIndex >= 0 && filteredConductores[selectedIndex]) {
      const conductor = filteredConductores[selectedIndex];
      setDeleteTarget({ 
        codigo_chofer: conductor.codigo_chofer, 
        nombre: conductor.nombre 
      });
      // Reset previous delete messages/state so modal opens clean
      setDeleteMessage(null);
      setDeleteBlocked(false);
      setDeleting(false);
      setShowDeleteConfirm(true);
    } else {
      alert('Selecciona un conductor para eliminar');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget({ codigo_chofer: null, nombre: null });
    setDeleteMessage(null);
    setDeleteBlocked(false);
    setDeleting(false);
  };

  const handleConfirmDelete = () => {
    (async () => {
      if (!deleteTarget.codigo_chofer) return;
      setDeleting(true);
      setDeleteMessage(null);
      
      try {
        // First check if conductor has related boletas
        const checkRes = await fetch(`${API_BASE_URL}/boletas/check-conductor/${encodeURIComponent(deleteTarget.codigo_chofer)}`);
        const checkData = await checkRes.json().catch(() => null);
        
        if (!checkRes.ok) {
          const err = (checkData && checkData.error) ? checkData.error : 'Error al verificar boletas relacionadas';
          setDeleteMessage({ type: 'error', text: err });
          setDeleting(false);
          return;
        }
        
        // If conductor has related boletas, block deletion
        if (checkData && checkData.hasBoletas) {
          setDeleteMessage({ 
            type: 'error', 
            text: `No se puede eliminar el conductor porque tiene ${checkData.boletascount || 'varias'} boleta(s) relacionada(s).` 
          });
          setDeleteBlocked(true);
          setDeleting(false);
          return;
        }
        
        // If no related boletas, proceed with deletion
        const deleteRes = await fetch(`${API_BASE_URL}/chofer/${encodeURIComponent(deleteTarget.codigo_chofer)}`, {
          method: 'DELETE'
        });
        const deleteData = await deleteRes.json().catch(() => null);
        
        if (!deleteRes.ok) {
          const err = (deleteData && deleteData.error) ? deleteData.error : 'Error al eliminar conductor';
          setDeleteMessage({ type: 'error', text: err });
          setDeleting(false);
          return;
        }
        
        // Success: show message but keep modal open for user to see
        setDeleteMessage({ type: 'success', text: deleteData && deleteData.message ? deleteData.message : 'Conductor eliminado correctamente' });
        setDeleting(false);
        // Refresh list after successful deletion
        fetchConductores();
      } catch (err) {
        console.error('Error en eliminación:', err);
        setDeleteMessage({ type: 'error', text: 'Error de conexión al eliminar conductor' });
        setDeleting(false);
      }
    })();
  };

  // Nota: La apertura del modal de documentos se mantiene disponible si se necesita programáticamente.

  if (!isOpen) return null;

  return (
    <div id="lista-conductores-modal-root" className="lista-conductores-modal-overlay">
      <div className="lista-conductores-modal">
        <div className="lista-conductores-modal-header">
          <h2 className="lista-conductores-modal-title">Lista de Conductores</h2>
          <button className="lista-conductores-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lista-conductores-modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por código, nombre o teléfonos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="content-wrapper">
            <div className="conductores-table-container">
              {loading && <p>Cargando conductores...</p>}
              {error && <p className="error">Error: {error}</p>}
              {!loading && !error && (
                <> 
                  <table className="conductores-table">
                    <thead className="conductores-table-header">
                      <tr className="header-row">
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Teléfonos</th>
                          <th className="estado-header">
                            <div className="estado-header-top">
                              <label htmlFor="estadoSelectHeader" className="sr-only">Estado</label>
                              <select id="estadoSelectHeader" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                                <option>Todo</option>
                                <option>Vigente</option>
                                <option>Vigente por vencer</option>
                                <option>Doc. Vencidos</option>
                                <option>Sin Documentos</option>
                              </select>
                            </div>
                            <div className="estado-header-label">Estado</div>
                          </th>
                        </tr>
                    </thead>
                    <tbody>
                      {filteredConductores.map((c, i) => (
                        <tr key={c.codigo_chofer} data-index={i} className={selectedIndex===i?'selected':''} onClick={()=>handleRowClick(i)}>
                          <td>{c.codigo_chofer}</td>
                          <td>{c.nombre}</td>
                          <td>{c.telefonos}</td>
                          <td className={`estado-celda ${c.estado === 'Vigente' ? 'estado-vigente' : (c.estado === 'Vigente por vencer' ? 'estado-por-vencer' : (c.estado === 'Doc. Vencidos' ? 'estado-vencido' : 'estado-sin-doc'))}`}>
                            <div className="estado-text">{c.estado || 'Sin Documentos'}</div>
                            {c.estado && c.estado !== 'Sin Documentos' && (
                              <button className="ver-doc-btn" onClick={(e) => { e.stopPropagation(); setDocsTarget(c); setShowDocsModal(true); }}>
                                <span className="icon">📄</span>
                                <span>Ver Documento</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredConductores.length===0 && <p>No hay conductores para mostrar.</p>}
                </>
              )}
            </div>
            <div className="action-buttons">
              <button className="action-btn nuevo" onClick={handleNuevoConductor}>➕ Nuevo</button>
              <button className="action-btn editar" onClick={handleEditarConductor} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona un conductor':'Editar conductor'}>✏️ Editar</button>
              <button 
                className="action-btn boletas-relacionadas" 
                onClick={handleBoletasRelacionadas}
                disabled={selectedIndex<0}
                title={selectedIndex<0? 'Selecciona un conductor' : 'Boletas Relacionadas'}
              >
                <span className="icon">📎</span>
                <span>Boletas Relacionadas</span>
              </button>
              <button className="action-btn exportar" onClick={handleExportClick}>📤 Exportar</button>
              <button className="action-btn eliminar" onClick={handleEliminarConductor} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona un conductor':'Eliminar conductor'}>🗑️ Eliminar</button>
              <button className="action-btn actualizar" onClick={handleActualizarClick}>🔄 Actualizar</button>
            </div>
          </div>
        </div>
        {/* Modal de exportación usando MensajeModal */}
        <MensajeModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          title="Exportar Conductores"
          buttons={[
            {
              label: 'Exportar',
              icon: '📤',
              onClick: handleExportToExcel,
              className: 'btn-confirm'
            },
            {
              label: 'Cancelar',
              icon: '❌',
              onClick: handleCloseExportModal,
              className: 'btn-cancel'
            }
          ]}
          size="medium"
        >
          <p style={{ textAlign: 'center', margin: '20px 0' }}>
            ¿Desea exportar la lista de conductores a Excel?
          </p>
        </MensajeModal>
        
        {/* Modal de confirmación de eliminación usando MensajeModal */}
        <MensajeModal
          isOpen={showDeleteConfirm}
          onClose={handleCancelDelete}
          title="Confirmar eliminación"
          buttons={[
            {
              label: 'Cancelar',
              onClick: handleCancelDelete,
              className: 'btn-secondary',
              disabled: deleting
            },
            ...(!deleteBlocked && (!deleteMessage || deleteMessage.type !== 'success') ? [{
              label: deleting ? 'Eliminando...' : 'Eliminar',
              onClick: handleConfirmDelete,
              className: 'btn-danger',
              disabled: deleting
            }] : [])
          ]}
          size="small"
        >
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p>¿Está seguro que desea eliminar el siguiente conductor?</p>
            <p><strong>Código:</strong> {deleteTarget.codigo_chofer}</p>
            <p><strong>Nombre:</strong> {deleteTarget.nombre}</p>
            {deleteMessage && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: deleteMessage.type === 'error' ? '#ffebee' : '#e8f5e8',
                color: deleteMessage.type === 'error' ? '#c62828' : '#2e7d32',
                border: `1px solid ${deleteMessage.type === 'error' ? '#ffcdd2' : '#c8e6c9'}`
              }}>
                {deleteMessage.text}
              </div>
            )}
          </div>
        </MensajeModal>
        
        {showDocsModal && docsTarget && (
          <ConductorDocumentosModal
            isOpen={showDocsModal}
            onClose={() => { setShowDocsModal(false); setDocsTarget(null); }}
            codigo={String(docsTarget.codigo_chofer || '').trim().toUpperCase()}
            nombre={docsTarget.nombre}
          />
        )}
        {showBoletasModal && boletasTarget && (
          <BoletasRelacionadasModal
            isOpen={showBoletasModal}
            onClose={() => { setShowBoletasModal(false); setBoletasTarget(null); }}
            codigoChofer={String(boletasTarget.codigo_chofer || '').trim().toUpperCase()}
            nombreChofer={boletasTarget.nombre}
          />
        )}
      </div>

      {/* Modal de mensaje de permisos denegados */}
      <MensajeModal
        isOpen={permisoDenegadoMensaje.show}
        title="Permiso Denegado"
        onClose={cerrarMensajePermisoDenegado}
        buttons={[
          {
            label: 'Aceptar',
            onClick: cerrarMensajePermisoDenegado,
            className: 'btn-primary'
          }
        ]}
      >
        <p>No dispone de permisos para realizar la acción: <strong>{permisoDenegadoMensaje.accion}</strong></p>
      </MensajeModal>
    </div>
  );
};

export default ListaConductoresModal;
