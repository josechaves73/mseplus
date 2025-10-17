import React, { useEffect, useState, useRef, useCallback } from 'react';
import './BoletasRelacionadasModal.css';

const BoletasRelacionadasModal = ({
  isOpen,
  onClose,
  // backwards compatible: codigoChofer/nombreChofer
  codigoChofer,
  nombreChofer,
  // new params for reuse
  fetchParamName, // e.g. 'chofer_c' or 'camion_p'
  fetchParamValue, // value for the query param
  headerPrimary, // primary header text (placa or conductor)
  headerSecondary, // secondary header text (nombre)
  columnOverrides // { camion: 'chofer' }
  , columnHeaderOverrides // { camion: 'Conductor' }
}) => {
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // modalRef removed: we now use wrapperRef for focus/keyboard handling
  const wrapperRef = useRef(null);
  const rowsRef = useRef({});
  const [clientSearch, setClientSearch] = useState('');
  const [filteredBoletas, setFilteredBoletas] = useState([]);
  const modalRef = useRef(null);
  const tableRef = useRef(null);
  const inputWrapperRef = useRef(null);

  const fmtDate = (raw) => {
    if (!raw) return '';
    // try to parse ISO or YYYY-MM-DD formats
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchBoletas = async () => {
      setLoading(true);
      setError(null);
      try {
        // determine param name and value (backwards compatible)
        const paramName = fetchParamName || (codigoChofer ? 'chofer_c' : null);
        const paramValue = fetchParamValue || codigoChofer;
  const url = `/api/boletas${paramName && paramValue ? `?${paramName}=${encodeURIComponent(paramValue)}` : ''}`;
  // debug
  console.log('Fetching boletas URL:', url);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Error al cargar boletas');
        const data = await resp.json();
        // server returns { boletas: [...] } or { rows: [...] } depending on implementation; normalize
        const rows = data.boletas || data.rows || data;
  const all = Array.isArray(rows) ? rows : [];
  setBoletas(all);
  setFilteredBoletas(all);
        setSelectedIndex(-1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBoletas();
  // note: dependencies include fetchParamValue and fetchParamName for reuse
  }, [isOpen, codigoChofer, fetchParamName, fetchParamValue]);

  // align client-search input with the Cliente column
  const alignClientInput = useCallback(() => {
    try {
      const modalEl = modalRef.current;
      const tableEl = tableRef.current;
      const wrapperEl = inputWrapperRef.current;
  const headerEl = modalEl ? modalEl.querySelector('.boletas-rel-header') : null;
  if (!modalEl || !tableEl || !wrapperEl || !headerEl) return;
      const ths = tableEl.querySelectorAll('th');
      if (!ths || !ths.length) return;
      // find the 'Cliente' column by text, fallback to 6th column
      let targetTh = Array.from(ths).find(t => (t.textContent || '').trim().toLowerCase() === 'cliente');
      if (!targetTh) targetTh = ths[5] || ths[ths.length-1];
  const headerRect = headerEl.getBoundingClientRect();
      const thRect = targetTh.getBoundingClientRect();
      // calculate left relative to header-controls (wrapper is inside it)
  // nudge left by 50px plus previous offset for visual alignment
  const left = Math.max(0, Math.round(thRect.left - headerRect.left - 58));
  wrapperEl.style.position = 'absolute';
  // clear any fallback 'right' so left takes effect
  wrapperEl.style.right = '';
  wrapperEl.style.left = `${left}px`;
  // position slightly below top to sit under the close button visually
  const top = 18 + 35 + 20 + 7; // move down additional 35px + 20px +7px as requested
  wrapperEl.style.top = `${top}px`;
      wrapperEl.style.width = '360px';
      wrapperEl.style.zIndex = '20';
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    // align on open and when data changes
    alignClientInput();
    const onResize = () => alignClientInput();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, filteredBoletas.length, alignClientInput]);

  // filter boletas by client name when clientSearch changes
  useEffect(() => {
    if (!clientSearch) {
      setFilteredBoletas(boletas);
      setSelectedIndex(-1);
      return;
    }
    const term = clientSearch.toLowerCase();
    const filtered = boletas.filter(b => (b.clienten || b.cliente || '').toLowerCase().includes(term));
    setFilteredBoletas(filtered);
    setSelectedIndex(-1);
  }, [clientSearch, boletas]);
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;
    const key = event.key;
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!boletas.length) return;
      if (key === 'ArrowDown') setSelectedIndex(prev => Math.min(prev + 1, boletas.length - 1));
      if (key === 'ArrowUp') setSelectedIndex(prev => Math.max(prev - 1, 0));
      if (key === 'Home') setSelectedIndex(0);
      if (key === 'End') setSelectedIndex(boletas.length - 1);
      if (key === 'PageDown') setSelectedIndex(prev => Math.min(prev + 10, boletas.length - 1));
      if (key === 'PageUp') setSelectedIndex(prev => Math.max(prev - 10, 0));
    }
    if (key === 'Enter') {
      // potential action: open boleta detalle - currently stop propagation
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isOpen, boletas.length]);

  const handleRowClick = (index) => {
    setSelectedIndex(index);
  };

  // attach listener to wrapper and lock body scrolling while modal is open
  useEffect(() => {
    const el = wrapperRef.current;
    if (isOpen) {
      if (el) el.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (el) el.addEventListener('keydown', handleKeyDown);
      return () => {
        if (el) el.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prev;
      };
    }
    if (el) el.removeEventListener('keydown', handleKeyDown);
    return undefined;
  }, [isOpen, handleKeyDown]);

  // autoscroll selected row into view
  useEffect(() => {
    if (selectedIndex < 0) return;
    const rowEl = rowsRef.current[`r-${selectedIndex}`];
    if (rowEl && rowEl.scrollIntoView) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="boletas-rel-overlay">
      <div className="boletas-rel-modal" ref={modalRef}>
        <div className="boletas-rel-header">
          <div>
            <h3>Boletas relacionadas</h3>
            <div className="conductor-info">
              {headerPrimary ? (
                <>
                  {fetchParamName === 'camion_p' ? 'Placa:' : 'Principal:'} <strong>{headerPrimary}</strong>
                  {headerSecondary ? <> — {headerSecondary}</> : null}
                </>
              ) : (
                <>Conductor: <strong>{nombreChofer || codigoChofer}</strong></>
              )}
            </div>
            <div className="boletas-count">Cantidad de Boletas relacionadas: <strong>{boletas.length}</strong></div>
          </div>
          <div className="header-controls">
            <button className="boletas-rel-close" onClick={onClose}>✕</button>
          </div>
          {/* input wrapper moved here so it can be aligned relative to the header */}
          <div className="client-search-wrapper" ref={inputWrapperRef}>
            <label htmlFor="clientSearch" className="sr-only">Buscar cliente</label>
            <input id="clientSearch" className="client-search-input" placeholder="Buscar cliente..." value={clientSearch} onChange={e=>setClientSearch(e.target.value)} />
          </div>
        </div>
        <div className="boletas-rel-body">
          {loading && <p>Cargando boletas...</p>}
          {error && <p className="error">Error: {error}</p>}
          {!loading && !error && (
            <div className="boletas-rel-table-wrap">
              <div className="boletas-rel-scroll" tabIndex={0} ref={wrapperRef}>
                <table className="boletas-rel-table" ref={tableRef}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>{(columnHeaderOverrides && columnHeaderOverrides.camion) || 'Camión'}</th>
                      <th>Estado</th>
                      <th>Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBoletas.map((b, idx) => (
                      <tr
                        key={`${b.numero}-${idx}`}
                        onClick={() => handleRowClick(idx)}
                        className={selectedIndex===idx ? 'selected' : ''}
                        ref={el => { rowsRef.current[`r-${idx}`] = el; }}
                      >
                        <td>{b.numero}</td>
                        <td>{b.tipo}</td>
                        <td>{fmtDate(b.fecha)}</td>
                        <td>{(columnOverrides && columnOverrides.camion && b[columnOverrides.camion]) || b.camion_n || ''}</td>
                        <td>{b.estado}</td>
                        <td>{b.clienten || b.cliente || b.nombre_cliente || ''}</td>
                      </tr>
                    ))}
                    {boletas.length===0 && (
                      <tr><td colSpan={6} style={{textAlign:'center', padding:'18px 0'}}>No se encontraron boletas para este conductor.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoletasRelacionadasModal;
