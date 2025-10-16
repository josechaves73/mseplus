import React, { useEffect, useState } from 'react';
import './ConductorDocumentosModal.css';

export default function ConductorDocumentosModal({ isOpen, onClose, codigo, nombre }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    if (!isOpen || !codigo) return;
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Run two requests in parallel: one that returns docu_config (+ left-join), and one that returns only conductor rows
        const urlAll = `http://localhost:4000/api/conductor-documento/${encodeURIComponent(codigo)}?includeAll=1`;
        const urlOwn = `http://localhost:4000/api/conductor-documento/${encodeURIComponent(codigo)}`;
        const [resAll, resOwn] = await Promise.all([fetch(urlAll), fetch(urlOwn)]);
        const [dataAll, dataOwn] = await Promise.all([resAll.json(), resOwn.json()]);

        if (!dataAll.success) {
          setError('Error al obtener documentos (doc types)');
          setLoading(false);
          return;
        }

        // Normalize arrays
        const docsAll = dataAll.documentos || [];
        const docsOwn = (dataOwn && dataOwn.success) ? (dataOwn.documentos || []) : [];

        // If the own endpoint returns any rows, prefer those (they represent actual conductor_documento records)
        if (Array.isArray(docsOwn) && docsOwn.length > 0) {
          const normalized = docsOwn.map(d => ({
            id: d.id || d.cd_id || null,
            documento_id: d.documento_id || d.docu_id || null,
            nombre_documento: d.nombre_documento || d.nombre || '-',
            nota_documento: d.nota_documento || d.nota || null,
            autoridad_relacion: d.autoridad_relacion || null,
            fecha_emision: d.fecha_emision || null,
            fecha_vence: d.fecha_vence || null,
            nota_conductor_doc: d.nota_conductor_doc || d.notas || null,
            estado_documento: d.estado_documento || null,
            dias_para_vencer: typeof d.dias_para_vencer === 'number' ? d.dias_para_vencer : null
          }));
          console.log('ConductorDocumentosModal: using own endpoint results', { requested: codigo, count: normalized.length });
          setDocumentos(normalized);
        } else {
          // No own records: show docu_config rows (sin registro)
          const normalized = docsAll.map(d => ({
            id: null,
            documento_id: d.docu_id || d.id || null,
            nombre_documento: d.nombre_documento || d.nombre || '-',
            nota_documento: d.nota_documento || d.nota || null,
            autoridad_relacion: d.autoridad_relacion || null,
            fecha_emision: d.fecha_emision || null,
            fecha_vence: d.fecha_vence || null,
            nota_conductor_doc: d.nota_conductor_doc || d.notas || null,
            aplica_a: d.aplica_a || 'conductor',
            estado_documento: d.estado_documento || 'Sin Registro',
            dias_para_vencer: typeof d.dias_para_vencer === 'number' ? d.dias_para_vencer : null
          }));
          console.log('ConductorDocumentosModal: using docu_config (no own records)', { requested: codigo, count: normalized.length });
          setDocumentos(normalized);
        }
      } catch (err) {
        console.error('Error fetch conductor documentos', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [isOpen, codigo]);

  if (!isOpen) return null;

  const fmtDate = (d) => {
    if (!d) return '-';
    try { return String(d).split('T')[0]; } catch { return String(d); }
  };

  return (
    <div className="cond-docs-overlay">
      <div className="cond-docs-modal larger">
        <div className="cond-docs-header">
          <h3>📄 Documentos de conductor {codigo} {nombre ? `- ${nombre}` : ''}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="cond-docs-body">
          {loading && <p>🔄 Cargando documentos...</p>}
          {error && <p className="error">❌ {error}</p>}
          {!loading && !error && documentos.length === 0 && (
            <div className="no-data">No se encontraron documentos para este conductor</div>
          )}

          {!loading && !error && documentos.length > 0 && (
            <table className="cond-docs-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Estado</th>
                  <th>Días para vencer</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th>Nota Conductor DOC</th>
                  <th>Nota Documento</th>
                  <th>Autoridad Relación</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.nombre_documento || '-'}</td>
                    <td>
                      <span className={`doc-estado ${doc.estado_documento === 'Doc. Vencidos' ? 'vencido' : (doc.estado_documento === 'Vigente por vencer' ? 'por-vencer' : (doc.estado_documento === 'Vigente' ? 'vigente' : 'sin-fecha'))}`}>
                        {doc.estado_documento}
                      </span>
                    </td>
                    <td>{typeof doc.dias_para_vencer === 'number' ? `${doc.dias_para_vencer} días` : '-'}</td>
                    <td>{fmtDate(doc.fecha_emision)}</td>
                    <td>{fmtDate(doc.fecha_vence)}</td>
                    <td>{doc.nota_conductor_doc || '-'}</td>
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
