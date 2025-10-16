import React, { useState, useEffect } from 'react';
import './FamiliasModal.css';

const FamiliasModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('unidades');
  
  // Estados para unidades
  const [unidades, setUnidades] = useState([]);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para familias
  const [familias, setFamilias] = useState([]);
  const [selectedFamilia, setSelectedFamilia] = useState(null);
  const [loadingFamilias, setLoadingFamilias] = useState(false);
  
  // Estados para categorías
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  
  // Estados para zona de trabajo
  const [nombreUnidad, setNombreUnidad] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isReadonly, setIsReadonly] = useState(true);
  const [editingUnidad, setEditingUnidad] = useState(null); // Para saber qué unidad estamos editando
  const [originalName, setOriginalName] = useState(''); // Para comparar si hubo cambios
  
  // Estados para zona de trabajo familias
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [isEditingFamilia, setIsEditingFamilia] = useState(false);
  const [isReadonlyFamilia, setIsReadonlyFamilia] = useState(true);
  const [editingFamilia, setEditingFamilia] = useState(null); // Para saber qué familia estamos editando
  const [originalFamiliaName, setOriginalFamiliaName] = useState(''); // Para comparar si hubo cambios
  
  // Estados para zona de trabajo categorías
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [isEditingCategoria, setIsEditingCategoria] = useState(false);
  const [isReadonlyCategoria, setIsReadonlyCategoria] = useState(true);
  const [editingCategoria, setEditingCategoria] = useState(null); // Para saber qué categoría estamos editando
  const [originalCategoriaName, setOriginalCategoriaName] = useState(''); // Para comparar si hubo cambios
  
  // Estados para notificaciones
  const [notification, setNotification] = useState(null);

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000); // Se oculta después de 4 segundos
  };

  // Cargar datos al montar el componente o cambiar de pestaña
  useEffect(() => {
    const cargarDatos = async () => {
      if (activeTab === 'unidades' && isOpen) {
        setLoading(true);
        try {
          const response = await fetch('http://localhost:4000/api/unidades');
          if (response.ok) {
            const data = await response.json();
            setUnidades(data || []);
          } else {
            console.error('Error al cargar unidades:', response.status);
            setUnidades([]);
          }
        } catch (error) {
          console.error('Error al cargar unidades:', error);
          setUnidades([]);
        } finally {
          setLoading(false);
        }
      } else if (activeTab === 'familias' && isOpen) {
        setLoadingFamilias(true);
        try {
          const response = await fetch('http://localhost:4000/api/familias');
          if (response.ok) {
            const data = await response.json();
            setFamilias(data || []);
          } else {
            console.error('Error al cargar familias:', response.status);
            setFamilias([]);
          }
        } catch (error) {
          console.error('Error al cargar familias:', error);
          setFamilias([]);
        } finally {
          setLoadingFamilias(false);
        }
      } else if (activeTab === 'categorias' && isOpen) {
        setLoadingCategorias(true);
        try {
          const response = await fetch('http://localhost:4000/api/categorias');
          if (response.ok) {
            const data = await response.json();
            setCategorias(data || []);
          } else {
            console.error('Error al cargar categorías:', response.status);
            setCategorias([]);
          }
        } catch (error) {
          console.error('Error al cargar categorías:', error);
          setCategorias([]);
        } finally {
          setLoadingCategorias(false);
        }
      }
    };

    cargarDatos();
  }, [activeTab, isOpen]);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/unidades');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que data sea un array
        if (Array.isArray(data)) {
          setUnidades(data);
        } else {
          console.error('Los datos recibidos no son un array:', data);
          setUnidades([]);
        }
      } else {
        console.error('Error al cargar unidades:', response.status);
        setUnidades([]);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      setUnidades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Limpiar selecciones y resetear zona de trabajo al cambiar de pestaña
    setSelectedUnidad(null);
    setNombreUnidad('');
    setIsEditing(false);
    setIsReadonly(true);
    setEditingUnidad(null);
    setOriginalName('');
  };

  const handleUnidadClick = (unidad) => {
    setSelectedUnidad(unidad);
  };

  const handleNuevoUnidad = () => {
    // Activar modo edición para nueva unidad
    setIsEditing(true);
    setIsReadonly(false);
    setNombreUnidad('');
    setSelectedUnidad(null);
    setEditingUnidad(null); // Nuevo registro
    setOriginalName('');
    
    // Usar setTimeout para enfocar el input después del render
    setTimeout(() => {
      const input = document.getElementById('nombreUnidadInput');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleEditarUnidad = () => {
    if (!selectedUnidad) {
      showNotification('Por favor selecciona una unidad para editar', 'warning');
      return;
    }
    
    // Activar modo edición para unidad existente
    setIsEditing(true);
    setIsReadonly(false);
    setNombreUnidad(selectedUnidad.nombreu);
    setEditingUnidad(selectedUnidad);
    setOriginalName(selectedUnidad.nombreu);
    
    // Usar setTimeout para enfocar el input después del render
    setTimeout(() => {
      const input = document.getElementById('nombreUnidadInput');
      if (input) {
        input.focus();
        input.select(); // Seleccionar todo el texto para fácil edición
      }
    }, 100);
  };

  const handleGuardar = async () => {
    const nombreTrimmed = nombreUnidad.trim();
    
    if (!nombreTrimmed) {
      showNotification('Por favor ingresa un nombre para la unidad', 'warning');
      return;
    }

    if (nombreTrimmed.length > 20) {
      showNotification('El nombre de la unidad no puede exceder 20 caracteres', 'error');
      return;
    }

    // Si estamos editando, verificar si hubo cambios
    if (editingUnidad && nombreTrimmed === originalName) {
      showNotification('⚠️ No se detectaron cambios en el nombre de la unidad', 'warning');
      return;
    }

    try {
      let response;
      
      if (editingUnidad) {
        // Actualizar unidad existente
        response = await fetch(`http://localhost:4000/api/unidades/${editingUnidad.nombreu}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombreu: nombreTrimmed })
        });
      } else {
        // Crear nueva unidad
        response = await fetch('http://localhost:4000/api/unidades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombreu: nombreTrimmed })
        });
      }

      if (response.ok) {
        // Actualizar grid
        await cargarUnidades();
        
        // Resetear zona de trabajo
        setNombreUnidad('');
        setIsEditing(false);
        setIsReadonly(true);
        setEditingUnidad(null);
        setOriginalName('');
        setSelectedUnidad(null);
        
        if (editingUnidad) {
          showNotification('✅ Unidad actualizada exitosamente', 'success');
        } else {
          showNotification('✅ Unidad guardada exitosamente', 'success');
        }
      } else {
        const error = await response.json();
        const action = editingUnidad ? 'actualizar' : 'guardar';
        showNotification(`❌ Error al ${action} unidad: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error al procesar unidad:', error);
      const action = editingUnidad ? 'actualizar' : 'guardar';
      showNotification(`❌ Error de conexión al ${action} unidad`, 'error');
    }
  };

  const handleCancelar = () => {
    // Resetear zona de trabajo
    setNombreUnidad('');
    setIsEditing(false);
    setIsReadonly(true);
    setEditingUnidad(null);
    setOriginalName('');
    // Mantener la selección del grid para que el usuario pueda intentar editar de nuevo
  };

  const handleEliminarUnidad = async () => {
    if (!selectedUnidad) {
      showNotification('Por favor selecciona una unidad para eliminar', 'warning');
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar la unidad "${selectedUnidad.nombreu}"?`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/unidades/${selectedUnidad.nombreu}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await cargarUnidades();
          setSelectedUnidad(null);
          showNotification('🗑️ Unidad eliminada exitosamente', 'success');
        } else {
          const error = await response.json();
          showNotification(`❌ Error al eliminar unidad: ${error.error}`, 'error');
        }
      } catch (error) {
        console.error('Error al eliminar unidad:', error);
        showNotification('❌ Error de conexión al eliminar unidad', 'error');
      }
    }
  };

  // ===== FUNCIONES PARA FAMILIAS =====
  
  const cargarFamilias = async () => {
    setLoadingFamilias(true);
    try {
      const response = await fetch('http://localhost:4000/api/familias');
      if (response.ok) {
        const data = await response.json();
        setFamilias(data || []);
      } else {
        console.error('Error al cargar familias');
        setFamilias([]);
      }
    } catch (error) {
      console.error('Error al cargar familias:', error);
      setFamilias([]);
    } finally {
      setLoadingFamilias(false);
    }
  };

  const handleFamiliaClick = (familia) => {
    setSelectedFamilia(familia);
  };

  const handleNuevoFamilia = () => {
    // Activar modo edición para nueva familia
    setIsEditingFamilia(true);
    setIsReadonlyFamilia(false);
    setNombreFamilia('');
    setSelectedFamilia(null);
    setEditingFamilia(null); // Nuevo registro
    setOriginalFamiliaName('');
    
    // Usar setTimeout para enfocar el input después del render
    setTimeout(() => {
      const input = document.getElementById('nombreFamiliaInput');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleEditarFamilia = () => {
    if (!selectedFamilia) {
      showNotification('Por favor selecciona una familia para editar', 'warning');
      return;
    }
    
    // Activar modo edición para familia existente
    setIsEditingFamilia(true);
    setIsReadonlyFamilia(false);
    setNombreFamilia(selectedFamilia.nombref);
    setEditingFamilia(selectedFamilia); // Registro existente
    setOriginalFamiliaName(selectedFamilia.nombref); // Guardar nombre original
    
    // Enfocar y seleccionar texto del input
    setTimeout(() => {
      const input = document.getElementById('nombreFamiliaInput');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  };

  const handleGuardarFamilia = async () => {
    if (!nombreFamilia.trim()) {
      showNotification('Por favor ingresa un nombre para la familia', 'warning');
      return;
    }
    
    // Si estamos editando, verificar si hubo cambios
    if (editingFamilia && nombreFamilia.trim() === originalFamiliaName) {
      showNotification('No se detectaron cambios para guardar', 'info');
      setIsEditingFamilia(false);
      setIsReadonlyFamilia(true);
      return;
    }

    try {
      let response;
      
      if (editingFamilia) {
        // Modo edición: actualizar familia existente
        response = await fetch(`http://localhost:4000/api/familias/${editingFamilia.nombref}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombref: nombreFamilia.trim()
          }),
        });
      } else {
        // Modo nuevo: crear nueva familia
        response = await fetch('http://localhost:4000/api/familias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombref: nombreFamilia.trim()
          }),
        });
      }

      if (response.ok) {
        await cargarFamilias();
        const message = editingFamilia ? 
          '✏️ Familia actualizada exitosamente' : 
          '➕ Familia creada exitosamente';
        showNotification(message, 'success');
        
        // Resetear zona de trabajo
        setNombreFamilia('');
        setIsEditingFamilia(false);
        setIsReadonlyFamilia(true);
        setEditingFamilia(null);
        setOriginalFamiliaName('');
      } else {
        const error = await response.json();
        const action = editingFamilia ? 'actualizar' : 'crear';
        showNotification(`❌ Error al ${action} familia: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error al procesar familia:', error);
      const action = editingFamilia ? 'actualizar' : 'guardar';
      showNotification(`❌ Error de conexión al ${action} familia`, 'error');
    }
  };

  const handleCancelarFamilia = () => {
    // Resetear zona de trabajo
    setNombreFamilia('');
    setIsEditingFamilia(false);
    setIsReadonlyFamilia(true);
    setEditingFamilia(null);
    setOriginalFamiliaName('');
    // Mantener la selección del grid para que el usuario pueda intentar editar de nuevo
  };

  const handleEliminarFamilia = async () => {
    if (!selectedFamilia) {
      showNotification('Por favor selecciona una familia para eliminar', 'warning');
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar la familia "${selectedFamilia.nombref}"?`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/familias/${selectedFamilia.nombref}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await cargarFamilias();
          setSelectedFamilia(null);
          showNotification('🗑️ Familia eliminada exitosamente', 'success');
        } else {
          const error = await response.json();
          showNotification(`❌ Error al eliminar familia: ${error.error}`, 'error');
        }
      } catch (error) {
        console.error('Error al eliminar familia:', error);
        showNotification('❌ Error de conexión al eliminar familia', 'error');
      }
    }
  };

  // ===== FUNCIONES PARA CATEGORÍAS =====
  
  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await fetch('http://localhost:4000/api/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data || []);
      } else {
        console.error('Error al cargar categorías');
        setCategorias([]);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleCategoriaClick = (categoria) => {
    setSelectedCategoria(categoria);
  };

  const handleNuevoCategoria = () => {
    // Activar modo edición para nueva categoría
    setIsEditingCategoria(true);
    setIsReadonlyCategoria(false);
    setNombreCategoria('');
    setSelectedCategoria(null);
    setEditingCategoria(null); // Nuevo registro
    setOriginalCategoriaName('');
    
    // Usar setTimeout para enfocar el input después del render
    setTimeout(() => {
      const input = document.getElementById('nombreCategoriaInput');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleEditarCategoria = () => {
    if (!selectedCategoria) {
      showNotification('Por favor selecciona una categoría para editar', 'warning');
      return;
    }
    
    // Activar modo edición para categoría existente
    setIsEditingCategoria(true);
    setIsReadonlyCategoria(false);
    setNombreCategoria(selectedCategoria.categoria);
    setEditingCategoria(selectedCategoria); // Registro existente
    setOriginalCategoriaName(selectedCategoria.categoria); // Guardar nombre original
    
    // Enfocar y seleccionar texto del input
    setTimeout(() => {
      const input = document.getElementById('nombreCategoriaInput');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  };

  const handleGuardarCategoria = async () => {
    if (!nombreCategoria.trim()) {
      showNotification('Por favor ingresa un nombre para la categoría', 'warning');
      return;
    }
    
    // Si estamos editando, verificar si hubo cambios
    if (editingCategoria && nombreCategoria.trim() === originalCategoriaName) {
      showNotification('No se detectaron cambios para guardar', 'info');
      setIsEditingCategoria(false);
      setIsReadonlyCategoria(true);
      return;
    }

    try {
      let response;
      
      if (editingCategoria) {
        // Modo edición: actualizar categoría existente
        response = await fetch(`http://localhost:4000/api/categorias/${editingCategoria.categoria}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categoria: nombreCategoria.trim()
          }),
        });
      } else {
        // Modo nuevo: crear nueva categoría
        response = await fetch('http://localhost:4000/api/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categoria: nombreCategoria.trim()
          }),
        });
      }

      if (response.ok) {
        await cargarCategorias();
        const message = editingCategoria ? 
          '✏️ Categoría actualizada exitosamente' : 
          '➕ Categoría creada exitosamente';
        showNotification(message, 'success');
        
        // Resetear zona de trabajo
        setNombreCategoria('');
        setIsEditingCategoria(false);
        setIsReadonlyCategoria(true);
        setEditingCategoria(null);
        setOriginalCategoriaName('');
      } else {
        const error = await response.json();
        const action = editingCategoria ? 'actualizar' : 'crear';
        showNotification(`❌ Error al ${action} categoría: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error al procesar categoría:', error);
      const action = editingCategoria ? 'actualizar' : 'guardar';
      showNotification(`❌ Error de conexión al ${action} categoría`, 'error');
    }
  };

  const handleCancelarCategoria = () => {
    // Resetear zona de trabajo
    setNombreCategoria('');
    setIsEditingCategoria(false);
    setIsReadonlyCategoria(true);
    setEditingCategoria(null);
    setOriginalCategoriaName('');
    // Mantener la selección del grid para que el usuario pueda intentar editar de nuevo
  };

  const handleEliminarCategoria = async () => {
    if (!selectedCategoria) {
      showNotification('Por favor selecciona una categoría para eliminar', 'warning');
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${selectedCategoria.categoria}"?`)) {
      try {
        const response = await fetch(`http://localhost:4000/api/categorias/${selectedCategoria.categoria}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await cargarCategorias();
          setSelectedCategoria(null);
          showNotification('🗑️ Categoría eliminada exitosamente', 'success');
        } else {
          const error = await response.json();
          showNotification(`❌ Error al eliminar categoría: ${error.error}`, 'error');
        }
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification('❌ Error de conexión al eliminar categoría', 'error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="familias-modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="familias-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#333',
          borderRadius: '8px',
          width: '1035px', // 15% más ancho que 900px (900 * 1.15 = 1035px)
          maxHeight: '750px', // 25% más grande que 600px
          border: '1px solid #555',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div 
          className="familias-modal-header"
          style={{
            backgroundColor: '#222',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #555'
          }}
        >
          <h2 
            className="familias-modal-title"
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '22px' }}>🏷️</span>
            Gestión de Familias
          </h2>
          <button 
            className="familias-modal-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div 
          className="familias-tabs"
          style={{
            display: 'flex',
            backgroundColor: '#2a2a2a',
            borderBottom: '1px solid #555'
          }}
        >
          <button
            className={`tab-button ${activeTab === 'unidades' ? 'active' : ''}`}
            onClick={() => handleTabClick('unidades')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'unidades' ? '#007bff' : 'transparent',
              color: activeTab === 'unidades' ? '#fff' : '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'unidades' ? '3px solid #007bff' : '3px solid transparent'
            }}
          >
            📏 Unidades
          </button>
          <button
            className={`tab-button ${activeTab === 'familias' ? 'active' : ''}`}
            onClick={() => handleTabClick('familias')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'familias' ? '#28a745' : 'transparent',
              color: activeTab === 'familias' ? '#fff' : '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'familias' ? '3px solid #28a745' : '3px solid transparent'
            }}
          >
            👥 Familias
          </button>
          <button
            className={`tab-button ${activeTab === 'categorias' ? 'active' : ''}`}
            onClick={() => handleTabClick('categorias')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'categorias' ? '#ffc107' : 'transparent',
              color: activeTab === 'categorias' ? '#000' : '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'categorias' ? '3px solid #ffc107' : '3px solid transparent'
            }}
          >
            📂 Categorías
          </button>
        </div>

        {/* Contenido de pestañas */}
        <div 
          className="familias-modal-body"
          style={{
            flex: 1,
            padding: '20px',
            overflow: 'auto',
            backgroundColor: '#333',
            color: '#fff'
          }}
        >
          {activeTab === 'unidades' && (
            <div className="tab-content">
              <h3 style={{ marginTop: 0, color: '#007bff' }}>📏 Gestión de Unidades</h3>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                Administra las unidades de medida para los artículos.
              </p>
              
              {/* Contenedor principal con grid y zona derecha */}
              <div style={{ 
                display: 'flex', 
                gap: '20px',
                minHeight: '375px'
              }}>
                
                {/* Zona izquierda - Grid */}
                <div style={{ 
                  flex: '0 0 50%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Grid de unidades */}
                  <div style={{
                    flex: 1,
                    border: '1px solid #555',
                    borderRadius: '8px',
                    backgroundColor: '#2a2a2a',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    
                    {/* Header del grid */}
                    <div style={{
                      backgroundColor: '#1a1a1a',
                      borderBottom: '1px solid #555',
                      padding: '12px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      Unidades de Medida
                    </div>
                    
                    {/* Contenido del grid */}
                    <div style={{
                      maxHeight: '280px',
                      overflowY: 'auto'
                    }}>
                      {loading ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#ccc'
                        }}>
                          Cargando unidades...
                        </div>
                      ) : !Array.isArray(unidades) || unidades.length === 0 ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666'
                        }}>
                          No hay unidades registradas
                        </div>
                      ) : (
                        Array.isArray(unidades) && unidades.map((unidad, index) => (
                          <div
                            key={unidad?.nombreu || index}
                            onClick={() => handleUnidadClick(unidad)}
                            style={{
                              padding: '12px',
                              borderBottom: index < unidades.length - 1 ? '1px solid #444' : 'none',
                              cursor: 'pointer',
                              backgroundColor: selectedUnidad?.nombreu === unidad?.nombreu ? '#007bff' : 'transparent',
                              color: selectedUnidad?.nombreu === unidad?.nombreu ? '#fff' : '#ccc',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedUnidad?.nombreu !== unidad?.nombreu) {
                                e.target.style.backgroundColor = '#333';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedUnidad?.nombreu !== unidad?.nombreu) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {unidad?.nombreu || 'Sin nombre'}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-start'
                  }}>
                    <button
                      onClick={handleNuevoUnidad}
                      disabled={isEditing}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isEditing ? '#6c757d' : '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isEditing ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isEditing) {
                          e.target.style.backgroundColor = '#218838';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditing) {
                          e.target.style.backgroundColor = '#28a745';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>➕</span>
                      Nuevo
                    </button>
                    
                    <button
                      onClick={handleEditarUnidad}
                      disabled={!selectedUnidad || isEditing}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: (!selectedUnidad || isEditing) ? '#6c757d' : '#ffc107',
                        color: (!selectedUnidad || isEditing) ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (!selectedUnidad || isEditing) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedUnidad && !isEditing) {
                          e.target.style.backgroundColor = '#e0a800';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedUnidad && !isEditing) {
                          e.target.style.backgroundColor = '#ffc107';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>✏️</span>
                      Editar
                    </button>
                    
                    <button
                      onClick={handleEliminarUnidad}
                      disabled={!selectedUnidad || isEditing}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: (!selectedUnidad || isEditing) ? '#6c757d' : '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (!selectedUnidad || isEditing) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedUnidad && !isEditing) {
                          e.target.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedUnidad && !isEditing) {
                          e.target.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* Zona derecha - Zona de trabajo */}
                <div style={{ 
                  flex: '0 0 45%',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Campo de texto para nombre de unidad */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#ccc',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Nombre de Unidad:
                    </label>
                    <input
                      id="nombreUnidadInput"
                      type="text"
                      value={nombreUnidad}
                      onChange={(e) => setNombreUnidad(e.target.value)}
                      readOnly={isReadonly}
                      maxLength={20}
                      placeholder={isReadonly ? "Escriba nombre de unidad" : 
                                  editingUnidad ? `Editando: ${originalName}` : 
                                  "Ingresa el nombre de la nueva unidad"}
                      style={{
                        width: '70%',
                        padding: '10px',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        backgroundColor: isReadonly ? '#1a1a1a' : '#333',
                        color: isReadonly ? '#888' : '#fff',
                        fontSize: '14px',
                        cursor: isReadonly ? 'not-allowed' : 'text',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!isReadonly) {
                          e.target.style.borderColor = '#007bff';
                          e.target.style.backgroundColor = '#404040';
                        }
                      }}
                      onBlur={(e) => {
                        if (!isReadonly) {
                          e.target.style.borderColor = '#555';
                          e.target.style.backgroundColor = '#333';
                        }
                      }}
                    />
                    {!isReadonly && (
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        marginTop: '4px'
                      }}>
                        Máximo 20 caracteres ({nombreUnidad.length}/20)
                      </div>
                    )}
                  </div>
                  
                  {/* Espacio flexible */}
                  <div style={{ flex: 1 }}></div>
                  
                  {/* Botones de acción de zona de trabajo */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-start',
                    width: '70%'
                  }}>
                    <button
                      onClick={handleCancelar}
                      disabled={isReadonly}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isReadonly ? '#6c757d' : '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isReadonly ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isReadonly) {
                          e.target.style.backgroundColor = '#5a6268';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isReadonly) {
                          e.target.style.backgroundColor = '#6c757d';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>❌</span>
                      Cancelar
                    </button>
                    
                    <button
                      onClick={handleGuardar}
                      disabled={isReadonly}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isReadonly ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isReadonly ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isReadonly) {
                          e.target.style.backgroundColor = '#0056b3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isReadonly) {
                          e.target.style.backgroundColor = '#007bff';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>💾</span>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'familias' && (
            <div className="tab-content">
              <h3 style={{ marginTop: 0, color: '#28a745' }}>👥 Gestión de Familias</h3>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                Organiza y administra las familias de productos.
              </p>
              
              {/* Layout flex horizontal */}
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                minHeight: '375px' 
              }}>
                {/* Zona izquierda - Lista de familias */}
                <div style={{ 
                  flex: '0 0 50%',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Header de la lista */}
                  <div style={{ 
                    padding: '12px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '1px solid #555'
                  }}>
                    👥 Lista de Familias
                  </div>
                  
                  {/* Contenedor de lista con scroll */}
                  <div style={{ 
                    flex: '1',
                    overflow: 'auto',
                    maxHeight: '320px'
                  }}>
                    {loadingFamilias ? (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#ccc' 
                      }}>
                        Cargando familias...
                      </div>
                    ) : familias.length > 0 ? (
                      <div>
                        {familias.map((familia, index) => (
                          <div
                            key={index}
                            onClick={() => handleFamiliaClick(familia)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #555',
                              cursor: 'pointer',
                              backgroundColor: selectedFamilia && selectedFamilia.nombref === familia.nombref ? '#28a745' : 'transparent',
                              color: selectedFamilia && selectedFamilia.nombref === familia.nombref ? 'white' : '#ccc',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!selectedFamilia || selectedFamilia.nombref !== familia.nombref) {
                                e.target.style.backgroundColor = '#444';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selectedFamilia || selectedFamilia.nombref !== familia.nombref) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            👥 {familia.nombref}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        No hay familias registradas
                      </div>
                    )}
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{ 
                    padding: '16px',
                    borderTop: '1px solid #555',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={handleNuevoFamilia}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#28a745';
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>➕</span>
                      Nuevo
                    </button>
                    <button
                      onClick={handleEditarFamilia}
                      disabled={!selectedFamilia}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: selectedFamilia ? '#007bff' : '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedFamilia ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s',
                        opacity: selectedFamilia ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        if (selectedFamilia) {
                          e.target.style.backgroundColor = '#0056b3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFamilia) {
                          e.target.style.backgroundColor = '#007bff';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>✏️</span>
                      Editar
                    </button>
                    <button
                      onClick={handleEliminarFamilia}
                      disabled={!selectedFamilia}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: selectedFamilia ? '#dc3545' : '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedFamilia ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s',
                        opacity: selectedFamilia ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        if (selectedFamilia) {
                          e.target.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFamilia) {
                          e.target.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* Zona derecha - Zona de trabajo */}
                <div style={{ 
                  flex: '0 0 45%',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Header zona de trabajo */}
                  <div style={{ 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #28a745'
                  }}>
                    <h4 style={{ 
                      margin: 0,
                      color: '#28a745',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>👥</span>
                      Familia
                    </h4>
                  </div>
                  
                  {/* Campo de texto */}
                  <div style={{ 
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <input
                        id="nombreFamiliaInput"
                        type="text"
                        value={nombreFamilia}
                        onChange={(e) => setNombreFamilia(e.target.value)}
                        readOnly={isReadonlyFamilia}
                        placeholder={isReadonlyFamilia ? "Selecciona una familia o haz clic en 'Nuevo'" : "Ingrese nombre de familia"}
                        style={{
                          width: '70%',
                          padding: '12px',
                          fontSize: '14px',
                          border: '2px solid #555',
                          borderRadius: '6px',
                          backgroundColor: isReadonlyFamilia ? '#1a1a1a' : '#333',
                          color: isReadonlyFamilia ? '#888' : '#fff',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          if (!isReadonlyFamilia) {
                            e.target.style.borderColor = '#28a745';
                            e.target.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.25)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#555';
                          e.target.style.boxShadow = 'none';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isReadonlyFamilia) {
                            handleGuardarFamilia();
                          }
                          if (e.key === 'Escape' && !isReadonlyFamilia) {
                            handleCancelarFamilia();
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{ 
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: 'auto',
                    paddingTop: '20px'
                  }}>
                    {isEditingFamilia && (
                      <button
                        onClick={handleCancelarFamilia}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#545b62';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#6c757d';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>❌</span>
                        Cancelar
                      </button>
                    )}
                    
                    <button
                      onClick={handleGuardarFamilia}
                      disabled={isReadonlyFamilia}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: isReadonlyFamilia ? '#666' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isReadonlyFamilia ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                        opacity: isReadonlyFamilia ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isReadonlyFamilia) {
                          e.target.style.backgroundColor = '#218838';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isReadonlyFamilia) {
                          e.target.style.backgroundColor = '#28a745';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>💾</span>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categorias' && (
            <div className="tab-content">
              <h3 style={{ marginTop: 0, color: '#ffc107' }}>📂 Gestión de Categorías</h3>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                Define y gestiona las categorías de clasificación.
              </p>
              
              {/* Layout flex horizontal */}
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                minHeight: '375px' 
              }}>
                {/* Zona izquierda - Lista de categorías */}
                <div style={{ 
                  flex: '0 0 50%',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Header de la lista */}
                  <div style={{ 
                    padding: '12px 16px',
                    backgroundColor: '#ffc107',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '1px solid #555'
                  }}>
                    📂 Lista de Categorías
                  </div>
                  
                  {/* Contenedor de lista con scroll */}
                  <div style={{ 
                    flex: '1',
                    overflow: 'auto',
                    maxHeight: '320px'
                  }}>
                    {loadingCategorias ? (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#ccc' 
                      }}>
                        Cargando categorías...
                      </div>
                    ) : categorias.length > 0 ? (
                      <div>
                        {categorias.map((categoria, index) => (
                          <div
                            key={index}
                            onClick={() => handleCategoriaClick(categoria)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #555',
                              cursor: 'pointer',
                              backgroundColor: selectedCategoria && selectedCategoria.categoria === categoria.categoria ? '#ffc107' : 'transparent',
                              color: selectedCategoria && selectedCategoria.categoria === categoria.categoria ? '#000' : '#ccc',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!selectedCategoria || selectedCategoria.categoria !== categoria.categoria) {
                                e.target.style.backgroundColor = '#444';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selectedCategoria || selectedCategoria.categoria !== categoria.categoria) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            📂 {categoria.categoria}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        No hay categorías registradas
                      </div>
                    )}
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{ 
                    padding: '16px',
                    borderTop: '1px solid #555',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={handleNuevoCategoria}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e0a800';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ffc107';
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>➕</span>
                      Nuevo
                    </button>
                    <button
                      onClick={handleEditarCategoria}
                      disabled={!selectedCategoria}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: selectedCategoria ? '#007bff' : '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedCategoria ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s',
                        opacity: selectedCategoria ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategoria) {
                          e.target.style.backgroundColor = '#0056b3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategoria) {
                          e.target.style.backgroundColor = '#007bff';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>✏️</span>
                      Editar
                    </button>
                    <button
                      onClick={handleEliminarCategoria}
                      disabled={!selectedCategoria}
                      style={{
                        flex: '1',
                        minWidth: '90px',
                        padding: '8px 12px',
                        backgroundColor: selectedCategoria ? '#dc3545' : '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedCategoria ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'background-color 0.2s',
                        opacity: selectedCategoria ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategoria) {
                          e.target.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategoria) {
                          e.target.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* Zona derecha - Zona de trabajo */}
                <div style={{ 
                  flex: '0 0 45%',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  {/* Header zona de trabajo */}
                  <div style={{ 
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #ffc107'
                  }}>
                    <h4 style={{ 
                      margin: 0,
                      color: '#ffc107',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>📂</span>
                      Categoría
                    </h4>
                  </div>
                  
                  {/* Campo de texto */}
                  <div style={{ 
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <input
                        id="nombreCategoriaInput"
                        type="text"
                        value={nombreCategoria}
                        onChange={(e) => setNombreCategoria(e.target.value)}
                        readOnly={isReadonlyCategoria}
                        placeholder={isReadonlyCategoria ? "Selecciona una categoría o haz clic en 'Nuevo'" : "Ingrese nombre de categoría"}
                        style={{
                          width: '70%',
                          padding: '12px',
                          fontSize: '14px',
                          border: '2px solid #555',
                          borderRadius: '6px',
                          backgroundColor: isReadonlyCategoria ? '#1a1a1a' : '#333',
                          color: isReadonlyCategoria ? '#888' : '#fff',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          if (!isReadonlyCategoria) {
                            e.target.style.borderColor = '#ffc107';
                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.25)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#555';
                          e.target.style.boxShadow = 'none';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isReadonlyCategoria) {
                            handleGuardarCategoria();
                          }
                          if (e.key === 'Escape' && !isReadonlyCategoria) {
                            handleCancelarCategoria();
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div style={{ 
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: 'auto',
                    paddingTop: '20px'
                  }}>
                    {isEditingCategoria && (
                      <button
                        onClick={handleCancelarCategoria}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#545b62';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#6c757d';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>❌</span>
                        Cancelar
                      </button>
                    )}
                    
                    <button
                      onClick={handleGuardarCategoria}
                      disabled={isReadonlyCategoria}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: isReadonlyCategoria ? '#666' : '#ffc107',
                        color: isReadonlyCategoria ? 'white' : '#000',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isReadonlyCategoria ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                        opacity: isReadonlyCategoria ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isReadonlyCategoria) {
                          e.target.style.backgroundColor = '#e0a800';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isReadonlyCategoria) {
                          e.target.style.backgroundColor = '#ffc107';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>💾</span>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Componente de Notificación */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: notification.type === 'success' ? '#28a745' : 
                          notification.type === 'error' ? '#dc3545' : 
                          notification.type === 'warning' ? '#ffc107' : '#007bff',
          color: notification.type === 'warning' ? '#000' : '#fff',
          padding: '20px 28px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
          maxWidth: '450px',
          minWidth: '300px',
          fontSize: '15px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeInScale 0.3s ease-out',
          border: `2px solid ${notification.type === 'success' ? '#1e7e34' : 
                                notification.type === 'error' ? '#bd2130' : 
                                notification.type === 'warning' ? '#d39e00' : '#0056b3'}`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            {notification.type === 'success' ? '✓' : 
             notification.type === 'error' ? '✕' : 
             notification.type === 'warning' ? '⚠' : 'ℹ'}
          </div>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '16px',
              cursor: 'pointer',
              marginLeft: 'auto',
              opacity: 0.7,
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default FamiliasModal;
