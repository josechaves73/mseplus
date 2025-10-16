import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ListaArticulosModal.css';
import NuevoArticuloModal from './NuevoArticuloModal';
import ArticulosXBoletaModal from './ArticulosXBoletaModal';
import MensajeModal from './MensajeModal';
import { useAuth } from '../contexts/AuthContext';

const ListaArticulosModal = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const [articulos, setArticulos] = useState([]);
  const [filteredArticulos, setFilteredArticulos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedUnidad, setSelectedUnidad] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNuevoArticuloModal, setShowNuevoArticuloModal] = useState(false);
  // Estado para modo edición y datos del artículo a editar
  const [editMode, setEditMode] = useState(false);
  const [articuloEditar, setArticuloEditar] = useState(null);
  // Estados para eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null); // null, 'checking', 'denied', 'allowed'
  const [deleteMessage, setDeleteMessage] = useState('');
  const [relatedTables, setRelatedTables] = useState([]);
  // Estado para modal de cambiar código
  const [showCambiarCodigoModal, setShowCambiarCodigoModal] = useState(false);
  const [cambiarCodigoLoading, setCambiarCodigoLoading] = useState(false);
  const [cambiarCodigoResult, setCambiarCodigoResult] = useState(null);
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [cambioAplicado, setCambioAplicado] = useState(false);
  const [articuloOriginal, setArticuloOriginal] = useState(null);
  // Estado para modal de trazabilidad por boleta
  const [showTrazabilidadModal, setShowTrazabilidadModal] = useState(false);
  const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, accion: '' });
  const tableRef = useRef(null);

  // Función helper para mostrar mensaje de permisos denegados
  const mostrarMensajePermisoDenegado = (accion) => {
    setPermisoDenegadoMensaje({ show: true, accion });
  };

  const cerrarMensajePermisoDenegado = () => {
    setPermisoDenegadoMensaje({ show: false, accion: '' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchArticulos();
      fetchUnidades();
      fetchFamilias();
    }
  }, [isOpen]);

  useEffect(() => {
    // Validar que articulos sea un array antes de filtrar
    if (!Array.isArray(articulos)) {
      setFilteredArticulos([]);
      return;
    }

    let filtered = articulos.filter(articulo =>
      articulo?.descri?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedUnidad && selectedUnidad !== '') {
      filtered = filtered.filter(articulo => {
        const articuloUnidad = String(articulo?.unidad || '').trim();
        return articuloUnidad === selectedUnidad.trim();
      });
    }

    if (selectedFamilia && selectedFamilia !== '') {
      filtered = filtered.filter(articulo => {
        const articuloFamilia = String(articulo?.familia || '').trim();
        return articuloFamilia === selectedFamilia.trim();
      });
    }

    setFilteredArticulos(filtered);
    setSelectedIndex(0);
  }, [articulos, searchTerm, selectedUnidad, selectedFamilia]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo manejar teclas de navegación si NO estamos en un input
      if (!isOpen || filteredArticulos.length === 0 || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredArticulos.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredArticulos.length]);

  // Scroll selected row into view
  useEffect(() => {
    if (isOpen && filteredArticulos.length > 0) {
      const selectedRow = document.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }
  }, [selectedIndex, isOpen, filteredArticulos]);

  const fetchArticulos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/articulos');
      if (!response.ok) {
        throw new Error('Error al cargar artículos');
      }
      const data = await response.json();
      // Validar que data.articulos sea un array
      if (Array.isArray(data.articulos)) {
        setArticulos(data.articulos);
      } else {
        console.error('Los artículos recibidos no son un array:', data);
        setArticulos([]);
      }
    } catch (err) {
      setError(err.message);
      setArticulos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/unidades');
      if (!response.ok) {
        throw new Error('Error al cargar unidades');
      }
      const data = await response.json();
      // Los endpoints de unidades devuelven array directamente
      if (Array.isArray(data)) {
        setUnidades(data);
      } else {
        console.error('Las unidades recibidas no son un array:', data);
        setUnidades([]);
      }
    } catch (err) {
      console.error('Error fetching unidades:', err);
      setUnidades([]);
    }
  };

  const fetchFamilias = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/familias');
      if (!response.ok) {
        throw new Error('Error al cargar familias');
      }
      const data = await response.json();
      // Verificar el formato de los datos de familias
      if (data.familias && Array.isArray(data.familias)) {
        setFamilias(data.familias);
      } else if (Array.isArray(data)) {
        setFamilias(data);
      } else {
        console.error('Las familias recibidas no son un array:', data);
        setFamilias([]);
      }
    } catch (err) {
      console.error('Error fetching familias:', err);
      setFamilias([]);
    }
  };

  const handleRowClick = (index) => {
    setSelectedIndex(index);
  };

  const handleExportClick = () => {
    console.log('🔍 Verificando permiso para exportar artículos:', hasPermission('Articulos', 'Lista de Articulos', 'exportar'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'exportar')) {
      mostrarMensajePermisoDenegado('Exportar Artículos');
      return;
    }
    setShowExportModal(true);
  };

  const handleExportToExcel = () => {
    try {
      // Preparar datos para exportación
      const dataToExport = filteredArticulos.map(articulo => ({
        'Código': articulo?.codigo || '',
        'Descripción': articulo?.descri || '',
        'Unidad': articulo?.unidad || '',
        'Familia': articulo?.familia || '',
        'Categoría': articulo?.categoria || '',
        'Tipo de Certificado': articulo?.tipo_cert || '',
        'Tipo de Residuo': articulo?.tipo_res || ''
      }));

      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Artículos');

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `articulos_${timestamp}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, filename);

      setShowExportModal(false);
    } catch (error) {
      console.error('Error al exportar artículos:', error);
      // Aquí podríamos mostrar un mensaje de error si fuera necesario
    }
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Abrir modal de eliminación
  const handleEliminarClick = () => {
    console.log('🔍 Verificando permiso para eliminar artículo:', hasPermission('Articulos', 'Lista de Articulos', 'eliminar'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'eliminar')) {
      mostrarMensajePermisoDenegado('Eliminar Artículo');
      return;
    }
    if (selectedIndex >= 0 && filteredArticulos[selectedIndex]) {
      setDeleteStatus(null);
      setDeleteMessage('');
      setRelatedTables([]);
      setShowDeleteModal(true);
    }
  };

  // Abrir modal de cambiar código
  const handleCambiarCodigoClick = () => {
    console.log('🔍 Verificando permiso para cambiar código de artículo:', hasPermission('Articulos', 'Lista de Articulos', 'cambiar_codigo'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'cambiar_codigo')) {
      mostrarMensajePermisoDenegado('Cambiar Código de Artículo');
      return;
    }
    if (selectedIndex >= 0 && filteredArticulos[selectedIndex]) {
      const articulo = filteredArticulos[selectedIndex];
      setArticuloOriginal(articulo);
      setNuevoCodigo('');
      setCambiarCodigoResult(null);
      setCambioAplicado(false);
      setShowCambiarCodigoModal(true);
    }
  };

  // Abrir modal de trazabilidad por boleta
  const handleTrazabilidadClick = () => {
    console.log('🔍 Verificando permiso para ver trazabilidad de artículo:', hasPermission('Articulos', 'Lista de Articulos', 'trazabilidad'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'trazabilidad')) {
      mostrarMensajePermisoDenegado('Ver Trazabilidad de Artículo');
      return;
    }
    if (selectedIndex >= 0 && filteredArticulos[selectedIndex]) {
      setShowTrazabilidadModal(true);
    }
  };

  // Cerrar modal de trazabilidad
  const handleCloseTrazabilidadModal = () => {
    setShowTrazabilidadModal(false);
  };

  // Aplicar cambio de código
  const handleAplicarCambioCodigo = async () => {
    // Si el cambio ya se aplicó, solo cerrar el modal
    if (cambioAplicado) {
      handleCloseCambiarCodigoModal();
      return;
    }

    if (!nuevoCodigo || nuevoCodigo.trim() === '') {
      setCambiarCodigoResult({ error: 'Debe ingresar un nuevo código' });
      return;
    }

    const articulo = articuloOriginal;
    if (!articulo) return;

    setCambiarCodigoLoading(true);
    setCambiarCodigoResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/articulos/cambiar-codigo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoActual: articulo.codigo,
          codigoNuevo: nuevoCodigo.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCambiarCodigoResult({
          success: true,
          message: data.message,
          tablasAfectadas: data.tablasAfectadas
        });
        setCambioAplicado(true);
        // Recargar la lista de artículos
        await fetchArticulos();
      } else {
        setCambiarCodigoResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error cambiando código:', error);
      setCambiarCodigoResult({ error: 'Error al cambiar el código del artículo' });
    } finally {
      setCambiarCodigoLoading(false);
    }
  };

  // Abrir modal en modo nuevo
  const handleNuevoArticuloClick = () => {
    console.log('🔍 Verificando permiso para nuevo artículo:', hasPermission('Articulos', 'Lista de Articulos', 'nuevo'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'nuevo')) {
      mostrarMensajePermisoDenegado('Nuevo Artículo');
      return;
    }
    setEditMode(false);
    setArticuloEditar(null);
    setShowNuevoArticuloModal(true);
  } 

  // Abrir modal en modo edición
  const handleEditarArticuloClick = () => {
    console.log('🔍 Verificando permiso para editar artículo:', hasPermission('Articulos', 'Lista de Articulos', 'editar'));
    if (!hasPermission('Articulos', 'Lista de Articulos', 'editar')) {
      mostrarMensajePermisoDenegado('Editar Artículo');
      return;
    }
    if (selectedIndex >= 0 && filteredArticulos[selectedIndex]) {
      setEditMode(true);
      setArticuloEditar(filteredArticulos[selectedIndex]);
      setShowNuevoArticuloModal(true);
    }
  }

  const handleSaveNuevoArticulo = async (nuevoArticulo) => {
    try {
      console.log('Artículo guardado:', nuevoArticulo);
      // Cerrar el modal
      setShowNuevoArticuloModal(false);

      // Recargar la lista de artículos para mostrar el nuevo registro
      await fetchArticulos();

    } catch (error) {
      console.error('Error al recargar los artículos:', error);
    }
  };

  const handleCloseNuevoArticuloModal = () => {
    setShowNuevoArticuloModal(false);
    setEditMode(false);
    setArticuloEditar(null);
  };

  const handleCloseCambiarCodigoModal = () => {
    setShowCambiarCodigoModal(false);
    setNuevoCodigo('');
    setCambiarCodigoResult(null);
    setCambioAplicado(false);
    setArticuloOriginal(null);
  };

  // Revisar relaciones del artículo seleccionado
  const handleRevisarRelaciones = async () => {
    const articulo = filteredArticulos[selectedIndex];
    if (!articulo) return;

    setDeleteStatus('checking');
    setDeleteMessage('Revisando relaciones...');
    setRelatedTables([]);

    try {
      const codigo = articulo.codigo;

      // Verificar en materiales_proceso
      const mpResponse = await fetch(`http://localhost:4000/api/materiales_proceso/exists/${codigo}`);
      const mpData = await mpResponse.json();
      const mpExists = mpData.exists;

      // Verificar en transa_ar
      const taResponse = await fetch(`http://localhost:4000/api/transa_ar/exists/${codigo}`);
      const taData = await taResponse.json();
      const taExists = taData.exists;

      const foundTables = [];
      if (mpExists) foundTables.push('materiales_proceso');
      if (taExists) foundTables.push('transa_ar');

      setRelatedTables(foundTables);

      if (foundTables.length > 0) {
        setDeleteStatus('denied');
        setDeleteMessage(`ELIMINACIÓN DENEGADA: El artículo está siendo usado en ${foundTables.join(' y ')}.`);
      } else {
        setDeleteStatus('allowed');
        setDeleteMessage('Eliminación Permitida: No se encontraron dependencias.');
      }
    } catch (error) {
      console.error('Error revisando relaciones:', error);
      setDeleteStatus('denied');
      setDeleteMessage('Error al revisar relaciones. Intente nuevamente.');
    }
  };

  // Eliminar el artículo si está permitido
  const handleEliminarArticulo = async () => {
    const articulo = filteredArticulos[selectedIndex];
    if (!articulo || deleteStatus !== 'allowed') return;

    try {
      const codigo = articulo.codigo;
      const deletedTables = [];

      // Eliminar de articulos_x_cliente (todos los registros para este código)
      const axcResponse = await fetch(`http://localhost:4000/api/articulos_x_cliente/${codigo}`, {
        method: 'DELETE'
      });
      if (axcResponse.ok) {
        const axcData = await axcResponse.json();
        if (axcData.affectedRows > 0) {
          deletedTables.push(`articulos_x_cliente (${axcData.affectedRows} registros)`);
        } else {
          deletedTables.push(`articulos_x_cliente (0 registros)`);
        }
      }

      // Eliminar de articulos
      const artResponse = await fetch(`http://localhost:4000/api/articulos/${codigo}`, {
        method: 'DELETE'
      });
      if (artResponse.ok) {
        const artData = await artResponse.json();
        if (artData.affectedRows > 0) {
          deletedTables.push(`articulos (${artData.affectedRows} registro)`);
        } else {
          deletedTables.push(`articulos (0 registros)`);
        }
      }

      // Recargar lista
      await fetchArticulos();

      setDeleteMessage(`Eliminación completada. Tablas afectadas: ${deletedTables.join(', ')}`);
      setDeleteStatus('completed');

    } catch (error) {
      console.error('Error eliminando artículo:', error);
      setDeleteMessage('Error al eliminar el artículo.');
      setDeleteStatus('error');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStatus(null);
    setDeleteMessage('');
    setRelatedTables([]);
  };

  if (!isOpen) return null;

  return (
    <div className="lista-articulos-modal-overlay">
      <div id="lista-articulos-modal-root" className="lista-articulos-modal">
        <div className="lista-articulos-modal-header">
          <h2 className="lista-articulos-modal-title">Lista de Artículos</h2>
          <button className="lista-articulos-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="lista-articulos-modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="content-wrapper">
            <div className="articulos-table-container">
              {loading && <p>Cargando artículos...</p>}
              {error && <p className="error">Error: {error}</p>}
              {!loading && !error && (
                <>
                  <table className="articulos-table" ref={tableRef}>
                    <thead className="articulos-table-header">
                      <tr className="filter-row">
                        <th key="filter-codigo" className="filter-col-codigo"></th>
                        <th key="filter-descripcion" className="filter-col-descripcion"></th>
                        <th key="filter-unidad" className="filter-col-unidad">
                          <select
                            value={selectedUnidad}
                            onChange={(e) => setSelectedUnidad(e.target.value)}
                            className="column-filter-select"
                          >
                            <option value="">Todas</option>
                            {unidades.map(unidad => (
                              <option key={unidad.nombreu} value={unidad.nombreu}>
                                {unidad.nombreu}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th key="filter-familia" className="filter-col-familia">
                          <select
                            value={selectedFamilia}
                            onChange={(e) => setSelectedFamilia(e.target.value)}
                            className="column-filter-select"
                          >
                            <option value="">Todas</option>
                            {familias.map(fam => (
                              <option key={fam.nombref} value={fam.nombref}>
                                {fam.nombref}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th key="filter-categoria" className="filter-col-categoria"></th>
                        <th key="filter-tipo-cert" className="filter-col-tipo-cert"></th>
                        <th key="filter-tipo-res" className="filter-col-tipo-res"></th>
                      </tr>
                      <tr className="header-row">
                        <th key="header-codigo" className="header-codigo">Código</th>
                        <th key="header-descripcion" className="header-descripcion">Descripción</th>
                        <th key="header-unidad" className="header-unidad">Unidad</th>
                        <th key="header-familia" className="header-familia">Familia</th>
                        <th key="header-categoria" className="header-categoria">Categoría</th>
                        <th key="header-tipo-cert" className="header-tipo-cert">Tipo de Certificado</th>
                        <th key="header-tipo-res" className="header-tipo-res">Tipo de Residuo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(filteredArticulos) ? filteredArticulos.map((articulo, index) => (
                        <tr
                          key={articulo?.codigo || index}
                          data-index={index}
                          className={selectedIndex === index ? 'selected' : ''}
                          onClick={() => handleRowClick(index)}
                        >
                          <td>{articulo?.codigo || ''}</td>
                          <td>{articulo?.descri || ''}</td>
                          <td>{articulo?.unidad || ''}</td>
                          <td>{articulo?.familia || ''}</td>
                          <td>{articulo?.categoria || ''}</td>
                          <td>{articulo?.tipo_cert || ''}</td>
                          <td>{articulo?.tipo_res || ''}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                            No hay artículos disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredArticulos.length === 0 && <p>No hay artículos para mostrar.</p>}
                </>
              )}
            </div>
            <div className="action-buttons">
              <button className="action-btn nuevo" onClick={handleNuevoArticuloClick}>
                ➕ Nuevo
              </button>
              <button
                className="action-btn editar"
                onClick={handleEditarArticuloClick}
                disabled={selectedIndex < 0 || !filteredArticulos[selectedIndex]}
                title={selectedIndex < 0 || !filteredArticulos[selectedIndex] ? 'Seleccione un artículo para editar' : 'Editar artículo'}
              >
                ✏️ Editar
              </button>
              <button className="action-btn exportar" onClick={handleExportClick}>
                📤 Exportar
              </button>
              <button 
                className="action-btn eliminar" 
                onClick={handleEliminarClick}
                disabled={selectedIndex < 0 || !filteredArticulos[selectedIndex]}
                title={selectedIndex < 0 || !filteredArticulos[selectedIndex] ? 'Seleccione un artículo para eliminar' : 'Eliminar artículo'}
              >
                🗑️ Eliminar
              </button>
              <button 
                className="action-btn cambiar-codigo" 
                onClick={handleCambiarCodigoClick}
                disabled={selectedIndex < 0 || !filteredArticulos[selectedIndex]}
                title={selectedIndex < 0 || !filteredArticulos[selectedIndex] ? 'Seleccione un artículo para cambiar código' : 'Cambiar Código de Artículo'}
              >
                🔄 Cambiar Código de Artículo
              </button>
              <button 
                className="action-btn trazabilidad" 
                onClick={handleTrazabilidadClick}
                disabled={selectedIndex < 0 || !filteredArticulos[selectedIndex]}
                title={selectedIndex < 0 || !filteredArticulos[selectedIndex] ? 'Seleccione un artículo para ver trazabilidad' : 'Ver Trazabilidad por Boleta'}
              >
                📊 Trazabilidad
              </button>
              <button className="action-btn actualizar" onClick={fetchArticulos}>
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Eliminar Artículo usando MensajeModal */}
      <MensajeModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Eliminar Artículo"
        size="medium"
        buttons={
          deleteStatus === null ? [
            {
              label: "Revisar Relaciones",
              icon: "🔍",
              onClick: handleRevisarRelaciones
            },
            {
              label: "Cancelar",
              icon: "❌",
              onClick: handleCloseDeleteModal,
              className: "btn-secondary"
            }
          ] : deleteStatus === 'allowed' ? [
            {
              label: "Eliminar",
              icon: "🗑️",
              onClick: handleEliminarArticulo,
              className: "btn-danger"
            },
            {
              label: "Cancelar",
              icon: "❌",
              onClick: handleCloseDeleteModal,
              className: "btn-secondary"
            }
          ] : (deleteStatus === 'completed' || deleteStatus === 'error') ? [
            {
              label: "Cerrar",
              icon: "✅",
              onClick: handleCloseDeleteModal
            }
          ] : [
            {
              label: "Cancelar",
              icon: "❌",
              onClick: handleCloseDeleteModal,
              className: "btn-secondary"
            }
          ]
        }
      >
        {filteredArticulos[selectedIndex] && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>Código:</strong> {filteredArticulos[selectedIndex].codigo}</p>
            <p><strong>Descripción:</strong> {filteredArticulos[selectedIndex].descri || filteredArticulos[selectedIndex].descripcion}</p>
            <p><strong>Unidad:</strong> {filteredArticulos[selectedIndex].unidad}</p>
          </div>
        )}

        <div style={{
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: deleteStatus === 'denied' ? '#fef2f2' : deleteStatus === 'allowed' ? '#f0fdf4' : '#f9fafb',
          border: `1px solid ${deleteStatus === 'denied' ? '#fca5a5' : deleteStatus === 'allowed' ? '#86efac' : '#e5e7eb'}`
        }}>
          <p style={{
            margin: 0,
            color: deleteStatus === 'denied' ? '#dc2626' : deleteStatus === 'allowed' ? '#16a34a' : '#374151',
            fontWeight: '500'
          }}>
            {deleteMessage}
          </p>

          {relatedTables.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ color: '#dc2626' }}>Tablas relacionadas:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {relatedTables.map(table => (
                  <li key={table} style={{ color: '#dc2626' }}>{table}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </MensajeModal>

      {/* Modal de Nuevo/Editar Artículo */}
      {showNuevoArticuloModal && (
        <NuevoArticuloModal
          isOpen={showNuevoArticuloModal}
          onClose={handleCloseNuevoArticuloModal}
          onSave={handleSaveNuevoArticulo}
          editMode={editMode}
          articuloEditar={articuloEditar}
        />
      )}

      {/* Modal de Cambiar Código usando MensajeModal */}
      <MensajeModal
        isOpen={showCambiarCodigoModal}
        onClose={handleCloseCambiarCodigoModal}
        title="Cambiar Código de Artículo"
        size="medium"
        buttons={
          cambioAplicado ? [
            {
              label: "Cerrar",
              icon: "✅",
              onClick: handleCloseCambiarCodigoModal
            }
          ] : [
            {
              label: cambiarCodigoLoading ? "Aplicando..." : "Aplicar",
              icon: cambiarCodigoLoading ? "⏳" : "✅",
              onClick: handleAplicarCambioCodigo,
              disabled: cambiarCodigoLoading
            },
            {
              label: "Cancelar",
              icon: "❌",
              onClick: handleCloseCambiarCodigoModal,
              className: "btn-secondary",
              disabled: cambiarCodigoLoading
            }
          ]
        }
      >
        {articuloOriginal && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>Código actual:</strong> {articuloOriginal.codigo}</p>
            <p><strong>Descripción:</strong> {articuloOriginal.descri || articuloOriginal.descripcion}</p>
            <p><strong>Unidad:</strong> {articuloOriginal.unidad}</p>
          </div>
        )}

        {!cambioAplicado && (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="nuevo-codigo-articulo" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Nuevo Código:
            </label>
            <input
              id="nuevo-codigo-articulo"
              type="text"
              placeholder="Ingrese el nuevo código"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: cambiarCodigoLoading ? '#f9fafb' : '#ffffff',
                color: '#374151'
              }}
              value={nuevoCodigo}
              onChange={(e) => setNuevoCodigo(e.target.value)}
              disabled={cambiarCodigoLoading || cambioAplicado}
            />
          </div>
        )}

        {cambiarCodigoResult && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: cambiarCodigoResult.error ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${cambiarCodigoResult.error ? '#fca5a5' : '#86efac'}`,
            marginTop: '16px'
          }}>
            {cambiarCodigoResult.error ? (
              <p style={{ margin: 0, color: '#dc2626', fontWeight: '500' }}>
                ❌ {cambiarCodigoResult.error}
              </p>
            ) : (
              <div>
                <p style={{ margin: 0, color: '#16a34a', fontWeight: '500' }}>
                  ✅ {cambiarCodigoResult.message}
                </p>
                {cambiarCodigoResult.tablasAfectadas && cambiarCodigoResult.tablasAfectadas.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong style={{ color: '#16a34a' }}>Tablas modificadas:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {cambiarCodigoResult.tablasAfectadas.map((tabla, index) => (
                        <li key={index} style={{ color: '#16a34a' }}>{tabla}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </MensajeModal>

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

      {/* Modal de Exportación usando MensajeModal */}
      <MensajeModal
        isOpen={showExportModal}
        onClose={handleCloseExportModal}
        title="Exportar Artículos a Excel"
        size="medium"
        buttons={[
          {
            label: "Exportar Excel",
            icon: "📊",
            onClick: handleExportToExcel
          },
          {
            label: "Cancelar",
            icon: "❌",
            onClick: handleCloseExportModal,
            className: "btn-secondary"
          }
        ]}
      >
        <p>
          Se exportarán <strong>{filteredArticulos.length.toLocaleString()}</strong> {searchTerm ? 'artículos filtrados' : 'artículos en total'} a un archivo Excel con los siguientes datos:
        </p>
        <p>
          <small>• Código • Descripción • Unidad • Familia • Categoría • Tipo de Certificado • Tipo de Residuo</small>
        </p>
        <p>
          ¿Deseas continuar con la exportación?
        </p>
      </MensajeModal>

      {/* Modal de Trazabilidad por Boleta */}
      <ArticulosXBoletaModal
        isOpen={showTrazabilidadModal}
        onClose={handleCloseTrazabilidadModal}
        articuloSeleccionado={selectedIndex >= 0 ? filteredArticulos[selectedIndex] : null}
      />
    </div>
  );
};

export default ListaArticulosModal;
