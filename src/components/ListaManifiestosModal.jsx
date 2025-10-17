import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './ListaManifiestosModal.css';
import MensajeModal from './MensajeModal';
import ManifiestoEditarNotaModal from './ManifiestoEditarNotaModal';
import VerDetalleManifiestoModal from './VerDetalleManifiestoModal';
import CambiarEstadoModal from './CambiarEstadoModal';
import ManifiestosCambiarNumeroModal from './ManifiestosCambiarNumeroModal';
import { useAuth } from '../contexts/AuthContext';

const ListaManifiestosModal = ({ isOpen, onClose }) => {
  const [manifiestos, setManifiestos] = useState([]);
  const [filteredManifiestos, setFilteredManifiestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [sortBy, setSortBy] = useState('fecha'); // 'fecha' o 'numero'
  const [showEditarNotaModal, setShowEditarNotaModal] = useState(false);
  const [showVerDetalleModal, setShowVerDetalleModal] = useState(false);
  const [showCambiarEstadoModal, setShowCambiarEstadoModal] = useState(false);
  const [showCambiarNumeroModal, setShowCambiarNumeroModal] = useState(false);
  const [manifiestoParaCambio, setManifiestoParaCambio] = useState(null);
  // Reversar modal moved to VerDetalleManifiestoModal

  // Estados para permisos
  const { hasPermission } = useAuth();
  const [showMensajePermisoDenegado, setShowMensajePermisoDenegado] = useState(false);
  const [mensajePermiso, setMensajePermiso] = useState('');

  // Cargar manifiestos cuando se abre el modal
  useEffect(() => {
    if (isOpen && manifiestos.length === 0) {
      fetchManifiestos();
    }
  }, [isOpen, manifiestos.length]);

  useEffect(() => {
    let result = [...manifiestos];

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(m => {
        const numeroStr = String(m.numero || '').toLowerCase();
        return numeroStr.includes(term);
      });
    }

    // Aplicar ordenamiento
    result = sortManifiestos(result, sortBy);

    setFilteredManifiestos(result);

    // Solo resetear selectedIndex si no hay modales abiertos
    if (!showEditarNotaModal && !showVerDetalleModal && !showCambiarEstadoModal) {
      setSelectedIndex(-1);
    }
  }, [manifiestos, searchTerm, sortBy, showEditarNotaModal, showVerDetalleModal, showCambiarEstadoModal]);

  const fetchManifiestos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/manifiestos');
      if (!response.ok) throw new Error('Error al cargar manifiestos');
      const data = await response.json();
      setManifiestos(data.manifiestos || []);
    } catch (err) {
      console.error('❌ Error al cargar manifiestos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = index => setSelectedIndex(index);

  // Función para ordenar manifiestos
  const sortManifiestos = (manifiestosArray, sortType) => {
    return [...manifiestosArray].sort((a, b) => {
      if (sortType === 'fecha') {
        // Ordenar por fecha descendente (más reciente primero)
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA;
      } else if (sortType === 'numero') {
        // Ordenar por número descendente (mayor número primero)
        const numA = parseInt(a.numero) || 0;
        const numB = parseInt(b.numero) || 0;
        return numB - numA;
      }
      return 0;
    });
  };

  // Función para manejar cambio de ordenamiento
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Función para generar HTML del reporte
  const generateReporteHTML = (manifiestoSeleccionado, detalles, totalCantidad) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Manifiesto ${manifiestoSeleccionado.numero}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }

          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }

          .titulo {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .subtitulo {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
          }

          .detalles {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 14px;
          }

          .detalle-item {
            margin-bottom: 5px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }

          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }

          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .total-row {
            background-color: #e0e0e0;
            font-weight: bold;
          }

          .total-row td {
            text-align: right;
          }

          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }

          .print-button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir</button>

        <div class="header">
          <div class="titulo">Multiservicios Ecológicos Nacionales</div>
          <div class="subtitulo">Reporte de Manifiesto</div>
        </div>

        <div class="detalles">
          <div>
            <div class="detalle-item"><strong>Número de Manifiesto:</strong> ${manifiestoSeleccionado.numero || ''}</div>
            <div class="detalle-item"><strong>Fecha:</strong> ${manifiestoSeleccionado.fecha || ''}</div>
            <div class="detalle-item"><strong>Peso Local:</strong> ${manifiestoSeleccionado.peso_local || ''}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Artículo</th>
              <th>Boleta</th>
              <th>Cliente</th>
              <th>Cantidad</th>
              <th>Tipo</th>
              <th>CIIU</th>
              <th>Simarde</th>
            </tr>
          </thead>
          <tbody>
            ${detalles.map(detalle => `
              <tr>
                <td>${detalle.codigo || ''}</td>
                <td>${detalle.articulo || ''}</td>
                <td>${detalle.boleta || ''}</td>
                <td>${detalle.cliente || ''}</td>
                <td style="text-align: right">${detalle.cantidad || ''}</td>
                <td>${detalle.tipo || ''}</td>
                <td>${detalle.ciiu || ''}</td>
                <td>${detalle.simarde || ''}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL PESO:</td>
              <td style="text-align: right; font-weight: bold;">${totalCantidad.toFixed(2)}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    const handleKeyDown = event => {
      if (!filteredManifiestos.length) return;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev < filteredManifiestos.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            // Aquí puedes implementar la lógica para ver detalles
          }
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredManifiestos, selectedIndex]);

  const handleExportClick = () => {
    console.log('🔍 Verificando permisos para exportar manifiestos');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'exportar')) {
      mostrarMensajePermisoDenegado('exportar');
      return;
    }
    setShowExportModal(true);
  };

  const handleExportToExcel = () => {
    const exportData = filteredManifiestos.map(m => ({
      'Fecha': m.fecha,
      'Número': m.numero,
      'Peso Local': m.peso_local,
      'Tipo': m.tipo,
      'Notas': m.notas || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manifiestos');
    const now = new Date();
    const ts = now.toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
    XLSX.writeFile(workbook, `manifiestos_${ts}.xlsx`);
    setShowExportModal(false);
  };

  const handleCloseExportModal = () => setShowExportModal(false);
  const handleActualizarClick = () => fetchManifiestos();

  const handleCambiarEstado = () => {
    console.log('🔍 Verificando permisos para cambiar estado de manifiesto');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'cambiar_estado')) {
      mostrarMensajePermisoDenegado('cambiar estado');
      return;
    }
    if (selectedIndex >= 0) {
      setShowCambiarEstadoModal(true);
    }
  };

  const handleCambiarNumero = () => {
    console.log('🔍 Verificando permisos para cambiar número de manifiesto');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'cambiar_numero')) {
      mostrarMensajePermisoDenegado('cambiar número');
      return;
    }
    if (selectedIndex >= 0) {
      const manifiesto = filteredManifiestos[selectedIndex];
      console.log('🔢 Abrir modal Cambiar Número para manifiesto:', manifiesto.numero);
      setManifiestoParaCambio(manifiesto);
      setShowCambiarNumeroModal(true);
    }
  };

  // Reversar handlers moved to VerDetalleManifiestoModal

  const handleImprimirReporte = async () => {
    console.log('🔍 Verificando permisos para imprimir reporte de manifiesto');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'imprimir_reporte')) {
      mostrarMensajePermisoDenegado('imprimir reporte');
      return;
    }
    if (selectedIndex < 0) return;

    const manifiestoSeleccionado = filteredManifiestos[selectedIndex];

    try {
      // Obtener detalles del manifiesto
      const response = await fetch(`http://localhost:4000/api/manifiesto3/${manifiestoSeleccionado.numero}`);
      if (!response.ok) throw new Error('Error al obtener detalles del manifiesto');

      const data = await response.json();
      const detalles = data.detalles || [];

      // Calcular sumatoria de cantidad
      const totalCantidad = detalles.reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0);

      // Generar HTML del reporte
      const reporteHTML = generateReporteHTML(manifiestoSeleccionado, detalles, totalCantidad);

      // Abrir nueva ventana con el reporte
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      printWindow.document.write(reporteHTML);
      printWindow.document.close();

    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert('Error al generar el reporte: ' + error.message);
    }
  };

  // Funciones para el modal de editar nota
  const handleCloseEditarNotaModal = () => {
    setShowEditarNotaModal(false);
  };

  const handleNotaUpdated = (numeroManifiesto, nuevaNota) => {
    // Actualizar la nota en el estado local
    setManifiestos(prev => prev.map(m =>
      m.numero === numeroManifiesto ? { ...m, notas: nuevaNota } : m
    ));
  };

  // Funciones nombradas para botones con permisos
  const handleVerDetalle = () => {
    console.log('🔍 Verificando permisos para ver detalle de manifiesto');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'ver_detalle')) {
      mostrarMensajePermisoDenegado('ver detalle');
      return;
    }
    if (selectedIndex >= 0) {
      setShowVerDetalleModal(true);
    }
  };

  const handleActualizarNota = () => {
    console.log('🔍 Verificando permisos para actualizar nota de manifiesto');
    if (!hasPermission('Manifiestos', 'Lista de Manifiestos', 'actualizar_nota')) {
      mostrarMensajePermisoDenegado('actualizar nota');
      return;
    }
    if (selectedIndex >= 0) {
      setShowEditarNotaModal(true);
    }
  };

  // Funciones para el modal de ver detalle
  const handleCloseVerDetalleModal = () => {
    setShowVerDetalleModal(false);
  };

  // Funciones para el modal de cambiar estado
  const handleCloseCambiarEstadoModal = () => {
    setShowCambiarEstadoModal(false);
  };

  // Funciones helper para permisos
  const mostrarMensajePermisoDenegado = (accion) => {
    setMensajePermiso(`No tienes permisos para ${accion} en Manifiestos.`);
    setShowMensajePermisoDenegado(true);
  };

  const cerrarMensajePermisoDenegado = () => {
    setShowMensajePermisoDenegado(false);
    setMensajePermiso('');
  };

  if (!isOpen) return null;

  return (
    <div id="lista-manifiestos-modal-root" className="lista-manifiestos-modal-overlay">
      <div className="lista-manifiestos-modal">
        <div className="lista-manifiestos-modal-header">
          <h2 className="lista-manifiestos-modal-title">Lista de Manifiestos</h2>
          <button className="lista-manifiestos-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="lista-manifiestos-modal-body">
          {/* Barra de búsqueda y ordenamiento */}
          <div className="search-container">
            <div className="search-row">
              <input
                type="text"
                placeholder="Buscar por número..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                }}
                className="search-input"
              />
              <div className="sort-controls">
                <label className="sort-label">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  <option value="fecha">Fecha (más reciente)</option>
                  <option value="numero">Número (mayor primero)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contenedor principal con grid y botones */}
          <div className="content-wrapper">
            {/* Grid de manifiestos */}
            <div className="manifiestos-table-container">
              {loading && <div className="loading">Cargando manifiestos...</div>}
              {error && <div className="error">Error: {error}</div>}

              {!loading && !error && (
                <table className="manifiestos-table">
                  <thead className="manifiestos-table-header">
                    <tr className="header-row">
                      <th className={sortBy === 'fecha' ? 'sort-active' : ''}>
                        Fecha {sortBy === 'fecha' && '↓'}
                      </th>
                      <th className={sortBy === 'numero' ? 'sort-active' : ''}>
                        Número {sortBy === 'numero' && '↓'}
                      </th>
                      <th>Peso Local</th>
                      <th>Tipo</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredManifiestos.map((manifiesto, index) => (
                      <tr
                        key={`${manifiesto.numero}-${index}`}
                        className={selectedIndex === index ? 'selected' : ''}
                        onClick={() => handleRowClick(index)}
                      >
                        <td>{manifiesto.fecha}</td>
                        <td>{manifiesto.numero}</td>
                        <td>{manifiesto.peso_local}</td>
                        <td>{manifiesto.tipo}</td>
                        <td>{manifiesto.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!loading && !error && manifiestos.length === 0 && (
                <div className="no-data">No se encontraron manifiestos</div>
              )}

              {!loading && !error && manifiestos.length > 0 && filteredManifiestos.length === 0 && searchTerm.trim() !== '' && (
                <div className="no-data">No se encontraron manifiestos que coincidan con "{searchTerm}"</div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="action-buttons">
              <button
                className="action-btn nuevo"
                onClick={handleVerDetalle}
                disabled={selectedIndex < 0}
              >
                <span className="btn-icon">👁️</span>
                <span className="btn-text">Ver Detalle</span>
              </button>
              <button
                className="action-btn editar"
                onClick={handleActualizarNota}
                disabled={selectedIndex < 0}
              >
                <span className="btn-icon">📝</span>
                <span className="btn-text">Actualizar Nota</span>
              </button>
              <button
                className="action-btn cambiar-estado"
                onClick={() => {
                  if (selectedIndex >= 0) {
                    handleCambiarEstado();
                  }
                }}
                disabled={selectedIndex < 0}
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Cambiar Estado</span>
              </button>
              <button
                className="action-btn cambiar-numero"
                onClick={() => {
                  if (selectedIndex >= 0) {
                    handleCambiarNumero();
                  }
                }}
                disabled={selectedIndex < 0}
              >
                <span className="btn-icon">🔢</span>
                <span className="btn-text">Cambiar Número</span>
              </button>
              <button className="action-btn exportar" onClick={handleExportClick}>
                <span className="btn-icon">📊</span>
                <span className="btn-text">Exportar</span>
              </button>
              <button className="action-btn actualizar" onClick={handleActualizarClick}>
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Actualizar</span>
              </button>
              <button className="action-btn imprimir" onClick={handleImprimirReporte} disabled={selectedIndex < 0}>
                <span className="btn-icon">🖨️</span>
                <span className="btn-text">Imprimir Reporte</span>
              </button>
              {/* Reversar Líneas moved to VerDetalleManifiestoModal */}
            </div>
          </div>
        </div>

        {/* Modal de exportación usando MensajeModal */}
        <MensajeModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          title="Exportar Manifiestos"
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
            ¿Desea exportar la lista de manifiestos a Excel?
          </p>
        </MensajeModal>

        {/* Modal Cambiar Número */}
        {showCambiarNumeroModal && (
          <ManifiestosCambiarNumeroModal
            isOpen={showCambiarNumeroModal}
            onClose={() => {
              setShowCambiarNumeroModal(false);
              setManifiestoParaCambio(null);
            }}
            manifiesto={manifiestoParaCambio}
            onCambioAplicado={() => {
              // refrescar lista después de éxito
              fetchManifiestos();
            }}
          />
        )}

        {/* Modal de editar nota */}
        {showEditarNotaModal && (
          <ManifiestoEditarNotaModal
            isOpen={showEditarNotaModal}
            onClose={handleCloseEditarNotaModal}
            manifiesto={selectedIndex >= 0 ? filteredManifiestos[selectedIndex] : null}
            onNotaUpdated={handleNotaUpdated}
          />
        )}

        {/* Modal de ver detalle */}
        {showVerDetalleModal && (
          <VerDetalleManifiestoModal
            isOpen={showVerDetalleModal}
            onClose={handleCloseVerDetalleModal}
            manifiesto={selectedIndex >= 0 ? filteredManifiestos[selectedIndex] : null}
          />
        )}

        {/* Modal de cambiar estado */}
        {showCambiarEstadoModal && (
          <CambiarEstadoModal
            isOpen={showCambiarEstadoModal}
            onClose={handleCloseCambiarEstadoModal}
            manifiesto={selectedIndex >= 0 ? filteredManifiestos[selectedIndex] : null}
            onEstadoUpdated={fetchManifiestos}
          />
        )}
        {/* Reversar modal removed from ListaManifiestosModal; moved to VerDetalleManifiestoModal */}

        {/* Modal de mensaje de permisos denegados */}
        <MensajeModal
          isOpen={showMensajePermisoDenegado}
          onClose={cerrarMensajePermisoDenegado}
          title="Permiso Denegado"
          buttons={[
            {
              label: 'Aceptar',
              icon: '✅',
              onClick: cerrarMensajePermisoDenegado,
              className: 'btn-confirm'
            }
          ]}
          size="small"
        >
          <p style={{ textAlign: 'center', margin: '20px 0' }}>
            {mensajePermiso}
          </p>
        </MensajeModal>
      </div>
    </div>
  );
};

export default ListaManifiestosModal;
