import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatModal.css';
import { API_BASE_URL } from '../config/api.js';
import NotificationToast from './NotificationToast.jsx';

const ChatModal = ({ onClose, currentUser, mensajesNoLeidos: mensajesNoLeidosProp, onMensajesNoLeidosChange }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const messagesAreaRef = useRef(null);

  // Obtener usuario actual de las props
  console.log('ChatModal - Usuario recibido como prop:', currentUser);
  const currentUserId = currentUser?.id?.toString() || '1';
  console.log('ChatModal - CurrentUserId:', currentUserId);

  // Estado para usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para conversación
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  // Estado para mensajes no leídos (usar prop externa si está disponible)
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(mensajesNoLeidosProp || {});

  // Sincronizar con prop externa
  useEffect(() => {
    if (mensajesNoLeidosProp) {
      setMensajesNoLeidos(mensajesNoLeidosProp);
    }
  }, [mensajesNoLeidosProp]);

  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // Refs para evitar dependencias circulares
  const usuariosRef = useRef([]);
  const usuarioSeleccionadoRef = useRef(null);

  // Actualizar refs cuando cambian los estados
  useEffect(() => {
    usuariosRef.current = usuarios;
  }, [usuarios]);

  useEffect(() => {
    usuarioSeleccionadoRef.current = usuarioSeleccionado;
  }, [usuarioSeleccionado]);

  // Función para cerrar notificación
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Refs para valores actuales
  const currentUserIdRef = useRef(currentUserId);

  // Actualizar ref cuando cambia currentUserId
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Función para cargar usuarios (sin dependencias problemáticas)
  const cargarUsuarios = useCallback(async () => {
    const userId = currentUserIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/chat/usuarios`, {
        headers: {
          'x-usuario-id': userId?.toString() || '1'
        }
      });
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar recreación

  // Función para cargar mensajes
  const cargarMensajes = useCallback(async (usuarioId, silent = false) => {
    try {
      if (!silent) console.log('🔄 cargarMensajes - Cargando mensajes para usuario:', usuarioId);

      const response = await fetch(`${API_BASE_URL}/chat/mensajes/${usuarioId}`, {
        headers: {
          'x-usuario-id': currentUserId
        }
      });
      const data = await response.json();

      if (data.success) {
        if (!silent) console.log('✅ cargarMensajes - Mensajes cargados:', data.mensajes.length);
        setMensajes(data.mensajes);
      } else {
        if (!silent) console.error('❌ cargarMensajes - Error del servidor:', data.error);
      }
    } catch (error) {
      if (!silent) console.error('❌ cargarMensajes - Error de red:', error);
    }
  }, [currentUserId]);

  // Función para seleccionar usuario
  const seleccionarUsuario = useCallback(async (usuario) => {
    console.log('Seleccionando usuario:', usuario);
    setUsuarioSeleccionado(usuario);
    setMensajes([]); // Limpiar mensajes anteriores

    // Cargar mensajes (esto también los marca como leídos en el backend)
    await cargarMensajes(usuario.id);

    // Después de cargar los mensajes, recargar el conteo de mensajes no leídos
    // para reflejar que los mensajes de este usuario ya se leyeron
    if (onMensajesNoLeidosChange) {
      console.log('🔄 ChatModal: Recargando mensajes no leídos después de abrir conversación');
      try {
        const response = await fetch(`${API_BASE_URL}/chat/mensajes/no-leidos`, {
          headers: {
            'x-usuario-id': currentUserId
          }
        });
        const data = await response.json();

        if (data.success) {
          const nuevosNoLeidos = data.no_leidos || {};
          console.log('✅ ChatModal: Mensajes no leídos actualizados:', nuevosNoLeidos);
          onMensajesNoLeidosChange(nuevosNoLeidos);
        }
      } catch (error) {
        console.error('❌ ChatModal: Error recargando mensajes no leídos:', error);
      }
    }
  }, [cargarMensajes, onMensajesNoLeidosChange, currentUserId]);

  // Función para enviar mensaje
  const enviarMensaje = useCallback(async () => {
    console.log('🔍 enviarMensaje - Iniciando envío');
    console.log('🔍 enviarMensaje - nuevoMensaje:', nuevoMensaje);
    console.log('🔍 enviarMensaje - nuevoMensaje.trim():', nuevoMensaje.trim());
    console.log('🔍 enviarMensaje - usuarioSeleccionado:', usuarioSeleccionado);
    console.log('🔍 enviarMensaje - enviandoMensaje:', enviandoMensaje);
    console.log('🔍 enviarMensaje - currentUserId:', currentUserId);

    if (!nuevoMensaje.trim()) {
      console.log('❌ enviarMensaje - Mensaje vacío, no se envía');
      return;
    }

    if (!usuarioSeleccionado) {
      console.log('❌ enviarMensaje - No hay usuario seleccionado, no se envía');
      return;
    }

    if (enviandoMensaje) {
      console.log('❌ enviarMensaje - Ya está enviando, no se envía');
      return;
    }

    try {
      setEnviandoMensaje(true);
      console.log('✅ enviarMensaje - Pasó validaciones, enviando...');

      const mensajeData = {
        remitente_id: parseInt(currentUserId),
        destinatario_id: usuarioSeleccionado.id,
        mensaje: nuevoMensaje.trim()
      };

      console.log('📤 enviarMensaje - Datos del mensaje:', mensajeData);

      const response = await fetch(`${API_BASE_URL}/chat/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-usuario-id': currentUserId
        },
        body: JSON.stringify(mensajeData)
      });

      console.log('📡 enviarMensaje - Respuesta del servidor:', response.status);
      const data = await response.json();
      console.log('📡 enviarMensaje - Datos de respuesta:', data);

      if (data.success) {
        console.log('✅ enviarMensaje - Mensaje enviado exitosamente');
        // Agregar el mensaje enviado a la lista
        setMensajes(prev => [...prev, data.mensaje]);
        setNuevoMensaje('');
      } else {
        console.error('❌ enviarMensaje - Error del servidor:', data.error);
      }

    } catch (error) {
      console.error('❌ enviarMensaje - Error de red:', error);
    } finally {
      setEnviandoMensaje(false);
    }
  }, [nuevoMensaje, usuarioSeleccionado, enviandoMensaje, currentUserId]);

  // Función para manejar Enter en el input
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }, [enviarMensaje]);

  // Cargar usuarios al montar el componente (una sola vez)
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]); // Ahora es seguro incluirlo

  // Scroll automático al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesAreaRef.current && mensajes.length > 0) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Función para marcar mensajes como leídos
  const marcarMensajesComoLeidos = useCallback(async () => {
    if (!usuarioSeleccionado) return;

    try {
      await fetch(`${API_BASE_URL}/chat/mensajes/leer/${usuarioSeleccionado.id}`, {
        method: 'POST',
        headers: {
          'x-usuario-id': currentUserId
        }
      });
      // Actualizar el conteo de mensajes no leídos usando el callback externo
      if (onMensajesNoLeidosChange) {
        // Recargar mensajes no leídos después de un pequeño delay
        setTimeout(async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/chat/mensajes/no-leidos`, {
              headers: {
                'x-usuario-id': currentUserId
              }
            });
            const data = await response.json();
            if (data.success) {
              // Asegurar que siempre se pase un objeto válido
              const nuevosNoLeidos = data.no_leidos || {};
              onMensajesNoLeidosChange(nuevosNoLeidos);
            }
          } catch (error) {
            console.error('Error recargando mensajes no leídos:', error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  }, [usuarioSeleccionado, currentUserId, onMensajesNoLeidosChange]);

  // Marcar mensajes como leídos cuando se cargan
  useEffect(() => {
    if (mensajes.length > 0) {
      marcarMensajesComoLeidos();
    }
  }, [mensajes, marcarMensajesComoLeidos]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-modal-close')) return; // No arrastrar si se hace clic en cerrar
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="chat-modal-overlay"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="chat-modal-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div
          className="chat-modal-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <h2>Chat Interno</h2>
          <button className="chat-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="chat-modal-body">
          {/* Lista de usuarios - lado izquierdo */}
          <div className="chat-users-section">
            <div className="chat-users-header">
              <h3>Usuarios Conectados</h3>
              <span className="users-count">
                {usuarios.filter(u => u.estado === 'online').length} online
              </span>
            </div>
            <div className="chat-users-list">
              {loading ? (
                <div className="loading-placeholder">
                  <p>Cargando usuarios...</p>
                </div>
              ) : error ? (
                <div className="error-placeholder">
                  <p>Error: {error}</p>
                  <button onClick={cargarUsuarios} className="retry-btn">
                    Reintentar
                  </button>
                </div>
              ) : (
                usuarios.map(usuario => {
                  const noLeidos = mensajesNoLeidos[usuario.id] || 0;
                  return (
                    <div
                      key={usuario.id}
                      className={`chat-user-item ${usuario.estado} ${usuarioSeleccionado?.id === usuario.id ? 'selected' : ''}`}
                      onClick={() => seleccionarUsuario(usuario)}
                    >
                      <div className="user-avatar">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{usuario.nombre}</span>
                        <span className="user-status">{usuario.estado}</span>
                      </div>
                      <div className={`user-status-indicator ${usuario.estado}`}></div>
                      {noLeidos > 0 && (
                        <div className="unread-messages-indicator">
                          <span className="unread-count">{noLeidos > 99 ? '99+' : noLeidos}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Área de conversación - lado derecho */}
          <div className="chat-conversation-section">
            {usuarioSeleccionado ? (
              <>
                {/* Header de conversación */}
                <div className="chat-conversation-header">
                  <div className="conversation-user-info">
                    <div className="user-avatar-small">
                      {usuarioSeleccionado.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{usuarioSeleccionado.nombre}</span>
                      <span className="user-status">{usuarioSeleccionado.estado}</span>
                    </div>
                  </div>
                  <button
                    className="close-conversation-btn"
                    onClick={() => setUsuarioSeleccionado(null)}
                    title="Cerrar conversación"
                  >
                    ×
                  </button>
                </div>

                {/* Área de mensajes */}
                <div className="chat-messages-area" ref={messagesAreaRef}>
                  {mensajes.length === 0 ? (
                    <div className="no-messages-placeholder">
                      <p>No hay mensajes aún.</p>
                      <p>¡Envía el primer mensaje!</p>
                    </div>
                  ) : (
                    mensajes.map(mensaje => (
                      <div
                        key={mensaje.id}
                        className={`chat-message ${mensaje.remitente_id === parseInt(currentUserId) ? 'own' : 'other'}`}
                      >
                        <div className="message-content">
                          <p>{mensaje.mensaje}</p>
                          <span className="message-time">
                            {(() => {
                              // La fecha ya viene en formato ISO UTC del servidor
                              const fecha = new Date(mensaje.fecha);

                              return isNaN(fecha.getTime())
                                ? 'Fecha inválida'
                                : fecha.toLocaleString('es-ES', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  });
                            })()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input para enviar mensajes */}
                <div className="chat-input-area">
                  <div className="chat-input-container">
                    <textarea
                      className="chat-input"
                      placeholder="Escribe un mensaje..."
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength={500}
                      rows={1}
                      disabled={enviandoMensaje}
                    />
                    <button
                      className="send-message-btn"
                      onClick={enviarMensaje}
                      disabled={!nuevoMensaje.trim() || enviandoMensaje}
                      title="Enviar mensaje"
                    >
                      {enviandoMensaje ? '...' : '📤'}
                    </button>
                  </div>
                  <div className="message-info">
                    <span className="char-count">{nuevoMensaje.length}/500</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="chat-messages-placeholder">
                <p>Selecciona un usuario para iniciar una conversación</p>
                <p>El sistema de chat estará disponible próximamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificación de mensajes nuevos */}
      {notification && (
        <NotificationToast
          message={notification.message}
          userName={notification.userName}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default ChatModal;