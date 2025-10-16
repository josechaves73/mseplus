import React, { useState, useEffect, useRef } from 'react';
import './TrazabilidadModal.css';
import FloatingMessage from './common/FloatingMessage';
// Reuse Flatpickr datepicker used in NuevoBoletaModal
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { buildApiUrl } from '../config/api';

const TrazabilidadModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('origen');
  const [selectedOrigen, setSelectedOrigen] = useState(null);
  const [selectedDestino, setSelectedDestino] = useState(null);

  const handleSelectOrigen = (id) => {
    setSelectedOrigen(id);
  };

  const handleSelectDestino = (id) => {
    setSelectedDestino(id);
  };

  const labelForOrigen = (id) => {
    switch(id) {
      case 1: return 'Bodega'
      case 2: return 'Proceso'
      case 3: return 'Terminado'
      default: return ''
    }
  }

  const labelForDestino = (id) => {
    switch(id) {
      case 4: return 'Bodega'
      case 5: return 'Proceso'
      case 6: return 'Terminado'
      case 7: return 'Despachado - Manifiesto'
      default: return ''
    }
  }

  // Lógica de deshabilitado se evalúa inline en useEffect y al renderizar botones

  const [fechaMovimiento, setFechaMovimiento] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [fpKey, setFpKey] = useState(0);
  const [floatingMsg, setFloatingMsg] = useState({ message: '', type: 'error', visible: false });
  const [origenTabDisabled, setOrigenTabDisabled] = useState(false);
  const [boletasEnabled, setBoletasEnabled] = useState(false);
  // Controls for the grid in Boletas tab (UI only for now)
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hideZeroLines, setHideZeroLines] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(1000);
  const [totalRows, setTotalRows] = useState(0);
  const [materiales, setMateriales] = useState([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const [materialesError, setMaterialesError] = useState('');
  // Transfer modal state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRow, setTransferRow] = useState(null);
  const [transferFromField, setTransferFromField] = useState('');
  const [transferToField, setTransferToField] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  // Manifiesto number state (only when destination is Despachado - Manifiesto)
  const [manifiestoNumber, setManifiestoNumber] = useState('');
  const [manifiestoValidated, setManifiestoValidated] = useState(false);
  const [validatingManifiesto, setValidatingManifiesto] = useState(false);
  // Confirmation modal for manifiesto
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalType, setConfirmModalType] = useState(''); // 'add' or 'create'
  // Selected row state: store row key (e.g. `${boleta}-${idx}`)
  const [selectedRow, setSelectedRow] = useState(null);
  // Ref for transfer quantity input
  const transferQtyRef = useRef(null);
  // Ver Manifiesto modal state
  const [verManifiestoModalOpen, setVerManifiestoModalOpen] = useState(false);
  const [manifiestoDetalles, setManifiestoDetalles] = useState([]);
  const [loadingManifiestoDetalles, setLoadingManifiestoDetalles] = useState(false);
  const [errorManifiestoDetalles, setErrorManifiestoDetalles] = useState('');

  const formatDateToISO = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const parseISOToLocalDate = (iso) => {
    if (!iso) return null;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }

  // Si la selección actual de destino queda deshabilitada por un cambio en origen, limpiarla
  useEffect(() => {
    // recalcular inline para evitar dependencias de funciones
    const destinoDisabledNow = (id) => {
      if (selectedOrigen === 1 && id === 4) return true;
      if (selectedOrigen === 2 && (id === 4 || id === 5)) return true;
      if (selectedOrigen === 3 && (id === 4 || id === 5 || id === 6)) return true;
      return false;
    }

    const origenDisabledNow = (id) => {
      if (selectedOrigen === 2 && id === 1) return true;
      if (selectedOrigen === 3 && id !== 3) return true;
      return false;
    }

    if (selectedDestino && destinoDisabledNow(selectedDestino)) {
      setSelectedDestino(null);
    }

    if (selectedOrigen && origenDisabledNow(selectedOrigen)) {
      // en caso raro que la seleccion de origen quedara inválida
      setSelectedOrigen(null);
    }

    // Clear manifiesto number if destination is not Despachado - Manifiesto
    if (selectedDestino !== 7) {
      setManifiestoNumber('');
      setManifiestoValidated(false);
    }
  }, [selectedOrigen, selectedDestino]);

  // Fetch materiales_proceso from server
  const fetchMateriales = async (opts = {}) => {
    try {
      setLoadingMateriales(true);
      setMaterialesError(null);
      const qs = new URLSearchParams();
      if (opts.search) qs.append('search', opts.search);
      if (opts.dateFrom) qs.append('dateFrom', opts.dateFrom);
      if (opts.dateTo) qs.append('dateTo', opts.dateTo);
  if (opts.hideZero) qs.append('hideZero', 'true');
  // Only include hideZeroField when hideZero is enabled (the checkbox controls applying the zero-line filter)
  if (opts.hideZero && opts.hideZeroField) qs.append('hideZeroField', opts.hideZeroField);
      if (opts.page) qs.append('page', opts.page);
      if (opts.pageSize) qs.append('pageSize', opts.pageSize);
  const url = `${buildApiUrl('/materiales_proceso')}?${qs.toString()}`;
  // (no debug logs in production)
      const res = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error desconocido');
      setMateriales(json.rows || []);
      setTotalRows(json.totalAll || 0);
      setLoadingMateriales(false);
      setMaterialesError('');
    } catch (err) {
      setLoadingMateriales(false);
      setMaterialesError(err.message || 'Error al cargar materiales');
    }
  }

  const fieldForOrigen = (origen) => {
    // origen: 1 -> ebodega, 2 -> eproceso, 3 -> eterminado
    if (origen === 1) return 'ebodega';
    if (origen === 2) return 'eproceso';
    if (origen === 3) return 'eterminado';
    return '';
  }

  const fieldForDestino = (dest) => {
    // destino: 4 -> ebodega, 5 -> eproceso, 6 -> eterminado, 7 -> despachado
    if (dest === 4) return 'ebodega';
    if (dest === 5) return 'eproceso';
    if (dest === 6) return 'eterminado';
    if (dest === 7) return 'despachado';
    return '';
  }

  const openTransferModal = (row, fromField, toField) => {
    setTransferRow(row);
    setTransferFromField(fromField);
    setTransferToField(toField);
    setTransferQty(row[fromField] || '');
    setTransferError('');
    setTransferOpen(true);
  }

  // Focus transfer quantity input when modal opens
  useEffect(() => {
    if (transferOpen && transferQtyRef.current) {
      transferQtyRef.current.focus();
      transferQtyRef.current.select();
    }
  }, [transferOpen]);

  const closeTransferModal = () => {
    setTransferOpen(false);
    setTransferRow(null);
    setTransferFromField('');
    setTransferToField('');
    setTransferQty('');
    setTransferError('');
  }

  // Validate manifiesto number
  const validateManifiesto = async () => {
    const numero = manifiestoNumber.trim();
    if (!numero) {
      setFloatingMsg({ message: 'Ingrese un número de manifiesto', type: 'error', visible: true });
      return;
    }

    setValidatingManifiesto(true);
    try {
      const res = await fetch(buildApiUrl(`/manifiestos/validate/${numero}`));
      const data = await res.json();

      if (data.exists) {
        setConfirmModalMessage(`¿Desea agregar registros al Manifiesto # ${numero}?`);
        setConfirmModalType('add');
      } else {
        setConfirmModalMessage(`¿Desea crear el manifiesto de transporte # ${numero}?`);
        setConfirmModalType('create');
      }
      setConfirmModalOpen(true);
    } catch (error) {
      setFloatingMsg({ message: 'Error al validar manifiesto', type: 'error', visible: true });
    } finally {
      setValidatingManifiesto(false);
    }
  }

  // Handle confirmation modal response
  const handleConfirmModal = (confirmed) => {
    setConfirmModalOpen(false);
    if (confirmed) {
      setManifiestoValidated(true);
    }
  }

  // Open Ver Manifiesto modal and load data
  const openVerManifiestoModal = async () => {
    setVerManifiestoModalOpen(true);
    setLoadingManifiestoDetalles(true);
    setErrorManifiestoDetalles('');

    try {
      const response = await fetch(buildApiUrl(`/manifiesto3/${manifiestoNumber}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar detalles del manifiesto');
      }

      setManifiestoDetalles(data.detalles || []);
    } catch (error) {
      setErrorManifiestoDetalles(error.message || 'Error al cargar detalles del manifiesto');
    } finally {
      setLoadingManifiestoDetalles(false);
    }
  }

  // Close Ver Manifiesto modal
  const closeVerManifiestoModal = () => {
    setVerManifiestoModalOpen(false);
    setManifiestoDetalles([]);
    setErrorManifiestoDetalles('');
  }

  // Función para determinar el tipo de transferencia basado en origen y destino
  const getTransferType = (origen, destino, manifiestoNumber) => {
    switch(`${origen}-${destino}`) {
      case '1-5': // Origen: Bodega, Destino: Proceso
        return 'De Bodega a Proceso';
      case '1-6': // Origen: Bodega, Destino: Terminado
        return 'De Bodega a Terminado';
      case '1-7': // Origen: Bodega, Destino: Despachado-Manifiesto
        return `De Bodega a Despachado: Manifiesto # ${manifiestoNumber}`;
      case '2-6': // Origen: Proceso, Destino: Terminado
        return 'De Proceso a Terminado';
      case '2-7': // Origen: Proceso, Destino: Despachado-Manifiesto
        return `De Proceso a Despachado: Manifiesto # ${manifiestoNumber}`;
      case '3-7': // Origen: Terminado, Destino: Despachado-Manifiesto
        return `De Terminado a Despachado: Manifiesto # ${manifiestoNumber}`;
      default:
        return 'Transferencia';
    }
  };

  const doTransfer = async () => {
    if (!transferRow) return;
    const qty = Number(transferQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setTransferError('Ingrese una cantidad válida mayor que 0');
      return;
    }
    const currentFrom = Number(transferRow[transferFromField]) || 0;
    if (qty > currentFrom) {
      setTransferError('Cantidad mayor que el disponible en el origen');
      return;
    }

    setTransferLoading(true);
    setTransferError('');
    try {
      const requestData = {
        boleta: transferRow.boleta,
        codigo: transferRow.codigo,
        tipo: transferRow.tipo, // Tipo original de la boleta para buscar en materiales_proceso
        tipoTransaAr: getTransferType(selectedOrigen, selectedDestino, manifiestoNumber), // Tipo descriptivo para transa_ar
        fromField: transferFromField,
        toField: transferToField,
        cantidad: qty,
        manifiestoNumber: selectedDestino === 7 ? manifiestoNumber : null,
        fechaMovimiento: fechaMovimiento
      };
      console.log('Sending transfer request:', requestData);

      const res = await fetch(buildApiUrl('/materiales_proceso/transferir'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const json = await res.json();
      if (!json.success) {
        setTransferError(json.error || 'Error en la transferencia');
        setTransferLoading(false);
        return;
      }

      // Update materiales array: replace the matching row (boleta+codigo+tipo) with returned row
      const updatedRow = json.row;
      setMateriales((prev) => prev.map(r => {
        if (r.boleta === updatedRow.boleta && r.codigo === updatedRow.codigo && r.tipo === updatedRow.tipo) {
          return updatedRow;
        }
        return r;
      }));

      setFloatingMsg({ message: 'Transferencia realizada', type: 'success', visible: true });
      setTransferLoading(false);
      closeTransferModal();
    } catch (err) {
      setTransferError(err.message || 'Error en la transferencia');
      setTransferLoading(false);
    }
  }

  // Load materiales when modal opens (cargar de entrada)
  useEffect(() => {
    if (isOpen) {
      // Reset all states when modal opens
      setActiveTab('origen');
      setSelectedOrigen(null);
      setSelectedDestino(null);
      setFechaMovimiento('');
      setFechaError('');
      setFpKey(prev => prev + 1);
      setOrigenTabDisabled(false);
      setBoletasEnabled(false);
      setSearchTerm('');
      setDateFrom('');
      setDateTo('');
      setHideZeroLines(false); // Fuerza el filtro a false
      setPage(1);
      setTotalRows(0);
      setMateriales([]);
      setLoadingMateriales(false);
      setMaterialesError('');
      setFiltersApplied(false);
      setManifiestoNumber(''); // Reset manifiesto number
      setManifiestoValidated(false); // Reset validation
      fetchMateriales({ hideZero: false }); // Nunca enviar hideZero en la carga inicial
    }
  }, [isOpen]);

  // When entering the Boletas tab and there are no user-applied filters,
  // load the full grid (no hideZero). This prevents the grid from starting
  // already filtered when the modal opens on Boletas.
  useEffect(() => {
    if (!isOpen) return;
  if (activeTab !== 'boletas') return;
    if (filtersApplied) return; // user already applied filters — do nothing
    if (materiales && materiales.length > 0) return; // already loaded
    // load all records (no hideZero) on first entrance
    fetchMateriales({ page: 1, hideZero: false });
  }, [isOpen, activeTab, filtersApplied, materiales]);

  // Debounced dynamic search: when searchTerm changes, call fetchMateriales after 300ms
  // Nota: intencionalmente OMITIMOS dateFrom, dateTo y hideZeroLines de las dependencias
  // porque esos controles deben aplicar filtros sólo cuando el usuario presiona FILTRAR.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // Only perform automatic searches for the text search field. We intentionally
    // do NOT trigger fetchMateriales on changes to dateFrom, dateTo or hideZeroLines
    // because those controls must only filter when the user clicks the FILTRAR button.
    if (!isOpen) return; // don't search if modal closed
    if (activeTab !== 'boletas') return; // only when on boletas tab

  const term = (searchTerm || '').trim();
  const delay = term ? 300 : 0; // debounce only when user types a term

    const timer = setTimeout(() => {
      // If user typed a term, perform a text search.
      if (term) {
        setPage(1);
        // text search is considered a user-applied filter
        setFiltersApplied(true);
          const hideZeroField = hideZeroLines ? fieldForOrigen(selectedOrigen) : '';
        // If the user had already applied date/hideZero filters, preserve them when searching
        if (filtersApplied) {
          fetchMateriales({ search: term, dateFrom, dateTo, hideZero: hideZeroLines, hideZeroField, page: 1 });
        } else {
          // otherwise perform a plain text search without date/hideZero
          fetchMateriales({ search: term, page: 1 });
        }
        return;
      }

      // term is empty
      // If no manual filters applied, do nothing: the initial load or tab effect handles it.
      if (!filtersApplied) return;

      // If manual filters are active but the user cleared the text search, re-run the
      // query with the current manual filters so the grid reflects them (without forcing hideZero=false).
      setPage(1);
      const hideZeroField = hideZeroLines ? fieldForOrigen(selectedOrigen) : '';
      fetchMateriales({ search: '', dateFrom, dateTo, hideZero: hideZeroLines, hideZeroField, page: 1 });
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, activeTab, selectedOrigen, selectedDestino, filtersApplied]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (floatingMsg.visible && floatingMsg.type === 'success') {
      const timer = setTimeout(() => {
        setFloatingMsg({ message: '', type: 'error', visible: false });
      }, 4000); // 4 seconds

      return () => clearTimeout(timer);
    }
  }, [floatingMsg.visible, floatingMsg.type]);

  if (!isOpen) return null;

  return (<>
    <div className="trazabilidad-modal-overlay" id="trazabilidad-modal-root">
      <div className="trazabilidad-modal">
        <div className="trazabilidad-modal-header">
          <h2 className="trazabilidad-modal-title">Trazabilidad</h2>
          <button className="trazabilidad-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="trazabilidad-modal-body">
          <div className="trazabilidad-tabs">
            <button
              className={`tab-button ${activeTab === 'origen' ? 'active' : ''}`}
              onClick={() => setActiveTab('origen')}
              disabled={origenTabDisabled}
            >
              Origen & Destinos
            </button>

            <button
              className={`tab-button ${activeTab === 'boletas' ? 'active' : ''}`}
              onClick={() => setActiveTab('boletas')}
              disabled={!boletasEnabled}
            >
              Boletas & Artículos
            </button>
          </div>

          <div className="trazabilidad-tab-content">
            {activeTab === 'origen' && (
              <div className="tab-panel origen-panel">

                <div className="origen-sidebars">
                  <div className="box origen-box">
                    <div className="box-title">ORIGEN</div>
                    <div className="box-body">
                      <button
                        className={`box-btn ${selectedOrigen === 1 ? 'selected' : ''}`}
                        onClick={() => handleSelectOrigen(1)}
                        aria-pressed={selectedOrigen === 1}
                        disabled={selectedOrigen === 2 || (selectedOrigen === 3 && 1 !== 3)}
                      ><span className="btn-icon">🏬</span> Bodega</button>

                      <button
                        className={`box-btn ${selectedOrigen === 2 ? 'selected' : ''}`}
                        onClick={() => handleSelectOrigen(2)}
                        aria-pressed={selectedOrigen === 2}
                        disabled={selectedOrigen === 3}
                      ><span className="btn-icon">⚙️</span> Proceso</button>

                      <button
                        className={`box-btn ${selectedOrigen === 3 ? 'selected' : ''}`}
                        onClick={() => handleSelectOrigen(3)}
                        aria-pressed={selectedOrigen === 3}
                        disabled={false}
                      ><span className="btn-icon">✅</span> Terminado</button>
                    </div>
                  </div>

                  <div className="box destinos-box">
                    <div className="box-title">DESTINOS</div>
                    <div className="box-body">
                      <button
                        className={`box-btn ${selectedDestino === 4 ? 'selected' : ''}`}
                        onClick={() => handleSelectDestino(4)}
                        aria-pressed={selectedDestino === 4}
                        disabled={(selectedOrigen === 1) || (selectedOrigen === 2) || (selectedOrigen === 3 && (4===4))}
                      ><span className="btn-icon">🏬</span> Bodega</button>

                      <button
                        className={`box-btn ${selectedDestino === 5 ? 'selected' : ''}`}
                        onClick={() => handleSelectDestino(5)}
                        aria-pressed={selectedDestino === 5}
                        disabled={(selectedOrigen === 2) || (selectedOrigen === 3)}
                      ><span className="btn-icon">⚙️</span> Proceso</button>

                      <button
                        className={`box-btn ${selectedDestino === 6 ? 'selected' : ''}`}
                        onClick={() => handleSelectDestino(6)}
                        aria-pressed={selectedDestino === 6}
                        disabled={selectedOrigen === 3}
                      ><span className="btn-icon">✅</span> Terminado</button>

                      <button
                        className={`box-btn ${selectedDestino === 7 ? 'selected' : ''}`}
                        onClick={() => handleSelectDestino(7)}
                        aria-pressed={selectedDestino === 7}
                        disabled={false}
                      ><span className="btn-icon">🚚</span> Despachado - Manifiesto</button>
                    </div>
                  </div>
                  {/* Summary box a la derecha que muestra las selecciones actuales */}
                  <div className="summary-box">
                    <div className="summary-row"><strong>ORIGEN SELECCIONADO:</strong> {selectedOrigen ? labelForOrigen(selectedOrigen) : '—'}</div>
                    <div className="summary-row"><strong>DESTINO SELECCIONADO:</strong> {selectedDestino ? labelForDestino(selectedDestino) : '—'}</div>
                  </div>
                  <div className="date-box">
                    <div className="box-title">Fecha del Movimiento</div>
                    <div className="date-box-body">
                      <Flatpickr
                        key={fpKey}
                        className="tm-fecha-input"
                        value={fechaMovimiento ? parseISOToLocalDate(fechaMovimiento) : null}
                        options={{ dateFormat: 'd-m-Y', allowInput: true, locale: Spanish, monthSelectorType: 'static' }}
                        onChange={([selected]) => {
                          if (!selected) {
                            setFechaMovimiento('');
                            setFechaError('');
                            // force remount to ensure input is cleared
                            setFpKey(k => k + 1);
                            return;
                          }
                          const today = new Date();
                          const sel = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
                          const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          if (sel > now) {
                            setFechaError('La fecha no puede ser mayor a hoy');
                            // clear stored value and reset the picker so it doesn't display the invalid date
                            setFechaMovimiento('');
                            setFpKey(k => k + 1);
                          } else {
                            setFechaError('');
                            setFechaMovimiento(formatDateToISO(selected));
                          }
                        }}
                      />
                      {fechaError && <div className="fecha-error">{fechaError}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTINUAR button fixed bottom-right inside modal body (only in Origen tab) */}
            {activeTab === 'origen' && (
            <div className="trazabilidad-continue-wrap">
              <button
                className="trazabilidad-continue-btn"
                onClick={() => {
                  // Validations
                  if (!selectedOrigen) {
                    setFloatingMsg({ message: 'Debe seleccionar un ORIGEN', type: 'error', visible: true });
                    return;
                  }
                  if (!selectedDestino) {
                    setFloatingMsg({ message: 'Debe seleccionar un DESTINO', type: 'error', visible: true });
                    return;
                  }
                  if (!fechaMovimiento) {
                    setFloatingMsg({ message: 'Debe seleccionar una FECHA válida', type: 'error', visible: true });
                    return;
                  }

                  // success: disable origen tab, enable boletas, focus it
                  setOrigenTabDisabled(true);
                  setBoletasEnabled(true);
                  setActiveTab('boletas');

                  // focus the boletas tab button after a short timeout to ensure it's rendered
                  setTimeout(() => {
                    const tabs = document.querySelectorAll('#trazabilidad-modal-root .trazabilidad-tabs .tab-button');
                    if (tabs && tabs[1]) tabs[1].focus();
                  }, 50);
                }}
              >
                <span className="btn-icon">➡️</span> CONTINUAR
              </button>
            </div>
            )}

            {activeTab === 'boletas' && (
              <div className="tab-panel boletas-panel">
                {/* Movement summary box */}
                <div className="movement-summary-box">
                  <div className="ms-row"><strong>Fecha del Movimiento:</strong> {fechaMovimiento ? fechaMovimiento : '—'}</div>
                  <div className="ms-row"><strong>Origen:</strong> {selectedOrigen ? labelForOrigen(selectedOrigen) : '—'}</div>
                  <div className="ms-row"><strong>Destino:</strong> {selectedDestino ? labelForDestino(selectedDestino) : '—'}</div>
                  <div className="ms-row"><strong>Código de Movimiento:</strong> {selectedOrigen && selectedDestino ? `${selectedOrigen}${selectedDestino}` : '—'}</div>
                  {selectedDestino === 7 && (
                    <>
                      <div className="ms-row">
                        <label><strong>Número de Manifiesto:</strong>
                          <input
                            type="text"
                            maxLength="8"
                            className="manifiesto-input"
                            value={manifiestoNumber}
                            onChange={e => setManifiestoNumber(e.target.value.toUpperCase())}
                            placeholder="Ingrese número"
                            readOnly={manifiestoValidated}
                          />
                        </label>
                      </div>
                      {!manifiestoValidated ? (
                        <div className="ms-row">
                          <button
                            className="btn-validar"
                            onClick={validateManifiesto}
                            disabled={validatingManifiesto || !manifiestoNumber.trim()}
                          >
                            {validatingManifiesto ? 'Validando...' : 'Validar'}
                          </button>
                        </div>
                      ) : (
                        <div className="ms-row">
                          <button
                            className="btn-ver-manifiesto"
                            onClick={openVerManifiestoModal}
                          >
                            <span className="btn-icon">👁️</span> VER MANIFIESTO
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                  {/* Filters area (search, date range, hide zeros, FILTRAR) */}
                  <div className="boletas-filters">
                    <input
                      className="bf-search"
                      placeholder="Buscar boleta, cliente o descri"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      aria-label="Buscar boleta cliente descri"
                    />

                    <div className="bf-dates">
                      <label>Desde: <input type="date" className="bf-date" value={dateFrom || ''} onChange={e => setDateFrom(e.target.value || '')} /></label>
                      <label>Hasta: <input type="date" className="bf-date" value={dateTo || ''} onChange={e => setDateTo(e.target.value || '')} /></label>
                    </div>

                    <label className="bf-hidezero"><input type="checkbox" checked={hideZeroLines} onChange={e => setHideZeroLines(e.target.checked)} /> No mostrar líneas en cero</label>

                    <button
                      className="bf-filter-btn"
                      onClick={() => {
                        const search = (searchTerm || '').trim();
                        // Only apply hideZeroField when the user checked the "No mostrar líneas en cero" checkbox
                        const hideZeroField = hideZeroLines ? fieldForOrigen(selectedOrigen) : '';
                        // mark that user applied filters and reset to first page
                        setPage(1);
                        setFiltersApplied(true);
                        fetchMateriales({ search, dateFrom, dateTo, hideZero: hideZeroLines, hideZeroField });
                      }}
                      disabled={loadingMateriales}
                    >
                      {loadingMateriales ? 'Cargando...' : 'FILTRAR'}
                    </button>
                  </div>

                  {/* Grid placeholder (data will come from materiales_proceso). clientec is present but hidden */}
                  <div className="boletas-grid-wrap">
                    <table className="boletas-grid">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Boleta</th>
                          <th>Tipo Boleta</th>
                          <th className="col-cliente">Cliente</th>
                          <th className="col-descri">Artículo</th>
                          <th>Cantidad</th>
                          <th className="col-ebodega">Existencia<br/>Bodega</th>
                          <th className="col-eproceso">Existencia<br/>Proceso</th>
                          <th className="col-eterminado">Existencia<br/>Terminado</th>
                          <th className="col-despachado">Cantidad<br/>Despachada</th>
                          <th className="hidden-col">clientec</th>
                          <th>Mover Cantidades</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingMateriales && (
                          <tr><td colSpan="11">Cargando...</td></tr>
                        )}
                        {materialesError && (
                          <tr><td colSpan="11">Error: {materialesError}</td></tr>
                        )}
                        {!loadingMateriales && !materialesError && materiales.length === 0 && (
                          <tr><td colSpan="11">No se encontraron registros</td></tr>
                        )}
                        {materiales.map((m, idx) => {
                          // format fecha to DD-MM-YYYY if present
                          let fechaFmt = m.fecha;
                          try {
                            if (m.fecha) {
                              const d = new Date(m.fecha);
                              const dd = String(d.getDate()).padStart(2, '0');
                              const mm = String(d.getMonth() + 1).padStart(2, '0');
                              const yyyy = d.getFullYear();
                              fechaFmt = `${dd}-${mm}-${yyyy}`;
                            }
                          } catch {
                            // leave original if parse fails
                          }

                          const fromField = selectedOrigen ? fieldForOrigen(selectedOrigen) : '';
                          const toField = selectedDestino ? fieldForDestino(selectedDestino) : '';

                          

                          const rowKey = `${m.boleta || 'b'}-${idx}`;
                          const isSelected = selectedRow === rowKey;

                          return (
                          <tr key={rowKey} className={isSelected ? 'row-selected' : ''} onClick={() => setSelectedRow(isSelected ? null : rowKey)}>
                            <td>{fechaFmt}</td>
                            <td>{m.boleta}</td>
                            <td>{m.tipo}</td>
                            <td className="col-cliente">{m.cliente}</td>
                            <td className="col-descri">{m.descri}</td>
                            <td>{m.cantidad}</td>
                            <td className="col-ebodega">{m.ebodega}</td>

                            <td className="col-eproceso">{m.eproceso}</td>

                            <td className="col-eterminado">{m.eterminado}</td>

                            <td className="col-despachado">{m.despachado}</td>
                            <td className="hidden-col">{m.clientec}</td>
                            <td className="debug-col">
                              <button
                                className="small-move-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // double-check conditions to avoid action on disabled buttons
                                  if (isSelected && fromField && toField && fromField !== toField) {
                                    openTransferModal(m, fromField, toField);
                                  }
                                }}
                                disabled={!(isSelected && fromField && toField && fromField !== toField && (selectedDestino !== 7 || manifiestoValidated))}
                                title={
                                  !isSelected ? 'Selecciona la fila para activar este botón' :
                                  (!fromField || !toField) ? 'Selecciona origen y destino válidos' :
                                  `Mover - ${labelForOrigen(selectedOrigen)} a ${labelForDestino(selectedDestino)}`
                                }
                              >
                                {fromField && toField && selectedOrigen && selectedDestino ? `Mover - ${labelForOrigen(selectedOrigen)} a ${labelForDestino(selectedDestino)}` : 'Mover'}
                              </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination controls */}
                  <div className="boletas-pagination">
                    <button
                      onClick={() => {
                        if (page <= 1) return;
                        const next = page - 1;
                        const hideZeroField = hideZeroLines ? fieldForOrigen(selectedOrigen) : '';
                        setPage(next);
                        fetchMateriales({ search: searchTerm.trim(), dateFrom, dateTo, hideZero: hideZeroLines, hideZeroField, page: next });
                      }}
                      disabled={page <= 1 || loadingMateriales}
                    >Anterior</button>

                    <div className="page-info">Página {page} de {Math.max(1, Math.ceil((totalRows || 0) / pageSize))} — {totalRows} registros</div>

                    <button
                      onClick={() => {
                        const maxp = Math.max(1, Math.ceil((totalRows || 0) / pageSize));
                        if (page >= maxp) return;
                        const next = page + 1;
                        const hideZeroField = hideZeroLines ? fieldForOrigen(selectedOrigen) : '';
                        setPage(next);
                        fetchMateriales({ search: searchTerm.trim(), dateFrom, dateTo, hideZero: hideZeroLines, hideZeroField, page: next });
                      }}
                      disabled={page >= Math.max(1, Math.ceil((totalRows || 0) / pageSize)) || loadingMateriales}
                    >Siguiente</button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <FloatingMessage
      message={floatingMsg.message}
      type={floatingMsg.type}
      isVisible={floatingMsg.visible}
      onClose={() => setFloatingMsg({ message: '', type: 'error', visible: false })}
    />
    {/* Confirmation modal for manifiesto */}
    {confirmModalOpen && (
      <div className="confirm-modal-overlay">
        <div className="confirm-modal">
          <div className="confirm-modal-header">
            <h3>Confirmar Manifiesto</h3>
          </div>
          <div className="confirm-modal-body">
            <p>{confirmModalMessage}</p>
          </div>
          <div className="confirm-modal-actions">
            <button onClick={() => handleConfirmModal(false)} className="btn-secondary">No</button>
            <button onClick={() => handleConfirmModal(true)} className="btn-primary">Sí</button>
          </div>
        </div>
      </div>
    )}
    {/* Transfer modal */}
    {transferOpen && transferRow && (
      <div className="transfer-modal-overlay">
        <div className="transfer-modal">
          <div className="transfer-modal-header">
            <h3>Transferir cantidad</h3>
            <button className="transfer-close" onClick={closeTransferModal}>✕</button>
          </div>
          <div className="transfer-modal-body">
            <div><strong>Boleta:</strong> {transferRow.boleta}</div>
            <div><strong>Cliente:</strong> {transferRow.cliente}</div>
            <div><strong>Artículo:</strong> {transferRow.descri}</div>
            <div><strong>Codigo:</strong> {transferRow.codigo}</div>
            <div className="transfer-row-values">
              <div><strong>Origen ({transferFromField}):</strong> {transferRow[transferFromField]}</div>
              <div><strong>Destino ({transferToField}):</strong> {transferRow[transferToField]}</div>
            </div>

            <div className="transfer-qty-placeholder">
              <label> Cantidad a transferir
                <input 
                  ref={transferQtyRef}
                  type="number" 
                  min="0" 
                  max={transferRow ? (transferRow[transferFromField] || 0) : 0}
                  step="0.01" 
                  className="transfer-qty-input" 
                  value={transferQty} 
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    // Prevent negative values and values greater than available
                    if (value === '' || (numValue >= 0 && numValue <= (Number(transferRow[transferFromField]) || 0))) {
                      setTransferQty(value);
                    }
                  }} 
                />
              </label>
            </div>
            {transferError && <div className="transfer-error">{transferError}</div>}
          </div>
          <div className="transfer-modal-actions">
            <button onClick={closeTransferModal} className="btn-secondary">
              <span className="btn-icon">❌</span> Cancelar
            </button>
            <button onClick={doTransfer} className="btn-primary" disabled={transferLoading}>
              <span className="btn-icon">✅</span> {transferLoading ? 'Procesando...' : 'Procesar'}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Ver Manifiesto Modal */}
    {verManifiestoModalOpen && (
      <div className="ver-manifiesto-modal-overlay">
        <div className="ver-manifiesto-modal">
          <div className="ver-manifiesto-modal-header">
            <div className="manifiesto-info-placeholder">
              <strong>Número de Manifiesto:</strong> {manifiestoNumber}
            </div>
          </div>
          <div className="ver-manifiesto-modal-body">
            {loadingManifiestoDetalles && (
              <div className="loading-message">Cargando detalles del manifiesto...</div>
            )}
            {errorManifiestoDetalles && (
              <div className="error-message">Error: {errorManifiestoDetalles}</div>
            )}
            {!loadingManifiestoDetalles && !errorManifiestoDetalles && (
              <>
                <div className="manifiesto-grid-container">
                  <table className="manifiesto-grid">
                    <thead>
                      <tr>
                        <th>Boleta</th>
                        <th>Artículo</th>
                        <th>Cantidad</th>
                        <th>Tipo</th>
                        <th>Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manifiestoDetalles.map((detalle, idx) => (
                        <tr key={`${detalle.boleta}-${idx}`}>
                          <td>{detalle.boleta}</td>
                          <td>{detalle.articulo}</td>
                          <td>{detalle.cantidad}</td>
                          <td>{detalle.tipo}</td>
                          <td>{detalle.cliente}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <div className="ver-manifiesto-modal-footer">
            <div className="peso-total-placeholder">
              <strong>Peso del Manifiesto en Toneladas:</strong> {
                (manifiestoDetalles.reduce((total, detalle) => total + (Number(detalle.cantidad) || 0), 0) / 1000).toFixed(3)
              }
            </div>
          </div>
          <div className="ver-manifiesto-modal-actions">
            <button onClick={closeVerManifiestoModal} className="btn-cerrar-rojo">
              <span className="btn-icon">✕</span> CERRAR ESTA VENTANA Y REGRESAR
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TrazabilidadModal;
