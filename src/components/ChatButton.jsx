import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import ChatModal from './ChatModal';
import './ChatButton.css';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api.js';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState({});

  const { user } = useAuth();

  // Refs para evitar dependencias problemáticas
  const pollingIntervalRef = useRef(null);

  // Función para cargar mensajes no leídos
  const cargarMensajesNoLeidos = useCallback(async () => {
    if (!user?.id) {
      console.log('🚫 cargarMensajesNoLeidos: No hay usuario, saliendo');
      return;
    }

    console.log('🔄 cargarMensajesNoLeidos: Iniciando carga para usuario', user.id);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/mensajes/no-leidos`, {
        headers: {
          'x-usuario-id': user.id.toString()
        }
      });
      const data = await response.json();

      console.log('📡 cargarMensajesNoLeidos: Respuesta del servidor:', data);

      if (data.success) {
        const nuevosNoLeidos = data.no_leidos || {};
        const totalActual = Object.values(nuevosNoLeidos).reduce((sum, count) => sum + count, 0);

        console.log(`📊 cargarMensajesNoLeidos: Total mensajes no leídos: ${totalActual}`);

        // Actualizar estado
        setMensajesNoLeidos(nuevosNoLeidos);

        console.log('✅ cargarMensajesNoLeidos: Estado actualizado');
      } else {
        console.log('❌ cargarMensajesNoLeidos: Respuesta no exitosa:', data);
      }
    } catch (error) {
      console.error('❌ cargarMensajesNoLeidos: Error:', error);
    }
  }, [user?.id]);

  // Polling cada 60 segundos
  useEffect(() => {
    console.log('⏰ Configurando polling para usuario:', user?.id);

    if (pollingIntervalRef.current) {
      console.log('🧹 Limpiando intervalo anterior');
      clearInterval(pollingIntervalRef.current);
    }

    if (user?.id) {
      console.log('▶️ Iniciando polling: carga inicial + intervalo cada 60s');

      // Carga inicial
      cargarMensajesNoLeidos();

      // Polling continuo
      pollingIntervalRef.current = setInterval(() => {
        console.log('🔄 Polling: verificando mensajes no leídos...');
        cargarMensajesNoLeidos();
      }, 60000);
    } else {
      console.log('⏸️ No hay usuario, polling pausado');
    }

    return () => {
      if (pollingIntervalRef.current) {
        console.log('🧹 Limpiando intervalo en cleanup');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user?.id, cargarMensajesNoLeidos]);

  // Calcular total de mensajes no leídos
  const totalMensajesNoLeidos = Object.values(mensajesNoLeidos).reduce((sum, count) => sum + count, 0);
  const hasMensajesNoLeidos = totalMensajesNoLeidos > 0;

  const handleToggle = () => {
    console.log('💬 Toggle Chat Modal - Estado actual:', isOpen, '→ Nuevo estado:', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Escuchar eventos del modal de Estado del Tiempo
  useEffect(() => {
    const handleEstadoTiempoChange = (event) => {
      const { isOpen: estadoTiempoAbierto } = event.detail;
      console.log('🎯 ChatButton: Evento estado-tiempo-modal-changed recibido, isOpen:', estadoTiempoAbierto);
      setIsVisible(!estadoTiempoAbierto);
    };

    console.log('🎯 ChatButton: Configurando event listener para estado-tiempo-modal-changed');
    window.addEventListener('estado-tiempo-modal-changed', handleEstadoTiempoChange);

    return () => {
      window.removeEventListener('estado-tiempo-modal-changed', handleEstadoTiempoChange);
    };
  }, []);

  // Debug: mostrar estado de visibilidad
  console.log('🎯 ChatButton: isVisible =', isVisible, 'user =', user);

  // TEMPORAL: Forzar visibilidad para debug en producción
  const forceVisible = window.location.hostname !== 'localhost';
  const shouldRender = forceVisible || isVisible;

  // No renderizar si no debe ser visible
  if (!shouldRender) {
    console.log('🎯 ChatButton: NO SE RENDERIZA - shouldRender es false');
    return null;
  }

  console.log('🎯 ChatButton: SE RENDERIZA - shouldRender es true');

  return (
    <div className="chat-btn-container">
      <button
        className={`chat-btn ${hasMensajesNoLeidos ? 'chat-btn-new-messages' : ''}`}
        onClick={handleToggle}
        title={hasMensajesNoLeidos ? "Tienes mensajes nuevos" : "Abrir chat interno"}
      >
        <span className="chat-btn-icon"></span>
        <span className="chat-btn-text">
          {hasMensajesNoLeidos ? 'Mensajes nuevos' : 'Chat interno'}
        </span>
        {totalMensajesNoLeidos > 0 && (
          <span className="chat-notification-badge">
            {totalMensajesNoLeidos > 99 ? '99+' : totalMensajesNoLeidos}
          </span>
        )}
      </button>

      {isOpen && ReactDOM.createPortal(
        <ChatModal
          onClose={handleClose}
          currentUser={user}
          mensajesNoLeidos={mensajesNoLeidos}
          onMensajesNoLeidosChange={setMensajesNoLeidos}
        />,
        document.body
      )}
    </div>
  );
};

// Función global para testing (solo en desarrollo)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.testChatNotifications = {
    async checkAPI() {
      console.log('🧪 Testing Chat API...');
      try {
        const response = await fetch(`${API_BASE_URL}/chat/mensajes/no-leidos`, {
          headers: { 'x-usuario-id': '1' }
        });
        const data = await response.json();
        console.log('📡 API Response:', data);
        return data;
      } catch (error) {
        console.error('❌ API Error:', error);
        return null;
      }
    },

    async createTestMessages() {
      console.log('� Creando mensajes de prueba...');
      // Esta función se puede usar desde la consola para crear mensajes de prueba
      console.log('Para crear mensajes de prueba, ejecuta desde el servidor:');
      console.log('node -e "const mysql = require(\'mysql2/promise\'); /* código para insertar mensajes */"');
    }
  };
}

export default ChatButton;
