import React, { useEffect } from 'react';
import './NotificationToast.css';
import { useNotificationSound } from '../hooks/useNotificationSound.js';

const NotificationToast = ({ message, userName, onClose, duration = 10000 }) => {
  const { playNotificationSound } = useNotificationSound();

  useEffect(() => {
    // Reproducir sonido de notificación al aparecer
    playNotificationSound();

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration, playNotificationSound]);

  return (
    <div className="notification-toast-overlay">
      <div className="notification-toast">
        <div className="notification-icon">💬</div>
        <div className="notification-content">
          <div className="notification-title">Mensaje Nuevo</div>
          <div className="notification-message">
            {message} de <strong>{userName}</strong>
          </div>
        </div>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default NotificationToast;