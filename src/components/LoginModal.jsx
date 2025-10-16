import React, { useState, useEffect } from 'react';
import './LoginModal.css';
import MensajeModal from './MensajeModal';
import { API_BASE_URL } from '../config/api';

const LoginModal = ({ isOpen, onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [mensaje, setMensaje] = useState({ show: false, texto: '', tipo: '' });

  // Generar wallpaper aleatorio al abrir el modal
  useEffect(() => {
    if (isOpen) {
      generateRandomWallpaper();
    }
  }, [isOpen]);

  // Generar wallpaper aleatorio usando Picsum (igual que en ConfiguracionDashboardModal)
  const generateRandomWallpaper = () => {
    const timestamp = Date.now();
    const seed = timestamp;
    const wallpaperUrl = `https://picsum.photos/seed/${seed}/1920/1080`;
    setBackgroundImage(wallpaperUrl);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      setMensaje({
        show: true,
        texto: 'Por favor complete todos los campos',
        tipo: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Llamar a API de login
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login exitoso - pasar datos del usuario
        onLoginSuccess(data.user, data.permissions, data.config);
      } else {
        // Error de credenciales
        setMensaje({
          show: true,
          texto: data.message || 'Usuario o contraseña incorrectos',
          tipo: 'error'
        });
      }
    } catch {
      // Error de conexión
      setMensaje({
        show: true,
        texto: 'Error de conexión a red. Verifique su conexión a internet.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cerrar mensaje modal
  const closeMensaje = () => {
    setMensaje({ show: false, texto: '', tipo: '' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="login-modal-overlay"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none'
        }}
      >
        <div className="login-modal-content">
          <div className="login-header">
            <h1 className="login-title">Sistema de Gestión - MSE</h1>
            <h2 className="login-subtitle">Acceso a Sistema</h2>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ingrese su nombre de usuario"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ingrese su contraseña"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>

      {/* MensajeModal para errores */}
      <MensajeModal
        isOpen={mensaje.show}
        onClose={closeMensaje}
        title={mensaje.tipo === 'success' ? '✓ Éxito' : '✕ Error'}
        size="small"
        className={mensaje.tipo === 'success' ? 'mensaje-success' : 'mensaje-error'}
      >
        <p style={{ textAlign: 'center', fontSize: '16px', margin: '20px 0' }}>
          {mensaje.texto}
        </p>
      </MensajeModal>
    </>
  );
};

export default LoginModal;