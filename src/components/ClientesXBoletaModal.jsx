import React, { useState, useEffect, useCallback } from 'react';
import './ClientesXBoletaModal.css';
import VerBoletaModal from './VerBoletaModal';
import * as XLSX from 'xlsx';

const ClientesXBoletaModal = ({ isOpen, onClose, clienteSeleccionado }) => {
  const [boletas, setBoletas] = useState([]);
  const [filteredBoletas, setFilteredBoletas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVerBoletaModal, setShowVerBoletaModal] = useState(false);
  const [boletaParaVer, setBoletaParaVer] = useState(null);

  const fetchBoletasCliente = useCallback(async () => {
    if (!clienteSeleccionado) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/boletas-x-cliente/${clienteSeleccionado.codigo}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setBoletas(data.boletas || []);
        setFilteredBoletas(data.boletas || []);
        setSelectedIndex(-1);
        setSearchTerm('');
      } else {
        setError(data.error || 'Error al cargar boletas');
        setBoletas([]);
        setFilteredBoletas([]);
      }
    } catch (err) {
      setError(err.message);
      setBoletas([]);
      setFilteredBoletas([]);
    } finally {
      setLoading(false);
    }
  }, [clienteSeleccionado]);

  // Efecto para filtrar boletas cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBoletas(boletas);
    } else {
      const filtered = boletas.filter(boleta =>
        boleta.numero.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBoletas(filtered);
    }
    setSelectedIndex(-1);
  }, [searchTerm, boletas]);

  // Cargar boletas cuando se abre el modal
  useEffect(() => {
    if (isOpen && clienteSeleccionado) {
      fetchBoletasCliente();
    }
  }, [isOpen, clienteSeleccionado, fetchBoletasCliente]);

  const handleRowClick = (index) => {
    setSelectedIndex(index);
  };

  const handleVerBoleta = (boleta) => {
    console.log('👁️ Ver boleta:', boleta);
    setBoletaParaVer(boleta);
    setShowVerBoletaModal(true);
  };

  const handleImprimir = () => {
    console.log('🖨️ Imprimir boletas del cliente:', clienteSeleccionado);
    
    if (!clienteSeleccionado || filteredBoletas.length === 0) {
      alert('No hay datos para imprimir');
      return;
    }

    // Crear contenido HTML para impresión
    const contenidoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Boletas del Cliente - ${clienteSeleccionado.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .cliente-info { margin-bottom: 30px; }
            .cliente-info h2 { color: #333; margin-bottom: 15px; }
            .cliente-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sistema de Gestión - MSE</h1>
            <h2>Reporte de Boletas por Cliente</h2>
            <p>Fecha de impresión: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="cliente-info">
            <h2>Información del Cliente</h2>
            <p><strong>Código:</strong> ${clienteSeleccionado.codigo}</p>
            <p><strong>Nombre:</strong> ${clienteSeleccionado.nombre}</p>
            <p><strong>Dirección:</strong> ${clienteSeleccionado.dire || 'N/A'}</p>
            <p><strong>Teléfonos:</strong> ${clienteSeleccionado.telefonos || 'N/A'}</p>
            <p><strong>Email:</strong> ${clienteSeleccionado.email || 'N/A'}</p>
            <p><strong>Contacto:</strong> ${clienteSeleccionado.contacto1 || 'N/A'}</p>
          </div>
          
          <h3>Boletas Registradas (${filteredBoletas.length} total)</h3>
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Chofer</th>
                <th>Camión</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBoletas.map(boleta => `
                <tr>
                  <td>${boleta.numero}</td>
                  <td>${boleta.tipo}</td>
                  <td>${boleta.fecha}</td>
                  <td>${boleta.chofer}</td>
                  <td>${boleta.camion_n}</td>
                  <td>${boleta.estado}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Este reporte fue generado automáticamente por el Sistema de Gestión MSE</p>
          </div>
        </body>
      </html>
    `;

    // Abrir ventana de vista previa de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenidoImpresion);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      
      // Esperar a que cargue el contenido y luego mostrar diálogo de impresión
      setTimeout(() => {
        ventanaImpresion.print();
      }, 500);
    } else {
      alert('No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.');
    }
  };

  const handleExportarExcel = () => {
    console.log('📤 Exportar a Excel boletas del cliente:', clienteSeleccionado);
    
    if (!clienteSeleccionado || filteredBoletas.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Crear datos para el encabezado del cliente
      const clienteData = [
        ['SISTEMA DE GESTIÓN - MSE'],
        ['REPORTE DE BOLETAS POR CLIENTE'],
        [''],
        ['INFORMACIÓN DEL CLIENTE'],
        ['Código:', clienteSeleccionado.codigo],
        ['Nombre:', clienteSeleccionado.nombre],
        ['Dirección:', clienteSeleccionado.dire || 'N/A'],
        ['Teléfonos:', clienteSeleccionado.telefonos || 'N/A'],
        ['Email:', clienteSeleccionado.email || 'N/A'],
        ['Contacto:', clienteSeleccionado.contacto1 || 'N/A'],
        ['Fecha de exportación:', new Date().toLocaleString()],
        [''],
        ['BOLETAS REGISTRADAS'],
        ['Total de boletas:', filteredBoletas.length],
        [''],
        // Encabezados de la tabla
        ['Número', 'Tipo', 'Fecha', 'Chofer', 'Camión', 'Estado']
      ];

      // Agregar datos de las boletas
      const boletasData = filteredBoletas.map(boleta => [
        boleta.numero,
        boleta.tipo,
        boleta.fecha,
        boleta.chofer,
        boleta.camion_n,
        boleta.estado
      ]);

      // Combinar todos los datos
      const todosLosDatos = [...clienteData, ...boletasData];

      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(todosLosDatos);

      // Configurar anchos de columna
      ws['!cols'] = [
        { wch: 15 }, // Columna A
        { wch: 20 }, // Columna B
        { wch: 15 }, // Columna C
        { wch: 20 }, // Columna D
        { wch: 15 }, // Columna E
        { wch: 15 }  // Columna F
      ];

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Boletas Cliente');

      // Generar nombre del archivo
      const nombreArchivo = `boletas_cliente_${clienteSeleccionado.codigo}_${clienteSeleccionado.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);
      
      console.log('✅ Archivo Excel generado exitosamente:', nombreArchivo);
    } catch (error) {
      console.error('❌ Error al generar archivo Excel:', error);
      alert('Error al generar el archivo Excel. Inténtalo de nuevo.');
    }
  };

  const handleCloseVerBoletaModal = () => {
    setShowVerBoletaModal(false);
    setBoletaParaVer(null);
  };

  if (!isOpen) return null;

  return (
    <div className="clientes-x-boleta-modal-overlay">
      <div className="clientes-x-boleta-modal">
        <div className="clientes-x-boleta-modal-header">
          <h2 className="clientes-x-boleta-modal-title">Boletas Relacionadas</h2>
          <div className="header-controls">
            <button className="clientes-x-boleta-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="clientes-x-boleta-modal-body">
          {!clienteSeleccionado ? (
            <div className="error-message">
              <p>Error: No se pudo obtener la información del cliente seleccionado.</p>
              <p>Por favor, cierre el modal y seleccione un cliente nuevamente.</p>
            </div>
          ) : (
            <>
              <div className="cliente-info-placeholder">
                <div className="cliente-info-left">
                  <span className="cliente-info-text">
                    {clienteSeleccionado.codigo} - {clienteSeleccionado.nombre}
                  </span>
                  <span className="boleta-count">
                    ({boletas.length} boleta{boletas.length !== 1 ? 's' : ''} relacionada{boletas.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="cliente-info-right">
                  <button
                    className="footer-btn imprimir"
                    onClick={handleImprimir}
                  >
                    <span>🖨️</span>
                    Imprimir
                  </button>
                  <button
                    className="footer-btn exportar"
                    onClick={handleExportarExcel}
                  >
                    <span>📤</span>
                    Exportar a Excel
                  </button>
                </div>
              </div>

              <div className="search-container">
                <input
                  type="text"
                  placeholder="Buscar por número de boleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="boletas-grid-container">
                {loading && <p className="loading">Cargando boletas...</p>}
                {error && <p className="error">Error: {error}</p>}
                {!loading && !error && (
                  <>
                    <div className="boletas-table-container">
                      <table className="boletas-table" style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead className="boletas-table-header">
                          <tr className="header-row">
                            <th>Número</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Chofer</th>
                            <th>Camión</th>
                            <th>Estado</th>
                            <th className="action-column">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="boletas-table-body">
                          {filteredBoletas.map((boleta, i) => (
                            <tr
                              key={boleta.numero}
                              className={selectedIndex === i ? 'selected' : ''}
                              onClick={() => handleRowClick(i)}
                            >
                              <td>{boleta.numero}</td>
                              <td>{boleta.tipo}</td>
                              <td>{boleta.fecha}</td>
                              <td>{boleta.chofer}</td>
                              <td>{boleta.camion_n}</td>
                              <td>{boleta.estado}</td>
                              <td className="action-column">
                                <button
                                  className="ver-boleta-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerBoleta(boleta);
                                  }}
                                >
                                  Ver Boleta
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredBoletas.length === 0 && boletas.length > 0 && (
                      <p className="no-boletas">No se encontraron boletas que coincidan con la búsqueda.</p>
                    )}
                    {boletas.length === 0 && !loading && (
                      <p className="no-boletas">No se encontraron boletas para este cliente.</p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de ver boleta */}
      <VerBoletaModal
        isOpen={showVerBoletaModal}
        onClose={handleCloseVerBoletaModal}
        boletaSeleccionada={boletaParaVer}
      />
    </div>
  );
};

export default ClientesXBoletaModal;
