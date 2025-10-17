import React, { useEffect, useState } from 'react';
import './VehiculoDocumentosModal.css';

export default function VehiculoDocumentosModal({ isOpen, onClose, placa }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    if (!isOpen || !placa) return;
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/vehiculo-documento/${encodeURIComponent(placa)}`);
        const data = await res.json();
        if (data.success) {
          setDocumentos(data.documentos || []);
        } else {
          setError('Error al obtener documentos');
        }
    } catch {
      console.error('Error fetch vehiculo documentos');
      setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [isOpen, placa]);

  if (!isOpen) return null;

  const fmtDate = (d) => {
    if (!d) return '-';
    // Accept strings like '2025-11-09' or ISO with time; return only the date part
    try {
      const onlyDate = String(d).split('T')[0];
      return onlyDate;
    } catch {
      return String(d);
    }
  };

  return (
    <div className="veh-docs-overlay">
      <div className="veh-docs-modal larger">
        <div className="veh-docs-header">
          <h3>📄 Documentos de placa {placa}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="veh-docs-body">
          {loading && <p>🔄 Cargando documentos...</p>}
          {error && <p className="error">❌ {error}</p>}
          {!loading && !error && documentos.length === 0 && (
            <div className="no-data">No se encontraron documentos para esta placa</div>
          )}

          {!loading && !error && documentos.length > 0 && (
            <table className="veh-docs-table">
              <thead>
                  <tr>
                  <th>Placa</th>
                  <th>Documento</th>
                  <th>Estado</th>
                  <th>Días para vencer</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th>Nota Vehiculo DOC</th>
                  <th>Nota Documento</th>
                  <th>Autoridad Relación</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.placa}</td>
                    <td>{doc.nombre_documento || '-'} </td>
                    <td>
                      <span className={`doc-estado ${doc.estado_documento === 'Doc. Vencidos' ? 'vencido' : (doc.estado_documento === 'Vigente por vencer' ? 'por-vencer' : (doc.estado_documento === 'Vigente' ? 'vigente' : 'sin-fecha'))}`}>
                        {doc.estado_documento}
                      </span>
                    </td>
                    <td>
                      {typeof doc.dias_para_vencer === 'number' ? (
                        <span className={`dias-vencer ${doc.dias_para_vencer < 0 ? 'negativo' : ''}`}>{doc.dias_para_vencer} días</span>
                      ) : (
                        <span className="dias-vencer">-</span>
                      )}
                    </td>
                    <td>{fmtDate(doc.fecha_emision)}</td>
                    <td>{fmtDate(doc.fecha_vence)}</td>
                    <td>{doc.nota_vehiculo_doc || '-'}</td>
                    <td>{doc.nota_documento || '-'}</td>
                    <td>{doc.autoridad_relacion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
