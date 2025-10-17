import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './ListaClientesModal.css';
import NuevoClienteModal from './NuevoClienteModal';
import FloatingMessage from './common/FloatingMessage';
import ClientesXBoletaModal from './ClientesXBoletaModal';
import EnviarEmailModal from './EnviarEmailModal';
import MensajeModal from './MensajeModal';
import { useAuth } from '../contexts/AuthContext';

const ListaClientesModal = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [editClienteData, setEditClienteData] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' o 'desc'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState({
    isVisible: false,
    message: '',
    type: 'error'
  });
  const [showClientesXBoletaModal, setShowClientesXBoletaModal] = useState(false);
  const [showEnviarEmailModal, setShowEnviarEmailModal] = useState(false);
  const [emailClienteSeleccionado, setEmailClienteSeleccionado] = useState(null);
  const [emailSeleccionado, setEmailSeleccionado] = useState('');
  const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, accion: '' });

  // Función helper para mostrar mensaje de permisos denegados
  const mostrarMensajePermisoDenegado = (accion) => {
    setPermisoDenegadoMensaje({ show: true, accion });
  };

  const cerrarMensajePermisoDenegado = () => {
    setPermisoDenegadoMensaje({ show: false, accion: '' });
  };

  // Función para alternar el orden
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    fetchClientes(searchTerm.trim() || '', newOrder);
  };

  // Filtrar clientes según el término de búsqueda
  const filteredClientes = clientes;

  // Cargar clientes desde el backend
  const fetchClientes = async (search = '', order = 'asc') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('order', order);
      
      const queryString = params.toString();
      const url = `/api/clientes${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setClientes(data.clientes || []);
      setSelectedIndex(-1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda con debounce
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        fetchClientes(searchTerm.trim(), sortOrder).finally(() => setIsSearching(false));
      } else {
        fetchClientes('', sortOrder);
      }
    }, 500); // 500ms de delay para evitar demasiadas consultas

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, sortOrder]);

  // Al hacer clic en una fila
  const handleRowClick = (index) => {
    setSelectedIndex(index);
  };

  // Al hacer clic en Nuevo
  const handleNuevoCliente = () => {
    console.log('🔍 Verificando permiso para nuevo cliente:', hasPermission('Clientes', 'Clientes', 'nuevo'));
    if (!hasPermission('Clientes', 'Clientes', 'nuevo')) {
      mostrarMensajePermisoDenegado('Nuevo Cliente');
      return;
    }
    console.log('➕ Nuevo cliente solicitado');
    setEditClienteData(null); // Resetear datos de edición
    setShowNuevoClienteModal(true);
  };

  // Función para manejar el cierre del modal de cliente
  const handleClienteModalClose = (shouldRefresh = false) => {
    setShowNuevoClienteModal(false);
    setEditClienteData(null);
    if (shouldRefresh) {
      // Refrescar la lista de clientes
      fetchClientes(searchTerm, sortOrder);
    }
  };

  const handleEditarCliente = () => {
    console.log('🔍 Verificando permiso para editar cliente:', hasPermission('Clientes', 'Clientes', 'editar'));
    if (!hasPermission('Clientes', 'Clientes', 'editar')) {
      mostrarMensajePermisoDenegado('Editar Cliente');
      return;
    }
    if (selectedIndex >= 0 && filteredClientes[selectedIndex]) {
      const clienteSeleccionado = filteredClientes[selectedIndex];
      console.log('✏️ Editando cliente:', clienteSeleccionado);
      setEditClienteData(clienteSeleccionado);
      setShowNuevoClienteModal(true);
    } else {
      alert('Selecciona un cliente para editar');
    }
  };

  const handleEliminarCliente = () => {
    console.log('🔍 Verificando permiso para eliminar cliente:', hasPermission('Clientes', 'Clientes', 'eliminar'));
    if (!hasPermission('Clientes', 'Clientes', 'eliminar')) {
      mostrarMensajePermisoDenegado('Eliminar Cliente');
      return;
    }
    if (selectedIndex >= 0 && filteredClientes[selectedIndex]) {
      const clienteSeleccionado = filteredClientes[selectedIndex];
      console.log('🗑️ Eliminando cliente:', clienteSeleccionado);
      setShowDeleteModal(true);
    } else {
      alert('Selecciona un cliente para eliminar');
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedIndex >= 0 && filteredClientes[selectedIndex]) {
      const clienteSeleccionado = filteredClientes[selectedIndex];
      console.log('🗑️ Confirmando eliminación de cliente:', clienteSeleccionado);

      try {
        const response = await fetch(`/api/clientes/${clienteSeleccionado.codigo}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Éxito: refrescar la lista y mostrar mensaje
          fetchClientes(searchTerm, sortOrder);
          setSelectedIndex(-1);
          setShowDeleteModal(false);
          setFloatingMessage({
            isVisible: true,
            message: data.message,
            type: 'success'
          });
          console.log('✅ Cliente eliminado exitosamente:', data.clienteEliminado);
        } else {
          // Error: mostrar mensaje de error
          setShowDeleteModal(false);
          setFloatingMessage({
            isVisible: true,
            message: data.error,
            type: 'error'
          });
          console.error('❌ Error al eliminar cliente:', data.error);
        }
      } catch (error) {
        console.error('❌ Error de conexión al eliminar cliente:', error);
        setShowDeleteModal(false);
        setFloatingMessage({
          isVisible: true,
          message: 'Error de conexión al eliminar el cliente: ' + error.message,
          type: 'error'
        });
      }
    }
  };

  const handleBoletasRelacionadas = () => {
    console.log('🔍 Verificando permiso para ver boletas relacionadas:', hasPermission('Clientes', 'Clientes', 'boletas_relacionadas'));
    if (!hasPermission('Clientes', 'Clientes', 'boletas_relacionadas')) {
      mostrarMensajePermisoDenegado('Ver Boletas Relacionadas');
      return;
    }
    if (selectedIndex >= 0 && filteredClientes[selectedIndex]) {
      const clienteSeleccionado = filteredClientes[selectedIndex];
      console.log('?? Mostrando boletas relacionadas del cliente:', clienteSeleccionado);
      setShowClientesXBoletaModal(true);
    } else {
      alert('Selecciona un cliente para ver sus boletas relacionadas');
    }
  };

  const handleFloatingMessageClose = () => {
    setFloatingMessage({
      isVisible: false,
      message: '',
      type: 'error'
    });
  };

  const handleClientesXBoletaModalClose = () => {
    setShowClientesXBoletaModal(false);
  };

  // Funciones para manejo de emails
  const handleEmailDropdownClick = (e, cliente) => {
    e.stopPropagation(); // Evitar que se seleccione la fila
    
    // Si solo tiene un email, abrir directamente el modal
    if (cliente.email && !cliente.email2) {
      handleEmailOptionClick(e, cliente, cliente.email);
    } else if (!cliente.email && cliente.email2) {
      handleEmailOptionClick(e, cliente, cliente.email2);
    }
    // Si tiene ambos emails, el dropdown CSS se encarga de mostrar las opciones
  };

  const handleEmailOptionClick = (e, cliente, email) => {
    e.stopPropagation(); // Evitar que se seleccione la fila
    
    setEmailClienteSeleccionado(cliente);
    setEmailSeleccionado(email);
    setShowEnviarEmailModal(true);
    
    console.log('?? Abriendo modal de email para:', cliente.nombre, 'Email:', email);
  };

  const handleEnviarEmailModalClose = () => {
    setShowEnviarEmailModal(false);
    setEmailClienteSeleccionado(null);
    setEmailSeleccionado('');
  };

  const handleExportClick = () => {
    console.log('🔍 Verificando permiso para exportar clientes:', hasPermission('Clientes', 'Clientes', 'exportar'));
    if (!hasPermission('Clientes', 'Clientes', 'exportar')) {
      mostrarMensajePermisoDenegado('Exportar Clientes');
      return;
    }
    setShowExportModal(true);
  };

  const handleExportToExcel = () => {
    const exportData = filteredClientes.map(cliente => ({
      'Código': cliente.codigo,
      'Nombre': cliente.nombre,
      'Dirección': cliente.dire,
      'Teléfonos': cliente.telefonos,
      'Email': cliente.email,
      'Contacto 1': cliente.contacto1,
      'Comentarios': cliente.comenta,
      'Contacto 2': cliente.contacto2,
      'Contacto 3': cliente.contacto3,
      'Email 2': cliente.email2,
      'Teléfono 2': cliente.telefono2
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    const now = new Date();
    const ts = now.toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
    XLSX.writeFile(workbook, `clientes_${ts}.xlsx`);
    setShowExportModal(false);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  const handleActualizarClick = () => {
    fetchClientes(searchTerm, sortOrder);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Contenido principal del modal de lista */}
      <div id="lista-clientes-modal-root" className="lista-clientes-modal-overlay">
        <div className="lista-clientes-modal">
          <div className="lista-clientes-modal-header">
            <h2 className="lista-clientes-modal-title">Lista de Clientes</h2>
            <div className="header-controls">
              <button className="lista-clientes-modal-close" onClick={onClose}>✕</button>
            </div>
          </div>
          <div className="lista-clientes-modal-body">
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar por código, nombre, teléfono, email o contacto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button 
                className={`sort-button ${sortOrder}`} 
                onClick={toggleSortOrder}
                title={`Ordenar por código ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
              >
                <span className="sort-icon">↕️</span>
                Ordenar
              </button>
              {isSearching && (
                <div className="search-loading">Buscando...</div>
              )}
            </div>
            
            <div className="content-wrapper">
              <div className="clientes-table-container">
                {loading && <p>Cargando datos....</p>}
                {error && <p className="error">Error: {error}</p>}
                {!loading && !error && (
                  <>
                    <table className="clientes-table clientes-table-expanded">
                      <thead className="clientes-table-header">
                        <tr className="header-row">
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Teléfonos</th>
                          <th>Email</th>
                          <th>Contacto 1</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClientes.map((cliente, i) => (
                          <tr key={cliente.codigo} data-index={i} className={selectedIndex===i?'selected':''} onClick={()=>handleRowClick(i)}>
                            <td>{cliente.codigo}</td>
                            <td className="cell-expanded">{cliente.nombre}</td>
                            <td>{cliente.telefonos}</td>
                            <td className="cell-expanded">{cliente.email}</td>
                            <td className="cell-expanded">{cliente.contacto1}</td>
                            <td className="actions-cell">
                              {(cliente.email || cliente.email2) && (
                                <div className="email-dropdown-container">
                                  <button 
                                    className="btn-email-dropdown"
                                    onClick={(e) => handleEmailDropdownClick(e, cliente)}
                                    title="Enviar email"
                                  >
                                    ✉️
                                  </button>
                                  <div className="email-dropdown-menu">
                                    {cliente.email && (
                                      <button
                                        className="email-option"
                                        onClick={(e) => handleEmailOptionClick(e, cliente, cliente.email)}
                                      >
                                        ?? {cliente.email}
                                      </button>
                                    )}
                                    {cliente.email2 && (
                                      <button
                                        className="email-option"
                                        onClick={(e) => handleEmailOptionClick(e, cliente, cliente.email2)}
                                      >
                                        ?? {cliente.email2}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredClientes.length === 0 && searchTerm && (
                      <p>No se encontraron clientes que coincidan con la búsqueda.</p>
                    )}
                  </>
                )}
              </div>
              <div className="action-buttons">
                <button className="action-btn nuevo" onClick={handleNuevoCliente}>➕ Nuevo</button>
                <button className="action-btn editar" onClick={handleEditarCliente} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona un cliente':'Editar cliente'}>✏️ Editar</button>
                <button className="action-btn exportar" onClick={handleExportClick}>📊 Exportar</button>
                <button className="action-btn eliminar" onClick={handleEliminarCliente} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona un cliente':'Eliminar cliente'}>🗑️ Eliminar</button>
                <button className="action-btn boletas-relacionadas" onClick={handleBoletasRelacionadas} disabled={selectedIndex<0} title={selectedIndex<0?'Selecciona un cliente':'Ver boletas relacionadas'}>📋 Boletas Relacionadas</button>
                <button className="action-btn actualizar" onClick={handleActualizarClick}>🔄 Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de nuevo cliente */}
      <NuevoClienteModal
        isOpen={showNuevoClienteModal}
        onClose={handleClienteModalClose}
        editData={editClienteData}
      />

      {/* Modal de Exportación usando MensajeModal */}
      <MensajeModal
        isOpen={showExportModal}
        onClose={handleCloseExportModal}
        title="Exportar Clientes a Excel"
        size="medium"
        buttons={[
          {
            label: "Exportar Excel",
            icon: "📊",
            onClick: handleExportToExcel,
            disabled: loading
          },
          {
            label: "Cancelar",
            icon: "❌",
            onClick: handleCloseExportModal,
            className: "btn-secondary",
            disabled: loading
          }
        ]}
      >
        <p>
          Se exportarán <strong>{filteredClientes.length}</strong> cliente(s) a un archivo Excel con todos los campos disponibles.
        </p>
        <p>
          • Código • Nombre • Dirección • Teléfonos • Email • Contactos • Comentarios
        </p>
        <p>
          ¿Deseas continuar con la exportación?
        </p>
      </MensajeModal>

      {/* Modal de confirmación de eliminación usando MensajeModal */}
      <MensajeModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
        size="medium"
        buttons={[
          {
            label: "Eliminar",
            icon: "🗑️",
            onClick: handleConfirmDelete,
            className: "btn-danger"
          },
          {
            label: "Cancelar",
            icon: "❌",
            onClick: () => setShowDeleteModal(false),
            className: "btn-secondary"
          }
        ]}
      >
        <p>
          ¿Está seguro de que desea eliminar el cliente:
        </p>
        <p>
          <strong>"{filteredClientes[selectedIndex]?.codigo} - {filteredClientes[selectedIndex]?.nombre}"</strong>
        </p>
        <p style={{ color: '#dc2626', fontWeight: '500' }}>
          ⚠️ Esta acción no se puede deshacer.
        </p>
      </MensajeModal>

      {/* Modal de mensaje de permisos denegados */}
      <MensajeModal
        isOpen={permisoDenegadoMensaje.show}
        title="Permiso Denegado"
        onClose={cerrarMensajePermisoDenegado}
        buttons={[
          {
            label: 'Aceptar',
            onClick: cerrarMensajePermisoDenegado,
            className: 'btn-primary'
          }
        ]}
      >
        <p>No dispone de permisos para realizar la acci�n: <strong>{permisoDenegadoMensaje.accion}</strong></p>
      </MensajeModal>

      {/* Mensaje flotante para feedback */}
      <FloatingMessage
        message={floatingMessage.message}
        type={floatingMessage.type}
        isVisible={floatingMessage.isVisible}
        onClose={handleFloatingMessageClose}
      />

      {/* Modal de boletas relacionadas */}
      <ClientesXBoletaModal
        isOpen={showClientesXBoletaModal}
        onClose={handleClientesXBoletaModalClose}
        clienteSeleccionado={selectedIndex >= 0 ? filteredClientes[selectedIndex] : null}
      />

      {/* Modal de envío de email */}
      <EnviarEmailModal
        isOpen={showEnviarEmailModal}
        onClose={handleEnviarEmailModalClose}
        clientePreseleccionado={emailClienteSeleccionado}
        emailPreseleccionado={emailSeleccionado}
      />
    </>
  );
};

export default ListaClientesModal;
