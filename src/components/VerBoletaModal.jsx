import React, { useState, useEffect, useCallback } from 'react';
import './VerBoletaModal.css';

const VerBoletaModal = ({ isOpen, onClose, boletaSeleccionada }) => {
  const [materiales, setMateriales] = useState([]);
  const [boletaHeader, setBoletaHeader] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMaterialesBoleta = useCallback(async () => {
    if (!boletaSeleccionada) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/materiales-boleta/${boletaSeleccionada.numero}/${boletaSeleccionada.tipo}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setMateriales(data.materiales || []);
      } else {
        setError(data.error || 'Error al cargar materiales');
      }
      // También obtener cabecera/metadata de la boleta si no viene completa
      try {
        const r2 = await fetch(`/api/boletas/${boletaSeleccionada.numero}/${boletaSeleccionada.tipo}`);
        if (r2.ok) {
          const header = await r2.json();
          setBoletaHeader(header || null);
        }
      } catch {
        // no crítico, mostramos lo que venga en boletaSeleccionada
      }
    } catch (err) {
      setError(err.message);
      setMateriales([]);
    } finally {
      setLoading(false);
    }
  }, [boletaSeleccionada]);

  // Cargar materiales cuando se abre el modal
  useEffect(() => {
    if (isOpen && boletaSeleccionada) {
      fetchMaterialesBoleta();
    }
  }, [isOpen, boletaSeleccionada, fetchMaterialesBoleta]);

  // Formatea fecha ISO a formato latino dd/MM/yyyy sin hora
  const formatFechaLatina = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch { return iso; }
  };

  if (!isOpen) return null;

  return (
    <div className="ver-boleta-modal-overlay">
      <div className="ver-boleta-modal">
        <div className="ver-boleta-modal-header">
          <h2 className="ver-boleta-modal-title">
            Detalle de Boleta: {boletaSeleccionada?.numero} - {boletaSeleccionada?.tipo}
          </h2>
          <div className="header-controls">
            <button className="ver-boleta-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="ver-boleta-modal-body">
          {!boletaSeleccionada ? (
            <div className="error-message">
              <p>Error: No se pudo obtener la información de la boleta seleccionada.</p>
            </div>
          ) : (
            <>
              <div className="boleta-info-placeholder">
                <div className="boleta-info-left">
                    <span className="boleta-info-text">
                      Boleta: {boletaSeleccionada.numero} | Tipo: {boletaSeleccionada.tipo}
                    </span>
                    <div className="boleta-info-grid">
                      <div className="info-row">
                        <div className="info-label">Fecha</div>
                        <div className="info-value">{ formatFechaLatina((boletaHeader && boletaHeader.fecha) || boletaSeleccionada.fecha) }</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Chofer</div>
                        <div className="info-value">{ (boletaHeader && boletaHeader.chofer) || boletaSeleccionada.chofer || '-' }</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Camión</div>
                        <div className="info-value">{ (boletaHeader && boletaHeader.camion_n) || boletaSeleccionada.camion_n || '-' }</div>
                      </div>
                    </div>
                  </div>
                <div className="materiales-count">
                  {materiales.length} material(es)
                </div>
              </div>

              <div className="materiales-grid-container">
                {loading && <p className="loading">Cargando materiales...</p>}
                {error && <p className="error">Error: {error}</p>}
                {!loading && !error && (
                  <>
                    <div className="materiales-table">
                      <div className="materiales-table-header">
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <thead>
                            <tr className="header-row">
                              <th>Código</th>
                              <th>Descripción de Artículo</th>
                              <th>Cantidad Ingresada</th>
                              <th>En Bodega</th>
                              <th>En Proceso</th>
                              <th>Terminado</th>
                              <th>Despachado</th>
                            </tr>
                          </thead>
                        </table>
                      </div>
                      <div className="materiales-table-body">
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <tbody>
                            {materiales.map((material, i) => (
                              <tr key={`${material.codigo}-${i}`}>
                                <td>{material.codigo}</td>
                                <td className="cell-expanded">{material.descri}</td>
                                <td className="numeric">{material.cantidad}</td>
                                <td className="numeric">{material.ebodega}</td>
                                <td className="numeric">{material.eproceso}</td>
                                <td className="numeric">{material.eterminado}</td>
                                <td className="numeric">{material.despachado}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {materiales.length === 0 && (
                      <p className="no-materiales">No se encontraron materiales para esta boleta.</p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerBoletaModal;
