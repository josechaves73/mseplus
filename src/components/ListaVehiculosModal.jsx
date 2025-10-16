import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import './ListaVehiculosModal.css';
import MensajeModal from './MensajeModal';
import VehiculoDocumentosModal from './VehiculoDocumentosModal';
import BoletasRelacionadasModal from './BoletasRelacionadasModal';
import VehiculoNuevoModal from './VehiculoNuevoModal';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const ListaVehiculosModal = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showExportModal, setShowExportModal] = useState(false);
  // Estado removido: modal NuevoVehiculo fue eliminado
  const [showVehiculoNuevo, setShowVehiculoNuevo] = useState(false);
  const [editVehiculoData, setEditVehiculoData] = useState(null);
  const [showVehDocsModal, setShowVehDocsModal] = useState(false);
  const [selectedPlacaForDocs, setSelectedPlacaForDocs] = useState(null);
  const [showBoletasVehModal, setShowBoletasVehModal] = useState(false);
  const [boletasVehParams, setBoletasVehParams] = useState({ placa: null, nombre: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ placa: null, nombre: null });
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, accion: '' });

  // Función helper para mostrar mensaje de permisos denegados
  const mostrarMensajePermisoDenegado = useCallback((accion) => {
    setPermisoDenegadoMensaje({ show: true, accion });
  }, []);

  const cerrarMensajePermisoDenegado = useCallback(() => {
    setPermisoDenegadoMensaje({ show: false, accion: '' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchVehiculos();
    }
  }, [isOpen]);

  useEffect(() => {
    // Extraer marcas y estados únicos de los vehículos
    const uniqueMarcas = [...new Set(vehiculos.map(v => v.marca).filter(Boolean))];
    // Ahora usamos estado_documentacion calculado por backend
    const uniqueEstados = [...new Set(vehiculos.map(v => v.estado_documentacion).filter(Boolean))];
    setMarcas(uniqueMarcas);
    setEstados(uniqueEstados);
  }, [vehiculos]);

  useEffect(() => {
    // Filtrar vehículos basado en los criterios de búsqueda
    let filtered = vehiculos;

    if (searchTerm) {
      filtered = filtered.filter(vehiculo =>
        vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculo.anotacion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMarca) {
      filtered = filtered.filter(vehiculo => vehiculo.marca === selectedMarca);
    }

    if (selectedEstado) {
      filtered = filtered.filter(vehiculo => vehiculo.estado_documentacion === selectedEstado);
    }

    setFilteredVehiculos(filtered);
    setSelectedIndex(-1); // Reset selection when filtering
  }, [vehiculos, searchTerm, selectedMarca, selectedEstado]);

  const fetchVehiculos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vehiculos/document-status`);
      if (!response.ok) {
        throw new Error('Error al cargar vehículos');
      }
      const data = await response.json();
      // Backend devuelve vehiculos con campo estado_documentacion
      setVehiculos(data.vehiculos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (index) => {
    setSelectedIndex(index);
  };

  const handleVerDocumentoClick = (vehiculo) => {
    setSelectedPlacaForDocs(vehiculo.placa);
    setShowVehDocsModal(true);
  };
  const handleNuevoVehiculoClick = useCallback(() => {
    console.log('🔍 Verificando permiso para nuevo vehículo:', hasPermission('Transportes', 'Lista de Vehículos', 'nuevo'));
    if (!hasPermission('Transportes', 'Lista de Vehículos', 'nuevo')) {
      mostrarMensajePermisoDenegado('Nuevo Vehículo');
      return;
    }
    setEditVehiculoData(null);
    setShowVehiculoNuevo(true);
  }, [hasPermission, mostrarMensajePermisoDenegado]);

  const handleEditarVehiculoClick = useCallback(() => {
    console.log('🔍 Verificando permiso para editar vehículo:', hasPermission('Transportes', 'Lista de Vehículos', 'editar'));
    if (!hasPermission('Transportes', 'Lista de Vehículos', 'editar')) {
      mostrarMensajePermisoDenegado('Editar Vehículo');
      return;
    }
    if (selectedIndex >= 0 && filteredVehiculos[selectedIndex]) {
      const v = filteredVehiculos[selectedIndex];
      setEditVehiculoData({
        placa: v.placa,
        marca: v.marca,
        nombre: v.nombre,
        anotacion: v.anotacion || ''
      });
      setShowVehiculoNuevo(true);
    } else {
      alert('Por favor seleccione un vehículo para editar');
    }
  }, [selectedIndex, filteredVehiculos, hasPermission, mostrarMensajePermisoDenegado]);

  const handleKeyDown = useCallback((event) => {
    if (!filteredVehiculos.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredVehiculos.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          handleEditarVehiculoClick();
        }
        break;
      default:
        break;
    }
  }, [filteredVehiculos, selectedIndex, handleEditarVehiculoClick]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleExportClick = () => {
    console.log('🔍 Verificando permiso para exportar vehículos:', hasPermission('Transportes', 'Lista de Vehículos', 'exportar'));
    if (!hasPermission('Transportes', 'Lista de Vehículos', 'exportar')) {
      mostrarMensajePermisoDenegado('Exportar Vehículos');
      return;
    }
    setShowExportModal(true);
  };

  const handleExportToExcel = () => {
    const exportData = filteredVehiculos.map(vehiculo => ({
      'Placa': vehiculo.placa,
      'Marca': vehiculo.marca,
      'Nombre': vehiculo.nombre,
      'Anotación': vehiculo.anotacion,
      'Estado Documentación': vehiculo.estado_documentacion || vehiculo.estado || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehículos');
    
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    const filename = `vehiculos_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
    setShowExportModal(false);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Función para refrescar la lista
  const handleActualizarClick = () => {
    fetchVehiculos();
  };

  const handleEliminarVehiculoClick = () => {
    console.log('🔍 Verificando permiso para eliminar vehículo:', hasPermission('Transportes', 'Lista de Vehículos', 'eliminar'));
    if (!hasPermission('Transportes', 'Lista de Vehículos', 'eliminar')) {
      mostrarMensajePermisoDenegado('Eliminar Vehículo');
      return;
    }
    if (selectedIndex >= 0 && filteredVehiculos[selectedIndex]) {
      const v = filteredVehiculos[selectedIndex];
      setDeleteTarget({ placa: v.placa, nombre: v.nombre });
      // reset previous delete messages/state so modal opens clean
      setDeleteMessage(null);
      setDeleteBlocked(false);
      setDeleting(false);
      setShowDeleteConfirm(true);
    }
  };

  const handleBoletasRelacionadasClick = () => {
    console.log('🔍 Verificando permiso para ver boletas relacionadas:', hasPermission('Transportes', 'Lista de Vehículos', 'boletas_relacionadas'));
    if (!hasPermission('Transportes', 'Lista de Vehículos', 'boletas_relacionadas')) {
      mostrarMensajePermisoDenegado('Ver Boletas Relacionadas');
      return;
    }
    if (selectedIndex >= 0 && filteredVehiculos[selectedIndex]) {
      const v = filteredVehiculos[selectedIndex];
      const placaNorm = (v.placa || '').toString().trim().toUpperCase();
      setBoletasVehParams({ placa: placaNorm, nombre: v.nombre });
      setShowBoletasVehModal(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget({ placa: null, nombre: null });
    setDeleteMessage(null);
    setDeleteBlocked(false);
    setDeleting(false);
  };

  const handleConfirmDelete = () => {
    (async () => {
      if (!deleteTarget.placa) return;
      setDeleting(true);
      setDeleteMessage(null);
      try {
        const res = await fetch(`${API_BASE_URL}/vehiculos/${encodeURIComponent(deleteTarget.placa)}`, {
          method: 'DELETE'
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const err = (data && data.error) ? data.error : (data && data.message) ? data.message : 'Error al eliminar vehículo';
          setDeleteMessage({ type: 'error', text: err });
          // Si el backend indica que tiene boletas relacionadas, bloqueamos el botón Eliminar
          if (res.status === 400 && data && typeof data.boletasCount === 'number' && data.boletasCount > 0) {
            setDeleteBlocked(true);
          }
          setDeleting(false);
          return;
        }

        // Éxito: mostrar mensaje pero NO cerrar automáticamente
        setDeleteMessage({ type: 'success', text: data && data.message ? data.message : 'Vehículo eliminado correctamente' });
        setDeleting(false);
        // refrescar lista inmediatamente (el modal sigue abierto para que el usuario vea el mensaje)
        fetchVehiculos();
      } catch (err) {
        console.error('Error en eliminación:', err);
        setDeleteMessage({ type: 'error', text: 'Error de conexión al eliminar vehículo' });
        setDeleting(false);
      }
    })();
  };
  

  if (!isOpen) return null;

  return (
    <div id="lista-vehiculos-modal-root" className="lista-vehiculos-modal-overlay">
      <div className="lista-vehiculos-modal">
        <div className="lista-vehiculos-modal-header">
          <h2 className="lista-vehiculos-modal-title">Lista de Vehículos</h2>
          <button className="lista-vehiculos-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="lista-vehiculos-modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por placa, marca, nombre o anotación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="content-wrapper">
            <div className="vehiculos-table-container">
              {loading && (
                <div className="lista-loading-overlay">
                  <div className="lista-loading-content">
                    <div className="lista-loading-message">Cargando y Actualizado Información</div>
                    <div className="lista-loading-bar">
                      <div className="lista-loading-progress" />
                    </div>
                  </div>
                </div>
              )}
              {!loading && null}
              {error && <p className="error">Error: {error}</p>}
              {!loading && !error && (
                <>
                  <table className="vehiculos-table">
                    <thead className="vehiculos-table-header">
                      <tr className="filter-row">
                        <th key="filter-placa" className="filter-col-placa"></th>
                        <th key="filter-marca" className="filter-col-marca">
                          <select
                            value={selectedMarca}
                            onChange={(e) => setSelectedMarca(e.target.value)}
                            className="column-filter-select"
                          >
                            <option value="">Todas</option>
                            {marcas.map(marca => (
                              <option key={marca} value={marca}>
                                {marca}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th key="filter-nombre" className="filter-col-nombre"></th>
                        <th key="filter-anotacion" className="filter-col-anotacion"></th>
                        <th key="filter-estado" className="filter-col-estado">
                          <select
                            value={selectedEstado}
                            onChange={(e) => setSelectedEstado(e.target.value)}
                            className="column-filter-select"
                          >
                            <option value="">Todos</option>
                            {estados.map(estado => (
                              <option key={estado} value={estado}>
                                {estado}
                              </option>
                            ))}
                          </select>
                        </th>
                      </tr>
                      <tr className="header-row">
                        <th>Placa</th>
                        <th>Marca</th>
                        <th>Nombre</th>
                        <th>Anotación</th>
                        <th>Estado Documentación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehiculos.map((vehiculo, index) => (
                        <tr
                          key={vehiculo.placa}
                          data-index={index}
                          className={selectedIndex === index ? 'selected' : ''}
                          onClick={() => handleRowClick(index)}
                        >
                          <td>{vehiculo.placa}</td>
                          <td>{vehiculo.marca}</td>
                          <td>{vehiculo.nombre}</td>
                          <td>{vehiculo.anotacion}</td>
                          <td className={`estado-celda ${vehiculo.estado_documentacion === 'Vigente' ? 'estado-vigente' : (vehiculo.estado_documentacion === 'Vigente por vencer' ? 'estado-por-vencer' : (vehiculo.estado_documentacion === 'Doc. Vencidos' ? 'estado-vencido' : 'estado-sin-doc'))}`}>
                            <div className="estado-text">{vehiculo.estado_documentacion}</div>
                            {vehiculo.estado_documentacion && vehiculo.estado_documentacion !== 'Sin Documentos' && (
                              <button className="ver-doc-btn" onClick={(e) => { e.stopPropagation(); handleVerDocumentoClick(vehiculo); }}>
                                <span className="icon">📄</span>
                                <span>Ver Documento</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredVehiculos.length === 0 && <p>No hay vehículos para mostrar.</p>}
                </>
              )}
            </div>
            <div className="action-buttons">
              <button className="action-btn nuevo" onClick={handleNuevoVehiculoClick}>
                ➕ Nuevo
              </button>
              <button
                className="action-btn editar"
                onClick={handleEditarVehiculoClick}
                disabled={selectedIndex < 0 || !filteredVehiculos[selectedIndex]}
                title={selectedIndex < 0 || !filteredVehiculos[selectedIndex] ? 'Seleccione un vehículo para editar' : 'Editar vehículo'}
              >
                ✏️ Editar
              </button>
                <button
                  className="action-btn boletas-rel"
                  onClick={handleBoletasRelacionadasClick}
                  disabled={selectedIndex < 0 || !filteredVehiculos[selectedIndex]}
                  title={selectedIndex < 0 ? 'Seleccione un vehículo' : 'Ver boletas relacionadas'}
                >
                  📌 Boletas Relacionadas
                </button>
              <button className="action-btn exportar" onClick={handleExportClick}>
                📤 Exportar
              </button>
              <button
                className="action-btn eliminar"
                onClick={handleEliminarVehiculoClick}
                disabled={selectedIndex < 0 || !filteredVehiculos[selectedIndex]}
              >
                🗑️ Eliminar
              </button>
              <button
                className="action-btn actualizar"
                onClick={handleActualizarClick}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Modal de exportación usando MensajeModal */}
        <MensajeModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          title="Exportar Vehículos"
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
            ¿Desea exportar la lista de vehículos a Excel?
          </p>
        </MensajeModal>
        
        {/* Modal de Nuevo Vehículo (nuevo independiente) */}
        <VehiculoNuevoModal
          isOpen={showVehiculoNuevo}
          onClose={() => { setShowVehiculoNuevo(false); setEditVehiculoData(null); }}
          editData={editVehiculoData}
          onUpdated={() => {}}
        />
        {/* Modal para ver documentos por placa */}
        <VehiculoDocumentosModal
          isOpen={showVehDocsModal}
          onClose={() => { setShowVehDocsModal(false); setSelectedPlacaForDocs(null); }}
          placa={selectedPlacaForDocs}
        />
        {/* Modal para ver boletas relacionadas por placa */}
        <BoletasRelacionadasModal
          isOpen={showBoletasVehModal}
          onClose={() => { setShowBoletasVehModal(false); setBoletasVehParams({ placa: null, nombre: null }); }}
          fetchParamName="camion_p"
          fetchParamValue={boletasVehParams.placa}
          headerPrimary={boletasVehParams.placa}
          headerSecondary={boletasVehParams.nombre}
          columnOverrides={{ camion: 'chofer' }}
          columnHeaderOverrides={{ camion: 'Conductor' }}
        />

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
            <p>¿Está seguro que desea eliminar el siguiente vehículo?</p>
            <p><strong>Placa:</strong> {deleteTarget.placa}</p>
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

export default ListaVehiculosModal;
