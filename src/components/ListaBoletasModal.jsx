import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './ListaBoletasModal.css';
import TiposDeBoletaModal from './modals/TiposDeBoletaModal';
import NuevoBoletaModal from './NuevoBoletaModal';
import AuditarBoletaModal from './AuditarBoletaModal';
import AnularBoletaModal from './AnularBoletaModal';
import CambiarTipoBoletaModal from './CambiarTipoBoletaModal';
import FloatingMessage from './common/FloatingMessage';
import BoletaManifiestoAsociadoModal from './BoletaManifiestoAsociadoModal';
import MensajeModal from './MensajeModal';
import { useAuth } from '../contexts/AuthContext';

const ListaBoletasModal = ({ isOpen, onClose, onOpenNuevaBoleta }) => {
  const { hasPermission } = useAuth();
  const [boletas, setBoletas] = useState([]);
  const [selectedBoletaForEdit, setSelectedBoletaForEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTiposDeBoletaModal, setShowTiposDeBoletaModal] = useState(false);
  const [showNuevoBoleta, setShowNuevoBoleta] = useState(false);
  const [showAuditarBoleta, setShowAuditarBoleta] = useState(false);
  const [boletaParaAuditar, setBoletaParaAuditar] = useState(null);
  const [showAnularBoleta, setShowAnularBoleta] = useState(false);
  const [boletaParaAnular, setBoletaParaAnular] = useState(null);
  const [showCambiarTipoBoleta, setShowCambiarTipoBoleta] = useState(false);
  const [boletaParaCambiarTipo, setBoletaParaCambiarTipo] = useState(null);
  const [floatingMessage, setFloatingMessage] = useState({
    isVisible: false,
    message: '',
    type: 'error'
  });
  const [showManifiestosModal, setShowManifiestosModal] = useState(false);
  const [boletaParaManifiestos, setBoletaParaManifiestos] = useState(null);
  const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, accion: '' });
  
  // Estados para paginación y optimización
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const recordsPerPage = 50; // Mostrar 50 registros por página

  // Función helper para mostrar mensaje de permisos denegados
  const mostrarMensajePermisoDenegado = (accion) => {
    setPermisoDenegadoMensaje({ show: true, accion });
  };

  const cerrarMensajePermisoDenegado = () => {
    setPermisoDenegadoMensaje({ show: false, accion: '' });
  };

  // Filtrar boletas según el término de búsqueda
  const filteredBoletas = boletas;

  // Cargar boletas desde el backend con paginación
  const fetchBoletas = async (page = 1, search = '') => {
    setLoading(true);
    setError('');
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/boletas?page=${page}&limit=${recordsPerPage}${searchParam}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setBoletas(data.boletas || []);
      setTotalRecords(data.total || 0);
      setCurrentPage(page);
      setSelectedIndex(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda con debounce
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        fetchBoletas(1, searchTerm.trim()).finally(() => setIsSearching(false));
      } else {
        fetchBoletas(1);
      }
    }, 500); // 500ms de delay para evitar demasiadas consultas

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen]);

  useEffect(() => {
    if (isOpen && !searchTerm) {
      fetchBoletas(1);
    }
  }, [isOpen, searchTerm]);


  const handleRowClick = index => setSelectedIndex(index);

  useEffect(() => {
    if (isOpen) {
      const handleEditarBoleta = () => {
        if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
          const boletaSeleccionada = filteredBoletas[selectedIndex];
          console.log('🔧 Editando boleta:', boletaSeleccionada);
          
          // Llamar función para abrir modal de edición con los datos
          if (onOpenNuevaBoleta) {
            onOpenNuevaBoleta(boletaSeleccionada);
          }
        } else {
          alert('Selecciona una boleta para editar');
        }
      };

      const handleKeyDown = event => {
        if (!filteredBoletas.length) return;
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setSelectedIndex(prev => (prev < filteredBoletas.length - 1 ? prev + 1 : prev));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            break;
          case 'Enter':
            if (selectedIndex >= 0) handleEditarBoleta();
            break;
          default:
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredBoletas, selectedIndex, onOpenNuevaBoleta]);

  const handleExportClick = () => {
    console.log('🔍 Verificando permiso para exportar boletas:', hasPermission('Boletas', 'Lista Boletas', 'exportar'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'exportar')) {
      mostrarMensajePermisoDenegado('Exportar Boletas');
      return;
    }
    setShowExportModal(true);
  };
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      // Obtener todos los datos filtrados para exportación
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/boletas/export${searchParam ? '?' + searchParam.substring(1) : ''}`);
      if (!response.ok) throw new Error('Error al obtener datos para exportar');
      
      const allData = await response.json();
      const exportData = allData.map(b => ({
        'Número': b.numero,
        'Fecha': new Date(b.fecha).toLocaleDateString(),
        'Cliente': b.clienten,
        'Camión': b.camion_n,
        'Chofer': b.chofer,
        'Estado': b.estado,
        'Tipo': b.tipo
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletas');
      const now = new Date();
      const ts = now.toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
      XLSX.writeFile(workbook, `boletas_${ts}.xlsx`);
      setShowExportModal(false);
    } catch (error) {
      setError('Error al exportar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleCloseExportModal = () => setShowExportModal(false);
  const handleActualizarClick = () => fetchBoletas(currentPage, searchTerm);

  // Funciones de paginación
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchBoletas(currentPage - 1, searchTerm);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchBoletas(currentPage + 1, searchTerm);
    }
  };

  const handlePageInput = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= totalPages) {
      fetchBoletas(pageNum, searchTerm);
    }
  };

  const handleNuevaBoleta = () => {
    console.log('🔍 Verificando permiso para nueva boleta:', hasPermission('Boletas', 'Lista Boletas', 'nuevo'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'nuevo')) {
      mostrarMensajePermisoDenegado('Nueva Boleta');
      return;
    }
    console.log('🔄 handleNuevaBoleta llamado, onOpenNuevaBoleta:', onOpenNuevaBoleta);
    // Si se proporcionó callback externo, usarlo (editar). Si no, abrir el modal localmente para crear nueva boleta.
    if (onOpenNuevaBoleta) {
      console.log('🚀 Ejecutando onOpenNuevaBoleta()');
      onOpenNuevaBoleta();
    } else {
      console.log('🆕 Abriendo modal interno de nueva boleta');
      setShowNuevoBoleta(true);
    }
  };

  // Al hacer clic en Tipos de Boletas
  const handleTiposBoletas = () => {
    console.log('🔍 Verificando permiso para ver tipos de boletas:', hasPermission('Boletas', 'Lista Boletas', 'tipos_de_boleta'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'tipos_de_boleta')) {
      mostrarMensajePermisoDenegado('Ver Tipos de Boletas');
      return;
    }
    setShowTiposDeBoletaModal(true);
  };

  const handleEditarBoleta = () => {
    console.log('🔍 Verificando permiso para editar boleta:', hasPermission('Boletas', 'Lista Boletas', 'editar'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'editar')) {
      mostrarMensajePermisoDenegado('Editar Boleta');
      return;
    }

    if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
      const boletaSeleccionada = filteredBoletas[selectedIndex];
      console.log('🔧 Editando boleta:', boletaSeleccionada);
      
      // Llamar función para abrir modal de edición con los datos
      if (onOpenNuevaBoleta) {
        onOpenNuevaBoleta(boletaSeleccionada);
      } else {
        // Fallback: abrir el modal interno de NuevoBoletaModal en modo edición
        setSelectedBoletaForEdit(boletaSeleccionada);
        setShowNuevoBoleta(true);
      }
    } else {
      alert('Selecciona una boleta para editar');
    }
  };

  const handleAuditarBoleta = () => {
    console.log('🔍 Verificando permiso para auditar boleta:', hasPermission('Boletas', 'Lista Boletas', 'auditar'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'auditar')) {
      mostrarMensajePermisoDenegado('Auditar Boleta');
      return;
    }

    if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
      const boletaSeleccionada = filteredBoletas[selectedIndex];
      console.log('🔍 Auditando boleta:', boletaSeleccionada);
      setBoletaParaAuditar(boletaSeleccionada);
      setShowAuditarBoleta(true);
    } else {
      alert('Selecciona una boleta para auditar');
    }
  };

  const handleAnularBoleta = () => {
    console.log('🔍 Verificando permiso para anular boleta:', hasPermission('Boletas', 'Lista Boletas', 'anular'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'anular')) {
      mostrarMensajePermisoDenegado('Anular Boleta');
      return;
    }

    if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
      const boletaSeleccionada = filteredBoletas[selectedIndex];
      console.log('🚫 Anulando boleta:', boletaSeleccionada);
      setBoletaParaAnular(boletaSeleccionada);
      setShowAnularBoleta(true);
    } else {
      alert('Selecciona una boleta para anular');
    }
  };

  const handleCambiarTipoBoleta = () => {
    console.log('🔍 Verificando permiso para cambiar tipo de boleta:', hasPermission('Boletas', 'Lista Boletas', 'cambiar_tipo'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'cambiar_tipo')) {
      mostrarMensajePermisoDenegado('Cambiar Tipo de Boleta');
      return;
    }

    if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
      const boletaSeleccionada = filteredBoletas[selectedIndex];
      console.log('🔄 Cambiando tipo de boleta:', boletaSeleccionada);

      // Verificar si la boleta está anulada
      if (boletaSeleccionada.estado && boletaSeleccionada.estado.toUpperCase() === 'ANULADA') {
        setFloatingMessage({
          isVisible: true,
          message: 'Esta boleta está ANULADA y no se permite cambiar su tipo.',
          type: 'error'
        });
        return;
      }

      setBoletaParaCambiarTipo(boletaSeleccionada);
      setShowCambiarTipoBoleta(true);
    } else {
      alert('Selecciona una boleta para cambiar tipo');
    }
  };

  // Abrir modal de Manifiestos Asociados
  const handleManifiestosAsociados = () => {
    console.log('🔍 Verificando permiso para ver manifiestos asociados:', hasPermission('Boletas', 'Lista Boletas', 'manifiestos_asociados'));
    if (!hasPermission('Boletas', 'Lista Boletas', 'manifiestos_asociados')) {
      mostrarMensajePermisoDenegado('Ver Manifiestos Asociados');
      return;
    }

    if (selectedIndex >= 0 && filteredBoletas[selectedIndex]) {
      const boletaSeleccionada = filteredBoletas[selectedIndex];
      setBoletaParaManifiestos(boletaSeleccionada);
      setShowManifiestosModal(true);
    } else {
      setFloatingMessage({
        isVisible: true,
        message: 'Selecciona una boleta para ver sus manifiestos asociados',
        type: 'error'
      });
    }
  };

  const handleFloatingMessageClose = () => {
    setFloatingMessage({
      isVisible: false,
      message: '',
      type: 'error'
    });
  };

  if (!isOpen) return null;

  return (
    <div id="lista-boletas-modal-root" className="lista-conductores-modal-overlay">
      <div className="lista-conductores-modal">
        <div className="lista-conductores-modal-header">
          <h2 className="lista-conductores-modal-title">Lista de Boletas</h2>
          <button className="lista-conductores-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lista-conductores-modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por número, chofer, camión, estado, cliente o tipo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {isSearching && (
              <div className="search-loading">🔍 Buscando...</div>
            )}
          </div>
          {/* placeholder: estadísticas o leyendas específicas del modal (migradas a Manifiestos Asociados) */}
          
          {/* Estadísticas y controles de paginación */}
          <div className="pagination-info">
            <div className="records-info">
              📋 Total: {totalRecords.toLocaleString()} boletas | 
              📄 Página {currentPage} de {totalPages} | 
              👁️ Mostrando: {boletas.length} registros
            </div>
            <div className="pagination-controls">
              <button 
                onClick={handlePreviousPage} 
                disabled={currentPage <= 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => handlePageInput(e.target.value)}
                className="page-input"
              />
              <span className="page-total">de {totalPages}</span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          </div>
          <div className="content-wrapper">
            <div className="conductores-table-container">
              {loading && <p>Cargando boletas...</p>}
              {error && <p className="error">Error: {error}</p>}
              {!loading && !error && (
                <> 
                  <table className="conductores-table boletas-table-expanded">
                    <thead className="conductores-table-header">
                      <tr className="header-row">
                        <th>Número</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Camión</th>
                        <th>Chofer</th>
                        <th>Estado</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBoletas.map((b, i) => (
                        <tr key={`${b.numero}-${b.tipo || ''}-${i}`} data-index={i} className={selectedIndex===i?'selected':''} onClick={()=>handleRowClick(i)}>
                          <td>{b.numero}</td>
                          <td>{new Date(b.fecha).toLocaleDateString()}</td>
                          <td className="cell-expanded">{b.clienten}</td>
                          <td className="cell-expanded">{b.camion_n}</td>
                          <td className="cell-expanded">{b.chofer}</td>
                          <td className="cell-narrow">
                            <span className={`estado-badge estado-${b.estado.toLowerCase()}`}>
                              {b.estado}
                            </span>
                          </td>
                          <td className="cell-narrow">{b.tipo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBoletas.length===0 && <p>No hay boletas para mostrar.</p>}
                </>
              )}
            </div>
            <div className="action-buttons">
          <button className="action-btn nuevo" onClick={handleNuevaBoleta}>➕ Nuevo</button>
              <button className="action-btn editar" onClick={handleEditarBoleta} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona una boleta':'Editar boleta'}>✏️ Editar</button>
              <button className="action-btn auditar" onClick={handleAuditarBoleta} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona una boleta':'Auditar boleta'}>🔍 Auditar Boleta</button>
              <button className="action-btn tipos-boletas" onClick={handleTiposBoletas}>📋 Tipos de Boletas</button>
              <button className="action-btn exportar" onClick={handleExportClick}>📤 Exportar</button>
              <button className="action-btn actualizar" onClick={handleActualizarClick}>🔄 Actualizar</button>
              <button className="action-btn anular" onClick={handleAnularBoleta} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona una boleta':'Anular boleta'}>🚫 Anular Boleta</button>
              <button className="action-btn cambiar-tipo" onClick={handleCambiarTipoBoleta} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona una boleta':'Cambiar tipo de boleta'}>🔄 Cambiar Tipo</button>
              <button className="action-btn manifiestos-asociados" onClick={handleManifiestosAsociados} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona una boleta':'Manifiestos Asociados'}>🗂️ Manifiestos Asociados</button>
            </div>
          </div>
        </div>
        {showManifiestosModal && (
          <BoletaManifiestoAsociadoModal
            isOpen={showManifiestosModal}
            onClose={() => { setShowManifiestosModal(false); setBoletaParaManifiestos(null); }}
            boleta={boletaParaManifiestos}
          />
        )}
        {/* Modal de Exportación usando MensajeModal */}
        <MensajeModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          title="Exportar Boletas a Excel"
          size="medium"
          buttons={[
            {
              label: "Exportar Excel",
              icon: "📊",
              onClick: handleExportToExcel,
              disabled: loading
            },
            {
              label: "Cancelar",
              icon: "❌",
              onClick: handleCloseExportModal,
              className: "btn-secondary",
              disabled: loading
            }
          ]}
        >
          <p>
            Se exportarán <strong>{totalRecords.toLocaleString()}</strong> {searchTerm ? 'boletas filtradas' : 'boletas en total'} a un archivo Excel con los siguientes datos:
          </p>
          <p>
            <small>• Número • Fecha • Cliente • Camión • Chofer • Estado • Tipo</small>
          </p>
          <p>
            ¿Deseas continuar con la exportación?
          </p>
        </MensajeModal>
      </div>
      
      {/* Modal de Tipos de Boleta */}
      <TiposDeBoletaModal 
        isOpen={showTiposDeBoletaModal}
        onClose={() => setShowTiposDeBoletaModal(false)}
      />

      {/* Modal de Nueva Boleta (skeleton) */}
      <NuevoBoletaModal isOpen={showNuevoBoleta} onClose={() => { setShowNuevoBoleta(false); setSelectedBoletaForEdit(null); }} 
        isEdit={!!selectedBoletaForEdit} initialBoleta={selectedBoletaForEdit}
        onAppliedUpdates={() => { setShowNuevoBoleta(false); setSelectedBoletaForEdit(null); fetchBoletas(currentPage, searchTerm); }}
      />

      {/* Modal de Auditar Boleta */}
      <AuditarBoletaModal 
        isOpen={showAuditarBoleta}
        onClose={() => { setShowAuditarBoleta(false); setBoletaParaAuditar(null); }}
        boleta={boletaParaAuditar}
      />

      {/* Modal de Anular Boleta */}
      <AnularBoletaModal
        isOpen={showAnularBoleta}
        onClose={() => { setShowAnularBoleta(false); setBoletaParaAnular(null); }}
        boleta={boletaParaAnular}
      />

      {/* Modal de Cambiar Tipo de Boleta */}
      <CambiarTipoBoletaModal
        isOpen={showCambiarTipoBoleta}
        onClose={() => { setShowCambiarTipoBoleta(false); setBoletaParaCambiarTipo(null); }}
        boleta={boletaParaCambiarTipo}
      />

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

      {/* Mensaje flotante para boletas anuladas */}
      <FloatingMessage
        message={floatingMessage.message}
        type={floatingMessage.type}
        isVisible={floatingMessage.isVisible}
        onClose={handleFloatingMessageClose}
      />
    </div>
  );
};

export default ListaBoletasModal;
