import React, { useState, useEffect } from 'react';
import './ArticulosXClienteModal.css';

const ArticulosXClienteModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para los textboxes
  const [codigoCliente, setCodigoCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  
  // Estados para artículos
  const [articulos, setArticulos] = useState([]);
  const [articulosSearchTerm, setArticulosSearchTerm] = useState('');
  const [selectedArticulo, setSelectedArticulo] = useState(null);

  // Filtrar clientes localmente
  const filteredClientes = clientes.filter(cliente => 
    cliente.codigo.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar clientes desde el backend
  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      // Usar endpoint optimizado para cargar solo código y nombre
      const response = await fetch('http://localhost:4000/api/clientes-basico');
      if (!response.ok) {
        // Fallback al endpoint completo si el básico falla
        const fallbackResponse = await fetch('http://localhost:4000/api/clientes');
        if (!fallbackResponse.ok) {
          throw new Error('Error al cargar clientes');
        }
        const fallbackData = await fallbackResponse.json();
        setClientes(fallbackData.success ? fallbackData.clientes : []);
      } else {
        const data = await response.json();
        setClientes(data.success ? data.clientes : []);
      }
      
      // Resetear selección
      setSelectedIndex(-1);
      setSelectedCliente(null);
      setCodigoCliente('');
      setNombreCliente('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar artículos desde el backend
  const fetchArticulos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/articulos');
      if (!response.ok) {
        throw new Error('Error al cargar artículos');
      }
      const data = await response.json();
      
      // El endpoint devuelve { success: true, articulos: [...] }
      const articulosArray = data.success && Array.isArray(data.articulos) ? data.articulos : [];
      setArticulos(articulosArray);
    } catch (err) {
      console.error('❌ Error en fetchArticulos:', err);
      setError(err.message);
      setArticulos([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Filtrar artículos localmente
  const filteredArticulos = Array.isArray(articulos) ? articulos.filter(articulo => 
    articulo.codigo && articulo.descri &&
    (articulo.codigo.toLowerCase().includes(articulosSearchTerm.toLowerCase()) ||
    articulo.descri.toLowerCase().includes(articulosSearchTerm.toLowerCase()))
  ) : [];

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (isOpen && activeTab === 'clientes') {
      fetchClientes();
    }
    if (isOpen && activeTab === 'articulos') {
      fetchArticulos();
    }
  }, [isOpen, activeTab]);

  // Manejar clic en fila del grid
  const handleRowClick = (index) => {
    setSelectedIndex(index);
    const cliente = filteredClientes[index];
    if (cliente) {
      setSelectedCliente(cliente);
      setCodigoCliente(cliente.codigo.toString());
      setNombreCliente(cliente.nombre);
    }
  };

  // Manejar selección de artículo
  const handleArticuloClick = (articulo) => {
    setSelectedArticulo(articulo);
  };

  // Manejar cambio de pestañas
  const handleTabClick = (tabId) => {
    if ((tabId === 'articulos' || tabId === 'existentes') && !selectedCliente) {
      // No permitir cambiar a pestañas de artículos sin cliente seleccionado
      alert('Debe seleccionar un cliente primero');
      return;
    }
    setActiveTab(tabId);
    
    // Llamar fetchArticulos directamente si estamos cambiando a artículos
    if (tabId === 'articulos') {
      fetchArticulos();
    }
    // TODO: Implementar carga de artículos existentes para la pestaña 'existentes'
  };

  // Limpiar datos al cerrar
  const handleClose = () => {
    setActiveTab('clientes');
    setSelectedIndex(-1);
    setSelectedCliente(null);
    setCodigoCliente('');
    setNombreCliente('');
    setClientes([]);
    setArticulos([]); // Limpiar artículos también
    setSelectedArticulo(null); // Limpiar artículo seleccionado
    setArticulosSearchTerm(''); // Limpiar búsqueda de artículos
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="articulos-cliente-modal-overlay" onClick={handleClose}>
      <div className="articulos-cliente-modal" onClick={(e) => e.stopPropagation()}>
        <div className="articulos-cliente-modal-header">
          <h2 className="articulos-cliente-modal-title">📦 Artículos por Cliente</h2>
          <button className="articulos-cliente-modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="articulos-cliente-modal-body">
          {/* Pestañas */}
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'clientes' ? 'active' : ''}`}
              onClick={() => handleTabClick('clientes')}
            >
              👥 Lista de Clientes
            </button>
            <button
              className={`tab-button ${activeTab === 'articulos' ? 'active' : ''} ${!selectedCliente ? 'disabled' : ''}`}
              onClick={() => handleTabClick('articulos')}
              disabled={!selectedCliente}
              title={!selectedCliente ? 'Seleccione un cliente primero' : 'Asignar artículos al cliente'}
            >
              📋 Asignación de Artículos
            </button>
            <button
              className={`tab-button ${activeTab === 'existentes' ? 'active' : ''} ${!selectedCliente ? 'disabled' : ''}`}
              onClick={() => handleTabClick('existentes')}
              disabled={!selectedCliente}
              title={!selectedCliente ? 'Seleccione un cliente primero' : 'Ver artículos existentes del cliente'}
            >
              📄 Artículos Existentes del Cliente
            </button>
          </div>

          {/* Contenido de pestañas */}
          <div className="tabs-content">
            {activeTab === 'clientes' && (
              <div className="tab-panel clientes-panel">
                <h3 style={{ marginTop: 0, color: '#007bff' }}>👥 Seleccionar Cliente</h3>
                
                {/* Campo de búsqueda */}
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="🔍 Buscar cliente por código o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {/* Grid de clientes */}
                <div className="clientes-grid-container">
                  {loading && (
                    <div className="loading-message">
                      <p>⏳ Cargando clientes...</p>
                    </div>
                  )}
                  {error && (
                    <div className="error-message">
                      <p>❌ {error}</p>
                    </div>
                  )}
                  {!loading && !error && (
                    <div className="grid-wrapper">
                      <table className="clientes-grid">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nombre del Cliente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClientes.map((cliente, index) => (
                            <tr 
                              key={`cliente-${cliente.codigo}-${index}`} 
                              className={selectedIndex === index ? 'selected' : ''}
                              onClick={() => handleRowClick(index)}
                            >
                              <td>{cliente.codigo}</td>
                              <td>{cliente.nombre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!loading && !error && filteredClientes.length === 0 && (
                    <div className="no-data-message">
                      <p>📂 {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes disponibles'}</p>
                    </div>
                  )}
                </div>

                {/* Textboxes para mostrar datos del cliente seleccionado */}
                <div className="cliente-info-section">
                  <h4 style={{ color: '#ffc107', marginBottom: '15px' }}>📋 Cliente Seleccionado</h4>
                  <div className="cliente-info-fields">
                    <div className="info-field codigo-field">
                      <label htmlFor="codigo-cliente">Código:</label>
                      <input
                        type="text"
                        id="codigo-cliente"
                        value={codigoCliente}
                        onChange={(e) => setCodigoCliente(e.target.value)}
                        className="info-input codigo-input"
                        placeholder="Seleccione..."
                        readOnly
                      />
                    </div>
                    <div className="info-field nombre-field">
                      <label htmlFor="nombre-cliente">Nombre:</label>
                      <input
                        type="text"
                        id="nombre-cliente"
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
                        className="info-input nombre-input"
                        placeholder="Seleccione un cliente..."
                        readOnly
                      />
                    </div>
                    <div className="info-field button-field">
                      {selectedCliente && (
                        <button 
                          className="btn-siguiente"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTabClick('existentes');
                          }}
                        >
                          📦 Ver Artículos Existentes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'articulos' && selectedCliente && (
              <div className="tab-panel articulos-panel">
                {/* Título con nombre del cliente */}
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#28a745', textAlign: 'center' }}>
                  📋 Artículos de: {selectedCliente.nombre}
                </h3>
                
                <div className="articulos-container">
                  {/* Panel izquierdo - Lista de Artículos */}
                  <div className="articulos-left-panel">
                    <h3 className="panel-title">📋 Lista de Artículos</h3>
                    <div className="articulos-search-container">
                      <input
                        type="text"
                        placeholder="🔍 Buscar artículos..."
                        className="search-input"
                        value={articulosSearchTerm}
                        onChange={(e) => setArticulosSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="articulos-grid-container">
                      <div className="articulos-grid-header">
                        <div className="grid-header-cell">Código</div>
                        <div className="grid-header-cell">Descripción</div>
                      </div>
                      <div className="articulos-grid-body">
                        {loading ? (
                          <div className="loading-message">
                            <p>⏳ Cargando artículos...</p>
                          </div>
                        ) : filteredArticulos.length > 0 ? (
                          filteredArticulos.map((articulo, index) => (
                            <div 
                              key={`articulo-${articulo.codigo}-${index}`} 
                              className={`articulos-grid-row ${selectedArticulo && selectedArticulo.codigo === articulo.codigo ? 'selected' : ''}`}
                              onClick={() => handleArticuloClick(articulo)}
                            >
                              <div className="grid-cell">{articulo.codigo}</div>
                              <div className="grid-cell">{articulo.descri}</div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            <p>📂 {articulosSearchTerm ? 'No se encontraron artículos que coincidan con la búsqueda' : 'No hay artículos disponibles'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho - Códigos para Asignar */}
                  <div className="articulos-right-panel">
                    <h3 className="panel-title">🏷️ Códigos para Asignar</h3>
                    <div className="assignment-fields">
                      <div className="field-group">
                        <input
                          type="text"
                          className="assignment-input main-input"
                          placeholder="Descripción del artículo..."
                          value={selectedArticulo ? selectedArticulo.descri : ''}
                          readOnly
                        />
                      </div>
                      <div className="field-group">
                        <label>Código CIIU:</label>
                        <input
                          type="text"
                          className="assignment-input"
                          placeholder="Ingrese código CIIU..."
                        />
                      </div>
                      <div className="field-group">
                        <label>Código SIMARDE:</label>
                        <input
                          type="text"
                          className="assignment-input"
                          placeholder="Ingrese código SIMARDE..."
                        />
                      </div>
                      <div className="assignment-buttons">
                        <button className="btn-asignar">
                          ✅ Asignar Artículo
                        </button>
                        <button className="btn-cancelar">
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'existentes' && selectedCliente && (
              <div className="tab-panel existentes-panel">
                {/* Título con nombre del cliente */}
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#ffc107', textAlign: 'center' }}>
                  📦 Artículos Existentes de: {selectedCliente.nombre}
                </h3>
                
                <div className="existentes-container">
                  {/* Contenido de artículos existentes */}
                  <div className="existentes-content">
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="🔍 Buscar artículos existentes..."
                        className="search-input"
                      />
                    </div>
                    
                    <div className="existentes-grid-container">
                      <div className="existentes-grid-header">
                        <div className="grid-header-cell">Código</div>
                        <div className="grid-header-cell">Descripción</div>
                        <div className="grid-header-cell">Código CIIU</div>
                        <div className="grid-header-cell">Código SIMARDE</div>
                        <div className="grid-header-cell">Acciones</div>
                      </div>
                      <div className="existentes-grid-body">
                        {/* Placeholder para artículos existentes */}
                        <div className="existentes-message">
                          <p>🔍 No se encontraron artículos asignados a este cliente.</p>
                          <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                            Use la pestaña "Asignación de Artículos" para asignar artículos al cliente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticulosXClienteModal;
