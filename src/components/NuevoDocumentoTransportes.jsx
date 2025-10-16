import React, { useState, useEffect } from 'react';
import './NuevoDocumentoTransportes.css';

const NuevoDocumentoTransportes = ({ isOpen, onClose, onSuccess, isEdit = false, editData = null }) => {
  const [formData, setFormData] = useState({
    aplica_a: '',
    nombre_documento: '',
    nota: '',
    aviso_vence_dias: 30,
    autoridad_relacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🧹 Limpiar o cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        // 📝 Modo edición: cargar datos existentes
        setFormData({
          aplica_a: editData.aplica_a || '',
          nombre_documento: editData.nombre_documento || '',
          nota: editData.nota || '',
          aviso_vence_dias: editData.aviso_vence_dias || 30,
          autoridad_relacion: editData.autoridad_relacion || ''
        });
      } else {
        // ➕ Modo nuevo: resetear formulario a valores iniciales
        setFormData({
          aplica_a: '',
          nombre_documento: '',
          nota: '',
          aviso_vence_dias: 30,
          autoridad_relacion: ''
        });
      }
      // Limpiar todos los mensajes residuales
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen, isEdit, editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al cambiar campos
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.aplica_a) {
      setError('Debe seleccionar si aplica a Vehículo o Conductor');
      return false;
    }
    if (!formData.nombre_documento.trim()) {
      setError('El nombre del documento es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const url = isEdit 
        ? `http://localhost:4000/api/docu-config/${editData.id}` 
        : 'http://localhost:4000/api/docu-config';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aplica_a: formData.aplica_a,
          nombre_documento: formData.nombre_documento.trim(),
          nota: formData.nota.trim() || null,
          aviso_vence_dias: parseInt(formData.aviso_vence_dias),
          autoridad_relacion: formData.autoridad_relacion.trim() || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const successMessage = isEdit 
          ? 'Documento actualizado exitosamente' 
          : 'Documento creado exitosamente';
        setSuccess(successMessage);
        
        // Solo resetear formulario en modo nuevo (no en edición)
        if (!isEdit) {
          setFormData({
            aplica_a: '',
            nombre_documento: '',
            nota: '',
            aviso_vence_dias: 30,
            autoridad_relacion: ''
          });
        }
        
        // Notificar al componente padre para refrescar grid
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            // El grid se refrescará cuando se vuelva a cargar la pestaña configurar
            window.dispatchEvent(new CustomEvent('refreshDocuConfig'));
          }, 1500);
        }
      } else {
        // Verificar si es error de duplicado
        if (data.message && data.message.includes('Duplicate entry')) {
          setError(`Ya existe un documento con el nombre "${formData.nombre_documento}" para ${formData.aplica_a}`);
        } else {
          const errorAction = isEdit ? 'actualizar' : 'crear';
          setError(data.message || `Error al ${errorAction} el documento`);
        }
      }
    } catch (err) {
      const errorAction = isEdit ? 'actualizar' : 'crear';
      console.error(`Error al ${errorAction} documento:`, err);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      aplica_a: '',
      nombre_documento: '',
      nota: '',
      aviso_vence_dias: 30,
      autoridad_relacion: ''
    });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="nuevo-documento-modal-overlay">
      <div className="nuevo-documento-modal">
        {/* Barra de título rojo oscuro */}
        <div className="nuevo-documento-header">
          <h2>{isEdit ? '� Editar Documento' : '�📄 Configuración de Documentación'}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        {/* Contenido del formulario */}
        <div className="nuevo-documento-content">
          <form onSubmit={handleSubmit}>
            {/* Aplica a */}
            <div className="form-group">
              <label htmlFor="aplica_a">Aplica a: *</label>
              <select
                id="aplica_a"
                name="aplica_a"
                value={formData.aplica_a}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione una opción</option>
                <option value="vehiculo">🚗 Vehículo</option>
                <option value="conductor">🧑‍✈️ Conductor</option>
              </select>
            </div>

            {/* Nombre del documento */}
            <div className="form-group">
              <label htmlFor="nombre_documento">Nombre del Documento: *</label>
              <input
                type="text"
                id="nombre_documento"
                name="nombre_documento"
                value={formData.nombre_documento}
                onChange={handleInputChange}
                placeholder="Ej: Licencia de Circulación, Certificado Médico..."
                required
              />
            </div>

            {/* Nota */}
            <div className="form-group">
              <label htmlFor="nota">Nota: (máx. 250 caracteres)</label>
              <textarea
                id="nota"
                name="nota"
                value={formData.nota}
                onChange={handleInputChange}
                placeholder="Descripción o comentarios adicionales..."
                rows="4"
                maxLength="250"
              />
              <div className="char-counter">
                {formData.nota.length}/250 caracteres
              </div>
            </div>

            {/* Aviso vence días */}
            <div className="form-group">
              <label htmlFor="aviso_vence_dias">Aviso de Vencimiento:</label>
              <select
                id="aviso_vence_dias"
                name="aviso_vence_dias"
                value={formData.aviso_vence_dias}
                onChange={handleInputChange}
              >
                <option value={7}>7 días antes</option>
                <option value={15}>15 días antes</option>
                <option value={30}>30 días antes</option>
                <option value={45}>45 días antes</option>
                <option value={60}>60 días antes</option>
              </select>
            </div>

            {/* Autoridad relación */}
            <div className="form-group">
              <label htmlFor="autoridad_relacion">Autoridad Gestora:</label>
              <input
                type="text"
                id="autoridad_relacion"
                name="autoridad_relacion"
                value={formData.autoridad_relacion}
                onChange={handleInputChange}
                placeholder="Ej: Municipalidad, Dirección de Tránsito..."
              />
            </div>

            {/* Mensajes de error/éxito */}
            {error && (
              <div className="message error-message">
                <span>❌ {error}</span>
              </div>
            )}

            {success && (
              <div className="message success-message">
                <span>✅ {success}</span>
              </div>
            )}

            {/* Botón GUARDAR/ACTUALIZAR */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-guardar"
                disabled={loading}
              >
                {loading 
                  ? (isEdit ? '⏳ Actualizando...' : '⏳ Guardando...') 
                  : (isEdit ? '✏️ ACTUALIZAR' : '💾 GUARDAR')
                }
              </button>
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={handleClose}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NuevoDocumentoTransportes;