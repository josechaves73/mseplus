import React, { useState, useEffect } from 'react';
import './NuevoBoletaModal.css';
import FloatingMessage from './common/FloatingMessage';
import ConfirmExitModal from './common/ConfirmExitModal';
// Flatpickr (datepicker estilable)
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
// Spanish locale for flatpickr
import { Spanish } from 'flatpickr/dist/l10n/es.js';

const tabs = [
  { id: 'numero', label: 'Número & Fechas', icon: '🔢', color: '#6b176b' },
  { id: 'transportes', label: 'Transportes', icon: '🚚', color: '#1e90ff' },
  { id: 'cliente', label: 'Cliente', icon: '👤', color: '#28a745' },
  { id: 'articulos', label: 'Selección de artículos', icon: '📦', color: '#ffb32b' },
  { id: 'cantidades', label: 'Cantidades', icon: '🔢', color: '#ff6b35' },
  { id: 'resumen', label: 'Resumen', icon: '📝', color: '#6c757d' },
];

const NuevoBoletaModal = ({ isOpen, onClose, isEdit = false, initialBoleta = null, onAppliedUpdates }) => {
  const [active, setActive] = useState(tabs[0].id);
  // enabledTabs determines which tabs are interactive. By default (opened from NUEVO)
  // only 'numero' is enabled. Other flows can enable more tabs later.
  const [enabledTabs] = useState(new Set(['numero']));
  // Data for tipo_boletas used in the Numero tab
  const [tipoBoletas, setTipoBoletas] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [errorTipos, setErrorTipos] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const [numeroError, setNumeroError] = useState('');
  const [fechaBoleta, setFechaBoleta] = useState('');
  const [anio, setAnio] = useState('');
  const [semana, setSemana] = useState('');
  // saving state removed (action buttons removed)
  const [floatMsg, setFloatMsg] = useState({ message: '', type: 'info', isVisible: false });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [readOnlyAfterSave, setReadOnlyAfterSave] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Handler to close floating message; optionally close the modal when requested
  const handleFloatClose = () => {
    // if floatMsg requests modal close on accept, call onClose()
    if (floatMsg && floatMsg.closeModalOnAccept) {
      try { onClose(); } catch { /* ignore */ }
    }
    // If floatMsg requests activating another tab after accept, do it now
    if (floatMsg) {
      if (floatMsg.setReadOnlyOnAccept) {
        setReadOnlyAfterSave(true);
      }
      if (floatMsg.activateTab) {
        const tabTo = floatMsg.activateTab;
        // enable the tab and switch to it
        try { enabledTabs.add(tabTo); } catch (e) { console.warn('Could not enable tab', e); }
        setActive(tabTo);
        // optionally focus an element in that tab
        if (floatMsg.focusId) {
          setTimeout(() => {
            const el = document.getElementById(floatMsg.focusId);
            if (el) {
              try { el.focus({ preventScroll: true }); } catch { el.focus(); }
            }
          }, 50);
        }
      }
    }
    setFloatMsg({ message: '', type: 'info', isVisible: false });
  };

  // Reset modal internal state whenever it is opened so no residual data remains
  useEffect(() => {
    if (isOpen) {
      setActive(tabs[0].id);
  // clear all inputs and messages (preserve tipoBoletas so grid keeps data)
      setLoadingTipos(false);
      setErrorTipos(null);
      // Reset all form and transport state to avoid residual data
      // Si estamos en modo edición y recibimos initialBoleta, precargar algunos campos
      if (isEdit && initialBoleta) {
        try {
          setSelectedTipo(initialBoleta.tipo || '');
          setNumeroBoleta(initialBoleta.numero || '');
          // Fecha puede venir en ISO o en otro formato - preferir ISO
          setFechaBoleta(initialBoleta.fecha ? (initialBoleta.fecha.slice && initialBoleta.fecha.slice(0,10)) : '');
        } catch (e) {
          console.warn('Error prefiling initialBoleta', e);
          setSelectedTipo('');
          setNumeroBoleta('');
          setFechaBoleta('');
        }
      } else {
        setSelectedTipo('');
        setNumeroBoleta('');
        setFechaBoleta('');
      }
      setNumeroError('');
      // Si estamos en modo edición y se precargó fecha desde initialBoleta, no sobrescribirla.
      if (!(isEdit && initialBoleta && initialBoleta.fecha)) {
        setFechaBoleta('');
        setAnio('');
        setSemana('');
      }
      setFloatMsg({ message: '', type: 'info', isVisible: false });
      // Ensure grid is interactive when opening a new modal
      setReadOnlyAfterSave(false);
      // Reset tipo and transport lists / filters / selections
      try {
        // recreate enabledTabs Set so only 'numero' is enabled initially
        // Note: enabledTabs is a Set from useState; mutate it in place to preserve identity.
        if (enabledTabs && typeof enabledTabs.clear === 'function' && typeof enabledTabs.add === 'function') {
          enabledTabs.clear();
          enabledTabs.add('numero');
        }
      } catch { /* ignore if not mutable */ }
      // No limpiar `tipoBoletas` aquí para conservar la lista en cache y evitar parpadeos
      // setTipoBoletas([]);
      setChoferes([]);
      setVehiculos([]);
      setSearchChofer('');
      setSearchVehiculo('');
      setFilteredChoferes([]);
      setFilteredVehiculos([]);
      setSelectedChoferIndex(-1);
      setSelectedVehiculoIndex(-1);
      // reset cliente lock al abrir modal nuevo
      setClienteLocked(false);
    }
  }, [isOpen, enabledTabs, isEdit, initialBoleta]);

  // Helper: parse ISO YYYY-MM-DD to a local Date (avoid timezone shifts)
  const parseISOToLocalDate = (iso) => {
    if (!iso) return null;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  };

  // NOTE: server-side check /api/boletas/check will perform exact match on numero+tipo

  // Helper: format a Date to ISO YYYY-MM-DD using local date parts
  const formatDateToISO = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: mostrar ISO YYYY-MM-DD como DD-MM-YYYY para display
  const formatISOToDisplay = (iso) => {
    if (!iso) return '';
    const d = parseISOToLocalDate(iso);
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Obtener número ISO de semana a partir de una Date local
  const getISOWeek = (d) => {
    if (!d) return '';
    // usar UTC para evitar problemas de zona horaria
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return String(weekNo).padStart(2,'0');
  };

  // Actualizar año y semana cuando cambie fechaBoleta
  useEffect(() => {
    if (!fechaBoleta) {
      setAnio('');
      setSemana('');
      return;
    }
    const d = parseISOToLocalDate(fechaBoleta);
    if (d) {
      setAnio(String(d.getFullYear()));
      setSemana(getISOWeek(d));
    } else {
      setAnio('');
      setSemana('');
    }
  }, [fechaBoleta]);

  // Handler para Guardar y Salir: valida, verifica existencia y guarda
  // Note: action handlers removed per request (Guardar y Continuar / Guardar y Salir)

  // Handler para Guardar y Continuar: similar a Guardar y Salir, but after save
  // activates the 'transportes' tab and makes numero/fecha readOnly.
  const handleGuardarContinuar = async () => {
    try {
      // Validaciones cliente
      if (!selectedTipo) { setFloatMsg({ message: 'Tipo de boleta es obligatorio', type: 'warning', isVisible:true }); return; }
  if (!numeroBoleta || numeroBoleta.trim() === '') { setFloatMsg({ message: 'Número de boleta no puede quedar vacío', type: 'warning', isVisible:true }); return; }

      const today = new Date();
      const picked = parseISOToLocalDate(fechaBoleta);
      if (!picked) { setFloatMsg({ message: 'Fecha inválida', type: 'error', isVisible:true }); return; }
      const ymdToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const ymdPicked = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate());
      if (ymdPicked > ymdToday) { setFloatMsg({ message: 'La fecha seleccionada no puede ser mayor a la fecha actual', type: 'warning', isVisible:true }); return; }

      // En modo edición no verificamos existencia (editará la boleta existente)
      if (!isEdit) {
        // Verificar existencia por número + tipo llamando al endpoint dedicado
        const checkUrl = `http://localhost:4000/api/boletas/exists?numero=${encodeURIComponent(numeroBoleta)}&tipo=${encodeURIComponent(selectedTipo || '')}`;
        const resCheck = await fetch(checkUrl);
        if (resCheck.ok) {
          const body = await resCheck.json();
          if (body && body.exists) {
            const numero = numeroBoleta;
            const tipoTexto = selectedTipo || (body.boleta && body.boleta.tipo) || '';
            const msg = `La boleta (${numero}) y el tipo (${tipoTexto}) ya existen en la Base de Datos. Favor Verificar datos ingresados.`;
            setFloatMsg({ message: msg, type: 'warning', isVisible:true });
            return;
          }
        } else {
          const txt = await resCheck.text();
          setFloatMsg({ message: 'Error al verificar boleta existente: ' + txt, type: 'error', isVisible:true });
          return;
        }
      }

      // No se construye payload: no guardamos en BD por ahora

      // Nota: no se guarda en BD ahora; solo hacemos las validaciones y la comprobación de existencia
      // y mostramos el mensaje de éxito que al aceptar activará la pestaña Transportes.
      // En modo edición permitir continuar directamente a Transportes sin bloquear por existencia
      setFloatMsg({ message: 'Validación exitosa. Continuar a Transportes.', type: 'success', isVisible:true, activateTab: 'transportes', focusId: 'transportes-first-input', setReadOnlyOnAccept: true });
    } catch (err) {
      console.error('Error en handleGuardarContinuar:', err);
      setFloatMsg({ message: 'Error inesperado: ' + String(err), type: 'error', isVisible:true });
    }
  };

  // Handler específico para el botón CONTINUAR dentro de la pestaña Transportes
  const handleTransportesContinuar = () => {
    try {
      // Leer los valores de los four readonly inputs
      const choferCodigo = (document.getElementById('transportes-chofer-codigo') || {}).value || '';
      const choferNombre = (document.getElementById('transportes-chofer-nombre') || {}).value || '';
      const vehPlaca = (document.getElementById('transportes-vehiculo-placa') || {}).value || '';
      const vehNombre = (document.getElementById('transportes-vehiculo-nombre') || {}).value || '';

      // Regla: todos deben tener contenido para continuar
      if (!choferCodigo.trim() || !choferNombre.trim() || !vehPlaca.trim() || !vehNombre.trim()) {
        setFloatMsg({ message: 'Debe seleccionar un chofer y un vehículo antes de continuar.', type: 'warning', isVisible: true });
        return;
      }

      // En modo edición: no activar pestaña Cliente, bloquear cliente y avanzar a Cantidades cargando líneas desde materiales_proceso
      if (isEdit) {
  try { enabledTabs.add('articulos'); } catch { /* ignore */ }
  try { enabledTabs.add('cantidades'); } catch { /* ignore */ }
        setClienteLocked(true);
        // Cargar cantidades para la boleta actual
        const boletaNum = numeroBoleta || (initialBoleta && initialBoleta.numero) || '';
        if (boletaNum) {
          const tipoFiltro = selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
          loadCantidadesForBoleta(boletaNum, tipoFiltro).finally(() => setActive('cantidades'));
        } else {
          setActive('cantidades');
        }
        return;
      }

      // Validación pasada: activar la pestaña 'cliente' (sin mostrar mensaje)
      try { enabledTabs.add('cliente'); } catch (e) { console.warn('Could not enable cliente tab', e); }
      setActive('cliente');
    } catch (err) {
      console.error('Error en handleTransportesContinuar:', err);
      setFloatMsg({ message: 'Error inesperado en validación de transportes.', type: 'error', isVisible: true });
    }
  };

  // Helper: cargar cantidades/lineas desde materiales_proceso para una boleta
  const loadCantidadesForBoleta = async (boletaNum, tipoParam) => {
    try {
      if (!boletaNum) return;
      // Preferir tipoParam, luego selectedTipo, luego initialBoleta.tipo
      const tipoFiltro = tipoParam || selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
      const qTipo = tipoFiltro ? `&tipo=${encodeURIComponent(tipoFiltro)}` : '';
      const resp = await fetch(`http://localhost:4000/api/materiales_proceso?search=${encodeURIComponent(boletaNum)}${qTipo}&pageSize=1000`);
      if (!resp.ok) { console.warn('No se pudo obtener materiales_proceso para la boleta'); return; }
      const body = await resp.json();
      const rows = body.rows || [];
      // Filtrar por boleta y por tipo si se proporcionó
      const filas = rows.filter(r => String(r.boleta) === String(boletaNum) && (tipoFiltro ? String((r.tipo||'')).toLowerCase() === String(tipoFiltro).toLowerCase() : true));
      if (!filas || filas.length === 0) return;
      const codigos = [];
      const cantidadesMap = {};
      filas.forEach(r => {
        const codigo = r.codigo;
        if (!codigos.includes(codigo)) codigos.push(codigo);
        // Guardar metadatos en cantidades para mostrar cuando el artículo no exista en articulos
        // locked = true si hay diferencias entre ebodega y cantidad (indicando movimientos aplicados)
        const ebodegaNum = Number(r.ebodega) || 0;
        const cantidadNum = Number(r.cantidad) || 0;
        const lockedFlag = ebodegaNum !== cantidadNum;
        cantidadesMap[codigo] = { cantidad: r.cantidad != null ? String(r.cantidad) : '', unidad: '', descri: r.descri || '', ciiu: r.ciiu || '', simarde: r.simarde || '', locked: lockedFlag, ebodega: r.ebodega != null ? String(r.ebodega) : '' };
      });

      // 1) Merge selectedArticuloIds: añadir los codigos de materiales_proceso sin eliminar los ya seleccionados
      setSelectedArticuloIds(prevSelected => {
        const prev = Array.isArray(prevSelected) ? prevSelected : [];
        const union = Array.from(new Set([...prev, ...codigos]));
        return union;
      });

      // 2) Merge cantidadesByArticulo: no sobreescribir cantidades existentes a menos que estén vacías
      setCantidadesByArticulo(prev => {
        const next = { ...(prev || {}) };
        Object.keys(cantidadesMap).forEach(codigo => {
          const existing = next[codigo];
          if (!existing || existing.cantidad === '' || existing.cantidad == null) {
            next[codigo] = cantidadesMap[codigo];
          } else {
            // conservar existing (pero añadir metadatos si faltan). Preservar locked si ya existía o si la nueva tiene locked
            const merged = { ...(cantidadesMap[codigo] || {}), ...(existing || {}) };
            merged.locked = Boolean((existing && existing.locked) || cantidadesMap[codigo].locked);
            next[codigo] = merged;
          }
        });
        return next;
      });
      // Guardar snapshot original para detectar cambios: mapear codigo -> cantidad original (number) y ebodega
      setOriginalCantidadesByArticulo(prev => {
        const next = { ...(prev || {}) };
        filas.forEach(r => {
          const codigo = r.codigo;
          if (next[codigo] === undefined) {
            next[codigo] = { cantidad: r.cantidad != null ? Number(r.cantidad) : 0, ebodega: r.ebodega != null ? Number(r.ebodega) : 0 };
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error cargando cantidades desde materiales_proceso:', err);
    }
  };

  // Construir payload de ajustes comparando snapshot original vs estado actual
  const buildAjustesPayload = () => {
    const ajustes = [];
    const numero = numeroBoleta || (initialBoleta && initialBoleta.numero) || '';
    const tipoFiltro = selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
    // cliente desde la pestaña Resumen (selección actual) o fallback a initialBoleta
    // Resolver cliente: preferir la selección actual en la pestaña Cliente, si no,
    // intentar encontrar en filteredClientes por código almacenado en initialBoleta (modo edición),
    // finalmente fallback a los valores de initialBoleta.
    let clienteName = '';
    let clienteC = '';
    if (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) {
      clienteName = filteredClientes[selectedClienteIndex].nombre || '';
      clienteC = filteredClientes[selectedClienteIndex].codigo || '';
    } else if (isEdit && initialBoleta && initialBoleta.clientec) {
      // intentar localizar en filteredClientes por código
      const found = filteredClientes.find(fc => String(fc.codigo) === String(initialBoleta.clientec));
      if (found) {
        clienteName = found.nombre || '';
        clienteC = found.codigo || '';
      } else {
        clienteName = initialBoleta.clienten || '';
        clienteC = initialBoleta.clientec || '';
      }
    } else {
      clienteName = initialBoleta && initialBoleta.clienten ? initialBoleta.clienten : '';
      clienteC = initialBoleta && initialBoleta.clientec ? initialBoleta.clientec : '';
    }
    Object.keys(cantidadesByArticulo || {}).forEach(codigo => {
      const datos = cantidadesByArticulo[codigo] || {};
      const nuevaRaw = datos.cantidad;
      const nueva = nuevaRaw === '' || nuevaRaw == null ? null : Number(String(nuevaRaw).replace(/,/g, '.'));
      const orig = originalCantidadesByArticulo && originalCantidadesByArticulo[codigo] ? originalCantidadesByArticulo[codigo].cantidad : null;
      // Si orig === null => fila nueva
      if (orig === null || orig === undefined) {
        if (nueva != null && !isNaN(nueva) && nueva !== 0) {
          ajustes.push({ codigo, original: null, nueva, descri: datos.descri || '', ciiu: datos.ciiu || '', simarde: datos.simarde || '' });
        }
      } else {
        // existe original, comparar
        if (nueva != null && !isNaN(nueva) && Number(nueva) !== Number(orig)) {
          ajustes.push({ codigo, original: Number(orig), nueva, descri: datos.descri || '', ciiu: datos.ciiu || '', simarde: datos.simarde || '' });
        }
      }
    });
    return {
      numero: numeroBoleta || (initialBoleta && initialBoleta.numero) || '',
      fecha: fechaBoleta || (initialBoleta && initialBoleta.fecha) || '',
      tipo: selectedTipo || (initialBoleta && initialBoleta.tipo) || '',
      cliente: clienteName || '',
      clientec: clienteC || '',
      ajustes
    };
  };

  const applyAjustes = async () => {
    try {
      if (!isEdit) { setFloatMsg({ message: 'Ajustes sólo aplicables en modo edición', type: 'warning', isVisible: true }); return; }
      const payload = buildAjustesPayload();
      // Construir payload con posibles cambios en nivel boleta (fecha, chofer, vehiculo, semana, año)
      const numero = payload.numero || (initialBoleta && initialBoleta.numero) || '';
      // Resolver valores actuales de chofer y vehículo desde selección o fallback a initialBoleta
      let choferValor = '';
      let choferCValor = '';
      if (selectedChoferIndex >= 0 && (choferes || []).length > selectedChoferIndex) {
        choferValor = (choferes[selectedChoferIndex] && choferes[selectedChoferIndex].nombre) || '';
        choferCValor = (choferes[selectedChoferIndex] && choferes[selectedChoferIndex].codigo_chofer) || '';
      } else if (initialBoleta) {
        choferValor = initialBoleta.chofer || '';
        choferCValor = initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || initialBoleta.chofer_c || (initialBoleta.chofer_c || '');
      }

      let camionPValor = '';
      let camionNValor = '';
      if (selectedVehiculoIndex >= 0 && (vehiculos || []).length > selectedVehiculoIndex) {
        camionPValor = (vehiculos[selectedVehiculoIndex] && vehiculos[selectedVehiculoIndex].placa) || '';
        camionNValor = (vehiculos[selectedVehiculoIndex] && vehiculos[selectedVehiculoIndex].nombre) || '';
      } else if (initialBoleta) {
        camionPValor = initialBoleta.camion_p || initialBoleta.placa || '';
        camionNValor = initialBoleta.camion_n || initialBoleta.vehiculo || '';
      }

      const fechaValor = fechaBoleta || (initialBoleta && initialBoleta.fecha) || '';

      // calcular semana (ISO) y año a partir de fechaValor si existe
      const computeISOWeekYear = (iso) => {
        if (!iso) return { semana: 0, año: new Date().getFullYear() };
        const d = new Date(iso + 'T00:00:00');
        // Copy date so don't modify original
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // ISO week date week starts Monday
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
        return { semana: weekNo, año: date.getUTCFullYear() };
      };

      const { semana: semanaCalc, año: añoCalc } = computeISOWeekYear(fechaValor);

      // Comparar con valores originales en initialBoleta para detectar cambios
      const originalChofer = initialBoleta ? (initialBoleta.chofer || '') : '';
      const originalChoferC = initialBoleta ? (initialBoleta.chofer_c || initialBoleta.chofer_c || '') : '';
      const originalCamionP = initialBoleta ? (initialBoleta.camion_p || initialBoleta.placa || '') : '';
      const originalCamionN = initialBoleta ? (initialBoleta.camion_n || initialBoleta.vehiculo || '') : '';
      const originalFecha = initialBoleta ? (initialBoleta.fecha || '') : '';
      const originalSemana = initialBoleta ? (initialBoleta.semana || 0) : 0;
      const originalAño = initialBoleta ? (initialBoleta.año || initialBoleta.anio || initialBoleta.year || 0) : 0;

      const boletaUpdates = {};
      if (fechaValor && fechaValor !== originalFecha) boletaUpdates.fecha = fechaValor;
      if (choferValor && String(choferValor) !== String(originalChofer)) boletaUpdates.chofer = choferValor;
      if (choferCValor && String(choferCValor) !== String(originalChoferC)) boletaUpdates.chofer_c = choferCValor;
      if (camionPValor && String(camionPValor) !== String(originalCamionP)) boletaUpdates.camion_p = camionPValor;
      if (camionNValor && String(camionNValor) !== String(originalCamionN)) boletaUpdates.camion_n = camionNValor;
      if (semanaCalc && Number(semanaCalc) !== Number(originalSemana)) boletaUpdates.semana = semanaCalc;
      if (añoCalc && Number(añoCalc) !== Number(originalAño)) boletaUpdates.año = añoCalc;

      const hasBoletaChanges = Object.keys(boletaUpdates).length > 0;

      if ((!payload.ajustes || payload.ajustes.length === 0) && !hasBoletaChanges) { setFloatMsg({ message: 'No hay ajustes para aplicar', type: 'info', isVisible: true }); return; }
      setIsApplying(true);
      let resp = { ok: true };
      let body = {};

      // Si hay ajustes en materiales_proceso, aplicarlos primero
      if (payload.ajustes && payload.ajustes.length > 0) {
        resp = await fetch('http://localhost:4000/api/materiales_proceso/ajustes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const txt = await resp.text();
        try { body = JSON.parse(txt); } catch { body = { message: txt }; }
      }

      // Si hay cambios en la boleta, enviarlos al endpoint de boletas
      if (hasBoletaChanges) {
        try {
          // Usar PUT /api/boletas/:numero (endpoint existente)
          // Incluir 'tipo' en el body para que el servidor pueda identificar por numero+tipo si es necesario
          const tipoParaEnviar = selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
          const updateBody = { ...boletaUpdates, tipo: tipoParaEnviar };
          const updateResp = await fetch(`http://localhost:4000/api/boletas/${encodeURIComponent(numero)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody) });
          if (!updateResp.ok) {
            const txt2 = await updateResp.text();
            let b2 = {};
            try { b2 = JSON.parse(txt2); } catch { b2 = { message: txt2 }; }
            console.warn('Warning: no se pudieron aplicar algunos cambios en boletas:', b2);
          }
        } catch (err) {
          console.error('Error actualizando boleta:', err);
        }
      }
      // Si hubo llamada a ajustes y fue OK
      if (resp && resp.ok) {
        // Mostrar mensaje de éxito y en el cierre volver al grid y refrescar
        setFloatMsg({ message: 'Actualizaciones Aplicadas', type: 'success', isVisible: true, action: 'aplicar_ajustes' });
        // refrescar snapshot y cantidades desde servidor si correspondía
        if (payload.ajustes && payload.ajustes.length > 0) {
          const boletaNum = payload.numero;
          const tipoFiltro = payload.tipo;
          await loadCantidadesForBoleta(boletaNum, tipoFiltro);
        }
      } else if (resp && resp.status === 404) {
        setFloatMsg({ message: body && body.error ? body.error : 'Registro no encontrado en materiales_proceso (404)', type: 'warning', isVisible: true });
      } else if (resp && resp.status === 409) {
        setFloatMsg({ message: body && body.error ? body.error : 'Conflicto al aplicar ajustes (409)', type: 'warning', isVisible: true });
      } else if (!resp) {
        setFloatMsg({ message: 'No se ejecutaron cambios', type: 'info', isVisible: true });
      } else {
        setFloatMsg({ message: body && body.error ? body.error : 'Error aplicando ajustes: ' + (resp.statusText || ''), type: 'error', isVisible: true });
      }
    } catch (err) {
      console.error('Error applyAjustes:', err);
      setFloatMsg({ message: 'Error al aplicar ajustes: ' + String(err), type: 'error', isVisible: true });
    } finally {
      setIsApplying(false);
    }
  };


  // Fetch tipo_boletas when the Numero tab becomes active
  useEffect(() => {
    let mounted = true;
    const loadTipos = async () => {
      if (active !== 'numero') return;
      setLoadingTipos(true);
      setErrorTipos(null);
      try {
        const res = await fetch('http://localhost:4000/api/tipo-boletas');
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error fetching tipos');
        if (mounted) {
          const tipos = body.data || [];
          setTipoBoletas(tipos);
          // NO auto-seleccionar para respetar comportamiento del usuario
        }
      } catch (err) {
        if (mounted) setErrorTipos(err.message || String(err));
      } finally {
        if (mounted) setLoadingTipos(false);
      }
    };

    loadTipos();
    return () => { mounted = false; };
  }, [active, isEdit, initialBoleta]);

  // Fetch choferes y vehiculos cuando la pestaña 'transportes' está activa
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [searchChofer, setSearchChofer] = useState('');
  const [searchVehiculo, setSearchVehiculo] = useState('');
  const [filteredChoferes, setFilteredChoferes] = useState([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [selectedChoferIndex, setSelectedChoferIndex] = useState(-1);
  const [selectedVehiculoIndex, setSelectedVehiculoIndex] = useState(-1);
  useEffect(() => {
    let mounted = true;
    const loadTransportes = async () => {
      if (active !== 'transportes') return;
      try {
        const [r1, r2] = await Promise.all([
          fetch('http://localhost:4000/api/chofer'),
          fetch('http://localhost:4000/api/vehiculos')
        ]);
        if (!r1.ok) throw new Error('Error cargando choferes');
        if (!r2.ok) throw new Error('Error cargando vehiculos');
        const b1 = await r1.json();
        const b2 = await r2.json();
        if (mounted) {
          const choferList = b1.choferes || [];
          const vehList = b2.vehiculos || [];
          setChoferes(choferList);
          setVehiculos(vehList);

          // Si estamos en modo edición, intentar preseleccionar chofer y vehículo según initialBoleta
          if (isEdit && initialBoleta) {
            try {
              const choferCodigo = initialBoleta.chofer_codigo || initialBoleta.choferCodigo || initialBoleta.chofer_cod || '';
              const choferNombre = initialBoleta.chofer || '';
              let choferIdx = -1;
              if (choferCodigo) {
                choferIdx = choferList.findIndex(c => String(c.codigo_chofer) === String(choferCodigo));
              }
              if (choferIdx === -1 && choferNombre) {
                choferIdx = choferList.findIndex(c => String((c.nombre||'')).toLowerCase() === String(choferNombre).toLowerCase());
              }
              if (choferIdx >= 0) setSelectedChoferIndex(choferIdx);

              // En la tabla boletas: camion_p = placa, camion_n = nombre
              const vehPlaca = initialBoleta.camion_p || initialBoleta.placa || initialBoleta.camion_p || '';
              const vehNombre = initialBoleta.camion_n || initialBoleta.vehiculo || initialBoleta.camion_nombre || '';
              let vehIdx = -1;
              if (vehPlaca) {
                vehIdx = vehList.findIndex(v => String(v.placa) === String(vehPlaca));
              }
              if (vehIdx === -1 && vehNombre) {
                vehIdx = vehList.findIndex(v => String((v.nombre||'')).toLowerCase() === String(vehNombre).toLowerCase());
              }
              if (vehIdx >= 0) setSelectedVehiculoIndex(vehIdx);
            } catch (err) {
              console.warn('No se pudo preseleccionar chofer/vehículo en modo edición:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando transportes:', err);
      }
    };
    loadTransportes();
    return () => { mounted = false; };
  }, [active, isEdit, initialBoleta]);

  // Filtrado local para ambos grids
  useEffect(() => {
    const term = String(searchChofer || '').toLowerCase();
    const fc = choferes.filter(c => String(c.codigo_chofer).toLowerCase().includes(term) || c.nombre.toLowerCase().includes(term));
    setFilteredChoferes(fc);
  }, [choferes, searchChofer]);

  useEffect(() => {
    const term = String(searchVehiculo || '').toLowerCase();
    const fv = vehiculos.filter(v => (v.marca || '').toLowerCase().includes(term) || (v.nombre || '').toLowerCase().includes(term) || (v.placa || '').toLowerCase().includes(term));
    setFilteredVehiculos(fv);
  }, [vehiculos, searchVehiculo]);

  // Cliente tab state
  const [clientes, setClientes] = useState([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [selectedClienteIndex, setSelectedClienteIndex] = useState(-1);
  // Cuando el usuario confirma un cliente, bloqueamos la pestaña cliente para que quede readOnly
  const [clienteLocked, setClienteLocked] = useState(false);
  // Artículos (selección) - cargados por cliente seleccionado
  const [articulos, setArticulos] = useState([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  const [selectedArticuloIds, setSelectedArticuloIds] = useState([]);
  // Cantidades: mapping codigoArticulo -> { cantidad: string|number, unidad: string }
  const [cantidadesByArticulo, setCantidadesByArticulo] = useState({});
  // Snapshot original cargado desde materiales_proceso para detectar cambios (codigo -> { cantidad, ebodega })
  const [originalCantidadesByArticulo, setOriginalCantidadesByArticulo] = useState({});

  // Determinar si existen ajustes comparando snapshot original vs estado actual
  const hasAjustes = React.useMemo(() => {
    try {
      // 1) Detectar cambios en cantidades (existente behavior)
      const keys = Object.keys(cantidadesByArticulo || {});
      for (const codigo of keys) {
        const datos = cantidadesByArticulo[codigo] || {};
        const nuevaRaw = datos.cantidad;
        const nueva = nuevaRaw === '' || nuevaRaw == null ? null : Number(String(nuevaRaw).replace(/,/g, '.'));
        const orig = originalCantidadesByArticulo && originalCantidadesByArticulo[codigo] ? originalCantidadesByArticulo[codigo].cantidad : null;
        if (orig === null || orig === undefined) {
          if (nueva != null && !isNaN(nueva) && nueva !== 0) { return true; }
        } else {
          if (nueva != null && !isNaN(nueva) && Number(nueva) !== Number(orig)) { return true; }
        }
      }

      // 2) Detectar cambios a nivel boleta: fecha, chofer, chofer_c, camion_p, camion_n
      // Fecha
      const currentFecha = fechaBoleta || (initialBoleta && initialBoleta.fecha) || '';
      const originalFecha = initialBoleta ? (initialBoleta.fecha || '') : '';
      if (currentFecha !== originalFecha) return true;

      // Chofer y chofer_c
      let currentChofer = '';
      let currentChoferC = '';
      if (selectedChoferIndex >= 0 && (choferes || []).length > selectedChoferIndex) {
        currentChofer = (choferes[selectedChoferIndex] && choferes[selectedChoferIndex].nombre) || '';
        currentChoferC = (choferes[selectedChoferIndex] && choferes[selectedChoferIndex].codigo_chofer) || '';
      } else if (initialBoleta) {
        currentChofer = initialBoleta.chofer || '';
        currentChoferC = initialBoleta.chofer_c || '';
      }
      const originalChofer = initialBoleta ? (initialBoleta.chofer || '') : '';
      const originalChoferC = initialBoleta ? (initialBoleta.chofer_c || '') : '';
      if (String(currentChofer) !== String(originalChofer) || String(currentChoferC) !== String(originalChoferC)) return true;

  // Vehículo (placa/nombre)
      let currentCamionP = '';
      let currentCamionN = '';
      if (selectedVehiculoIndex >= 0 && (vehiculos || []).length > selectedVehiculoIndex) {
        currentCamionP = (vehiculos[selectedVehiculoIndex] && vehiculos[selectedVehiculoIndex].placa) || '';
        currentCamionN = (vehiculos[selectedVehiculoIndex] && vehiculos[selectedVehiculoIndex].nombre) || '';
      } else if (initialBoleta) {
        currentCamionP = initialBoleta.camion_p || initialBoleta.placa || '';
        currentCamionN = initialBoleta.camion_n || initialBoleta.vehiculo || '';
      }
      const originalCamionP = initialBoleta ? (initialBoleta.camion_p || initialBoleta.placa || '') : '';
      const originalCamionN = initialBoleta ? (initialBoleta.camion_n || initialBoleta.vehiculo || '') : '';
      if (String(currentCamionP) !== String(originalCamionP) || String(currentCamionN) !== String(originalCamionN)) return true;

  // Semana / Año: comparar con los valores calculados a partir de fechaBoleta
  // Nota: anio y semana también se mantienen en estados `anio` y `semana`.
  const currentSemana = semana || '';
  const currentAnio = anio || '';
  const originalSemana = initialBoleta ? (initialBoleta.semana || '') : '';
  const originalAnio = initialBoleta ? (initialBoleta.año || initialBoleta.anio || initialBoleta.year || '') : '';
  if (String(currentSemana) !== String(originalSemana) || String(currentAnio) !== String(originalAnio)) return true;

  return false;
    } catch {
      return false;
    }
  }, [
    cantidadesByArticulo, originalCantidadesByArticulo, fechaBoleta, initialBoleta,
    selectedChoferIndex, choferes, selectedVehiculoIndex, vehiculos,
    semana, anio
  ]);

  // Mantener sincronizado el mapping de cantidades con los artículos seleccionados
  useEffect(() => {
    setCantidadesByArticulo(prev => {
      const next = {};
      (selectedArticuloIds || []).forEach(id => {
        next[id] = prev[id] || { cantidad: '', unidad: '' };
      });
      return next;
    });
  }, [selectedArticuloIds, articulos]);

  const handleCantidadChange = (codigo, value) => {
    // Sanitize: accept comma or dot as decimal separator, remove invalid chars
    if (typeof value !== 'string') value = String(value || '');
    value = value.replace(/,/g, '.');
    // Allow only digits and at most one dot
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      // keep only first dot
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Enforce max decimals 2
    if (value.includes('.')) {
      const [intPart, decPart] = value.split('.');
      value = intPart.slice(0, 8) + '.' + (decPart || '').slice(0, 2);
    } else {
      // no decimals, limit integer part to 8 (so total 10 with 2 decimals)
      value = value.slice(0, 8);
    }

    setCantidadesByArticulo(prev => ({ ...prev, [codigo]: { ...(prev[codigo]||{}), cantidad: value } }));
  };

  const handleUnidadChange = (codigo, value) => {
    setCantidadesByArticulo(prev => ({ ...prev, [codigo]: { ...(prev[codigo]||{}), unidad: value } }));
  };

  // Eliminar un artículo de la lista seleccionada (desde la pestaña Cantidades)
  const handleEliminarArticulo = async (codigo) => {
    try {
      // En modo edición, debemos verificar en servidor que ebodega === cantidad y eliminar en BD
      if (isEdit) {
        const boletaNum = numeroBoleta || (initialBoleta && initialBoleta.numero) || '';
        const tipoFiltro = selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
        if (!boletaNum || !tipoFiltro) {
          setFloatMsg({ message: 'No se pudo determinar boleta/tipo para eliminar en servidor.', type: 'error', isVisible: true });
          return;
        }

        const url = `http://localhost:4000/api/materiales_proceso?boleta=${encodeURIComponent(boletaNum)}&codigo=${encodeURIComponent(codigo)}&tipo=${encodeURIComponent(tipoFiltro)}`;
        // helper to extract readable message from server response
        const extractMessage = async (response) => {
          try {
            const cloned = response.clone();
            const body = await cloned.json();
            if (body && (body.error || body.message)) return String(body.error || body.message);
          } catch {
            // ignore JSON parse error
          }
          try {
            const text = await response.text();
            // if text looks like JSON, try to clean it
            try {
              const parsed = JSON.parse(text);
              return String(parsed.error || parsed.message || text);
            } catch {
              return text;
            }
          } catch {
            return response.statusText || 'Error en la respuesta del servidor';
          }
        };

        try {
          const resp = await fetch(url, { method: 'DELETE' });
          if (resp.ok) {
            const body = await resp.json().catch(() => ({}));
            // Eliminar localmente
            setSelectedArticuloIds(prev => prev.filter(id => id !== codigo));
            setCantidadesByArticulo(prev => {
              const next = { ...prev };
              delete next[codigo];
              return next;
            });
            const successMsg = (body && (body.message || body.success)) ? (body.message || 'Artículo eliminado correctamente.') : 'Artículo eliminado correctamente.';
            setFloatMsg({ message: successMsg, type: 'success', isVisible: true });
            return;
          }
          const cleanMsg = await extractMessage(resp);
          if (resp.status === 409) {
            setFloatMsg({ message: 'Eliminación denegada - Artículo tiene movimientos de trazabilidad aplicados. Devuelve las cantidades a Bodega para poder eliminar.', type: 'warning', isVisible: true });
            return;
          } else if (resp.status === 404) {
            setFloatMsg({ message: cleanMsg || 'Registro no encontrado en materiales_proceso.', type: 'warning', isVisible: true });
            return;
          } else {
            setFloatMsg({ message: 'Error al eliminar línea en servidor: ' + (cleanMsg || resp.statusText), type: 'error', isVisible: true });
            return;
          }
        } catch (err) {
          console.error('Error llamando DELETE materiales_proceso:', err);
          setFloatMsg({ message: 'Error de comunicación con el servidor al intentar eliminar.', type: 'error', isVisible: true });
          return;
        }
      }

      // Si no es modo edición, comportamiento local (no tocar servidor)
      setSelectedArticuloIds(prev => prev.filter(id => id !== codigo));
      setCantidadesByArticulo(prev => {
        const next = { ...prev };
        delete next[codigo];
        return next;
      });
    } catch (err) {
      console.error('Error eliminando artículo:', err);
      setFloatMsg({ message: 'Error al eliminar artículo.', type: 'error', isVisible: true });
    }
  };

  // Navegación y foco para inputs de cantidad en la pestaña 'cantidades'
  const focusCantidadInputByIndex = (idx) => {
    const inputs = Array.from(document.querySelectorAll('.nb-panel-cantidades .cantidad-input'));
    if (!inputs || inputs.length === 0) return;
    const clamped = Math.max(0, Math.min(inputs.length - 1, idx));
    const el = inputs[clamped];
    if (el) {
      try { el.focus({ preventScroll: true }); } catch { el.focus(); }
      // seleccionar contenido para que el usuario pueda escribir sin borrar manualmente
      try { setTimeout(() => { el.select && el.select(); }, 0); } catch { /* ignore */ }
    }
  };

  const handleCantidadKeyDown = (codigo, e) => {
    if (active !== 'cantidades') return;
    const inputs = Array.from(document.querySelectorAll('.nb-panel-cantidades .cantidad-input'));
    if (!inputs || inputs.length === 0) return;
    const idx = inputs.findIndex(i => i.dataset && i.dataset.codigo === String(codigo));
    if (idx === -1) return;

    // Tab y Shift+Tab: navegar exclusivamente entre campos de cantidad
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const prev = idx > 0 ? idx - 1 : inputs.length - 1;
        focusCantidadInputByIndex(prev);
      } else {
        const next = idx < inputs.length - 1 ? idx + 1 : 0;
        focusCantidadInputByIndex(next);
      }
      return;
    }

    // Flechas arriba/abajo: mover foco
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = Math.min(inputs.length - 1, idx + 1);
      focusCantidadInputByIndex(next);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = Math.max(0, idx - 1);
      focusCantidadInputByIndex(prev);
      return;
    }
  };

  const handleClienteContinuar = async () => {
    try {
      const codigo = (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? (filteredClientes[selectedClienteIndex].codigo || '') : '';
      const nombre = (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? (filteredClientes[selectedClienteIndex].nombre || '') : '';
      if (!codigo.trim() || !nombre.trim()) {
        setFloatMsg({ message: 'Debe seleccionar un cliente antes de continuar.', type: 'warning', isVisible: true });
        return;
      }

      // Antes de avanzar, verificar que el cliente tiene artículos relacionados
      try {
        const res = await fetch(`http://localhost:4000/api/articulos-x-cliente/${encodeURIComponent(codigo)}`);
        if (!res.ok) {
          const txt = await res.text();
          setFloatMsg({ message: 'Error al verificar artículos del cliente: ' + txt, type: 'error', isVisible: true });
          return;
        }
        const body = await res.json();
        const lista = Array.isArray(body) ? body : (body.articulos || body.data || []);
        if (!lista || lista.length === 0) {
          setFloatMsg({ message: 'CLIENTE SELECCIONADO NO TIENE ARTICULOS RELACIONADOS', type: 'warning', isVisible: true });
          return;
        }

        // Si hay artículos, bloquear la pestaña cliente para que quede readonly y avanzar a articulos
        setClienteLocked(true);
        try { enabledTabs.add('articulos'); } catch { /* ignore */ }
        setActive('articulos');
        setTimeout(() => {
          const el = document.querySelector('.nb-panel-articulos input, .nb-panel-articulos textarea, .nb-panel-articulos button');
          if (el) {
            try { el.focus({ preventScroll: true }); } catch { el.focus(); }
          }
        }, 60);
      } catch (err) {
        console.error('Error fetching articulos-x-cliente:', err);
        setFloatMsg({ message: 'Error verificando artículos del cliente.', type: 'error', isVisible: true });
      }
    } catch (err) {
      console.error('Error en handleClienteContinuar:', err);
      setFloatMsg({ message: 'Error inesperado validando cliente.', type: 'error', isVisible: true });
    }
  };

  // Handler para continuar desde la pestaña Artículos: requiere al menos 1 artículo seleccionado
  const handleArticulosContinuar = () => {
    try {
      if (!articulos || articulos.length === 0) {
        setFloatMsg({ message: 'DEBE SELECCIONAR AL MENOS UN ARTICULO', type: 'warning', isVisible: true });
        return;
      }
      if (!selectedArticuloIds || selectedArticuloIds.length === 0) {
        setFloatMsg({ message: 'DEBE SELECCIONAR AL MENOS UN ARTICULO', type: 'warning', isVisible: true });
        return;
      }

      // Habilitar la pestaña de cantidades y avanzar
      try { enabledTabs.add('cantidades'); } catch { /* ignore */ }
      setActive('cantidades');
    } catch (err) {
      console.error('Error en handleArticulosContinuar:', err);
      setFloatMsg({ message: 'Error inesperado al validar artículos.', type: 'error', isVisible: true });
    }
  };

  // Handler para la pestaña Cantidades: validar cantidad > 0 y unidad no vacía para cada artículo
  const handleCantidadesContinuar = () => {
    try {
      if (!selectedArticuloIds || selectedArticuloIds.length === 0) {
        setFloatMsg({ message: 'No hay artículos seleccionados. Vuelva a la pestaña Selección de Artículos.', type: 'warning', isVisible: true });
        return;
      }

      for (const codigo of selectedArticuloIds) {
  const datos = cantidadesByArticulo[codigo] || { cantidad: '', unidad: '' };
  const cantidadRaw = datos.cantidad;

        // cantidad debe ser numérica y mayor que 0, respetando DECIMAL(10,2)
        if (!cantidadRaw || String(cantidadRaw).trim() === '') {
          setFloatMsg({ message: `Cantidad vacía para el artículo ${codigo}. Ingrese un valor mayor que 0.`, type: 'warning', isVisible: true });
          // enfocar el input con problema si existe
          try {
            const el = document.querySelector(`.nb-panel-cantidades .cantidad-input[data-codigo="${codigo}"]`);
            if (el) { try { el.focus({ preventScroll: true }); el.select && el.select(); } catch { el.focus(); } }
          } catch { console.debug('ignored focus fallback'); }
          return;
        }
        const cantidadSan = String(cantidadRaw).replace(/,/g, '.');
        const cantidadNum = Number(cantidadSan);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
          setFloatMsg({ message: `Cantidad inválida para el artículo ${codigo}. Ingrese un número mayor que 0 (ej: 1234.56).`, type: 'warning', isVisible: true });
          // enfocar el input con problema
          try {
            const el = document.querySelector(`.nb-panel-cantidades .cantidad-input[data-codigo="${codigo}"]`);
            if (el) { try { el.focus({ preventScroll: true }); el.select && el.select(); } catch { el.focus(); } }
          } catch { console.debug('ignored focus fallback'); }
          return;
        }
        // verificar límites DECIMAL(10,2): max 8 enteros y 2 decimales, valor máximo 99999999.99
        const [intPart = '0', decPart = ''] = String(cantidadSan).split('.');
        if (intPart.length > 8 || decPart.length > 2) {
          setFloatMsg({ message: `Cantidad fuera de rango para el artículo ${codigo}. Máximo 8 dígitos enteros y 2 decimales.`, type: 'warning', isVisible: true });
          try {
            const el = document.querySelector(`.nb-panel-cantidades .cantidad-input[data-codigo="${codigo}"]`);
            if (el) { try { el.focus({ preventScroll: true }); el.select && el.select(); } catch { el.focus(); } }
          } catch { console.debug('ignored focus fallback'); }
          return;
        }

        // Nota: los campos de unidad pueden quedar vacíos. No validar aquí.
      }

      // Si todo es válido, habilitar la pestaña resumen y navegar a ella
      try { enabledTabs.add('resumen'); } catch { /* ignore if not mutable */ }
      setActive('resumen');
      // dar foco al primer control del panel resumen
      setTimeout(() => {
        try {
          const el = document.querySelector('.nb-panel-resumen input, .nb-panel-resumen button, .nb-panel-resumen textarea');
          if (el) { try { el.focus({ preventScroll: true }); } catch { el.focus(); } }
  } catch { console.debug('ignored focus fallback'); }
      }, 50);
    } catch (err) {
      console.error('Error en handleCantidadesContinuar:', err);
      setFloatMsg({ message: 'Error inesperado validando cantidades.', type: 'error', isVisible: true });
    }
  };

      // Handler para el botón APLICAR ENTRADA DE BOLETA (verifica duplicado y guarda)
  const handleResumenApply = async () => {
    try {
  if (!selectedTipo) { setFloatMsg({ message: 'Tipo de boleta es obligatorio', type: 'warning', isVisible:true }); return; }
  if (!numeroBoleta || numeroBoleta.trim() === '') { setFloatMsg({ message: 'Número de boleta no puede quedar vacío', type: 'warning', isVisible:true }); return; }

      setIsApplying(true);

      // 1) Verificar duplicados (numero + tipo)
      const checkUrl = `http://localhost:4000/api/boletas/exists?numero=${encodeURIComponent(numeroBoleta)}&tipo=${encodeURIComponent(selectedTipo || '')}`;
      const resCheck = await fetch(checkUrl);
      if (!resCheck.ok) {
        const txt = await resCheck.text();
        setFloatMsg({ message: 'Error al verificar boleta existente: ' + txt, type: 'error', isVisible:true });
        setIsApplying(false);
        return;
      }
      const body = await resCheck.json();
      if (body && body.exists) {
        const numero = numeroBoleta;
        const tipoTexto = selectedTipo || (body.boleta && body.boleta.tipo) || '';
        const msg = `La boleta (${numero}) y el tipo (${tipoTexto}) ya existen en la Base de Datos. Favor Verificar datos ingresados.`;
        setFloatMsg({ message: msg, type: 'warning', isVisible:true });
        setIsApplying(false);
        return;
      }

  // 2) Construir payload para insertar en boletas
  // El backend espera la fecha en formato ISO YYYY-MM-DD (tipo DATE en MySQL).
  // `fechaBoleta` ya se mantiene como ISO (YYYY-MM-DD) en este componente, así que la usamos directamente.
  const fechaISO = fechaBoleta; // YYYY-MM-DD
      const now = new Date();
      const pad2 = (n) => String(n).padStart(2, '0');
      const horaStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  const estado = 'Abierta';
      const facturado = 'NO';
      const noaplica = '';

      const payload = {
        numero: numeroBoleta,
        fecha: fechaISO,
        hora: horaStr,
        semana: semana || '',
  'año': anio || '',
        chofer: (selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex]) ? filteredChoferes[selectedChoferIndex].nombre : '',
        chofer_c: (selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex]) ? filteredChoferes[selectedChoferIndex].codigo_chofer : '',
        camion_p: (selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex]) ? filteredVehiculos[selectedVehiculoIndex].placa : '',
        camion_n: (selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex]) ? filteredVehiculos[selectedVehiculoIndex].nombre : '',
        clientec: (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].codigo : '',
        clienten: (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].nombre : '',
        tipo: selectedTipo,
        estado,
        facturado,
        noaplica,
        articulos: JSON.stringify((selectedArticuloIds || []).map(codigo => {
          const a = articulos.find(x => x.codigo === codigo) || {};
          const datos = cantidadesByArticulo[codigo] || { cantidad: '', unidad: '', descri: '' };
          return {
            codigo: a.codigo || codigo,
            descripcion: a.descri || a.descripcion || (datos && datos.descri) || '',
            cantidad: datos.cantidad ? String(datos.cantidad).replace(/,/g, '.') : '',
            unidad: datos.unidad || ''
          };
        }))
      };

      // 3) Enviar POST al backend
      const res = await fetch('http://localhost:4000/api/boletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        setFloatMsg({ message: 'Error guardando boleta: ' + txt, type: 'error', isVisible:true });
        setIsApplying(false);
        return;
      }

      // Boleta guardada correctamente. Ahora construir y enviar las líneas a transa_ar
      const insertLines = (selectedArticuloIds || []).map(codigo => {
        const a = articulos.find(x => x.codigo === codigo) || {};
        const datos = cantidadesByArticulo[codigo] || { cantidad: '', unidad: '', descri: '' };
        const cantidadStr = datos.cantidad ? String(datos.cantidad).replace(/,/g, '.') : '';
        const cantidadNum = cantidadStr === '' ? 0 : Number(cantidadStr);
        return {
          codigo: a.codigo || codigo,
          cantidad: isNaN(cantidadNum) ? 0 : cantidadNum,
          descri: a.descri || a.descripcion || (datos && datos.descri) || '',
          ciiu: a.ciiu || (datos.ciiu || '') || '',
          simarde: a.simarde || (datos.simarde || '') || ''
        };
      });

      if (insertLines.length > 0) {
        try {
          const transaRes = await fetch('http://localhost:4000/api/transa_ar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: numeroBoleta, fecha: fechaISO, tipo: selectedTipo, lines: insertLines })
          });
          if (!transaRes.ok) {
            const txt = await transaRes.text();
            setFloatMsg({ message: 'Boleta guardada pero error guardando detalles (transa_ar): ' + txt, type: 'warning', isVisible: true, closeModalOnAccept: true });
            setReadOnlyAfterSave(true);
            setIsApplying(false);
            return;
          }
          const trBody = await transaRes.json();
          const successMsg = `Datos de Boleta : ( ${numeroBoleta} ) Guardados Correctamente. Detalles insertados: ${trBody.inserted || insertLines.length}`;
          setFloatMsg({ message: successMsg, type: 'success', isVisible:true, closeModalOnAccept: true });
          setReadOnlyAfterSave(true);
        } catch (err) {
          console.error('Error guardando transa_ar:', err);
          setFloatMsg({ message: 'Boleta guardada pero error guardando detalles (transa_ar): ' + String(err), type: 'warning', isVisible: true, closeModalOnAccept: true });
          setReadOnlyAfterSave(true);
        }
      } else {
        const successMsg = `Datos de Boleta : ( ${numeroBoleta} ) Guardados Correctamente`;
        setFloatMsg({ message: successMsg, type: 'success', isVisible:true, closeModalOnAccept: true });
        setReadOnlyAfterSave(true);
      }

      // Ahora también insertar en materiales_proceso según lo solicitado
      try {
        const clienteName = (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].nombre : '';
        const clienteC = (selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].codigo : '';
        const mpLines = (selectedArticuloIds || []).map(codigo => {
          const a = articulos.find(x => x.codigo === codigo) || {};
          const datos = cantidadesByArticulo[codigo] || { cantidad: '', unidad: '', descri: '' };
          const cantidadStr = datos.cantidad ? String(datos.cantidad).replace(/,/g, '.') : '';
          const cantidadNum = cantidadStr === '' ? 0 : Number(cantidadStr);
          const unidadesNum = (datos.unidad !== undefined && datos.unidad !== null && datos.unidad !== '') && !isNaN(Number(String(datos.unidad).replace(/,/g,'.'))) ? Number(String(datos.unidad).replace(/,/g,'.')) : 0;
          return {
            codigo: a.codigo || codigo,
            descri: a.descri || a.descripcion || (datos && datos.descri) || '',
            cliente: clienteName || '',
            clientec: isNaN(Number(clienteC)) ? 0 : Number(clienteC),
            tipo: selectedTipo || '',
            ciiu: a.ciiu || (datos.ciiu || '') || '',
            simarde: a.simarde || (datos.simarde || '') || '',
            fecha: fechaISO,
            ebodega: cantidadNum,
            cantidad: cantidadNum,
            unidades: unidadesNum
          };
        });

        if (mpLines.length > 0) {
          const mpRes = await fetch('http://localhost:4000/api/materiales_proceso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: numeroBoleta, fecha: fechaISO, tipo: selectedTipo, cliente: clienteName, clientec: isNaN(Number(clienteC)) ? 0 : Number(clienteC), lines: mpLines })
          });
          if (!mpRes.ok) {
            const txt = await mpRes.text();
            console.warn('materiales_proceso insert warning:', txt);
            // No bloquear al usuario; ya se guardó la boleta y transa_ar
          } else {
            const mpBody = await mpRes.json();
            console.log('materiales_proceso inserted:', mpBody);
          }
        }
      } catch (err) {
        console.error('Error guardando materiales_proceso:', err);
      }

    } catch (err) {
      console.error('Error en handleResumenApply:', err);
      setFloatMsg({ message: 'Error inesperado verificando/guardando boleta: ' + String(err), type: 'error', isVisible:true });
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (active !== 'cliente') return;
    // fetch basic clientes (codigo, nombre)
    let mounted = true;
    const loadClientes = async () => {
      try {
        const query = searchCliente ? `?search=${encodeURIComponent(searchCliente)}` : '';
        const res = await fetch(`http://localhost:4000/api/clientes-basico${query}`);
        if (!res.ok) throw new Error('Error cargando clientes');
        const body = await res.json();
        if (mounted) {
          // Si el cliente ya está bloqueado (confirmado), no sobreescribir la selección
          setClientes(body || []);
          if (!clienteLocked) setSelectedClienteIndex(-1);
        }
      } catch (err) {
        console.error('Error cargando clientes:', err);
        if (mounted) setClientes([]);
      }
    };
    loadClientes();
    return () => { mounted = false; };
  }, [active, searchCliente, clienteLocked]);

  useEffect(() => {
    const term = String(searchCliente || '').toLowerCase();
    const fc = clientes
      .filter(c => (c.codigo || '').toLowerCase().includes(term) || (c.nombre || '').toLowerCase().includes(term))
      .sort((a, b) => {
        const na = (a.nombre || '').toLowerCase();
        const nb = (b.nombre || '').toLowerCase();
        return na.localeCompare(nb, undefined, { sensitivity: 'base' });
      });
    setFilteredClientes(fc);
  }, [clientes, searchCliente]);

  // Cuando cambia cliente seleccionado, limpiar artículos y selección previa
  useEffect(() => {
    setArticulos([]);
    setSelectedArticuloIds([]);
  }, [selectedClienteIndex]);

  // Fetch artículos del cliente cuando la pestaña 'articulos' está activa
  useEffect(() => {
    let mounted = true;
    const loadArticulos = async () => {
      if (active !== 'articulos') return;
      // Si estamos en modo edición y tenemos initialBoleta con clientec, usar ese cliente
      let codigo = '';
      if (isEdit && initialBoleta) {
        // Preferir clientec numérico/cadena, luego clienten (nombre) como fallback
        codigo = initialBoleta.clientec || initialBoleta.clientec === 0 ? String(initialBoleta.clientec) : '';
        if (!codigo && initialBoleta.clienten) {
          // Si sólo tenemos el nombre, intentar buscar el cliente por nombre no es ideal aquí;
          // mejor dejar la carga por nombre al flujo normal que usa `selectedClienteIndex`.
          codigo = '';
        }
      }
      // Si no obtuvimos código desde initialBoleta, usar el cliente seleccionado en la UI
      if (!codigo) {
        codigo = (selectedClienteIndex >= 0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].codigo : '';
      }
      if (!codigo) {
        setArticulos([]);
        return;
      }
      // Si estamos en modo edición, bloquear cliente (si no está ya bloqueado)
      if (isEdit) setClienteLocked(true);
      setLoadingArticulos(true);
      try {
  // El servidor expone: GET /api/articulos-x-cliente/:codigoCliente
        const res = await fetch(`http://localhost:4000/api/articulos-x-cliente/${encodeURIComponent(codigo)}`);
        if (!res.ok) throw new Error('Error cargando artículos');
        const body = await res.json();
        if (mounted) {
          const listaArticulos = Array.isArray(body) ? body : (body.articulos || body.data || []);
          setArticulos(listaArticulos);

          // Si estamos en modo edición, intentar sincronizar selección con las líneas ya existentes
          // en materiales_proceso para esta boleta: marcar como seleccionados los códigos que
          // aparecen en materiales_proceso y aplicar sus cantidades en cantidadesByArticulo.
          if (isEdit && initialBoleta && initialBoleta.numero) {
            try {
              const tipoFiltro = selectedTipo || (initialBoleta && initialBoleta.tipo) || '';
              const qTipo = tipoFiltro ? `&tipo=${encodeURIComponent(tipoFiltro)}` : '';
              const resp = await fetch(`http://localhost:4000/api/materiales_proceso?search=${encodeURIComponent(initialBoleta.numero)}${qTipo}&pageSize=1000`);
              if (resp.ok) {
                const b = await resp.json();
                const rows = b.rows || [];
                const filas = rows.filter(r => String(r.boleta) === String(initialBoleta.numero) && (tipoFiltro ? String((r.tipo||'')).toLowerCase() === String(tipoFiltro).toLowerCase() : true));
                if (filas && filas.length > 0) {
                  const codigosUnicos = [];
                  const cantidadesMap = {};
                  filas.forEach(r => {
                    const codigo = r.codigo;
                    if (!codigosUnicos.includes(codigo)) codigosUnicos.push(codigo);
                      // Guardar la descripción tal como viene de materiales_proceso (descri)
                      cantidadesMap[codigo] = { cantidad: r.cantidad != null ? String(r.cantidad) : '', unidad: '', descri: r.descri || '', ciiu: r.ciiu || '', simarde: r.simarde || '' };
                  });
                  // Incluir todos los códigos encontrados en materiales_proceso, incluso si no
                  // aparecen en la lista de artículos del cliente. Esto permite mostrar la
                  // descripción proveniente de materiales_proceso (campo descri) para códigos
                  // como PLAS que no estén en la tabla `articulos`.
                  const seleccionados = codigosUnicos;
                  // Unir con la selección previa sin eliminar existentes
                  setSelectedArticuloIds(prev => {
                    const prevArr = Array.isArray(prev) ? prev : [];
                    return Array.from(new Set([...prevArr, ...seleccionados]));
                  });
                  // Combinar cantidades/metadatos (descri proveniente de materiales_proceso)
                  setCantidadesByArticulo(prev => ({ ...prev, ...cantidadesMap }));
                }
              }
            } catch (err) {
              console.warn('No se pudo sincronizar artículos desde materiales_proceso en modo edición:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando articulos:', err);
        if (mounted) setArticulos([]);
      } finally {
        if (mounted) setLoadingArticulos(false);
      }
    };
    loadArticulos();
    return () => { mounted = false; };
  }, [active, selectedClienteIndex, filteredClientes, isEdit, initialBoleta, selectedTipo]);

  // Nota: la selección de artículos desde la pestaña 'articulos' ahora se realiza
  // mediante el botón 'AGREGAR' que llama a addArticuloToCantidades(codigo).

  // Añadir un artículo a la lista de Cantidades (merge, sin duplicados)
  const addArticuloToCantidades = (codigo) => {
    try {
      if (!codigo) return;
      setSelectedArticuloIds(prev => {
        const prevArr = Array.isArray(prev) ? prev : [];
        if (prevArr.includes(codigo)) {
          // ya existe
          setFloatMsg({ message: `El artículo ${codigo} ya existe en Cantidades.`, type: 'warning', isVisible: true });
          return prevArr;
        }
        // añadir al final
        return [...prevArr, codigo];
      });
      // Incluir metadatos (descri/ciiu/simarde) si el artículo está cargado en articulos
      const art = (articulos || []).find(a => a.codigo === codigo) || {};
      setCantidadesByArticulo(prev => ({ ...(prev || {}), [codigo]: (prev && prev[codigo]) ? prev[codigo] : { cantidad: '', unidad: '', descri: art.descri || art.descripcion || '', ciiu: art.ciiu || '', simarde: art.simarde || '' } }));
      setFloatMsg({ message: `Artículo ${codigo} agregado a Cantidades.`, type: 'success', isVisible: true });
    } catch (err) {
      console.error('Error agregando artículo a cantidades:', err);
      setFloatMsg({ message: 'Error agregando artículo.', type: 'error', isVisible: true });
    }
  };

  if (!isOpen) return null;

  // Use the same modal classes as ListaBoletasModal to match size and header
  return (
    <div className="lista-conductores-modal-overlay" onClick={(e)=>e.stopPropagation()}>
      <div className="lista-conductores-modal">
        <div className="lista-conductores-modal-header">
          <h2 className="lista-conductores-modal-title">NUEVA BOLETA</h2>
          <button className="lista-conductores-modal-close" onClick={() => setShowExitConfirm(true)}>✕</button>
        </div>
        {/* Floating message: centrally positioned */}
        <FloatingMessage
          message={floatMsg.message}
          type={floatMsg.type}
          isVisible={floatMsg.isVisible}
          onClose={handleFloatClose}
          action={floatMsg.action}
          onCloseAction={() => {
            // Cerrar modal y notificar al padre que haga refresh en ListaBoletas
            try { if (onAppliedUpdates) onAppliedUpdates(); } catch (err) { console.warn('onAppliedUpdates callback error', err); }
            try { onClose(); } catch { /* ignore */ }
          }}
        />

        <ConfirmExitModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={() => { setShowExitConfirm(false); onClose(); }} />

        <div className="nb-tabs-row">
          <div className="nb-tabs">
            {tabs.map(t => {
              const isEnabled = enabledTabs.has(t.id);
              return (
                <button
                  key={t.id}
                  className={`nb-tab ${active===t.id ? 'active' : ''} ${isEnabled ? '' : 'disabled'}`}
                  onClick={() => { if (!isEnabled) return; setActive(t.id); }}
                  style={{ '--tab-color': t.color }}
                  aria-disabled={!isEnabled}
                >
                  <span className="nb-tab-icon">{t.icon}</span>
                  <span className="nb-tab-label">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lista-conductores-modal-body">
          {/* tabs moved into header */}

          <div className={`nb-tab-panel nb-panel-${active}`}>
            <div className="nb-panel-inner">
              {/* Contenido específico para la pestaña Número & Fechas */}
              {active === 'numero' ? (
                <div className="numero-panel">
                  <div className="numero-side">
                    <div className="tb-grid-container">
                      <div className="tb-grid-header">Tipo de Boletas</div>
                      {loadingTipos && <div className="tb-loading">Cargando...</div>}
                      {errorTipos && <div className="tb-error">Error: {errorTipos}</div>}
                      {!loadingTipos && !errorTipos && (
                        <div className="tb-grid">
                          {tipoBoletas.length === 0 && <div className="tb-empty">No hay tipos de boleta</div>}
                          {tipoBoletas.map((row, idx) => (
                            <div
                              key={`${row.nombre}-${idx}`}
                              className={`tb-row ${selectedTipo === row.nombre ? 'selected' : ''} ${readOnlyAfterSave || isEdit ? 'readonly' : ''}`}
                              onClick={() => { if (readOnlyAfterSave || isEdit) return; setSelectedTipo(row.nombre); }}
                              role={(readOnlyAfterSave || isEdit) ? undefined : 'button'}
                              tabIndex={(readOnlyAfterSave || isEdit) ? -1 : 0}
                              onKeyDown={(e) => { if (!(readOnlyAfterSave || isEdit) && e.key === 'Enter') setSelectedTipo(row.nombre); }}
                            >
                              {row.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="tb-selected-outside">
                      <label className="tb-selected-label">Tipo seleccionado</label>
                      <input className="tb-selected-input" type="text" readOnly value={selectedTipo} disabled={readOnlyAfterSave} />
                    </div>
                  
                    
                    
                  </div>

                  <div className="numero-main">
                    <div className="numero-left">
                      <div className="nb-numero-box">
                        <div className="nb-numero-container">
                          <label className="nb-numero-label">Número de Boleta</label>
                          <input
                            className="nb-numero-input"
                            type="text"
                            value={numeroBoleta}
                            disabled={!selectedTipo || readOnlyAfterSave || isEdit}
                            aria-disabled={!selectedTipo || readOnlyAfterSave}
                            maxLength={8}
                            onChange={(e) => { setNumeroBoleta(e.target.value.toUpperCase()); if (e.target.value.trim() === '') setNumeroError('El número no puede quedar vacío'); else setNumeroError(''); }}
                            required
                          />
                          {numeroError && <div className="nb-numero-error">{numeroError}</div>}
                        </div>
                      </div>
                    </div>

                    {/* right side now arranged horizontally */}
                    <div className="numero-right-row">
                      <div className="nb-fecha-box">
                        <div className="nb-fecha-container">
                          <label className="nb-fecha-label">Seleccione una fecha</label>
                          <Flatpickr
                            className="nb-fecha-input"
                            value={fechaBoleta ? parseISOToLocalDate(fechaBoleta) : null}
                            disabled={!selectedTipo || readOnlyAfterSave}
                            aria-disabled={!selectedTipo || readOnlyAfterSave}
                            options={{ dateFormat: 'd-m-Y', allowInput: true, locale: Spanish, monthSelectorType: 'static' }}
                            onChange={([selected]) => setFechaBoleta(selected ? formatDateToISO(selected) : '')}
                          />
                        </div>
                      </div>

                      <div className="nb-fecha-extra-box">
                        <div className="nb-fecha-extra-container">
                          <label className="nb-anio-label">Año</label>
                          <input className="nb-anio-input" type="text" readOnly value={anio} />

                          <label className="nb-semana-label">Semana</label>
                          <input className="nb-semana-input" type="text" readOnly value={semana} />
                        </div>
                      </div>
                    </div>
                    {/* CONTINUAR button (solo en la pestaña Número & Fechas) - positioned relative to the purple container */}
                    <div className="nb-continue-wrapper">
                      <button className="nb-btn nb-btn-continue large-continue" id="nb-continue-btn" onClick={handleGuardarContinuar}>
                        <span className="nb-btn-icon">➡️</span> CONTINUAR
                      </button>
                    </div>
                </div>
                </div>
              ) : (
                active === 'transportes' ? (
                  <div className="transportes-panel">
                    <div className="transportes-grid transportes-left">
                      <label className="transportes-grid-label">Seleccione Chofer</label>
                      <div className="transportes-search">
                        <input
                          id="transportes-first-input"
                          type="text"
                          className="transportes-search-input"
                          placeholder="Buscar por código de chofer..."
                          value={searchChofer}
                          onChange={(e) => setSearchChofer(e.target.value)}
                        />
                      </div>
                      <div className="transportes-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Nombre</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredChoferes && filteredChoferes.length > 0 ? (
                              filteredChoferes.map((c, i) => (
                                <tr key={`${c.codigo_chofer}-${i}`} className={selectedChoferIndex===i?'selected':''} onClick={() => setSelectedChoferIndex(i)}>
                                  <td>{c.codigo_chofer}</td>
                                  <td>{c.nombre}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan={2}>No hay conductores para mostrar.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="transportes-selected-fields transportes-selected-horizontal">
                        <div className="selected-field-pair">
                          <label className="selected-field-label">Código</label>
                          <input id="transportes-chofer-codigo" type="text" readOnly={!isEdit} className="selected-field-input" value={(selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex]) ? filteredChoferes[selectedChoferIndex].codigo_chofer : (isEdit && initialBoleta ? (initialBoleta.chofer_codigo||initialBoleta.choferCodigo||'') : '')} />
                        </div>
                        <div className="selected-field-pair">
                          <label className="selected-field-label">Nombre</label>
                          <input id="transportes-chofer-nombre" type="text" readOnly={!isEdit} className="selected-field-input" value={(selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex]) ? filteredChoferes[selectedChoferIndex].nombre : (isEdit && initialBoleta ? (initialBoleta.chofer||'') : '')} />
                        </div>
                      </div>
                    </div>

                    <div className="transportes-grid transportes-right">
                      <label className="transportes-grid-label">Seleccione Vehículo</label>
                      <div className="transportes-search">
                        <input
                          type="text"
                          className="transportes-search-input"
                          placeholder="Buscar por marca o nombre..."
                          value={searchVehiculo}
                          onChange={(e) => setSearchVehiculo(e.target.value)}
                        />
                      </div>
                      <div className="transportes-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Placa</th>
                              <th>Marca</th>
                              <th>Nombre</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredVehiculos && filteredVehiculos.length > 0 ? (
                              filteredVehiculos.map((v, i) => (
                                <tr key={`${v.placa}-${i}`} className={selectedVehiculoIndex===i?'selected':''} onClick={() => setSelectedVehiculoIndex(i)}>
                                  <td>{v.placa}</td>
                                  <td>{v.marca}</td>
                                  <td>{v.nombre}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan={3}>No hay vehículos para mostrar.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="transportes-selected-fields transportes-selected-horizontal">
                        <div className="selected-field-pair">
                          <label className="selected-field-label">Placa</label>
                        <input id="transportes-vehiculo-placa" type="text" readOnly={!isEdit} className="selected-field-input" value={(selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex]) ? filteredVehiculos[selectedVehiculoIndex].placa : (isEdit && initialBoleta ? (initialBoleta.camion_p||initialBoleta.placa||'') : '')} />
                        </div>
                        <div className="selected-field-pair">
                          <label className="selected-field-label">Nombre</label>
                          <input id="transportes-vehiculo-nombre" type="text" readOnly={!isEdit} className="selected-field-input" value={(selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex]) ? filteredVehiculos[selectedVehiculoIndex].nombre : (isEdit && initialBoleta ? (initialBoleta.camion_n||initialBoleta.vehiculo||initialBoleta.camion_nombre||'') : '')} />
                          {/* CONTINUAR moved outside the blue box into the placeholder area */}
                        </div>
                      </div>
                    </div>
                    {/* Placeholder area for actions outside the blue transport boxes */}
                    <div className="placeholder-continue-wrapper">
                      <button className="nb-btn nb-btn-continue" onClick={handleTransportesContinuar} id="transportes-right-continue-btn">
                        <span className="nb-btn-icon">➡️</span> CONTINUAR
                      </button>
                    </div>
                  </div>
                ) : (
                  active === 'cliente' ? (
                    <div className="cliente-panel">
                      <div className="cliente-left">
                        <label className="cliente-grid-label">Seleccione Cliente</label>
                        <div className="cliente-search">
                          <input
                            type="text"
                            className="cliente-search-input"
                            placeholder="Buscar por nombre de cliente..."
                            value={searchCliente}
                            onChange={(e) => { if (!clienteLocked) setSearchCliente(e.target.value); }}
                            readOnly={clienteLocked}
                            disabled={clienteLocked}
                          />
                        </div>

                        <div className="cliente-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredClientes && filteredClientes.length > 0 ? (
                                filteredClientes.map((c, i) => (
                                  <tr key={`${c.codigo}-${i}`} className={selectedClienteIndex===i? 'selected': ''} onClick={() => { if (!clienteLocked) setSelectedClienteIndex(i); }}>
                                    <td>{c.codigo}</td>
                                    <td>{c.nombre}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan={2}>No hay clientes para mostrar.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="cliente-right">
                        <div className="cliente-right-form">
                          <label className="cliente-right-sub-label">Cliente seleccionado</label>
                          <div className="cliente-right-readonlys cliente-right-readonlys-vertical">
                            <div className="cliente-right-field">
                              <label className="cliente-right-field-label">Código</label>
                              <input type="text" readOnly className="cliente-right-field-input" value={(selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].codigo : ''} />
                            </div>
                            <div className="cliente-right-field">
                              <label className="cliente-right-field-label">Nombre</label>
                              <input type="text" readOnly className="cliente-right-field-input" value={(selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].nombre : ''} />
                            </div>
                          </div>
                        </div>
                        <div className="cliente-placeholder-continue">
                          <button className="nb-btn nb-btn-continue" onClick={handleClienteContinuar} id="cliente-continue-btn" disabled={clienteLocked} aria-disabled={clienteLocked}>
                            <span className="nb-btn-icon">➡️</span> {clienteLocked ? 'CLIENTE CONFIRMADO' : 'CONTINUAR'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Artículos: implementado como tabla naranja-oscura con selección por checkboxes */
                    active === 'articulos' ? (
                      <div className="articulos-panel nb-panel-articulos">
                        <div className="articulos-grid">
                          <div className="articulos-header">
                            <label className="articulos-grid-label">Artículos del cliente seleccionado</label>
                            <span className="articulos-selected-client">
                              {selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex] ? filteredClientes[selectedClienteIndex].nombre : ''}
                            </span>
                          </div>

                          <div className="articulos-table">
                            <table>
                              <thead>
                                <tr>
                                  <th style={{ width: '10%' }}>Código</th>
                                  <th style={{ width: '57.5%' }}>Descripción</th>
                                  <th style={{ width: '10%' }}>CIUU</th>
                                  <th style={{ width: '10%' }}>Simarde</th>
                                  <th style={{ width: '12.5%', textAlign: 'center' }}>Seleccione Artículos a Inlcuir</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loadingArticulos ? (
                                  <tr><td colSpan={5}>Cargando artículos...</td></tr>
                                ) : (articulos && articulos.length > 0 ? (
                                  articulos.map((a, i) => (
                                    <tr key={`${a.codigo}-${i}`}>
                                      <td>{a.codigo}</td>
                                      <td>{a.descri || a.descripcion || ''}</td>
                                      <td>{a.ciiu || ''}</td>
                                      <td>{a.simarde || ''}</td>
                                      <td style={{ textAlign: 'center' }}>
                                        {selectedArticuloIds && selectedArticuloIds.includes(a.codigo) ? (
                                          <span className="badge-in-cantidades">YA EN CANTIDADES</span>
                                        ) : (
                                          <button className="nb-btn small" onClick={() => addArticuloToCantidades(a.codigo)}>AGREGAR</button>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr><td colSpan={5}>No hay artículos para el cliente seleccionado.</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Botón CONTINUAR fuera del placeholder, en la esquina inferior derecha del panel */}
                        <div className="articulos-placeholder-continue">
                          <button className="nb-btn nb-btn-continue" onClick={handleArticulosContinuar} id="articulos-continue-btn">
                            <span className="nb-btn-icon">➡️</span> CONTINUAR
                          </button>
                        </div>
                      </div>
                    ) : (
                        /* Cantidades tab: mostrar solo los artículos seleccionados con campos editables */
                        active === 'cantidades' ? (
                          <div className="cantidades-panel nb-panel-cantidades">
                            <div className="articulos-grid articulos-cantidades-grid">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="articulos-grid-label">Cantidades por Artículo (seleccionados)</div>
                                <div />
                              </div>
                              <div className="articulos-table">
                                <table>
                                  <thead>
                                    <tr>
                                      <th style={{ width: '10%' }}>Código</th>
                                      <th style={{ width: '50%' }}>Descripción</th>
                                      <th style={{ width: '10%' }}>CIUU</th>
                                      <th style={{ width: '10%' }}>Simarde</th>
                                      <th style={{ width: '9%' }}>CANTIDAD</th>
                                      <th style={{ width: '9%' }}>UNIDADES</th>
                                      <th style={{ width: '12%', textAlign: 'center' }}>ACCIONES</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(selectedArticuloIds && selectedArticuloIds.length > 0) ? (
                                      selectedArticuloIds.map((codigo, i) => {
                                        const a = articulos.find(x => x.codigo === codigo) || {};
                                        const datos = cantidadesByArticulo[codigo] || { cantidad: '', unidad: '' };
                                        // Preferir datos del artículo; si no existen, usar metadatos cargados desde materiales_proceso (cantidadesByArticulo)
                                        const descripcion = a.descri || a.descripcion || (cantidadesByArticulo[codigo] && cantidadesByArticulo[codigo].descri) || '';
                                        const ciiuVal = a.ciiu || (cantidadesByArticulo[codigo] && cantidadesByArticulo[codigo].ciiu) || '';
                                        const simardeVal = a.simarde || (cantidadesByArticulo[codigo] && cantidadesByArticulo[codigo].simarde) || '';
                                        return (
                                          <tr key={`${codigo}-${i}`} className={`${datos && datos.cantidad ? 'selected' : ''} ${datos && datos.locked ? 'locked-row' : ''}`}>
                                            <td>{codigo}</td>
                                            <td>{descripcion}</td>
                                            <td>{ciiuVal}</td>
                                            <td>{simardeVal}</td>
                                            <td>
                                              <input data-codigo={codigo} type="text" inputMode="decimal" maxLength={11} value={datos.cantidad}
                                                onChange={(e) => handleCantidadChange(codigo, e.target.value)} className={`cantidad-input ${datos && datos.locked ? 'locked' : ''}`}
                                                readOnly={datos && datos.locked}
                                                onKeyDown={(e) => handleCantidadKeyDown(codigo, e)}
                                                onFocus={(e) => { try { e.target.select && e.target.select(); } catch (err) { console.debug('select focus failed', err); } }}
                                                onClick={(e) => { try { e.target.select && e.target.select(); } catch (err) { console.debug('select click failed', err); } }}
                                                onBlur={(e) => {
                                                  try {
                                                    if (datos && datos.locked) return; // prevent formatting if locked
                                                    let v = String(e.target.value || '').replace(/,/g, '.');
                                                    if (v === '') return;
                                                    if (isNaN(Number(v))) return;
                                                    const n = Number(v);
                                                    // limitar a 2 decimales
                                                    const formatted = n.toFixed(2);
                                                    // Aplicar límites máximos
                                                    const [intPart] = formatted.split('.');
                                                    if (intPart.length > 8) {
                                                      // recortar a máximo permitidos
                                                      const max = Number(''.padEnd(8, '9') + '.99');
                                                      e.target.value = String(Math.min(n, max).toFixed(2));
                                                    } else {
                                                      e.target.value = formatted;
                                                    }
                                                    // Actualizar estado
                                                    handleCantidadChange(codigo, e.target.value);
                                                  } catch (err) { console.debug('format blur failed', err); }
                                                }}
                                              />
                                            </td>
                                            <td>
                                              <input type="text" value={datos.unidad}
                                                onChange={(e) => handleUnidadChange(codigo, e.target.value)} className={`unidad-input ${datos && datos.locked ? 'locked' : ''}`}
                                                readOnly={datos && datos.locked}
                                              />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                              {/* Locked icon with tooltip showing ebodega and cantidad for context when the row is locked */}
                                              {datos && datos.locked ? (
                                                <span className="locked-icon" title={`Tiene movimientos; devuelve a Bodega para editar/eliminar. ebodega=${datos.ebodega != null ? datos.ebodega : 'N/A'} - cantidad=${datos.cantidad != null ? datos.cantidad : 'N/A'}`}>🔒</span>
                                              ) : null}
                                              <button className="nb-small-btn nb-btn-delete" onClick={() => handleEliminarArticulo(codigo)} title="Eliminar artículo">Eliminar</button>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr><td colSpan={6}>No hay artículos seleccionados. Vuelva a la pestaña Selección de Artículos para elegir.</td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="cantidades-placeholder-continue">
                              <button className="nb-btn nb-btn-continue" id="cantidades-resumen-btn" onClick={handleCantidadesContinuar}>
                                <span className="nb-btn-icon">📝</span> IR A RESUMEN Y GUARDAR
                              </button>
                            </div>
                          </div>
                        ) : (
                          active === 'resumen' ? (
                            <div className="resumen-panel nb-panel-resumen">
                              <div className="resumen-grid">
                                <div className="resumen-left">
                                  <div className="resumen-grid-label">Artículos y Cantidades</div>
                                  <div className="resumen-table">
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Código</th>
                                          <th>Descripción</th>
                                          <th style={{ textAlign: 'right' }}>Cantidad</th>
                                          <th>Unidad</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(selectedArticuloIds && selectedArticuloIds.length>0) ? (
                                          selectedArticuloIds.map((codigo, i) => {
                                            const a = articulos.find(x => x.codigo === codigo) || {};
                                            const datos = cantidadesByArticulo[codigo] || { cantidad:'', unidad:'' };
                                            const cantidad = datos.cantidad ? String(datos.cantidad).replace(/,/g, '.') : '';
                                            const cantidadFmt = cantidad !== '' && !isNaN(Number(cantidad)) ? Number(cantidad).toFixed(2) : '';
                                            return (
                                              <tr key={`${codigo}-res-${i}`}>
                                                <td>{a.codigo}</td>
                                                <td>{a.descri || a.descripcion || (cantidadesByArticulo[codigo] && cantidadesByArticulo[codigo].descri) || ''}</td>
                                                <td style={{ textAlign: 'right' }}>{cantidadFmt}</td>
                                                <td>{datos.unidad || ''}</td>
                                              </tr>
                                            );
                                          })
                                        ) : (
                                          <tr><td colSpan={4}>No hay artículos seleccionados.</td></tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="resumen-right">
                                  <div className="resumen-box">
                                    <h4>Datos de Boleta</h4>
                                    <div className="resumen-row"><label>Tipo:</label><span>{selectedTipo}</span></div>
                                    <div className="resumen-row"><label>Número:</label><span>{numeroBoleta}</span></div>
                                    <div className="resumen-row"><label>Fecha:</label><span>{formatISOToDisplay(fechaBoleta)}</span></div>
                                    <div className="resumen-row"><label>Año:</label><span>{anio}</span></div>
                                    <div className="resumen-row"><label>Semana:</label><span>{semana}</span></div>
                                  </div>

                                  <div className="resumen-box">
                                    <h4>Transportes</h4>
                                    <div className="resumen-row"><label>Código Chofer:</label><span>{(selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex])? filteredChoferes[selectedChoferIndex].codigo_chofer : ''}</span></div>
                                    <div className="resumen-row"><label>Nombre Chofer:</label><span>{(selectedChoferIndex>=0 && filteredChoferes[selectedChoferIndex])? filteredChoferes[selectedChoferIndex].nombre : ''}</span></div>
                                    <div className="resumen-row"><label>Placa:</label><span>{(selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex])? filteredVehiculos[selectedVehiculoIndex].placa : ''}</span></div>
                                    <div className="resumen-row"><label>Vehículo:</label><span>{(selectedVehiculoIndex>=0 && filteredVehiculos[selectedVehiculoIndex])? filteredVehiculos[selectedVehiculoIndex].nombre : ''}</span></div>
                                  </div>

                                  <div className="resumen-box">
                                    <h4>Cliente</h4>
                                    <div className="resumen-row"><label>Código Cliente:</label><span>{(selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].codigo : ((isEdit && initialBoleta && initialBoleta.clientec) ? (filteredClientes.find(fc => String(fc.codigo) === String(initialBoleta.clientec)) ? filteredClientes.find(fc => String(fc.codigo) === String(initialBoleta.clientec)).codigo : initialBoleta.clientec) : '')}</span></div>
                                    <div className="resumen-row"><label>Nombre Cliente:</label><span>{(selectedClienteIndex>=0 && filteredClientes[selectedClienteIndex]) ? filteredClientes[selectedClienteIndex].nombre : ((isEdit && initialBoleta && initialBoleta.clientec) ? (filteredClientes.find(fc => String(fc.codigo) === String(initialBoleta.clientec)) ? filteredClientes.find(fc => String(fc.codigo) === String(initialBoleta.clientec)).nombre : initialBoleta.clienten) : '')}</span></div>
                                  </div>
                                </div>
                              </div>

                              <div className="resumen-placeholder-apply">
                                {isEdit ? (
                                  <button className="nb-btn nb-btn-apply" id="resumen-apply-ajustes-btn" onClick={applyAjustes} disabled={isApplying || !hasAjustes} aria-busy={isApplying}>
                                    {/* SVG icon */}
                                    <svg className="nb-btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <path d="M12 2C7.58 2 4 3.79 4 6v3c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4z" fill="currentColor"/>
                                      <path d="M4 11v5c0 2.21 3.58 4 8 4s8-1.79 8-4v-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                      <path d="M12 8v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                      <path d="M9 11l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </svg>
                                    <span>{isApplying ? 'Aplicando...' : 'APLICAR AJUSTES'}</span>
                                  </button>
                                ) : (
                                  <button className="nb-btn nb-btn-apply" id="resumen-apply-btn" onClick={handleResumenApply} disabled={isApplying} aria-busy={isApplying}>
                                    {/* SVG icon: guardar en BD (cilindro + flecha down) */}
                                    <svg className="nb-btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <path d="M12 2C7.58 2 4 3.79 4 6v3c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4z" fill="currentColor"/>
                                      <path d="M4 11v5c0 2.21 3.58 4 8 4s8-1.79 8-4v-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                      <path d="M12 8v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                      <path d="M9 11l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </svg>
                                    <span>APLICAR ENTRADA DE BOLETA</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="content-placeholder">
                              <div className="placeholder-content">
                                <div className="placeholder-icon">{tabs.find(t => t.id === active)?.icon}</div>
                                <div className="placeholder-text">{tabs.find(t => t.id === active)?.label}</div>
                                <div className="placeholder-subtext">Contenido de ejemplo — aún no implementado</div>
                              </div>
                            </div>
                          )
                        )
                    )
                  )
                )
              )}
            </div>
          </div>

          {/* Action buttons removed per request */}
          {/* No action buttons or inputs as requested */}
        </div>
      </div>
    </div>
  );
};

export default NuevoBoletaModal;
