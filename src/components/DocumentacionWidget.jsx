import React, { useState, useEffect } from 'react';
import './DocumentacionWidget.css';
import { API_BASE_URL } from '../config/api';

const DocumentacionWidget = () => {
  const [loading, setLoading] = useState(true);
  const [conductoresAlerta, setConductoresAlerta] = useState(false);
  const [vehiculosAlerta, setVehiculosAlerta] = useState(false);
  const [totalConductoresProblema, setTotalConductoresProblema] = useState(0);
  const [totalVehiculosProblema, setTotalVehiculosProblema] = useState(0);

  useEffect(() => {
    verificarDocumentacion();
  }, []);

  const verificarDocumentacion = async () => {
    setLoading(true);
    try {
      // Consultar ambos endpoints en paralelo
      const [resConductores, resVehiculos] = await Promise.all([
        fetch(`${API_BASE_URL}/conductores/document-status`),
        fetch(`${API_BASE_URL}/vehiculos/document-status`)
      ]);

      const dataConductores = await resConductores.json();
      const dataVehiculos = await resVehiculos.json();

      // Verificar conductores con documentos vencidos o por vencer
      if (dataConductores.success) {
        const problemaConductores = dataConductores.choferes.filter(
          c => c.estado_documentacion === 'Doc. Vencidos' || 
               c.estado_documentacion === 'Vigente por vencer'
        );
        setConductoresAlerta(problemaConductores.length > 0);
        setTotalConductoresProblema(problemaConductores.length);
      }

      // Verificar vehículos con documentos vencidos o por vencer
      if (dataVehiculos.success) {
        const problemaVehiculos = dataVehiculos.vehiculos.filter(
          v => v.estado_documentacion === 'Doc. Vencidos' || 
               v.estado_documentacion === 'Vigente por vencer'
        );
        setVehiculosAlerta(problemaVehiculos.length > 0);
        setTotalVehiculosProblema(problemaVehiculos.length);
      }
    } catch (error) {
      console.error('Error al verificar documentación:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="documentacion-widget">
      <div className="widget-header">
        <div className="header-icon">📋</div>
        <h3 className="header-title">Documentación</h3>
      </div>

      <div className="widget-content">
        {loading ? (
          <div className="widget-loading">
            <div className="loading-spinner"></div>
            <p>Verificando documentación...</p>
          </div>
        ) : (
          <>
            {/* Alerta de Conductores */}
            {conductoresAlerta && (
              <div className="alerta-item alerta-warning">
                <div className="alerta-icon">⚠️</div>
                <div className="alerta-content">
                  <div className="alerta-titulo">Conductores</div>
                  <div className="alerta-descripcion">
                    Documentos vencidos o por vencer
                  </div>
                  <div className="alerta-nota">Favor tomar nota</div>
                  <div className="alerta-count">{totalConductoresProblema} {totalConductoresProblema === 1 ? 'conductor' : 'conductores'}</div>
                </div>
              </div>
            )}

            {/* Alerta de Vehículos */}
            {vehiculosAlerta && (
              <div className="alerta-item alerta-warning">
                <div className="alerta-icon">⚠️</div>
                <div className="alerta-content">
                  <div className="alerta-titulo">Vehículos</div>
                  <div className="alerta-descripcion">
                    Documentos vencidos o por vencer
                  </div>
                  <div className="alerta-nota">Favor tomar nota</div>
                  <div className="alerta-count">{totalVehiculosProblema} {totalVehiculosProblema === 1 ? 'vehículo' : 'vehículos'}</div>
                </div>
              </div>
            )}

            {/* Mensaje de éxito cuando todo está bien */}
            {!conductoresAlerta && !vehiculosAlerta && (
              <div className="alerta-item alerta-success">
                <div className="alerta-icon">✅</div>
                <div className="alerta-content">
                  <div className="alerta-titulo">Sin alertas de documentación</div>
                  <div className="alerta-descripcion-success">
                    Todos los documentos están vigentes
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón de actualización */}
      <div className="widget-footer">
        <button 
          className="widget-refresh-btn" 
          onClick={verificarDocumentacion}
          disabled={loading}
          title="Actualizar estado de documentación"
        >
          <span className="refresh-icon">🔄</span>
          <span className="refresh-text">Actualizar</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentacionWidget;
