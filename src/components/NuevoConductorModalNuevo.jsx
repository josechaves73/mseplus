import React, { useState, useEffect, useRef } from 'react';
import MensajeModal from './MensajeModal';

const NuevoConductorModal = ({ isOpen, onClose, editData = null }) => {
  console.log('🚗 NuevoConductorModal - isOpen:', isOpen, 'editData:', editData);
  
  const [activeTab, setActiveTab] = useState('mantenimiento');
  const codigoInputRef = useRef(null);
  
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    codigo_chofer: '',
    nombre: '',
    cedula: '',
    telefonos: '',
    imagen: ''
  });
  
  // Estados para manejo de imágenes
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // Estados para modal de mensaje
  const [showMensajeModal, setShowMensajeModal] = useState(false);
  const [mensajeModalData, setMensajeModalData] = useState({ title: '', message: '', type: 'success' });
  
  // Determinar si estamos en modo edición
  const isEditMode = editData !== null;

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && !isEditMode) {
      setFormData({
        codigo_chofer: '',
        nombre: '',
        cedula: '',
        telefonos: '',
        imagen: ''
      });
      setActiveTab('mantenimiento');
      // Limpiar estados de imagen
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [isOpen, isEditMode]);

  // Cargar datos en modo edición
  useEffect(() => {
    if (isEditMode && editData) {
      setFormData({
        codigo_chofer: editData.codigo_chofer || '',
        nombre: editData.nombre || '',
        cedula: editData.cedula || '',
        telefonos: editData.telefonos || '',
        imagen: editData.imagen || ''
      });
      
      // Si hay imagen, establecer preview
      if (editData.imagen) {
        setPreviewUrl(editData.imagen);
      }
    }
  }, [isEditMode, editData]);

  if (!isOpen) return null;

  console.log('🟢 NuevoConductorModal - RENDERING! DOM va a mostrar el modal');
  
  const handleTabClick = (tabId) => {
    // En modo edición, permitir acceso a todas las pestañas
    if (isEditMode) {
      setActiveTab(tabId);
      return;
    }
    
    // En modo nuevo, solo permitir pestaña de mantenimiento
    if (tabId === 'documentacion') {
      showNotification('Debe guardar primero los datos básicos del conductor', 'error');
      return;
    }
    setActiveTab(tabId);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showNotification = (message, type = 'success') => {
    const title = type === 'error' ? 'Error' : 'Éxito';
    setMensajeModalData({ title, message, type });
    setShowMensajeModal(true);
  };

  // Función para manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no debe superar los 5MB', 'error');
        return;
      }
      
      setSelectedFile(file);
      
      // Crear URL de preview local
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Subir automáticamente a Cloudinary
      uploadToCloudinary(file);
    }
  };

  // Función para subir imagen a Cloudinary
  const uploadToCloudinary = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'mse_uploads'); // Tu preset personalizado
      formData.append('folder', 'conductores');
      
      // Usar tu cloud_name correcto
      const response = await fetch('https://api.cloudinary.com/v1_1/dbdcyfeew/image/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Error de Cloudinary'}`);
      }
      
      const result = await response.json();
      console.log('Cloudinary result:', result);
      
      if (result.secure_url) {
        // Actualizar el formData con la URL de Cloudinary
        setFormData(prev => ({
          ...prev,
          imagen: result.secure_url
        }));
        
        showNotification('Imagen cargada exitosamente', 'success');
      } else {
        throw new Error('No se recibió URL de imagen');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      showNotification(`Error: ${error.message}`, 'error');
      // Limpiar preview en caso de error
      setSelectedFile(null);
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  // Función para mostrar confirmación de eliminación
  const handleDeleteImageClick = () => {
    setShowDeleteConfirmModal(true);
  };

  // Función para confirmar eliminación de imagen
  const confirmDeleteImage = async () => {
    setShowDeleteConfirmModal(false);
    await executeDeleteImage();
  };

  // Función para cancelar eliminación
  const cancelDeleteImage = () => {
    setShowDeleteConfirmModal(false);
  };

  // Función que ejecuta la eliminación real
  const executeDeleteImage = async () => {
    if (formData.imagen) {
      try {
        // Extraer public_id de la URL de Cloudinary
        const urlParts = formData.imagen.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        
        // Eliminar de Cloudinary
        const cloudinaryResponse = await fetch('/api/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicId: `conductores/${publicId}` })
        });
        
        // Si estamos en modo edición, también actualizar la base de datos
        if (isEditMode && editData) {
          const dbResponse = await fetch(`/api/chofer/${editData.codigo_chofer}/imagen`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (dbResponse.ok) {
            showNotification('Imagen eliminada de Cloudinary y base de datos', 'success');
          } else {
            showNotification('Imagen eliminada de Cloudinary, error en base de datos', 'error');
          }
        } else {
          if (cloudinaryResponse.ok) {
            showNotification('Imagen eliminada exitosamente', 'success');
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        showNotification('Imagen eliminada localmente', 'success');
      }
    }
    
    // Limpiar estados locales
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({
      ...prev,
      imagen: ''
    }));
    
    // Limpiar input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleGuardar = async () => {
    // Validar campos requeridos
    if (!formData.codigo_chofer || !formData.nombre || !formData.cedula || !formData.telefonos) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    try {
      const url = isEditMode 
        ? `/api/chofer/${editData.codigo_chofer}`
        : '/api/chofer';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const mensaje = isEditMode 
          ? 'Conductor actualizado exitosamente' 
          : 'Conductor guardado exitosamente';
        
        showNotification(mensaje, 'success');
        
        if (!isEditMode) {
          // Solo limpiar en modo nuevo
          setFormData({
            codigo_chofer: '',
            nombre: '',
            cedula: '',
            telefonos: '',
            imagen: ''
          });
          
          // Limpiar estados de imagen
          setSelectedFile(null);
          setPreviewUrl('');
          
          // Limpiar input file
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) {
            fileInput.value = '';
          }
          
          // Dar foco al campo código después de un breve delay
          setTimeout(() => {
            if (codigoInputRef.current) {
              codigoInputRef.current.focus();
            }
          }, 100);
        }
        // En modo edición, NO cerrar el modal - solo mostrar notificación
        
      } else {
        // Error del servidor (código duplicado, etc.)
        showNotification(result.error || 'Error al guardar conductor', 'error');
      }
    } catch (error) {
      console.error('Error al guardar conductor:', error);
      showNotification('Error de conexión al guardar', 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        left: 0,
        width: '100%',
        height: 'calc(100vh - 64px)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#333',
          borderRadius: 0,
          boxShadow: 'none',
          width: '90%',
          maxWidth: '800px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#007bff',
          color: '#fff',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #444'
        }}>
          <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>
            {isEditMode ? 'Editar Conductor' : 'Nuevo Conductor'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#333',
          borderBottom: '1px solid #444'
        }}>
          <button
            onClick={() => handleTabClick('mantenimiento')}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'mantenimiento' ? '#28a745' : '#333',
              fontSize: '14px',
              fontWeight: '500',
              flex: 1,
              textAlign: 'center',
              color: '#fff',
              borderBottom: activeTab === 'mantenimiento' ? '3px solid #28a745' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'mantenimiento') {
                e.target.style.backgroundColor = '#444';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'mantenimiento') {
                e.target.style.backgroundColor = '#333';
              }
            }}
          >
            🔧 Mantenimiento
          </button>
          <button
            onClick={() => handleTabClick('documentacion')}
            disabled={!isEditMode}
            style={{
              padding: '12px 24px',
              cursor: isEditMode ? 'pointer' : 'not-allowed',
              border: 'none',
              background: activeTab === 'documentacion' ? '#6f42c1' : '#333',
              fontSize: '14px',
              fontWeight: '500',
              flex: 1,
              textAlign: 'center',
              color: isEditMode ? '#fff' : '#888',
              borderBottom: activeTab === 'documentacion' ? '3px solid #6f42c1' : '3px solid transparent',
              opacity: isEditMode ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isEditMode && activeTab !== 'documentacion') {
                e.target.style.backgroundColor = '#444';
              }
            }}
            onMouseLeave={(e) => {
              if (isEditMode && activeTab !== 'documentacion') {
                e.target.style.backgroundColor = '#333';
              }
            }}
          >
            📋 Documentación
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          backgroundColor: '#333',
          color: '#fff'
        }}>
          {activeTab === 'mantenimiento' && (
            <div>
              <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label style={{marginBottom: '6px', fontWeight: '500', color: '#fff', fontSize: '14px'}}>
                    Código Chofer *
                  </label>
                  <input
                    ref={codigoInputRef}
                    type="text"
                    value={formData.codigo_chofer}
                    onChange={(e) => handleInputChange('codigo_chofer', e.target.value)}
                    placeholder="Ej: CH001"
                    maxLength="10"
                    readOnly={isEditMode}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: isEditMode ? '#555' : '#444',
                      color: '#fff',
                      cursor: isEditMode ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label style={{marginBottom: '6px', fontWeight: '500', color: '#fff', fontSize: '14px'}}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre completo del conductor"
                    maxLength="100"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#444',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label style={{marginBottom: '6px', fontWeight: '500', color: '#fff', fontSize: '14px'}}>
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => handleInputChange('cedula', e.target.value)}
                    placeholder="Número de cédula"
                    maxLength="20"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#444',
                      color: '#fff'
                    }}
                  />
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label style={{marginBottom: '6px', fontWeight: '500', color: '#fff', fontSize: '14px'}}>
                    Teléfonos *
                  </label>
                  <input
                    type="text"
                    value={formData.telefonos}
                    onChange={(e) => handleInputChange('telefonos', e.target.value)}
                    placeholder="Teléfonos de contacto"
                    maxLength="50"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#444',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              {/* Sección de imagen */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                border: '2px dashed #555',
                borderRadius: '8px',
                backgroundColor: '#444'
              }}>
                <h3 style={{margin: '0 0 16px 0', color: '#fff', fontSize: '16px', textAlign: 'center'}}>
                  📷 Foto del Conductor
                </h3>
                
                {/* Vista previa de imagen o botón de carga */}
                {previewUrl || formData.imagen ? (
                  <div style={{textAlign: 'center', position: 'relative'}}>
                    <div style={{position: 'relative', display: 'inline-block'}}>
                      <img 
                        src={previewUrl || formData.imagen}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '2px solid #666'
                        }}
                        onClick={() => setShowImageModal(true)}
                      />
                      {/* Botón X para eliminar */}
                      <button
                        onClick={handleDeleteImageClick}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar imagen"
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{fontSize: '12px', color: '#ccc', marginTop: '8px'}}>
                      Haz clic en la imagen para verla en grande
                    </p>
                    {uploading && (
                      <p style={{fontSize: '12px', color: '#28a745', marginTop: '4px'}}>
                        Subiendo imagen...
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{textAlign: 'center'}}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{display: 'none'}}
                      id="imageInput"
                    />
                    <label
                      htmlFor="imageInput"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: uploading ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {uploading ? '📤 Subiendo...' : '📁 Seleccionar Imagen'}
                    </label>
                    <p style={{fontSize: '12px', color: '#ccc', marginTop: '8px'}}>
                      <em>Formatos soportados: JPG, PNG, GIF (máx. 5MB)</em>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documentacion' && isEditMode && (
            <div style={{textAlign: 'center', padding: '40px'}}>
              <h3 style={{color: '#fff'}}>📋 Documentación</h3>
              <p style={{color: '#ccc'}}>Esta sección estará disponible para agregar documentos del conductor.</p>
              <p style={{color: '#ccc'}}><em>Próximamente: Licencias, certificados, contratos, etc.</em></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #444',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#333'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: '#fff',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            ❌ Cancelar
          </button>
          <button 
            onClick={handleGuardar}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#28a745',
              color: '#fff',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            💾 Guardar
          </button>
        </div>

        {/* Notificaciones usando MensajeModal */}
        <MensajeModal
          isOpen={showMensajeModal}
          onClose={() => setShowMensajeModal(false)}
          title={mensajeModalData.title}
          buttons={[
            {
              label: 'Aceptar',
              onClick: () => setShowMensajeModal(false),
              className: mensajeModalData.type === 'error' ? 'btn-danger' : 'btn-confirm'
            }
          ]}
          size="small"
        >
          <p style={{ textAlign: 'center', margin: '20px 0' }}>
            {mensajeModalData.message}
          </p>
        </MensajeModal>

        {/* Modal para ver imagen en grande */}
        {showImageModal && (previewUrl || formData.imagen) && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999999, // Z-index muy alto
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => setShowImageModal(false)}
          >
            <div style={{position: 'relative', maxWidth: '90vw', maxHeight: '90vh'}}>
              <img
                src={previewUrl || formData.imagen}
                alt="Imagen en grande"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}
              />
              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar imagen */}
        {showDeleteConfirmModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 10000000, // Z-index mayor que el modal de imagen
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={cancelDeleteImage}
          >
            <div
              style={{
                backgroundColor: '#333',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                border: '1px solid #555'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  🗑️
                </div>
                <h3 style={{
                  color: '#fff',
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  ¿Eliminar imagen?
                </h3>
                <p style={{
                  color: '#ccc',
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  Esta acción eliminará permanentemente la imagen de Cloudinary
                  {isEditMode ? ' y de la base de datos' : ''}. No se puede deshacer.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={cancelDeleteImage}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={confirmDeleteImage}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevoConductorModal;
