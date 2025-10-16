import React, { useState, useEffect } from 'react';
import './AuditarBoletaModal.css';

const AuditarBoletaModal = ({ isOpen, onClose, boleta }) => {
  const [materialesProceso, setMaterialesProceso] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para el grid de movimientos (transa_ar)
  const [movimientos, setMovimientos] = useState([]);
  const [selectedMovimientoIndex, setSelectedMovimientoIndex] = useState(-1);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [errorMovimientos, setErrorMovimientos] = useState('');
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  // Cargar materiales_proceso cuando se abre el modal o cambia la boleta
  useEffect(() => {
    if (!isOpen || !boleta) {
      setMaterialesProceso([]);
      setSelectedRowIndex(-1);
      setError('');
      return;
    }

    const fetchMaterialesProceso = async () => {
      setLoading(true);
      setError('');
      try {
        const numero = boleta.numero || '';
        const tipo = boleta.tipo || '';
        const url = `http://localhost:4000/api/materiales_proceso?search=${encodeURIComponent(numero)}&tipo=${encodeURIComponent(tipo)}&pageSize=1000`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const rows = data.rows || [];
        
        // Filtrar por numero y tipo exactos
        const filtered = rows.filter(r => 
          String(r.boleta) === String(numero) && 
          String(r.tipo || '').toLowerCase() === String(tipo).toLowerCase()
        );
        
        setMaterialesProceso(filtered);
        setSelectedRowIndex(-1);
      } catch (err) {
        console.error('Error al cargar materiales_proceso:', err);
        setError('Error al cargar los materiales');
        setMaterialesProceso([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialesProceso();
  }, [isOpen, boleta]);

  // Cargar movimientos (transa_ar) cuando se selecciona un artículo
  useEffect(() => {
    if (!isOpen || !boleta || selectedRowIndex < 0 || !materialesProceso[selectedRowIndex]) {
      setMovimientos([]);
      setSelectedMovimientoIndex(-1);
      setErrorMovimientos('');
      setArticuloSeleccionado(null);
      return;
    }

    const fetchMovimientos = async () => {
      setLoadingMovimientos(true);
      setErrorMovimientos('');
      
      const material = materialesProceso[selectedRowIndex];
      const codigo = material.codigo;
      const descri = material.descri || codigo || 'N/A';
      setArticuloSeleccionado(descri);

      try {
        const numero = boleta.numero || '';
        const tipo = boleta.tipo || '';
        const url = `http://localhost:4000/api/transa_ar?codigo=${encodeURIComponent(codigo)}&boleta=${encodeURIComponent(numero)}&tipox=${encodeURIComponent(tipo)}&pageSize=1000`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const movs = data.movimientos || [];
        
        setMovimientos(movs);
        setSelectedMovimientoIndex(-1);
      } catch (err) {
        console.error('Error al cargar movimientos:', err);
        setErrorMovimientos('Error al cargar los movimientos');
        setMovimientos([]);
      } finally {
        setLoadingMovimientos(false);
      }
    };

    fetchMovimientos();
  }, [isOpen, boleta, selectedRowIndex, materialesProceso]);

  if (!isOpen) return null;

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  // Función para imprimir la auditoría
  const handleImprimir = async () => {
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    
    if (!ventanaImpresion) {
      alert('Por favor permite las ventanas emergentes para imprimir');
      return;
    }

    // Función auxiliar para generar movimientos de cada artículo
    const generarMovimientosPorArticulo = async () => {
      if (materialesProceso.length === 0) {
        return '<div class="sin-datos">No hay artículos para mostrar movimientos</div>';
      }

      let htmlMovimientos = '';

      for (const material of materialesProceso) {
        const codigo = material.codigo;
        const descri = material.descri || codigo || 'N/A';
        const numero = boleta?.numero || '';
        const tipo = boleta?.tipo || '';

        try {
          const url = `http://localhost:4000/api/transa_ar?codigo=${encodeURIComponent(codigo)}&boleta=${encodeURIComponent(numero)}&tipox=${encodeURIComponent(tipo)}&pageSize=1000`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const movs = data.movimientos || [];

            htmlMovimientos += `
              <div class="articulo-grupo">
                <div class="articulo-titulo">Artículo: ${descri} (${codigo})</div>
                ${movs.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th style="text-align: right;">Cantidad</th>
                        <th>Tipo</th>
                        <th>Hecho Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${movs.map(mov => `
                        <tr>
                          <td>${formatFecha(mov.fecha)}</td>
                          <td class="numero-celda">${mov.cantidad != null ? Number(mov.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                          <td>${mov.tipo || 'N/A'}</td>
                          <td>${mov.hecho_por || 'N/A'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : '<div class="sin-datos">No hay movimientos registrados para este artículo</div>'}
              </div>
            `;
          }
        } catch {
          htmlMovimientos += `
            <div class="articulo-grupo">
              <div class="articulo-titulo">Artículo: ${descri} (${codigo})</div>
              <div class="sin-datos">Error al cargar movimientos</div>
            </div>
          `;
        }
      }

      return htmlMovimientos;
    };

    // Generar movimientos primero
    const movimientosHTML = await generarMovimientosPorArticulo();

    const contenidoHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auditoría de Boleta - ${boleta?.numero || 'N/A'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
            color: black;
          }
          
          .titulo-principal {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            text-transform: uppercase;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 10px;
          }
          
          .seccion {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .titulo-seccion {
            font-size: 16px;
            font-weight: bold;
            background-color: #1e3a8a;
            color: white;
            padding: 8px 12px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          
          .datos-boleta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            border: 1px solid #ccc;
            padding: 15px;
            background-color: #f9f9f9;
          }
          
          .campo-boleta {
            display: flex;
            gap: 8px;
          }
          
          .campo-boleta label {
            font-weight: bold;
            min-width: 100px;
          }
          
          .campo-boleta span {
            flex: 1;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          table thead {
            background-color: #1e3a8a;
            color: white;
          }
          
          table th,
          table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }
          
          table th {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          
          table td {
            font-size: 11px;
          }
          
          .numero-celda {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          
          .articulo-grupo {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .articulo-titulo {
            background-color: #059669;
            color: white;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 13px;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          
          .sin-datos {
            padding: 15px;
            text-align: center;
            color: #666;
            font-style: italic;
          }
          
          @media print {
            body {
              padding: 10px;
            }
            
            .titulo-principal {
              font-size: 20px;
              margin-bottom: 20px;
            }
            
            .seccion {
              page-break-inside: avoid;
            }
            
            table {
              font-size: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="titulo-principal">Auditoría de Boleta</div>
        
        <div class="seccion">
          <div class="titulo-seccion">Información de la Boleta</div>
          <div class="datos-boleta">
            <div class="campo-boleta">
              <label>Número:</label>
              <span>${boleta?.numero || 'N/A'}</span>
            </div>
            <div class="campo-boleta">
              <label>Tipo:</label>
              <span>${boleta?.tipo || 'N/A'}</span>
            </div>
            <div class="campo-boleta">
              <label>Fecha Ingreso:</label>
              <span>${formatFecha(boleta?.fecha)}</span>
            </div>
            <div class="campo-boleta">
              <label>Estado:</label>
              <span>${boleta?.estado || 'N/A'}</span>
            </div>
            <div class="campo-boleta">
              <label>Cliente:</label>
              <span>${boleta?.clienten || boleta?.cliente || 'N/A'}</span>
            </div>
            <div class="campo-boleta">
              <label>Vehículo:</label>
              <span>${boleta?.camion_n || boleta?.vehiculo || 'N/A'}</span>
            </div>
            <div class="campo-boleta">
              <label>Chofer:</label>
              <span>${boleta?.chofer || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div class="seccion">
          <div class="titulo-seccion">Artículos contenidos en la Boleta</div>
          ${materialesProceso.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th style="text-align: right;">Cant. Ingresada</th>
                  <th style="text-align: right;">E. Bodega</th>
                  <th style="text-align: right;">E. Proceso</th>
                  <th style="text-align: right;">E. Terminado</th>
                  <th style="text-align: right;">Despachado</th>
                </tr>
              </thead>
              <tbody>
                ${materialesProceso.map(mat => `
                  <tr>
                    <td>${mat.descri || mat.codigo || 'N/A'}</td>
                    <td class="numero-celda">${mat.cantidad != null ? Number(mat.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td class="numero-celda">${mat.ebodega != null ? Number(mat.ebodega).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td class="numero-celda">${mat.eproceso != null ? Number(mat.eproceso).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td class="numero-celda">${mat.eterminado != null ? Number(mat.eterminado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td class="numero-celda">${mat.despachado != null ? Number(mat.despachado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="sin-datos">No hay materiales registrados para esta boleta</div>'}
        </div>
        
        <div class="seccion">
          <div class="titulo-seccion">Movimientos por Artículo (Trazabilidad)</div>
          ${movimientosHTML}
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(contenidoHTML);
    ventanaImpresion.document.close();
  };

  return (
    <div className="auditar-boleta-modal-overlay" onClick={onClose}>
      <div className="auditar-boleta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auditar-boleta-modal-header">
          <h2>Auditoría de Boleta</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="auditar-boleta-modal-body">
          {boleta ? (
            <>
              <div className="boleta-info-placeholder">
                <div id="auditar-boleta-info-grid" className="boleta-info-grid">
                  <div className="info-field">
                    <label>Número:</label>
                    <input type="text" value={boleta.numero || 'N/A'} readOnly />
                  </div>
                  <div className="info-field">
                    <label>Tipo:</label>
                    <input type="text" value={boleta.tipo || 'N/A'} readOnly />
                  </div>
                  <div className="info-field">
                    <label>Fecha Ingreso:</label>
                    <input type="text" value={formatFecha(boleta.fecha)} readOnly />
                  </div>
                  <div className="info-field">
                    <label>Estado:</label>
                    <input type="text" value={boleta.estado || 'N/A'} readOnly />
                  </div>
                  <div className="info-field field-cliente">
                    <label>Cliente:</label>
                    <input type="text" value={boleta.clienten || boleta.cliente || 'N/A'} readOnly />
                  </div>
                  <div className="info-field">
                    <label>Vehículo:</label>
                    <input type="text" value={boleta.camion_n || boleta.vehiculo || 'N/A'} readOnly />
                  </div>
                  <div className="info-field">
                    <label>Chofer:</label>
                    <input type="text" value={boleta.chofer || 'N/A'} readOnly />
                  </div>
                </div>
              </div>

              <div className="grids-container">
                <div className="materiales-proceso-container">
                  <div className="materiales-proceso-grid-wrapper">
                    {loading && <div className="materiales-loading">⏳ Cargando materiales...</div>}
                    {error && <div className="materiales-error">❌ {error}</div>}
                    {!loading && !error && (
                      <table className="materiales-proceso-table">
                        <thead className="materiales-proceso-header">
                          <tr>
                            <th className="col-articulo">Artículo</th>
                            <th className="col-number">Cantidad Ingresada</th>
                            <th className="col-number">Existencia Bodega</th>
                            <th className="col-number">Existencia Proceso</th>
                            <th className="col-number">Existencia Terminado</th>
                            <th className="col-number">Despachado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialesProceso.length > 0 ? (
                            materialesProceso.map((material, index) => (
                              <tr
                                key={`${material.boleta}-${material.codigo}-${index}`}
                                className={selectedRowIndex === index ? 'selected' : ''}
                                onClick={() => setSelectedRowIndex(index)}
                              >
                                <td className="cell-articulo">{material.descri || material.codigo || 'N/A'}</td>
                                <td className="cell-number">{material.cantidad != null ? Number(material.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="cell-number">{material.ebodega != null ? Number(material.ebodega).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="cell-number">{material.eproceso != null ? Number(material.eproceso).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="cell-number">{material.eterminado != null ? Number(material.eterminado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="cell-number">{material.despachado != null ? Number(material.despachado).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="no-data-cell">
                                {loading ? 'Cargando...' : 'No hay materiales registrados para esta boleta'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="movimientos-container">
                  <div className="movimientos-header-label">
                    <span>Movimientos de Artículo: </span>
                    <span className="articulo-nombre">{articuloSeleccionado || 'Seleccione un artículo'}</span>
                  </div>
                  <div className="movimientos-grid-wrapper">
                    {loadingMovimientos && <div className="movimientos-loading">⏳ Cargando movimientos...</div>}
                    {errorMovimientos && <div className="movimientos-error">❌ {errorMovimientos}</div>}
                    {!loadingMovimientos && !errorMovimientos && (
                      <table className="movimientos-table">
                        <thead className="movimientos-header">
                          <tr>
                            <th>Fecha</th>
                            <th>Cantidad</th>
                            <th>Tipo</th>
                            <th>Hecho Por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientos.length > 0 ? (
                            movimientos.map((mov, index) => (
                              <tr
                                key={`${mov.fecha}-${mov.codigo}-${index}`}
                                className={selectedMovimientoIndex === index ? 'selected' : ''}
                                onClick={() => setSelectedMovimientoIndex(index)}
                              >
                                <td className="cell-fecha">{formatFecha(mov.fecha)}</td>
                                <td className="cell-number">{mov.cantidad != null ? Number(mov.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                                <td className="cell-tipo">{mov.tipo || 'N/A'}</td>
                                <td className="cell-hecho-por">{mov.hecho_por || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="no-data-cell">
                                {selectedRowIndex >= 0 ? 'No hay movimientos registrados para este artículo' : 'Seleccione un artículo para ver sus movimientos'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="boleta-info-placeholder">
              <p className="no-boleta-message">No hay datos de boleta disponibles</p>
            </div>
          )}
          
          {boleta && (
            <div className="footer-actions">
              <button className="btn-imprimir" onClick={handleImprimir}>
                🖨️ IMPRIMIR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditarBoletaModal;