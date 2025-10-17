import React, { useState, useEffect } from 'react';
import './GestionUsuariosModal.css';
import MensajeModal from './MensajeModal';

const GestionUsuariosModal = ({ isOpen, onClose }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [permisosCatalogo, setPermisosCatalogo] = useState({});
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [permisosUsuario, setPermisosUsuario] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // true cuando editamos, false cuando creamos
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' o 'permisos'
  const [mensaje, setMensaje] = useState({ show: false, texto: '', tipo: '' });
  const [modulosExpandidos, setModulosExpandidos] = useState({}); // Estado para acordeón
  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    email: '',
    rol: 'user'  // Valor por defecto coincide con BD
  });

  // Cargar usuarios y catálogo de permisos
  useEffect(() => {
    if (isOpen) {
      cargarUsuarios();
      cargarPermisosCatalogo();
      // Resetear estado al abrir modal
      setActiveTab('usuarios');
      setUsuarioSeleccionado(null);
      setPermisosUsuario({});
    }
  }, [isOpen]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Usuarios cargados:', data);
        setUsuarios(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error del servidor:', response.status, errorData);
        setMensaje({
          show: true,
          texto: `Error al cargar usuarios: ${errorData.error || 'Error del servidor'}`,
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setMensaje({
        show: true,
        texto: 'Error de conexión con el servidor. Verifica que el servidor esté funcionando.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarPermisosCatalogo = async () => {
    try {
      const response = await fetch('/api/permisos/modulos');
      if (response.ok) {
        const data = await response.json();
        setPermisosCatalogo(data);
      }
    } catch (error) {
      console.error('Error cargando catálogo de permisos:', error);
    }
  };

  const cargarPermisosUsuario = async (usuarioId) => {
    try {
      const response = await fetch(`/api/permisos/usuario/${usuarioId}`);
      if (response.ok) {
        const data = await response.json();
        // Convertir array a objeto para fácil acceso
        const permisosObj = {};
        data.forEach(permiso => {
          const key = `${permiso.modulo}.${permiso.submodulo}.${permiso.accion}`;
          permisosObj[key] = permiso.permitido;
        });
        setPermisosUsuario(permisosObj);
      }
    } catch (error) {
      console.error('Error cargando permisos del usuario:', error);
    }
  };

  const handleSeleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    cargarPermisosUsuario(usuario.id);
  };

  const handlePermisoChange = (modulo, submodulo, accion, permitido) => {
    const key = `${modulo}.${submodulo}.${accion}`;
    
    // Si estamos desmarcando el permiso de "acceso"
    if (accion === 'acceso' && !permitido) {
      // Desmarcar automáticamente todos los permisos del mismo submódulo
      const nuevosPermisos = { ...permisosUsuario };
      Object.keys(nuevosPermisos).forEach(permisoKey => {
        if (permisoKey.startsWith(`${modulo}.${submodulo}.`) && permisoKey !== key) {
          nuevosPermisos[permisoKey] = false;
        }
      });
      nuevosPermisos[key] = false;
      setPermisosUsuario(nuevosPermisos);
    } else {
      // Cambio normal
      setPermisosUsuario(prev => ({
        ...prev,
        [key]: permitido
      }));
    }
  };

  const handleGuardarPermisos = async () => {
    if (!usuarioSeleccionado) return;

    setLoading(true);
    try {
      // Convertir objeto de permisos a array para enviar
      const permisosArray = Object.entries(permisosUsuario).map(([key, permitido]) => {
        const [modulo, submodulo, accion] = key.split('.');
        return { modulo, submodulo, accion, permitido };
      });

      const response = await fetch(`/api/permisos/usuario/${usuarioSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permisos: permisosArray })
      });

      if (response.ok) {
        setMensaje({ 
          show: true, 
          texto: '✓ Permisos guardados correctamente', 
          tipo: 'success' 
        });
      } else {
        setMensaje({ 
          show: true, 
          texto: '✕ Error al guardar permisos', 
          tipo: 'error' 
        });
      }
    } catch (error) {
      console.error('Error guardando permisos:', error);
      setMensaje({ 
        show: true, 
        texto: '✕ Error de conexión al guardar permisos', 
        tipo: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async () => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (response.ok) {
        setMensaje({ 
          show: true, 
          texto: '✓ Usuario creado correctamente', 
          tipo: 'success' 
        });
        setShowNuevoUsuario(false);
        setNuevoUsuario({ username: '', password: '', nombre_completo: '', email: '', rol: 'user' });
        cargarUsuarios();
      } else {
        const data = await response.json();
        setMensaje({ 
          show: true, 
          texto: `✕ Error: ${data.error || 'No se pudo crear el usuario'}`, 
          tipo: 'error' 
        });
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      setMensaje({ 
        show: true, 
        texto: '✕ Error de conexión al crear usuario', 
        tipo: 'error' 
      });
    }
  };

  const handleEditarUsuario = (usuario) => {
    // Cargar datos del usuario en el formulario
    setNuevoUsuario({
      id: usuario.id,
      username: usuario.username,
      password: '', // No mostramos la contraseña actual
      nombre_completo: usuario.nombre_completo,
      email: usuario.email || '',
      rol: usuario.rol
    });
    setModoEdicion(true);
    setShowNuevoUsuario(true);
  };

  const handleActualizarUsuario = async () => {
    try {
      // Preparar datos - solo enviar password si se modificó
      const datosActualizar = { ...nuevoUsuario };
      if (!datosActualizar.password) {
        delete datosActualizar.password; // No actualizar contraseña si está vacía
      }

      const response = await fetch(`/api/usuarios/${nuevoUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizar)
      });

      if (response.ok) {
        setMensaje({ 
          show: true, 
          texto: '✓ Usuario actualizado correctamente', 
          tipo: 'success' 
        });
        setShowNuevoUsuario(false);
        setModoEdicion(false);
        setNuevoUsuario({ username: '', password: '', nombre_completo: '', email: '', rol: 'user' });
        cargarUsuarios();
      } else {
        const data = await response.json();
        setMensaje({ 
          show: true, 
          texto: `✕ Error: ${data.error || 'No se pudo actualizar el usuario'}`, 
          tipo: 'error' 
        });
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      setMensaje({ 
        show: true, 
        texto: '✕ Error de conexión al actualizar usuario', 
        tipo: 'error' 
      });
    }
  };

  const handleCancelarEdicion = () => {
    setShowNuevoUsuario(false);
    setModoEdicion(false);
    setNuevoUsuario({ username: '', password: '', nombre_completo: '', email: '', rol: 'user' });
  };

  const toggleModulo = (modulo) => {
    setModulosExpandidos(prev => ({
      ...prev,
      [modulo]: !prev[modulo]
    }));
  };

  const expandirTodos = () => {
    const todos = {};
    Object.keys(permisosCatalogo).forEach(modulo => {
      todos[modulo] = true;
    });
    setModulosExpandidos(todos);
  };

  const contraerTodos = () => {
    setModulosExpandidos({});
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content gestion-usuarios-modal">
        <div className="modal-header">
          <h2>👥 Gestión de Usuarios y Permisos</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Pestañas */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              👥 Usuarios de Sistema
            </button>
            <button
              className={`tab-button ${activeTab === 'permisos' ? 'active' : ''}`}
              onClick={() => setActiveTab('permisos')}
              disabled={!usuarioSeleccionado}
              title={!usuarioSeleccionado ? 'Seleccione un usuario para gestionar permisos' : `Permisos de ${usuarioSeleccionado?.nombre_completo}`}
            >
              🔐 Permisos de Usuario
              {usuarioSeleccionado && (
                <span className="tab-usuario-nombre"> - {usuarioSeleccionado.nombre_completo}</span>
              )}
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div className="tab-content">
            {activeTab === 'usuarios' && (
              <div className="usuarios-section">
                <div className="section-header">
                  <h3>👥 Usuarios del Sistema</h3>
                  <button
                    className="btn-primary"
                    onClick={() => setShowNuevoUsuario(true)}
                  >
                    ➕ Nuevo Usuario
                  </button>
                </div>

                <div className="usuarios-tabla-container">
                  <table className="usuarios-tabla">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="no-data">
                            No hay usuarios registrados
                          </td>
                        </tr>
                      ) : (
                        usuarios.map(usuario => (
                          <tr
                            key={usuario.id}
                            className={usuarioSeleccionado?.id === usuario.id ? 'selected' : ''}
                          >
                            <td>
                              <strong>{usuario.username}</strong>
                            </td>
                            <td>{usuario.nombre_completo}</td>
                            <td>{usuario.email || 'Sin email'}</td>
                            <td>
                              <span className={`rol-badge rol-${usuario.rol}`}>
                                {usuario.rol}
                              </span>
                            </td>
                            <td>
                              <span className={`usuario-status ${usuario.activo ? 'active' : 'inactive'}`}>
                                {usuario.activo ? '✓ Activo' : '✕ Inactivo'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-icon btn-permisos"
                                  onClick={() => {
                                    handleSeleccionarUsuario(usuario);
                                    setActiveTab('permisos');
                                  }}
                                  title="Gestionar Permisos"
                                >
                                  🔐
                                </button>
                                <button
                                  className="btn-icon btn-edit"
                                  onClick={() => handleEditarUsuario(usuario)}
                                  title="Editar Usuario"
                                >
                                  ✏️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'permisos' && !usuarioSeleccionado && (
              <div className="permisos-section">
                <div className="permisos-empty">
                  <div className="permisos-empty-icon">🔐</div>
                  <div className="permisos-empty-text">No hay usuario seleccionado</div>
                  <div className="permisos-empty-hint">
                    Seleccione un usuario de la lista y haga clic en el botón 🔐 para gestionar sus permisos
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => setActiveTab('usuarios')}
                    style={{ marginTop: '20px' }}
                  >
                    ← Volver a Usuarios
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'permisos' && usuarioSeleccionado && (
              <div className="permisos-section">
                <div className="permisos-header">
                  <div className="permisos-header-info">
                    <h3>🔐 Configuración de Permisos</h3>
                    <p className="permisos-subtitle">
                      Usuario: <strong>{usuarioSeleccionado.nombre_completo}</strong>
                      <span className={`rol-badge rol-${usuarioSeleccionado.rol}`}>
                        {usuarioSeleccionado.rol}
                      </span>
                    </p>
                  </div>
                  {usuarioSeleccionado.rol !== 'admin' && (
                    <div className="permisos-actions">
                      <button className="btn-acordeon" onClick={expandirTodos} title="Expandir todos">
                        ⬇️ Expandir Todo
                      </button>
                      <button className="btn-acordeon" onClick={contraerTodos} title="Contraer todos">
                        ⬆️ Contraer Todo
                      </button>
                      <button
                        className="btn-guardar-permisos"
                        onClick={handleGuardarPermisos}
                        disabled={loading}
                      >
                        💾 Guardar Permisos
                      </button>
                    </div>
                  )}
                </div>

                <div className="permisos-content">
                  {usuarioSeleccionado.rol === 'admin' ? (
                    <div className="admin-access-message">
                      <div className="admin-icon">👑</div>
                      <h4>Administrador del Sistema</h4>
                      <p>Este usuario tiene acceso completo y automático a todas las funciones del sistema.</p>
                      <p className="admin-note">Los administradores no requieren configuración de permisos individual.</p>
                    </div>
                  ) : Object.keys(permisosCatalogo).length === 0 ? (
                    <div className="no-permisos">
                      <p>⚠️ No hay permisos disponibles en el sistema</p>
                    </div>
                  ) : (
                    Object.entries(permisosCatalogo).map(([modulo, submodulos]) => {
                      const isExpanded = modulosExpandidos[modulo] || false;
                      const totalPermisos = Object.values(submodulos).reduce((acc, acciones) => acc + acciones.length, 0);
                      
                      return (
                        <div key={modulo} className={`modulo-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          <div className="modulo-header" onClick={() => toggleModulo(modulo)}>
                            <span className="modulo-toggle">{isExpanded ? '▼' : '▶'}</span>
                            <span className="modulo-icon">📦</span>
                            <h4 className="modulo-name">{modulo}</h4>
                            <span className="modulo-count">{totalPermisos} permisos</span>
                          </div>
                          
                          {isExpanded && (
                            <div className="modulo-body">
                              {Object.entries(submodulos).map(([submodulo, acciones]) => {
                                // Verificar si existe permiso de "acceso" en este submódulo
                                const tieneAcceso = acciones.some(a => a.accion === 'acceso');
                                const accesoKey = `${modulo}.${submodulo}.acceso`;
                                const accesoMarcado = permisosUsuario[accesoKey] || false;
                                
                                return (
                                  <div key={`${modulo}-${submodulo}`} className="submodulo-row">
                                    <div className="submodulo-info">
                                      <div className="submodulo-name">{submodulo}</div>
                                    </div>
                                    <div className="acciones-container">
                                      {acciones.map(accion => {
                                        const key = `${modulo}.${submodulo}.${accion.accion}`;
                                        const permitido = permisosUsuario[key] || false;
                                        const esAcceso = accion.accion === 'acceso';
                                        const estaDeshabilitado = tieneAcceso && !esAcceso && !accesoMarcado;
                                        
                                        return (
                                          <label 
                                            key={accion.accion} 
                                            className={`permiso-checkbox ${permitido ? 'checked' : ''} ${estaDeshabilitado ? 'disabled' : ''}`}
                                            title={estaDeshabilitado ? 'Debe activar el permiso de Acceso primero' : accion.descripcion}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={permitido}
                                              disabled={estaDeshabilitado}
                                              onChange={(e) => handlePermisoChange(modulo, submodulo, accion.accion, e.target.checked)}
                                            />
                                            <span className="checkbox-custom"></span>
                                            <span className="permiso-accion">{accion.accion}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {showNuevoUsuario && (
            <div className="modal-overlay">
              <div className="modal-content nuevo-usuario-modal">
                <div className="modal-header">
                  <h3>
                    {modoEdicion ? '✏️ Editar Usuario' : '👤 Crear Nuevo Usuario'}
                  </h3>
                  <button className="modal-close" onClick={handleCancelarEdicion}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Username: *</label>
                    <input
                      type="text"
                      value={nuevoUsuario.username}
                      onChange={(e) => setNuevoUsuario(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Ingrese nombre de usuario"
                      disabled={modoEdicion}
                      required
                    />
                    {modoEdicion && (
                      <small className="form-help">
                        ℹ️ El username no puede modificarse
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>
                      Contraseña: {modoEdicion ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={nuevoUsuario.password}
                      onChange={(e) => setNuevoUsuario(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={modoEdicion ? 'Dejar vacío para mantener contraseña actual' : 'Ingrese contraseña'}
                      required={!modoEdicion}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre Completo: *</label>
                    <input
                      type="text"
                      value={nuevoUsuario.nombre_completo}
                      onChange={(e) => setNuevoUsuario(prev => ({ ...prev, nombre_completo: e.target.value }))}
                      placeholder="Ingrese nombre completo"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rol: *</label>
                    <select
                      value={nuevoUsuario.rol}
                      onChange={(e) => setNuevoUsuario(prev => ({ ...prev, rol: e.target.value }))}
                    >
                      <option value="user">Usuario</option>
                      <option value="manager">Supervisor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={handleCancelarEdicion}>
                      Cancelar
                    </button>
                    {modoEdicion ? (
                      <button className="btn-primary" onClick={handleActualizarUsuario}>
                        ✓ Actualizar Usuario
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleCrearUsuario}>
                        ✓ Crear Usuario
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MensajeModal para éxito/error */}
        <MensajeModal
          isOpen={mensaje.show}
          onClose={() => setMensaje({ show: false, texto: '', tipo: '' })}
          title={mensaje.tipo === 'success' ? '✓ Éxito' : '✕ Error'}
          size="small"
          className={mensaje.tipo === 'success' ? 'mensaje-success' : 'mensaje-error'}
        >
          <p style={{ textAlign: 'center', fontSize: '16px', margin: '20px 0' }}>
            {mensaje.texto}
          </p>
        </MensajeModal>
      </div>
    </div>
  );
};

export default GestionUsuariosModal;
