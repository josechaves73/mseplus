import React, { useState, useRef, useEffect, useCallback } from 'react';
import './NuevoArticuloModal.css';
import { useSelectOptions } from '../hooks/useSelectOptions';
import FloatingMessage from './common/FloatingMessage';

// Datos iniciales del formulario
const initialFormData = {
  codigo: '',
  descri: '',
  unidad: '',
  familia: '',
  categoria: '',
  tipo_certificado: '',
  tipo_res: ''
};

const NuevoArticuloModal = ({ isOpen, onClose, editMode = false, articuloEditar = null }) => {
  // Estado para mensajes flotantes
  const [floatMsg, setFloatMsg] = useState({ message: '', type: 'info', isVisible: false });
  const [guardando, setGuardando] = useState(false);

  // Función para mostrar notificaciones
  const showNotification = useCallback((message, type = 'info') => {
    setFloatMsg({ message, type, isVisible: true });
  }, []);

  // Referencias para los campos
  const codigoRef = useRef(null);

  // Usar hook personalizado para cargar opciones
  const {
    completeData: residuosCompletos,
    loading: loadingResiduos,
    loadOptions: cargarResiduos
  } = useSelectOptions('residuo_x_cert', 'residuos', [
    { codigo_c: 'CT01', codigo_r: 'R01', nombre: 'RESIDUO A' },
    { codigo_c: 'CT02', codigo_r: 'R02', nombre: 'RESIDUO B' },
    { codigo_c: 'CT03', codigo_r: 'R03', nombre: 'RESIDUO C' }
  ]);

  // Estado separado para residuos filtrados
  const [residuos, setResiduos] = useState([]);

  const {
    options: categorias,
    loading: loadingCategorias,
    loadOptions: cargarCategorias
  } = useSelectOptions('categorias', null, [
    'GENERAL', 'SERVICIOS', 'PRODUCTOS', 'OTROS'
  ]);

  const {
    options: familias,
    loading: loadingFamilias,
    loadOptions: cargarFamilias
  } = useSelectOptions('familias', null, [
    'GENERAL', 'REPUESTOS', 'SUMINISTROS', 'OTROS'
  ]);

  const {
    options: unidades,
    loading: loadingUnidades,
    loadOptions: cargarUnidades
  } = useSelectOptions('unidades', null, [
    'PCS', 'KG', 'LT', 'M', 'M2', 'M3', 'HR', 'UN'
  ]);

  const {
    options: certificadoTipos,
    completeData: certificadoTiposCompletos,
    loading: loadingCertificadoTipos,
    loadOptions: cargarCertificadoTipos
  } = useSelectOptions('certificado_tipos', 'certificado_tipos', [
    { codigo: 'CT01', tipo: 'CALIDAD' },
    { codigo: 'CT02', tipo: 'GARANTÍA' },
    { codigo: 'CT03', tipo: 'ORIGEN' }
  ]);

  // Handlers para los selects
  const handleResiduosSelectorFocus = () => {
    cargarResiduos();
  };

  const handleResiduosChange = (e) => {
    const selectedResiduo = e.target.value;
    if (selectedResiduo) {
      setFormData(prev => ({
        ...prev,
        tipo_res: selectedResiduo
      }));
    }
  };

  const handleCategoriaSelectorFocus = () => {
    cargarCategorias();
  };

  const handleCategoriaChange = (e) => {
    const selectedCategoria = e.target.value;
    if (selectedCategoria) {
      setFormData(prev => ({
        ...prev,
        categoria: selectedCategoria
      }));
    }
  };

  const handleFamiliaSelectorFocus = () => {
    cargarFamilias();
  };

  const handleFamiliaChange = (e) => {
    const selectedFamilia = e.target.value;
    if (selectedFamilia) {
      setFormData(prev => ({
        ...prev,
        familia: selectedFamilia
      }));
    }
  };

  const handleSelectorFocus = () => {
    cargarUnidades();
  };

  const handleUnidadChange = (e) => {
    const selectedUnidad = e.target.value;
    if (selectedUnidad) {
      setFormData(prev => ({
        ...prev,
        unidad: selectedUnidad
      }));
    }
  };

  const handleCertificadoTipoSelectorFocus = () => {
    cargarCertificadoTipos();
  };

  const handleCertificadoTipoChange = (e) => {
    const selectedTipo = e.target.value;
    if (selectedTipo) {
      // Buscar el código del tipo seleccionado
      const tipoCompleto = certificadoTiposCompletos.find(item => 
        (typeof item === 'string' ? item : item.tipo || item.TIPO || 'N/A') === selectedTipo
      );
      const codigoCertificado = tipoCompleto ? (tipoCompleto.codigo || tipoCompleto.CODIGO || '') : '';
      
      setFormData(prev => ({
        ...prev,
        tipo_certificado: selectedTipo,
        tipo_res: '' // Limpiar tipo de residuo al cambiar certificado
      }));
      
      // Filtrar residuos basado en el código del certificado
      filtrarResiduosPorCertificado(codigoCertificado);
    }
  };

  // Función para filtrar residuos basado en código de certificado
  const filtrarResiduosPorCertificado = useCallback((codigoCertificado) => {
    if (!codigoCertificado || residuosCompletos.length === 0) {
      // Si no hay código o no hay residuos, mostrar lista vacía
      setResiduos([]);
      return;
    }
    
    // Filtrar residuos donde codigo_c coincida con el código del certificado
    const residuosFiltrados = residuosCompletos.filter(item => 
      (item.codigo_c || item.CODIGO_C || '') === codigoCertificado
    );
    
    // Extraer solo los nombres para mostrar en el select
    const nombresResiduos = residuosFiltrados.map(item => 
      typeof item === 'string' ? item : item.nombre || item.NOMBRE || 'N/A'
    );
    
    setResiduos(nombresResiduos);
  }, [residuosCompletos]);

  const [formData, setFormData] = useState(initialFormData);

  // Efecto para inicializar el formulario en modo edición
  useEffect(() => {
    if (editMode && articuloEditar) {
      setFormData({
        codigo: articuloEditar.codigo || '',
        descri: articuloEditar.descri || '',
        unidad: articuloEditar.unidad || '',
        familia: articuloEditar.familia || '',
        categoria: articuloEditar.categoria || '',
        tipo_certificado: articuloEditar.tipo_cert || '',
        tipo_res: articuloEditar.tipo_res || ''
      });
    } else if (!editMode) {
      setFormData(initialFormData);
    }
  }, [editMode, articuloEditar, isOpen]);

  // Cargar opciones cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      cargarFamilias();
      cargarCategorias();
      cargarUnidades();
      cargarCertificadoTipos();
      cargarResiduos();
    }
  }, [isOpen, cargarFamilias, cargarCategorias, cargarUnidades, cargarCertificadoTipos, cargarResiduos]);

  // Filtrar residuos cuando cambian los datos completos y hay un tipo de certificado seleccionado
  useEffect(() => {
    if (certificadoTiposCompletos.length > 0 && residuosCompletos.length > 0 && formData.tipo_certificado) {
      const tipoCompleto = certificadoTiposCompletos.find(item => 
        (typeof item === 'string' ? item : item.tipo || item.TIPO || 'N/A') === formData.tipo_certificado
      );
      const codigoCertificado = tipoCompleto ? (tipoCompleto.codigo || tipoCompleto.CODIGO || '') : '';
      if (codigoCertificado) {
        filtrarResiduosPorCertificado(codigoCertificado);
      }
    }
  }, [certificadoTiposCompletos, residuosCompletos, formData.tipo_certificado, filtrarResiduosPorCertificado]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.codigo.trim() || !formData.descri.trim()) {
      showNotification('Los campos Código y Descripción son obligatorios', 'error');
      return;
    }

    setGuardando(true);

    try {
      let response;
      if (editMode && articuloEditar) {
        // Solo enviar los campos que cambiaron
        const cambios = {};
        Object.keys(formData).forEach((key) => {
          // Mapear nombres si es necesario
          let backendKey = key;
          if (key === 'tipo_certificado') backendKey = 'tipo_cert';
          else if (key === 'codigo') backendKey = 'codigo';
          else if (key === 'descri') backendKey = 'descri';
          else if (key === 'unidad') backendKey = 'unidad';
          else if (key === 'familia') backendKey = 'familia';
          else if (key === 'categoria') backendKey = 'categoria';
          else if (key === 'tipo_res') backendKey = 'tipo_res';
          if (formData[key] !== (articuloEditar[backendKey] || '')) {
            cambios[backendKey] = formData[key];
          }
        });
        // Si no hay cambios, no hacer nada
        if (Object.keys(cambios).length === 0) {
          showNotification('No hay cambios para guardar.', 'info');
          setGuardando(false);
          return;
        }
        // Asegurar que el código no esté vacío ni tenga espacios
        const codigoUrl = encodeURIComponent((formData.codigo || '').trim());
        if (!codigoUrl) {
          showNotification('Código inválido para actualizar.', 'error');
          setGuardando(false);
          return;
        }
        response = await fetch(`http://localhost:4000/api/articulos/${codigoUrl}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cambios),
        });
      } else {
        // Modo nuevo: POST y sí revisa duplicados
        response = await fetch('http://localhost:4000/api/articulos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            codigo: formData.codigo,
            descri: formData.descri,
            unidad: formData.unidad,
            familia: formData.familia,
            categoria: formData.categoria,
            tipo_cert: formData.tipo_certificado,
            tipo_res: formData.tipo_res
          }),
        });
      }

      if (response.ok) {
        await response.json(); // Confirmar que la respuesta es correcta
        showNotification(editMode ? 'Cambios guardados' : 'Registro Guardado', 'success');

        // Limpiar formulario después de 3 segundos (solo en modo nuevo)
        setTimeout(() => {
          if (!editMode) {
            // Solo limpiar formulario en modo nuevo
            setFormData(initialFormData);
            // Dar foco al campo código
            if (codigoRef.current) {
              codigoRef.current.focus();
            }
          }
        }, 3000);

      } else {
        await response.json(); // Leer respuesta de error
        if (!editMode && response.status === 409) {
          // Código duplicado - solo en modo nuevo
          showNotification('El código ya existe. Ingrese un código diferente.', 'warning');

          // Dar foco al campo código después de mostrar el mensaje
          setTimeout(() => {
            if (codigoRef.current) {
              codigoRef.current.focus();
              codigoRef.current.select(); // Seleccionar todo el texto para fácil reemplazo
            }
          }, 1000);
        } else {
          // Otros errores
          showNotification('Registro no se ha podido Guardar', 'error');
        }
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      showNotification('Registro no se ha podido Guardar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData(initialFormData);
    onClose();
  };

  const handleOverlayClick = () => {
    // No hacer nada - el modal no se cierra al hacer clic fuera
    // Solo se cierra con los botones Guardar o Cancelar
  };

  if (!isOpen) return null;

  return (
    <div className="nuevo-articulo-modal-overlay" onClick={handleOverlayClick}>
      <div id="nuevo-articulo-modal-root" className="nuevo-articulo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nuevo-articulo-modal-header">
          <h2 className="nuevo-articulo-modal-title">
            {editMode ? 'Editar Artículo' : 'Nuevo Artículo'}
          </h2>
          <button className="nuevo-articulo-modal-close" onClick={handleCancel}>
            ✕
          </button>
        </div>
        <div className="nuevo-articulo-modal-body">
          <form onSubmit={handleSubmit} className="nuevo-articulo-form">
            <div className="form-group">
              <label htmlFor="codigo">Código:</label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                required
                className="form-input codigo"
                placeholder="Ingrese el código del artículo"
                ref={codigoRef}
                autoFocus
                readOnly={!!editMode}
              />
            </div>

            <div className="form-group">
              <label htmlFor="descri">Descripción:</label>
              <input
                type="text"
                id="descri"
                name="descri"
                value={formData.descri}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Ingrese la descripción del artículo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="unidad">Unidad:</label>
              <div className="unidad-input-container">
                <input
                  type="text"
                  id="unidad"
                  name="unidad"
                  value={formData.unidad}
                  readOnly
                  required
                  className="form-input unidad"
                  placeholder="Seleccione una unidad"
                />
                <select
                  className="unidad-selector"
                  onChange={handleUnidadChange}
                  onFocus={handleSelectorFocus}
                  value=""
                >
                  <option value="" disabled>
                    {loadingUnidades ? 'Cargando unidades...' : 'Seleccionar unidad'}
                  </option>
                  {unidades.map((unidad, index) => (
                    <option key={index} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="familia">Familia:</label>
              <div className="familia-input-container">
                <input
                  type="text"
                  id="familia"
                  name="familia"
                  value={formData.familia}
                  readOnly
                  required
                  className="form-input familia"
                  placeholder="Seleccione una familia"
                />
                <select
                  className="familia-selector"
                  onChange={handleFamiliaChange}
                  onFocus={handleFamiliaSelectorFocus}
                  value=""
                >
                  <option value="" disabled>
                    {loadingFamilias ? 'Cargando familias...' : 'Seleccionar familia'}
                  </option>
                  {familias.map((familia, index) => (
                    <option key={index} value={familia}>
                      {familia}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            <div className="form-group">
              <label htmlFor="categoria">Categoría:</label>
              <div className="categoria-input-container">
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  readOnly
                  required
                  className="form-input categoria"
                  placeholder="Seleccione una categoría"
                />
                <select
                  className="categoria-selector"
                  onChange={handleCategoriaChange}
                  onFocus={handleCategoriaSelectorFocus}
                  value=""
                >
                  <option value="" disabled>
                    {loadingCategorias ? 'Cargando categorías...' : 'Seleccionar categoría'}
                  </option>
                  {categorias.map((categoria, index) => (
                    <option key={index} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campo tipo_certificado debajo de categoría */}
            <div className="form-group">
              <label htmlFor="tipo_certificado">Tipo Certificado:</label>
              <div className="tipo-certificado-input-container">
                <input
                  type="text"
                  id="tipo_certificado"
                  name="tipo_certificado"
                  value={formData.tipo_certificado}
                  readOnly
                  required
                  className="form-input tipo-certificado"
                  placeholder="Seleccione un tipo de certificado"
                />
                <select
                  className="tipo-certificado-selector"
                  onChange={handleCertificadoTipoChange}
                  onFocus={handleCertificadoTipoSelectorFocus}
                  value=""
                >
                  <option value="" disabled>
                    {loadingCertificadoTipos ? 'Cargando tipos...' : 'Seleccionar tipo'}
                  </option>
                  {certificadoTipos.map((tipo, index) => (
                    <option key={index} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tipo_res">Tipo de Residuo:</label>
              <div className="tipo-res-input-container">
                <input
                  type="text"
                  id="tipo_res"
                  name="tipo_res"
                  value={formData.tipo_res}
                  readOnly
                  required
                  className="form-input tipo-certificado"
                  placeholder="Seleccione un tipo de residuo"
                />
                <select
                  className="tipo-res-selector"
                  onChange={handleResiduosChange}
                  onFocus={handleResiduosSelectorFocus}
                  value=""
                >
                  <option value="" disabled>
                    {loadingResiduos ? 'Cargando residuos...' : 'Seleccionar residuo'}
                  </option>
                  {residuos.map((residuo, index) => (
                    <option key={index} value={residuo}>
                      {residuo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={guardando}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
              <button type="button" className="btn-cancel" onClick={handleCancel} disabled={guardando}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notificaciones flotantes */}
      <FloatingMessage
        message={floatMsg.message}
        type={floatMsg.type}
        isVisible={floatMsg.isVisible}
        onClose={() => setFloatMsg(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default NuevoArticuloModal;
