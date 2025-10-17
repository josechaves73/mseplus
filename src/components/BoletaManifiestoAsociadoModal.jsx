import React, { useEffect, useState } from 'react';
import './BoletaManifiestoAsociadoModal.css';

const BoletaManifiestoAsociadoModal = ({ isOpen, onClose, boleta }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({}); // manifiesto -> bool
  const [manifiestosCount, setManifiestosCount] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      if (!boleta || !boleta.numero) {
        setRows([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/manifiesto3/boleta/${encodeURIComponent(boleta.numero)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // normalizar: el servidor puede devolver {detalles: [...] } u directamente un array
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.detalles) ? data.detalles : []);
        setRows(list);
      } catch (err) {
        setError(err.message || 'Error al cargar manifiestos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, boleta]);

  // Cuando cambien las filas, recalcular cantidad de manifiestos distintos
  useEffect(() => {
    if (!rows || rows.length === 0) {
      setManifiestosCount(0);
      return;
    }
    const setMan = new Set(rows.map(r => (r.manifiesto != null && r.manifiesto !== '') ? r.manifiesto : 'Sin manifiesto'));
    setManifiestosCount(setMan.size);
  }, [rows]);

  // Agrupar por manifiesto
  const grouped = rows.reduce((acc, r) => {
    const key = r.manifiesto != null && r.manifiesto !== '' ? r.manifiesto : 'Sin manifiesto';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const toggle = (manifiesto) => {
    setExpanded(prev => ({ ...prev, [manifiesto]: !prev[manifiesto] }));
  };

  if (!isOpen) return null;

  return (
    <div className="bma-modal-overlay">
      <div className="bma-modal">
        <div className="bma-header">
          <h3>Manifiestos Asociados</h3>
          <button className="bma-close" onClick={onClose}>✕</button>
        </div>
        <div className="bma-body">
          <div className="bma-placeholder">
            <div className="bma-info-grid">
              <div className="info-label">Número de Boleta</div>
              <div className="info-value">{boleta?.numero ?? '-'}</div>
              <div className="info-label">Tipo</div>
              <div className="info-value">{boleta?.tipo ?? '-'}</div>
              <div className="info-label">Fecha</div>
              <div className="info-value">{boleta?.fecha ? new Date(boleta.fecha).toLocaleDateString() : '-'}</div>
              <div className="info-label">Cliente</div>
              <div className="info-value">{boleta?.clienten ?? '-'}</div>
              <div className="info-label">Estado</div>
              <div className="info-value">{boleta?.estado ?? '-'}</div>
            </div>
            {/* Leyenda: cuántos manifiestos distintos incluyen esta boleta */}
            <div className="bma-leyenda">
              {manifiestosCount === null ? (
                <span className="bma-leyenda-text">Cargando información de manifiestos...</span>
              ) : (
                <span className="bma-leyenda-text">Esta boleta está incluida en <span className="bma-leyenda-count">{manifiestosCount}</span> manifiestos.</span>
              )}
            </div>
          </div>

          <div className="bma-grid-container">
            {loading && <div className="bma-loading">Cargando manifiestos...</div>}
            {error && <div className="bma-error">Error: {error}</div>}
            {!loading && !error && rows.length === 0 && (
              <div className="bma-empty">No hay manifiestos asociados a esta boleta.</div>
            )}

            {!loading && !error && rows.length > 0 && (
              <table className="bma-table">
                <thead>
                  <tr>
                    <th style={{width: '48px'}} aria-hidden="true"></th>
                    <th>Manifiesto</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(grouped).sort((a,b)=>{
                    // ordenar; 'Sin manifiesto' al final
                    if (a==='Sin manifiesto') return 1;
                    if (b==='Sin manifiesto') return -1;
                    return a.toString().localeCompare(b.toString(), undefined, {numeric:true});
                  }).map((manifiesto) => (
                    <React.Fragment key={`grp-${manifiesto}`}>
                      <tr className="bma-group-row">
                        <td>
                          <button
                            id={`grp-${manifiesto}-btn`}
                            aria-expanded={!!expanded[manifiesto]}
                            aria-controls={`grp-${manifiesto}-body`}
                            className={`bma-expand-btn ${expanded[manifiesto] ? 'is-open' : ''}`}
                            onClick={() => toggle(manifiesto)}
                            title={expanded[manifiesto] ? 'Ocultar líneas' : 'Ver líneas'}
                          >
                            <svg width="33" height="33" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              {/* Flecha apuntando hacia abajo (50% más grande) */}
                              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </td>
                        <td className="bma-manifiesto-cell">{manifiesto} <span className="bma-count">({grouped[manifiesto].length})</span></td>
                      </tr>

                      {expanded[manifiesto] && (
                        <tr className="bma-expanded-panel-row">
                          <td colSpan={2}>
                            <div className={`bma-expanded-panel ${expanded[manifiesto] ? 'bma-expanded-panel-open' : 'bma-expanded-panel-collapsed'}`} id={`grp-${manifiesto}-body`} role="region" aria-labelledby={`grp-${manifiesto}-btn`}>
                              <div className="bma-expanded-actions">
                                <span>Manifiesto {manifiesto} — {grouped[manifiesto].length} líneas</span>
                              </div>
                              <table className="bma-child-table">
                                <thead>
                                  <tr>
                                    <th>Boleta</th>
                                    <th>Código</th>
                                    <th>Artículo</th>
                                    <th>Cantidad</th>
                                    <th>Cliente</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grouped[manifiesto].map((row, idx) => (
                                    <tr key={`child-${manifiesto}-${idx}`}>
                                      <td>{row.boleta}</td>
                                      <td>{row.codigo}</td>
                                      <td>{row.articulo || row.descri || '-'}</td>
                                      <td>{row.cantidad}</td>
                                      <td>{row.cliente || row.clienten || row.ccliente || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoletaManifiestoAsociadoModal;
