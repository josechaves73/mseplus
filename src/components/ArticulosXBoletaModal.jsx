import React, { useState, useEffect, useCallback } from 'react';
import './ArticulosXBoletaModal.css';

const ArticulosXBoletaModal = ({ isOpen, onClose, articuloSeleccionado }) => {
  const [boletas, setBoletas] = useState([]);
  const [selectedBoleta, setSelectedBoleta] = useState('');
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [movimientosTransaAr, setMovimientosTransaAr] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBoletas = useCallback(async () => {
    if (!articuloSeleccionado) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:4000/api/materiales_proceso/boletas-por-articulo?codigo=${articuloSeleccionado.codigo}`);
      const data = await response.json();

      if (data.success) {
        setBoletas(data.boletas || []);
      } else {
        setError(data.error || 'Error al cargar boletas');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching boletas:', err);
    } finally {
      setLoading(false);
    }
  }, [articuloSeleccionado]);

  const fetchTrazabilidad = useCallback(async () => {
    if (!selectedBoleta || !articuloSeleccionado) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:4000/api/materiales_proceso/trazabilidad?boleta=${selectedBoleta}&codigo=${articuloSeleccionado.codigo}`);
      const data = await response.json();

      if (data.success) {
        setTrazabilidad(data.trazabilidad || []);
      } else {
        setError(data.error || 'Error al cargar trazabilidad');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching trazabilidad:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBoleta, articuloSeleccionado]);

  const fetchMovimientosTransaAr = useCallback(async () => {
    if (!selectedBoleta || !articuloSeleccionado) return;

    // Limpiar datos anteriores antes de cargar nuevos
    setMovimientosTransaAr([]);

    try {
      // Encontrar la boleta seleccionada para obtener su tipox
      const boletaSeleccionada = boletas.find(b => b.boleta === selectedBoleta);
      const tipoxBoleta = boletaSeleccionada ? boletaSeleccionada.tipo : '';
      const codigoArticulo = articuloSeleccionado.codigo;

      console.log('🔍 Cargando movimientos para:', {
        boleta: selectedBoleta,
        tipox: tipoxBoleta,
        codigo: codigoArticulo
      });

      // Construir URL con parámetros
      const params = new URLSearchParams({
        boleta: selectedBoleta,
        codigo: codigoArticulo
      });

      if (tipoxBoleta) {
        params.append('tipox', tipoxBoleta);
      }

      const response = await fetch(`http://localhost:4000/api/materiales_proceso/movimientos-transa-ar?${params.toString()}`);
      const data = await response.json();

      console.log('📊 Movimientos filtrados recibidos:', data.movimientos);
      if (data.success) {
        setMovimientosTransaAr(data.movimientos || []);
      }
    } catch (err) {
      console.error('Error fetching movimientos transa_ar:', err);
      setMovimientosTransaAr([]);
    }
  }, [selectedBoleta, articuloSeleccionado, boletas]);

  // Cargar boletas cuando se abre el modal
  useEffect(() => {
    if (isOpen && articuloSeleccionado) {
      fetchBoletas();
    }
  }, [isOpen, articuloSeleccionado, fetchBoletas]);

  // Cargar trazabilidad cuando se selecciona una boleta
  useEffect(() => {
    if (selectedBoleta) {
      // Limpiar datos anteriores
      setTrazabilidad([]);
      setMovimientosTransaAr([]);
      fetchTrazabilidad();
      fetchMovimientosTransaAr();
    } else {
      setTrazabilidad([]);
      setMovimientosTransaAr([]);
    }
  }, [selectedBoleta, fetchTrazabilidad, fetchMovimientosTransaAr]);

  const filteredBoletas = boletas.filter(boleta =>
    boleta.boleta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = () => {
    setSelectedBoleta('');
    setTrazabilidad([]);
    setMovimientosTransaAr([]);
    setSearchTerm('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="articulos-x-boleta-modal-overlay">
      <div className="articulos-x-boleta-modal">
        <div className="articulos-x-boleta-modal-header">
          <h3>Trazabilidad de Artículo por Boleta</h3>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="articulos-x-boleta-modal-body">
          {/* Información del artículo */}
          {articuloSeleccionado && (
            <div className="articulo-info">
              <h4>Artículo Seleccionado:</h4>
              <div className="articulo-details">
                <p><strong>Código:</strong> {articuloSeleccionado.codigo}</p>
                <p><strong>Descripción:</strong> {articuloSeleccionado.descri || articuloSeleccionado.descripcion}</p>
                <p><strong>Unidad:</strong> {articuloSeleccionado.unidad}</p>
                <p><strong>Familia:</strong> {articuloSeleccionado.familia}</p>
              </div>
            </div>
          )}

          {/* Layout de 3 columnas */}
          <div className="modal-content-grid">
            {/* Columna Izquierda: Selector de boletas */}
            <div className="boleta-column">
              <div className="boleta-selector">
                <h4>Seleccionar Boleta:</h4>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Buscar boleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="boletas-list">
                  {loading && <p>Cargando boletas...</p>}
                  {error && <p className="error">{error}</p>}

                  {!loading && !error && filteredBoletas.length === 0 && (
                    <p>No se encontraron boletas para este artículo</p>
                  )}

                  {filteredBoletas.map((boleta) => (
                    <div
                      key={boleta.boleta}
                      className={`boleta-item ${selectedBoleta === boleta.boleta ? 'selected' : ''}`}
                      onClick={() => setSelectedBoleta(boleta.boleta)}
                    >
                      <strong>{boleta.boleta}</strong>
                      {boleta.fecha && <span> - {boleta.fecha}</span>}
                      {boleta.tipo && <span> - {boleta.tipo}</span>}
                      {boleta.cantidad && <span> (Cant: {boleta.cantidad})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna Centro: Trazabilidad */}
            <div className="trazabilidad-column">
              {selectedBoleta && (
                <div className="trazabilidad-section">
                  <h4>Trazabilidad - Boleta: {selectedBoleta}</h4>

                  {loading && <p>Cargando trazabilidad...</p>}

                  {!loading && trazabilidad.length === 0 && (
                    <p>No se encontró información de trazabilidad</p>
                  )}

                  {trazabilidad.length > 0 && (
                    <div className="trazabilidad-timeline">
                      {trazabilidad.map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-date">
                            {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-type">{item.tipo || 'Movimiento'}</span>
                              <span className="timeline-cantidad">Cant: {item.cantidad}</span>
                            </div>
                            <div className="timeline-details">
                              <div className="estado-info">
                                {item.origen === 'materiales_proceso' ? (
                                  <>
                                    <span>Bodega: {item.bodega || 0}</span>
                                    <span>Proceso: {item.proceso || 0}</span>
                                    <span>Terminado: {item.terminado || 0}</span>
                                    <span>Despachado: {item.despachado || 0}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Estado: {item.estado || 'N/A'}</span>
                                    <span>Tipo: {item.tipo_movimiento || item.tipo}</span>
                                  </>
                                )}
                              </div>
                              {item.cliente && (
                                <div className="cliente-info">Cliente: {item.cliente}</div>
                              )}
                              {item.manifiesto && (
                                <div className="manifiesto-info">Manifiesto: {item.manifiesto}</div>
                              )}
                              {item.descripcion && (
                                <div className="movimiento-info">Movimiento: {item.descripcion}</div>
                              )}
                              {item.usuario && (
                                <div className="movimiento-info">Usuario: {item.usuario}</div>
                              )}
                              {item.nota && (
                                <div className="movimiento-info">Nota: {item.nota}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna Derecha: Movimientos Transa_AR */}
            <div className="movimientos-column">
              {selectedBoleta && (
                <div className="movimientos-section">
                  <h4>Movimientos - Boleta: {selectedBoleta}</h4>

                  {movimientosTransaAr.length === 0 ? (
                    <p>No se encontraron movimientos</p>
                  ) : (
                    <div className="movimientos-table-container">
                      <table className="movimientos-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Cantidad</th>
                            <th>Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientosTransaAr.map((movimiento, index) => (
                            <tr key={`${movimiento.boleta}-${movimiento.conse}-${index}`}>
                              <td>{movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}</td>
                              <td>{movimiento.cantidad}</td>
                              <td>{movimiento.tipo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="articulos-x-boleta-modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticulosXBoletaModal;