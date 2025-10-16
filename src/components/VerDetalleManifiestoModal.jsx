import React, { useState, useEffect, useCallback } from 'react';
import VerBoletaModal from './VerBoletaModal';
import './VerDetalleManifiestoModal.css';

const VerDetalleManifiestoModal = ({ isOpen, onClose, manifiesto }) => {
  const [detallesManifiesto, setDetallesManifiesto] = useState([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [errorDetalles, setErrorDetalles] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showVerBoletaModal, setShowVerBoletaModal] = useState(false);
  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
  const [cantidadBoletas, setCantidadBoletas] = useState(0);
  const [clientesUnicos, setClientesUnicos] = useState(0);
  // Reversión de Línea state
  const [showReversarModal, setShowReversarModal] = useState(false);
  const [reversarData, setReversarData] = useState({ numeroBoleta: '', tipo: '', cliente: '', cantidad: 0 });
  const [reversarCantidad, setReversarCantidad] = useState(0);
  const [reversarError, setReversarError] = useState(null);
  // Resumen UI state (reemplaza alert())
  const [showResumen, setShowResumen] = useState(false);
  const [resumenData, setResumenData] = useState(null);

  // Función para convertir peso_local a toneladas
  const convertirAToneladas = (pesoLocal) => {
    if (!pesoLocal || isNaN(pesoLocal)) return '0.00';
    const pesoEnToneladas = parseFloat(pesoLocal) / 1000;
    return pesoEnToneladas.toFixed(2);
  };

  // Cargar detalles del manifiesto cuando se abre el modal
  useEffect(() => {
    const cargarDetalles = async () => {
      if (!manifiesto?.numero) return;

      setLoadingDetalles(true);
      setErrorDetalles(null);

      try {
        const response = await fetch(`http://localhost:4000/api/manifiesto3/${manifiesto.numero}`);
        const data = await response.json();

        if (response.ok) {
          setDetallesManifiesto(data.detalles || []);

          // Calcular cantidad de boletas y clientes únicos
          const detalles = data.detalles || [];
          setCantidadBoletas(detalles.length);

          // Calcular clientes únicos
          const clientesSet = new Set(detalles.map(detalle => detalle.ccliente).filter(c => c));
          setClientesUnicos(clientesSet.size);
        } else {
          setErrorDetalles(data.error || 'Error al cargar detalles del manifiesto');
          setCantidadBoletas(0);
          setClientesUnicos(0);
        }
      } catch (error) {
        console.error('Error al cargar detalles:', error);
        setErrorDetalles('Error de conexión al cargar detalles');
        setCantidadBoletas(0);
        setClientesUnicos(0);
      } finally {
        setLoadingDetalles(false);
      }
    };

    if (isOpen && manifiesto?.numero) {
      cargarDetalles();
    }
  }, [isOpen, manifiesto?.numero]);

  const handleRowClick = (index) => {
    // Solo cambiar la selección si es diferente, no permitir deseleccionar con clic
    if (selectedRow !== index) {
      setSelectedRow(index);
    }
  };

  // Función para manejar navegación con teclado
  const handleKeyDown = useCallback((event) => {
    if (!detallesManifiesto.length) return;

    // Solo manejar flechas arriba y abajo
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    event.preventDefault();

    if (selectedRow === null) {
      // Si no hay selección, empezar desde la primera fila
      setSelectedRow(0);
    } else {
      // Asegurar que selectedRow esté dentro de límites válidos
      let currentIndex = selectedRow;
      if (currentIndex < 0 || currentIndex >= detallesManifiesto.length) {
        currentIndex = 0;
      }

      // Navegar desde la fila actual
      if (event.key === 'ArrowUp') {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : detallesManifiesto.length - 1;
        setSelectedRow(newIndex);
      } else if (event.key === 'ArrowDown') {
        const newIndex = currentIndex < detallesManifiesto.length - 1 ? currentIndex + 1 : 0;
        setSelectedRow(newIndex);
      }
    }
  }, [detallesManifiesto.length, selectedRow]);

  // Agregar event listener para teclado cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="ver-detalle-manifiesto-modal-overlay">
      <div className="ver-detalle-manifiesto-modal">
        <div className="ver-detalle-manifiesto-modal-header">
          <h2 className="ver-detalle-manifiesto-modal-title">Detalle de Manifiesto</h2>
          <div>
            <button
              className="ver-detalle-manifiesto-modal-back"
              onClick={onClose}
            >
              Regresar a Lista
            </button>
          </div>
        </div>

        <div className="ver-detalle-manifiesto-modal-body">
          {/* Container de Información del Manifiesto */}
          <div className="manifiesto-info-container">
            <h3 className="manifiesto-info-title">Información del Manifiesto</h3>

            <div className="manifiesto-info-grid">
              {/* Número de Manifiesto */}
              <div className="info-field">
                <label className="info-label">Número de Manifiesto</label>
                <input
                  type="text"
                  value={manifiesto?.numero || ''}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Fecha */}
              <div className="info-field">
                <label className="info-label">Fecha</label>
                <input
                  type="text"
                  value={manifiesto?.fecha || ''}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Peso Local */}
              <div className="info-field">
                <label className="info-label">Peso Local</label>
                <input
                  type="text"
                  value={manifiesto?.peso_local || ''}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Peso Local en Toneladas */}
              <div className="info-field">
                <label className="info-label">Peso Local Toneladas</label>
                <input
                  type="text"
                  value={convertirAToneladas(manifiesto?.peso_local)}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Estado (Tipo) */}
              <div className="info-field">
                <label className="info-label">Estado</label>
                <input
                  type="text"
                  value={manifiesto?.tipo || ''}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Cantidad de Boletas */}
              <div className="info-field">
                <label className="info-label">Cantidad de Boletas</label>
                <input
                  type="text"
                  value={cantidadBoletas}
                  readOnly
                  className="info-input readonly"
                />
              </div>

              {/* Clientes Únicos */}
              <div className="info-field">
                <label className="info-label">Clientes Únicos</label>
                <input
                  type="text"
                  value={clientesUnicos}
                  readOnly
                  className="info-input readonly"
                />
              </div>
            </div>
          </div>

          {/* Container de Detalles del Manifiesto */}
          <div className="manifiesto-detalles-container">
            <h3 className="manifiesto-detalles-title">Detalles del Manifiesto</h3>

            {loadingDetalles && !detallesManifiesto.length && (
              <div className="loading-message">Cargando detalles...</div>
            )}

            {errorDetalles && (
              <div className="error-message">Error: {errorDetalles}</div>
            )}

            {!loadingDetalles && !errorDetalles && (
              <div className="detalles-table-container">
                <table className="detalles-table">
                  <thead>
                    <tr>
                      <th>Boleta</th>
                      <th>Tipo</th>
                      <th>Código</th>
                      <th>Artículo</th>
                      <th>Cantidad</th>
                      <th>Simarde</th>
                      <th>Cód. Cliente</th>
                      <th>Cliente</th>
                      <th className="acciones-col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesManifiesto.length > 0 ? (
                      detallesManifiesto.map((detalle, index) => (
                        <tr
                          key={`${detalle.boleta}-${index}`}
                          className={selectedRow === index ? 'selected-row' : ''}
                          onClick={() => handleRowClick(index)}
                        >
                          <td>{detalle.boleta || ''}</td>
                          <td>{detalle.tipo || ''}</td>
                          <td>{detalle.codigo || ''}</td>
                          <td>{detalle.articulo || ''}</td>
                          <td>{detalle.cantidad || ''}</td>
                          <td>{detalle.simarde || ''}</td>
                          <td>{detalle.ccliente || ''}</td>
                          <td>{detalle.cliente || ''}</td>
                          <td className="acciones-cell">
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="action-btn ver-boleta"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sel = {
                                    numero: detalle.boleta || detalle.numero_boleta || '',
                                    tipo: detalle.tipo || detalle.tipo_boleta || '',
                                    fecha: detalle.fecha || detalle.fecha_boleta || '',
                                    chofer: detalle.chofer || detalle.conductor || '',
                                    camion_n: detalle.camion_n || detalle.camion || ''
                                  };
                                  setBoletaSeleccionada(sel);
                                  setShowVerBoletaModal(true);
                                }}
                              >
                                <svg className="btn-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                  <path d="M7 7H13V3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V11H15V7H7Z" fill="currentColor"/>
                                  <path d="M15 3V9H21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="btn-text">Ver Boleta</span>
                              </button>
                              <button
                                className="action-btn reversar-lineas"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const numeroBoleta = detalle.boleta || detalle.numero_boleta || '';
                                  const tipo = detalle.tipo || detalle.tipo_boleta || '';
                                  const cliente = detalle.cliente || detalle.cliente_nombre || '';
                                  const cantidad = parseFloat(detalle.cantidad || detalle.cant || 0) || 0;
                                  const codigo = detalle.codigo || '';
                                  const descri = detalle.articulo || detalle.descri || '';
                                  setReversarData({ numeroBoleta, tipo, cliente, cantidad, codigo, descri });
                                  setReversarCantidad(cantidad);
                                  setReversarError(null);
                                  setShowReversarModal(true);
                                }}
                              >
                                <svg className="btn-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                  <path d="M21 7V3L13 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 11A8 8 0 1 1 13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="btn-text">Reversar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-data">No hay detalles disponibles para este manifiesto</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Modal Reversión de Línea */}
        {showReversarModal && (
          <div className="reversar-overlay" data-h-offset="0" data-v-offset="0">
            <div className="reversar-modal" role="dialog" aria-modal="true">
              <div className="reversar-header" data-h-offset="8" data-v-offset="6">
                <h3 className="reversar-title"> Reversión de Línea </h3>
                <button className="reversar-close" aria-label="Cerrar" onClick={() => setShowReversarModal(false)}>✕</button>
              </div>
              <div className="reversar-body" data-h-offset="12" data-v-offset="8">
                <div className="reversar-info">
                  <div className="reversar-info-grid">
                    <div className="reversar-label">Número de Boleta:</div>
                    <div className="reversar-value">{reversarData.numeroBoleta}</div>

                    <div className="reversar-label">Tipo de Boleta:</div>
                    <div className="reversar-value">{reversarData.tipo}</div>

                    <div className="reversar-label">Cliente:</div>
                    <div className="reversar-value">{reversarData.cliente}</div>

                    <div className="reversar-label">Cantidad existente:</div>
                    <div className="reversar-value">{reversarData.cantidad}</div>
                  </div>
                </div>

                <div className="reversar-note" data-h-offset="6" data-v-offset="8">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="note-icon">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.2" />
                    <path d="M12 8v1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M11.5 11.5h1v4h-1z" fill="white" />
                  </svg>
                  <span>Nota: La cantidad Reversada sera devuelta a Bodega (ebodega).</span>
                </div>

                <div className="reversar-input-row" data-h-offset="6" data-v-offset="12">
                  <div className="reversar-cantidad-label">Cantidad a Reversar</div>
                  <input
                    className="reversar-cantidad-input"
                    type="text"
                    value={reversarCantidad}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/^\d*(?:\.\d*)?$/.test(val)) return;
                      const num = val === '' ? '' : parseFloat(val);
                      if (num === '') {
                        setReversarCantidad('');
                        setReversarError(null);
                        return;
                      }
                      if (num < 0) {
                        setReversarError('No se permiten cantidades negativas');
                        return;
                      }
                      if (num > (reversarData.cantidad || 0)) {
                        setReversarError('La cantidad no puede ser mayor a la existente');
                        return;
                      }
                      setReversarCantidad(num);
                      setReversarError(null);
                    }}
                    inputMode="decimal"
                    autoFocus
                    aria-label="Cantidad a Reversar"
                  />
                </div>

                {reversarError && <div className="reversar-error" data-h-offset="6" data-v-offset="6">{reversarError}</div>}

                {/* separador visual entre input/error y acciones */}
                <div className="reversar-separator" aria-hidden />

                <div className="reversar-actions" data-h-offset="6" data-v-offset="12">
                  <button className="action-btn cancel" onClick={() => setShowReversarModal(false)}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <span>Cancelar</span>
                  </button>
                  <button
                    className="action-btn confirmar"
                    onClick={async () => {
                      if (!!reversarError || reversarCantidad === '' || parseFloat(reversarCantidad) <= 0) return;
                      try {
                        // bloquear UI simple
                        const payload = {
                          manifiesto: manifiesto?.numero,
                          boleta: reversarData.numeroBoleta,
                          tipo: reversarData.tipo,
                          codigo: reversarData.codigo || reversarData.codigo || '',
                          descri: reversarData.descri || '',
                          cantidad: reversarCantidad
                        };

                        const resp = await fetch('http://localhost:4000/api/reversar-linea', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        const data = await resp.json();
                        if (!resp.ok) {
                          throw new Error(data.error || 'Error procesando reversión');
                        }

                        // Mostrar resumen elegante en UI (en vez de alert)
                        const resumen = data.resumen || {};
                        const mensaje = `Reversión OK. Manifiesto filas actualizadas: ${resumen.manifiestoUpdated || 0}, Materiales actualizados: ${resumen.materialesUpdated || 0}, Transacción insertada: ${resumen.transaInserted || 0}`;
                        // Cerrar modal de reversión y mostrar resumen
                        setShowReversarModal(false);
                        setResumenData({ mensaje, resumen });
                        setShowResumen(true);

                        // Refrescar detalles del manifiesto (si existe manifiesto.numero) se hará al aceptar el resumen
                        // (evita doble fetch mientras el resumen está visible)
                        if (manifiesto?.numero) {
                          try {
                            const r = await fetch(`http://localhost:4000/api/manifiesto3/${manifiesto.numero}`);
                            if (r.ok) {
                              const d = await r.json();
                              setDetallesManifiesto(d.detalles || []);
                              setCantidadBoletas((d.detalles || []).length);
                            }
                          } catch { /* ignore */ }
                        }
                      } catch (err) {
                        console.error('Error al procesar reversión:', err);
                        alert('Error al procesar reversión: ' + (err.message || err));
                      }
                    }}
                    disabled={!!reversarError || reversarCantidad === '' || parseFloat(reversarCantidad) <= 0}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M21 12H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11 6L7 12L11 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Procesar Reversión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal para ver boleta seleccionado */}
        {showVerBoletaModal && (
          <VerBoletaModal
            isOpen={showVerBoletaModal}
            onClose={() => setShowVerBoletaModal(false)}
            boletaSeleccionada={boletaSeleccionada}
          />
        )}
        {/* Resumen flotante tras reversión (reemplaza alert) */}
        {showResumen && resumenData && (
          <div className="resumen-overlay">
            <div className="resumen-modal" role="dialog" aria-modal="true">
              <div className="resumen-header">
                <h4 className="resumen-title">Resumen de Reversión</h4>
              </div>
              <div className="resumen-body">
                <p className="resumen-mensaje">{resumenData.mensaje}</p>
                <div className="resumen-details">
                  <div><strong>Manifiesto filas actualizadas:</strong> {resumenData.resumen?.manifiestoUpdated || 0}</div>
                  <div><strong>Materiales actualizados:</strong> {resumenData.resumen?.materialesUpdated || 0}</div>
                  <div><strong>Transacción insertada:</strong> {resumenData.resumen?.transaInserted || 0}</div>
                  <div><strong>Cantidad anterior:</strong> {resumenData.resumen?.cantidadAnterior ?? '-'}</div>
                  <div><strong>Cantidad nueva:</strong> {resumenData.resumen?.cantidadNueva ?? '-'}</div>
                </div>
                <div className="resumen-actions">
                  <button
                    className="action-btn aceptar"
                    onClick={async () => {
                      // Cerrar resumen y refrescar detalles del manifiesto
                      setShowResumen(false);
                      setResumenData(null);
                      if (manifiesto?.numero) {
                        try {
                          const r = await fetch(`http://localhost:4000/api/manifiesto3/${manifiesto.numero}`);
                          if (r.ok) {
                            const d = await r.json();
                            setDetallesManifiesto(d.detalles || []);
                            setCantidadBoletas((d.detalles || []).length);
                          }
                        } catch { /* ignore */ }
                      }
                    }}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal para ver boleta seleccionado */}
        {showVerBoletaModal && (
          <VerBoletaModal
            isOpen={showVerBoletaModal}
            onClose={() => setShowVerBoletaModal(false)}
            boletaSeleccionada={boletaSeleccionada}
          />
        )}
      </div>
    </div>
  );
};

export default VerDetalleManifiestoModal;
