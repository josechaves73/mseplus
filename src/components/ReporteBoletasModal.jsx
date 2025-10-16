import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './ReporteBoletasModal.css';
import { buildApiUrl } from '../config/api.js';

const initialFilters = { desde: '', hasta: '', clienteId: '', vehiculoId: '', conductorId: '', tipo: '' };

const ReporteBoletasModal = ({ isOpen, onClose, controlProps = {} }) => {
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Resetear todo el estado cada vez que se abre el modal
    setFilters(initialFilters);
    setRows([]);
    setTotal(0);
    setTipos([]);
    setClientes([]);
    setVehiculos([]);
    setConductores([]);
    setLoading(false);
    setError(null);

    // cargar listas (usar helper para apuntar al backend correcto)
    fetch(buildApiUrl('/list/clientes')).then(async r => {
      try {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (ct.includes('application/json')) {
          const data = await r.json();
          setClientes(data.clientes || data || []);
        } else {
          // respuesta inesperada (HTML), vaciar listas y loguear
          const txt = await r.text();
          console.error('Respuesta no JSON en /list/clientes:', txt.slice(0,200));
          setClientes([]);
        }
      } catch (e) {
        console.error('Error cargando /list/clientes', e);
        setClientes([]);
      }
    }).catch(() => setClientes([]));

    fetch(buildApiUrl('/list/vehiculos')).then(async r => {
      try {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (ct.includes('application/json')) {
          const data = await r.json();
          setVehiculos(data.vehiculos || data || []);
        } else {
          const txt = await r.text();
          console.error('Respuesta no JSON en /list/vehiculos:', txt.slice(0,200));
          setVehiculos([]);
        }
      } catch (e) {
        console.error('Error cargando /list/vehiculos', e);
        setVehiculos([]);
      }
    }).catch(() => setVehiculos([]));

    fetch(buildApiUrl('/list/conductores')).then(async r => {
      try {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (ct.includes('application/json')) {
          const data = await r.json();
          setConductores(data.conductores || data || []);
        } else {
          const txt = await r.text();
          console.error('Respuesta no JSON en /list/conductores:', txt.slice(0,200));
          setConductores([]);
        }
      } catch (e) {
        console.error('Error cargando /list/conductores', e);
        setConductores([]);
      }
    }).catch(() => setConductores([]));

    // cargar tipos de boleta
    fetch(buildApiUrl('/tipo-boletas')).then(async r => {
      try {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (ct.includes('application/json')) {
          const data = await r.json();
          // backend responde { success: true, data: rows }
          const list = (data && (data.data || data.rows || data.tipos)) || [];
          setTipos(list.map(x => x.nombre || x));
        } else {
          const txt = await r.text();
          console.error('Respuesta no JSON en /tipo-boletas:', txt.slice(0,200));
          setTipos([]);
        }
      } catch (e) {
        console.error('Error cargando /tipo-boletas', e);
        setTipos([]);
      }
    }).catch(() => setTipos([]));
  }, [isOpen]);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getProps = (name) => {
    return controlProps[name] || {};
  };

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.append('desde', filters.desde);
      if (filters.hasta) params.append('hasta', filters.hasta);
      if (filters.clienteId) params.append('clienteId', filters.clienteId);
      if (filters.vehiculoId) params.append('vehiculoId', filters.vehiculoId);
      if (filters.conductorId) params.append('conductorId', filters.conductorId);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const url = buildApiUrl('/reportes/boletas') + (params.toString() ? ('?' + params.toString()) : '');
      const resp = await fetch(url);
      const ct = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        const txt = await resp.text().catch(()=>'');
        throw new Error(`Error al obtener reporte: ${resp.status} ${resp.statusText} - ${txt.slice(0,200)}`);
      }
      if (ct.includes('application/json')) {
        const data = await resp.json();
        setRows(data.rows || data || []);
        setTotal(data.total || (data.rows ? data.rows.length : 0));
      } else {
        const txt = await resp.text();
        throw new Error('Respuesta del servidor no es JSON: ' + txt.slice(0,500));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // export all matching rows (API already returns all rows when called without pagination)
    const exportData = (rows || []).map(r => ({
      'Número de Boleta': r.numero,
      Tipo: r.tipo,
      Fecha: r.fecha,
      Cliente: r.clienten,
      Vehículo: r.camion_n,
      Conductor: r.chofer
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletas');
    const now = new Date();
    const ts = now.toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
    XLSX.writeFile(workbook, `reporte_boletas_${ts}.xlsx`);
  };

  const handlePrint = () => {
    const formatFiltersForPrint = () => {
      const parts = [];
      if (filters.desde) parts.push(`Desde: ${filters.desde}`);
      if (filters.hasta) parts.push(`Hasta: ${filters.hasta}`);
      if (filters.clienteId) {
        const c = clientes.find(x => (x.id && x.id.toString() === filters.clienteId.toString()) || (x.codigo && x.codigo.toString() === filters.clienteId.toString()) || (x.clientec && x.clientec.toString() === filters.clienteId.toString()));
        parts.push(`Cliente: ${c ? (c.clienten || c.nombre || c.clienten) : filters.clienteId}`);
      }
      if (filters.vehiculoId) {
        const v = vehiculos.find(x => (x.nombre && x.nombre === filters.vehiculoId) || (x.placa && x.placa === filters.vehiculoId) || (x.id && x.id.toString() === filters.vehiculoId.toString()));
        parts.push(`Vehículo: ${v ? (v.nombre || v.placa) : filters.vehiculoId}`);
      }
      if (filters.conductorId) {
        const ch = conductores.find(x => (x.codigo_chofer && x.codigo_chofer.toString() === filters.conductorId.toString()) || (x.id && x.id.toString() === filters.conductorId.toString()));
        parts.push(`Conductor: ${ch ? (ch.nombre || ch.chofer) : filters.conductorId}`);
      }
      if (filters.tipo) parts.push(`Tipo: ${filters.tipo}`);
      return parts.length ? parts.join(' | ') : '';
    };

    const summary = formatFiltersForPrint();
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const html = `
      <html>
      <head>
        <title>Reporte de Boletas</title>
        <style>body{font-family: Arial, sans-serif;}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:8px;text-align:left}.filters{color:#666;font-size:14px;margin-bottom:8px}</style>
      </head>
      <body>
        <h2>Reporte de Boletas</h2>
        ${summary ? `<div class="filters">Filtros aplicados: ${summary}</div>` : ''}
        <table>
          <thead>
            <tr><th>Número de Boleta</th><th>Tipo</th><th>Fecha</th><th>Cliente</th><th>Vehículo</th><th>Conductor</th></tr>
          </thead>
          <tbody>
            ${(rows || []).map(r => `<tr><td>${r.numero}</td><td>${r.tipo}</td><td>${r.fecha}</td><td>${r.clienten}</td><td>${r.camion_n}</td><td>${r.chofer}</td></tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div id="reporte-boletas-modal-root" className="reporte-boletas-overlay">
      <div className="reporte-boletas-modal">
        <div className="reporte-boletas-header">
          <h2>Reporte de Boletas</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="reporte-boletas-filters">
          <div className="filter-row">
            <label {...getProps('label_desde')}>Desde</label>
            <input type="date" value={filters.desde} onChange={(e)=>handleChange('desde', e.target.value)} {...getProps('desde')} />
            <label {...getProps('label_hasta')}>Hasta</label>
            <input type="date" value={filters.hasta} onChange={(e)=>handleChange('hasta', e.target.value)} {...getProps('hasta')} />
          </div>
          <div className="filter-row">
            <label {...getProps('label_cliente')}>Cliente</label>
            <select value={filters.clienteId} onChange={(e)=>handleChange('clienteId', e.target.value)} {...getProps('cliente')}>
              <option value="">-- Todos --</option>
              {clientes.map(c => <option key={c.id || c.codigo || c.clientec} value={c.id || c.codigo || c.clientec}>{c.clienten || c.nombre || c.clienten}</option>)}
            </select>

            <label {...getProps('label_vehiculo')}>Vehículo</label>
            <select value={filters.vehiculoId} onChange={(e)=>handleChange('vehiculoId', e.target.value)} {...getProps('vehiculo')}>
              <option value="">-- Todos --</option>
              {vehiculos.map(v => <option key={v.placa || v.id || v.nombre} value={v.nombre || v.placa || v.id}>{v.nombre || v.placa}</option>)}
            </select>

            <label {...getProps('label_conductor')}>Conductor</label>
            <select value={filters.conductorId} onChange={(e)=>handleChange('conductorId', e.target.value)} {...getProps('conductor')}>
              <option value="">-- Todos --</option>
              {conductores.map(c => <option key={c.codigo_chofer || c.id} value={c.codigo_chofer || c.id}>{c.nombre || c.chofer}</option>)}
            </select>

            <label {...getProps('label_tipo')}>Tipo de Boleta</label>
            <select value={filters.tipo} onChange={(e)=>handleChange('tipo', e.target.value)} {...getProps('tipo')}>
              <option value="">-- Todos --</option>
              {tipos && tipos.length > 0 ? (
                tipos.map((t, i) => <option key={`${t}-${i}`} value={t}>{t}</option>)
              ) : (
                <>
                  <option value="ENTRADA">ENTRADA</option>
                  <option value="SALIDA">SALIDA</option>
                </>
              )}
            </select>

            <button className="apply-btn" onClick={applyFilters} {...getProps('applyBtn')}>APLICAR FILTRO</button>
          </div>
        </div>

        <div className="reporte-boletas-body">
          <div className="content-wrapper">
            <div className="reporte-table-container">
              {loading && <div className="loading">Cargando...</div>}
              {error && <div className="error">{error}</div>}

              <table className="reporte-table">
                <thead>
                    <tr>
                      <th>Número de Boleta</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th>Conductor</th>
                    </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={`${r.numero}-${idx}`}>
                      <td>{r.numero}</td>
                      <td>{r.tipo}</td>
                      <td>{r.fecha}</td>
                      <td>{r.clienten}</td>
                      <td>{r.camion_n}</td>
                      <td>{r.chofer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="footer">Total: {total}</div>
            </div>

            <div className="action-buttons">
              <button className="action-btn exportar" onClick={handleExport} disabled={loading}>📤 Exportar</button>
              <button className="action-btn imprimir" onClick={handlePrint} disabled={loading}>🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteBoletasModal;
