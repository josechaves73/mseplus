import React, { useState, useEffect } from 'react';
import './AnularBoletaModal.css';
import MensajeModal from './MensajeModal';

const AnularBoletaModal = ({ isOpen, onClose, boleta }) => {
  const [canAnular, setCanAnular] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showAnuladaModal, setShowAnuladaModal] = useState(false);

  // Verificar si la boleta está anulada al abrir el modal
  useEffect(() => {
    if (isOpen && boleta) {
      console.log('🔍 Verificando estado de boleta al abrir modal:', boleta);
      console.log('📊 Estado de la boleta:', boleta.estado);

      // Si la boleta ya está anulada, mostrar modal específico inmediatamente
      if (boleta.estado && boleta.estado.toUpperCase() === 'ANULADA') {
        console.log('🚫 Boleta ya anulada detectada, mostrando modal específico');
        setShowAnuladaModal(true);
        return;
      }

      // Resetear estados para boletas no anuladas
      setCanAnular(false);
      setVerificationResult(null);
      setShowResultModal(false);
      setShowAnuladaModal(false);
    }
  }, [isOpen, boleta]);

  if (!isOpen) return null;

  // Función para verificar si la boleta se puede anular
  const handleVerificarBoleta = async () => {
    if (!boleta) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const numero = boleta.numero || '';
      const tipo = boleta.tipo || '';

      // Consultar materiales_proceso para esta boleta
      const response = await fetch(`/api/materiales_proceso?boleta=${encodeURIComponent(numero)}&tipo=${encodeURIComponent(tipo)}&pageSize=1000`);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      const allMateriales = data.rows || [];

      // Filtrar por numero y tipo exactos
      const materiales = allMateriales.filter(r =>
        String(r.boleta) === String(numero) &&
        String(r.tipo || '').toLowerCase() === String(tipo).toLowerCase()
      );

      // Verificar si todos los artículos tienen cantidad == ebodega
      let puedeAnular = true;
      let articuloProblematico = null;

      for (const material of materiales) {
        if (parseFloat(material.cantidad) !== parseFloat(material.ebodega)) {
          puedeAnular = false;
          articuloProblematico = material;
          break;
        }
      }

      const resultado = {
        puedeAnular,
        articuloProblematico,
        totalArticulos: materiales.length
      };

      setVerificationResult(resultado);
      setCanAnular(puedeAnular);
      setShowResultModal(true);

    } catch (error) {
      console.error('Error al verificar boleta:', error);
      setVerificationResult({
        puedeAnular: false,
        error: error.message
      });
      setShowResultModal(true);
    } finally {
      setVerifying(false);
    }
  };

  // Función para anular la boleta
  const handleAnularBoleta = async () => {
    if (!boleta || !canAnular) return;

    setVerifying(true);

    try {
      const numero = boleta.numero || '';
      const tipo = boleta.tipo || '';

      // Llamar al endpoint de anulación
      const response = await fetch(`/api/anular-boleta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero,
          tipo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Boleta anulada exitosamente:', result);

      // Mostrar modal de éxito
      setVerificationResult({
        puedeAnular: true,
        anulada: true,
        mensaje: 'Boleta anulada exitosamente'
      });
      setShowResultModal(true);

    } catch (error) {
      console.error('❌ Error al anular boleta:', error);
      setVerificationResult({
        puedeAnular: false,
        error: error.message
      });
      setShowResultModal(true);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="anular-boleta-modal-overlay">
      <div className="anular-boleta-modal">
        <div className="anular-boleta-modal-header">
          <h2 className="anular-boleta-modal-title">Anulación de Boleta</h2>
          <button className="anular-boleta-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="anular-boleta-info-placeholder">
          <div className="boleta-info">
            <div className="boleta-line">
              <span className="info-label">Número:</span>
              <span className="info-value">{boleta?.numero || 'N/A'}</span>
            </div>
            <div className="boleta-line">
              <span className="info-label">Tipo:</span>
              <span className="info-value">{boleta?.tipo || 'N/A'}</span>
            </div>
            <div className="boleta-line">
              <span className="info-label">Cliente:</span>
              <span className="info-value">{boleta?.clienten || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="anular-boleta-instructions-placeholder">
          <h3 className="instructions-title">📋 Instrucciones para Anular Boleta</h3>
          <div className="instructions-content">
            <div className="instruction-item">
              <span className="instruction-icon">⚠️</span>
              <span className="instruction-text">
                Para <strong>ANULAR</strong> una boleta, esta tiene que contener <strong>TODA</strong> la cantidad ingresada en <strong>BODEGA</strong>.
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🔄</span>
              <span className="instruction-text">
                Si la boleta contiene movimientos deberá <strong>transpasar</strong> esas cantidades a <strong>BODEGA</strong>.
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">✅</span>
              <span className="instruction-text">
                Cuando la <strong>Cantidad total ingresada</strong> esté en <strong>Bodega</strong> entonces ya podrá <strong>ANULAR</strong> la boleta.
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🗑️</span>
              <span className="instruction-text">
                <strong>Todos los Registros de Movimientos</strong> serán <strong>Eliminados</strong>.
              </span>
            </div>
          </div>
        </div>
        <div className="anular-boleta-modal-body">
          <div className="anular-boleta-action-buttons">
            <button
              className="action-btn verificar-boleta"
              onClick={handleVerificarBoleta}
              disabled={verifying}
            >
              {verifying ? '🔄 Verificando...' : '🔍 Verificar Boleta'}
            </button>
            <button
              className="action-btn anular-boleta-confirm"
              onClick={handleAnularBoleta}
              disabled={!canAnular || verifying}
            >
              {verifying ? '🔄 Anulando...' : '🚫 Anular Boleta'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Resultado de Verificación usando MensajeModal */}
      <MensajeModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          if (verificationResult?.anulada) {
            onClose();
          }
        }}
        title={
          verificationResult?.anulada
            ? "✅ Anulación Exitosa"
            : verificationResult?.puedeAnular
              ? "✅ Verificación Exitosa"
              : "❌ Anulación Denegada"
        }
        size="medium"
        buttons={[
          {
            label: "Aceptar",
            onClick: () => {
              setShowResultModal(false);
              if (verificationResult?.anulada) {
                onClose();
              }
            }
          }
        ]}
      >
        {verificationResult?.error ? (
          <p><strong>Error:</strong> {verificationResult.error}</p>
        ) : verificationResult?.anulada ? (
          <div>
            <p>🎉 {verificationResult.mensaje || 'Boleta anulada exitosamente.'}</p>
            <p>La boleta ha sido marcada como ANULADA y todos los materiales han sido ajustados.</p>
          </div>
        ) : verificationResult?.puedeAnular ? (
          <div>
            <p>🎉 La boleta puede ser anulada.</p>
            <p>Todos los artículos tienen las cantidades correctas en bodega.</p>
            <p><strong>Total de artículos verificados:</strong> {verificationResult.totalArticulos}</p>
          </div>
        ) : (
          <div>
            <p>🚫 La boleta <strong>NO</strong> puede ser anulada.</p>
            <p><strong>Motivo:</strong> Cantidades en bodega insuficientes.</p>
            {verificationResult?.articuloProblematico && (
              <div style={{
                background: '#fff5f5',
                border: '1px solid #fca5a5',
                padding: '12px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                marginTop: '16px'
              }}>
                <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                  Artículo problemático:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Código:</strong> {verificationResult.articuloProblematico.codigo}</li>
                  <li><strong>Cantidad requerida:</strong> {verificationResult.articuloProblematico.cantidad}</li>
                  <li><strong>Cantidad en bodega:</strong> {verificationResult.articuloProblematico.ebodega}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </MensajeModal>

      {/* Modal de Boleta Ya Anulada usando MensajeModal */}
      <MensajeModal
        isOpen={showAnuladaModal}
        onClose={() => {
          setShowAnuladaModal(false);
          onClose(); // Cerrar también el modal principal
        }}
        title="⚠️ Boleta Anulada"
        size="medium"
        buttons={[
          {
            label: "Entendido",
            onClick: () => {
              setShowAnuladaModal(false);
              onClose();
            }
          }
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
            LA BOLETA {boleta?.numero || 'N/A'} ESTÁ ANULADA Y NO SE PUEDE PROCEDER
          </p>
          <p>Esta boleta ya ha sido anulada anteriormente.</p>
        </div>
      </MensajeModal>
    </div>
  );
};

export default AnularBoletaModal;
