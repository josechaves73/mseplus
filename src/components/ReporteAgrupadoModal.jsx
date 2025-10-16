import React, { useState, useMemo, useEffect } from 'react';
import './ReporteAgrupadoModal.css';

const ReporteAgrupadoModal = ({ isOpen, onClose }) => {
  const [reporteData, setReporteData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('codigo');
  const [selectedRow, setSelectedRow] = useState(null);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setReporteData([]);
      setLoading(false);
      setProgress(0);
      setError('');
      setGenerated(false);
      setSearchTerm('');
      setSortBy('codigo');
      setSelectedRow(null);
    }
  }, [isOpen]);

  // Filtrar y ordenar datos
  const filteredAndSortedData = useMemo(() => {
    let filtered = reporteData;

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.descri?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'codigo') {
        return (a.codigo || '').localeCompare(b.codigo || '');
      } else {
        return (a.descri || '').localeCompare(b.descri || '');
      }
    });

    return filtered;
  }, [reporteData, searchTerm, sortBy]);

  const formatNumber = (num) => {
    return num ? num.toLocaleString('es-ES') : '0';
  };

  const handleRowClick = (codigo) => {
    setSelectedRow(prev => prev === codigo ? null : codigo);
  };

  const handleGenerarReporte = async () => {
    setLoading(true);
    setProgress(0);
    setError('');
    setGenerated(false);

    try {
      console.log('🔄 Iniciando generación de reporte agrupado...');

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost:4000/api/reporte-agrupado');

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Reporte generado exitosamente:', data.total_articulos, 'artículos');
        setReporteData(data.reporte);
        setGenerated(true);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('❌ Error al generar reporte:', err);
      setError(err.message);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Lógica para imprimir el reporte mostrado en la tabla
  const handlePrint = () => {
    try {
      const table = document.querySelector('.reporte-modal-container .data-table');
      if (!table) {
        window.alert('No hay datos para imprimir');
        return;
      }

      const title = 'Reporte de Artículos Agrupado';
      const printedAt = new Date().toLocaleString();

      const styles = `
        <style>
          body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111; margin:0; padding:20px;}
          h1{font-size:20px; margin:0 0 8px 0}
          .meta{font-size:12px; margin-bottom:12px; color:#444}
          table{width:100%; border-collapse:collapse; font-size:12px;}
          th, td{border:1px solid #bbb; padding:8px; text-align:center;}
          thead th{background:#f5f5f5; font-weight:700}
          tbody tr:nth-child(even){background:#fff}
          @page { size: landscape; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      `;

      const newWin = window.open('', '_blank');
      if (!newWin) {
        window.alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de popups.');
        return;
      }

      newWin.document.write('<!doctype html><html><head><title>' + title + '</title>' + styles + '</head><body>');
      newWin.document.write('<h1>' + title + '</h1>');
      newWin.document.write('<div class="meta">Impreso: ' + printedAt + '</div>');

      // Clonar la tabla y limpiar atributos que no son necesarios
      const clone = table.cloneNode(true);
      // Remover estilos oscuros para impresión (si hay clases que coloreen fondo)
      clone.querySelectorAll('th, td').forEach(cell => {
        cell.style.background = 'transparent';
        cell.style.color = '#111';
      });

      newWin.document.body.appendChild(clone);
      newWin.document.close();
      newWin.focus();

      // Dar un pequeño tiempo para que cargue el DOM y luego imprimir
      setTimeout(() => {
        try {
          newWin.print();
          // No cerrar automáticamente en todos los navegadores para permitir al usuario revisar; cerrar si quieres
          newWin.close();
        } catch (e) {
          console.error('Error en impresión:', e);
        }
      }, 500);
    } catch (err) {
      console.error('handlePrint error:', err);
      window.alert('Error al intentar imprimir. Revisa la consola para más detalles.');
    }
  };

  // Estado para modal de confirmación de exportar
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);

  const handleExportClick = () => {
    // Abrir modal de confirmación
    setExportConfirmOpen(true);
  };

  const closeExportConfirm = () => setExportConfirmOpen(false);

  const exportToExcel = () => {
    try {
      const data = filteredAndSortedData.length ? filteredAndSortedData : reporteData;
      if (!data || data.length === 0) {
        window.alert('No hay datos para exportar');
        setExportConfirmOpen(false);
        return;
      }

      const title = 'Reporte de Artículos Agrupado';
      // Construir tabla HTML
      const headers = ['Código', 'Descripción', 'Cantidad Ingresada', 'Existencia Bodega', 'Existencia Proceso', 'Existencia Terminado', 'Total Despachado'];
      let html = '<table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';

      data.forEach(row => {
        html += '<tr>' +
          '<td>' + (row.codigo || '') + '</td>' +
          '<td>' + (row.descri || '') + '</td>' +
          '<td>' + (row.cantidad_total ?? 0) + '</td>' +
          '<td>' + (row.ebodega_total ?? 0) + '</td>' +
          '<td>' + (row.eproceso_total ?? 0) + '</td>' +
          '<td>' + (row.eterminado_total ?? 0) + '</td>' +
          '<td>' + (row.despachado_total ?? 0) + '</td>' +
          '</tr>';
      });

      html += '</tbody></table>';

      const fullHtml = '<html><head><meta charset="utf-8" /><title>' + title + '</title></head><body>' +
        '<h2>' + title + '</h2>' +
        '<div>Exportado: ' + new Date().toLocaleString() + '</div>' +
        html +
        '</body></html>';

      const blob = new Blob([fullHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Articulos_Agrupado.xls';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setExportConfirmOpen(false);
    } catch (err) {
      console.error('Error exportando:', err);
      window.alert('Error al exportar. Revisa la consola.');
      setExportConfirmOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reporte-modal-overlay" onClick={onClose}>
      <div className="reporte-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reporte-modal-header">
          <div className="header-content">
            <div className="header-icon">📊</div>
            <div className="header-text">
              <h1>Reporte Agrupado</h1>
              <p>Reporte consolidado de materiales por artículo</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        {/* Controls Section */}
        <div className="reporte-controls-section">
          <div className="control-group">
            <button
              className={`generate-button ${loading ? 'loading' : ''}`}
              onClick={handleGenerarReporte}
              disabled={loading}
            >
              <span className="button-icon">🚀</span>
              <span className="button-text">
                {loading ? 'Generando...' : 'Generar Reporte'}
              </span>
            </button>

            {loading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress}%</span>
              </div>
            )}
          </div>

          {generated && (
            <div className="filter-controls">
              <div className="left-controls">
                <div className="search-group">
                  <div className="search-icon">🔍</div>
                  <input
                    type="text"
                    placeholder="Buscar por descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="sort-group">
                  <label className="sort-label">Orden de los datos</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="codigo">Orden por Código</option>
                    <option value="descripcion">Orden por Descripción</option>
                  </select>
                </div>
              </div>

              <>
                <button className="action-button imprimir-button" onClick={handlePrint}>
                  <span className="button-icon">🖨️</span>
                  <span>Imprimir</span>
                </button>
                <button className="action-button exportar-button" onClick={handleExportClick}>
                  <span className="button-icon">📤</span>
                  <span>Exportar</span>
                </button>
              </>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Error al generar reporte</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {generated && reporteData.length > 0 && (
          <div className="results-section">
            {/* Summary Stats */}
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">Total Artículos:</span>
                <span className="stat-value">{reporteData.length}</span>
              </div>
              {filteredAndSortedData.length !== reporteData.length && (
                <div className="stat-item">
                  <span className="stat-label">Mostrando:</span>
                  <span className="stat-value">{filteredAndSortedData.length}</span>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="codigo-column">Código</th>
                    <th className="descripcion-column">Descripción</th>
                    <th className="number-column">Cantidad Ingresada</th>
                    <th className="number-column">Existencia Bodega</th>
                    <th className="number-column">Existencia Proceso</th>
                    <th className="number-column">Existencia Terminado</th>
                    <th className="number-column">Total Despachado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((item, index) => (
                    <tr
                      key={`${item.codigo}-${index}`}
                      onClick={() => handleRowClick(item.codigo)}
                      className={selectedRow === item.codigo ? 'selected-row' : ''}
                    >
                      <td className="codigo-column">
                        <code>{item.codigo}</code>
                      </td>
                      <td className="descripcion-column">
                        <span className="description-text">{item.descri}</span>
                      </td>
                      <td className="number-column">{formatNumber(item.cantidad_total)}</td>
                      <td className="number-column">{formatNumber(item.ebodega_total)}</td>
                      <td className="number-column">{formatNumber(item.eproceso_total)}</td>
                      <td className="number-column">{formatNumber(item.eterminado_total)}</td>
                      <td className="number-column">{formatNumber(item.despachado_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generated && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">�</div>
            <h2>Reporte de Materiales Agrupado</h2>
            <p>
              Genera un reporte consolidado que agrupa todos los materiales por código de artículo,
              sumando las cantidades de cada estado del proceso.
            </p>
            {/* feature-list eliminado según solicitud: no mostrar boxes iniciales */}
          </div>
        )}

        {/* Modal de Confirmación para Exportar */}
        {exportConfirmOpen && (
          <div className="export-confirm-modal">
            <div className="modal-content">
              <h2>Confirmar Exportación</h2>
              <p>
                ¿Estás seguro de que deseas exportar el reporte a Excel?
                Se generará un archivo .xls con los datos actuales de la tabla.
              </p>
              <div className="modal-buttons">
                <button className="confirm-button" onClick={exportToExcel}>
                  <span className="button-icon">✅</span>
                  <span>Confirmar y Exportar</span>
                </button>
                <button className="cancel-button" onClick={closeExportConfirm}>
                  <span className="button-icon">❌</span>
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteAgrupadoModal;