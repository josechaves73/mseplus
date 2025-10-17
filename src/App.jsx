import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MenuHorizontal from './components/MenuHorizontal';
import Dashboard from './components/Dashboard';
import ListaArticulosModal from './components/ListaArticulosModal';
import ListaVehiculosModal from './components/ListaVehiculosModal';
import ListaConductoresModal from './components/ListaConductoresModal';
import ListaBoletasModal from './components/ListaBoletasModal';
import ListaClientesModal from './components/ListaClientesModal';
import TrazabilidadModal from './components/TrazabilidadModal';
import FamiliasModal from './components/FamiliasModal';
import NuevoConductorModal from './components/NuevoConductorModalNuevo';
import ClientePorArticulosModal from './components/ClientePorArticulosModal';
import ListaManifiestosModal from './components/ListaManifiestosModal';
import ReporteAgrupadoModal from './components/ReporteAgrupadoModal';
import ReporteBoletasModal from './components/ReporteBoletasModal';
import ConfiguracionEmailModal from './components/ConfiguracionEmailModal';
import ConfiguracionDashboardModal from './components/ConfiguracionDashboardModal';
import ConfiguracionGeneralModal from './components/ConfiguracionGeneralModal';
import EnviarEmailModal from './components/EnviarEmailModal';
import HistorialEmailsModal from './components/HistorialEmailsModal';
import TransportesDocuModal from './components/TransportesDocuModal';
import NuevoDocumentoTransportes from './components/NuevoDocumentoTransportes';
import GestionUsuariosModal from './components/GestionUsuariosModal';
import LoginModal from './components/LoginModal';
import MensajeModal from './components/MensajeModal';
import NuevoVehiculoModal from './components/NuevoVehiculoModal';

function App() {
  // Componente interno que usa el contexto de autenticación
  const AppContent = () => {
    const { isAuthenticated, loading, login, logout, user, hasPermission } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Estados de los modales
    const [showListaManifiestosModal, setShowListaManifiestosModal] = useState(false);
    const [showListaArticulosModal, setShowListaArticulosModal] = useState(false);
    const [showListaVehiculosModal, setShowListaVehiculosModal] = useState(false);
    const [showListaConductoresModal, setShowListaConductoresModal] = useState(false);
    const [showListaBoletasModal, setShowListaBoletasModal] = useState(false);
    const [showFamiliasModal, setShowFamiliasModal] = useState(false);
    const [showListaClientesModal, setShowListaClientesModal] = useState(false);
    const [showTrazabilidadModal, setShowTrazabilidadModal] = useState(false);
    const [showClientePorArticulosModal, setShowClientePorArticulosModal] = useState(false);
    const [showNuevoConductorModal, setShowNuevoConductorModal] = useState(false);
    const [conductorEditData, setConductorEditData] = useState(null);
    const [showReporteAgrupadoModal, setShowReporteAgrupadoModal] = useState(false);
    const [showReporteBoletasModal, setShowReporteBoletasModal] = useState(false);
    const [showConfiguracionEmailModal, setShowConfiguracionEmailModal] = useState(false);
    const [showConfiguracionDashboardModal, setShowConfiguracionDashboardModal] = useState(false);
    const [showConfiguracionGeneralModal, setShowConfiguracionGeneralModal] = useState(false);
    const [showEnviarEmailModal, setShowEnviarEmailModal] = useState(false);
    const [showHistorialEmailsModal, setShowHistorialEmailsModal] = useState(false);
    const [showTransportesDocuModal, setShowTransportesDocuModal] = useState(false);
    const [showNuevoDocumentoTransportes, setShowNuevoDocumentoTransportes] = useState(false);
    const [documentoEditMode, setDocumentoEditMode] = useState(false);
    const [documentoEditData, setDocumentoEditData] = useState(null);
    const [showGestionUsuariosModal, setShowGestionUsuariosModal] = useState(false);
    const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showNuevoVehiculoModal, setShowNuevoVehiculoModal] = useState(false);
    const [permisoDenegadoMensaje, setPermisoDenegadoMensaje] = useState({ show: false, modulo: '' });

    const mostrarMensajePermisoDenegado = (modulo) => {
        setPermisoDenegadoMensaje({ show: true, modulo });
    };

    const cerrarMensajePermisoDenegado = () => {
        setPermisoDenegadoMensaje({ show: false, modulo: '' });
    };

    // Mostrar login si no está autenticado y terminó de cargar
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        // Resetear todos los estados de modales cuando se hace logout
        setShowListaManifiestosModal(false);
        setShowListaArticulosModal(false);
        setShowListaVehiculosModal(false);
        setShowListaConductoresModal(false);
        setShowListaBoletasModal(false);
        setShowFamiliasModal(false);
        setShowListaClientesModal(false);
        setShowTrazabilidadModal(false);
        setShowClientePorArticulosModal(false);
        setShowNuevoConductorModal(false);
        setConductorEditData(null);
        setShowReporteAgrupadoModal(false);
        setShowReporteBoletasModal(false);
        setShowConfiguracionEmailModal(false);
        setShowConfiguracionDashboardModal(false);
        setShowConfiguracionGeneralModal(false);
        setShowEnviarEmailModal(false);
        setShowHistorialEmailsModal(false);
        setShowTransportesDocuModal(false);
        setShowNuevoDocumentoTransportes(false);
        setDocumentoEditMode(false);
        setDocumentoEditData(null);
        setShowGestionUsuariosModal(false);
        setPermisoDenegadoMensaje({ show: false, modulo: '' });
        setShowLogoutConfirmModal(false);
        
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
      }
    }, [loading, isAuthenticated]);

    // Función para manejar login exitoso
    const handleLoginSuccess = (user, permissions, config) => {
      login(user, permissions, config);
    };

    // Dev-only: auto-login and open NuevoVehiculoModal when URL has ?dev_show_nuevo_vehiculo=1
    useEffect(() => {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (params && params.get('dev_show_nuevo_vehiculo') === '1') {
        try {
          // Auto login as dev admin (only for local dev)
          const devUser = { id: 1, username: 'dev', rol: 'admin' };
          const devPermissions = [{ modulo: 'Transportes', submodulo: 'Lista de Vehículos', accion: 'acceso', permitido: 1 }];
          const devConfig = {};
          login(devUser, devPermissions, devConfig);
          // Open the NuevoVehiculo modal for inspection
          setShowNuevoVehiculoModal(true);
        } catch (err) {
          console.warn('dev auto-login failed', err);
        }
      }
    }, [login]);

    // Función para mostrar modal de confirmación de logout
    const handleLogout = () => {
      setShowLogoutConfirmModal(true);
    };

    // Función para confirmar logout
    const handleConfirmLogout = () => {
      // Resetear todos los estados de modales antes del logout
      setShowListaManifiestosModal(false);
      setShowListaArticulosModal(false);
      setShowListaVehiculosModal(false);
      setShowListaConductoresModal(false);
      setShowListaBoletasModal(false);
      setShowFamiliasModal(false);
      setShowListaClientesModal(false);
      setShowTrazabilidadModal(false);
      setShowClientePorArticulosModal(false);
      setShowNuevoConductorModal(false);
      setConductorEditData(null);
      setShowReporteAgrupadoModal(false);
      setShowReporteBoletasModal(false);
      setShowConfiguracionEmailModal(false);
      setShowConfiguracionDashboardModal(false);
      setShowConfiguracionGeneralModal(false);
      setShowEnviarEmailModal(false);
      setShowHistorialEmailsModal(false);
      setShowTransportesDocuModal(false);
      setShowNuevoDocumentoTransportes(false);
      setDocumentoEditMode(false);
      setDocumentoEditData(null);
      setShowGestionUsuariosModal(false);
      setPermisoDenegadoMensaje({ show: false, modulo: '' });
      
      setShowLogoutConfirmModal(false);
      logout(); // Hace logout y resetea los datos del usuario
    };

    // Función para cancelar logout
    const handleCancelLogout = () => {
      setShowLogoutConfirmModal(false);
    };

    // Funciones de manejo de modales
    const handleOpenListaArticulos = () => {
      console.log('🔍 Verificando permiso para Lista de Articulos:', hasPermission('Articulos', 'Lista de Articulos', 'acceso'));
      if (hasPermission('Articulos', 'Lista de Articulos', 'acceso')) {
        setShowListaArticulosModal(true);
      } else {
        console.log('❌ Permiso denegado para Lista de Articulos');
        mostrarMensajePermisoDenegado('Lista de Articulos');
      }
    };

    const handleCloseListaArticulos = () => {
      setShowListaArticulosModal(false);
    };

    const handleOpenListaVehiculos = () => {
      if (hasPermission('Transportes', 'Lista de Vehículos', 'acceso')) {
        setShowListaVehiculosModal(true);
      } else {
        mostrarMensajePermisoDenegado('Lista de Vehículos');
      }
    };

    const handleCloseListaVehiculos = () => {
      setShowListaVehiculosModal(false);
    };

    const handleOpenListaConductores = () => {
      if (hasPermission('Transportes', 'Lista de Conductores', 'acceso')) {
        setShowListaConductoresModal(true);
      } else {
        mostrarMensajePermisoDenegado('Lista de Conductores');
      }
    };

    const handleCloseListaConductores = () => {
      setShowListaConductoresModal(false);
    };

    const handleOpenListaBoletas = () => {
      if (hasPermission('Boletas', 'Lista Boletas', 'acceso')) {
        setShowListaBoletasModal(true);
      } else {
        mostrarMensajePermisoDenegado('Lista Boletas');
      }
    };

    const handleCloseListaBoletas = () => {
      setShowListaBoletasModal(false);
    };

    const handleOpenListaClientes = () => {
      if (hasPermission('Clientes', 'Clientes', 'acceso')) {
        setShowListaClientesModal(true);
      } else {
        mostrarMensajePermisoDenegado('Clientes');
      }
    };

    const handleCloseListaClientes = () => {
      setShowListaClientesModal(false);
    };

    const handleOpenTrazabilidad = () => {
      if (hasPermission('Boletas', 'Trazabilidad', 'acceso')) {
        setShowTrazabilidadModal(true);
      } else {
        mostrarMensajePermisoDenegado('Trazabilidad');
      }
    };

    const handleCloseTrazabilidad = () => {
      setShowTrazabilidadModal(false);
    };

    const handleOpenClientePorArticulos = () => {
      if (hasPermission('Articulos', 'Articulos x Cliente', 'acceso')) {
        setShowClientePorArticulosModal(true);
      } else {
        mostrarMensajePermisoDenegado('Articulos x Cliente');
      }
    };

    const handleCloseClientePorArticulos = () => {
      setShowClientePorArticulosModal(false);
    };

    const handleOpenListaManifiestos = () => {
      if (hasPermission('Manifiestos', 'Lista de Manifiestos', 'acceso')) {
        setShowListaManifiestosModal(true);
      } else {
        mostrarMensajePermisoDenegado('Lista de Manifiestos');
      }
    };

    const handleCloseListaManifiestos = () => {
      setShowListaManifiestosModal(false);
    };

    const handleOpenFamilias = () => {
      if (hasPermission('Articulos', 'Familias', 'acceso')) {
        setShowFamiliasModal(true);
      } else {
        mostrarMensajePermisoDenegado('Familias');
      }
    };

    const handleCloseFamilias = () => {
      setShowFamiliasModal(false);
    };

    const handleOpenNuevoConductor = (conductorData = null) => {
      setConductorEditData(conductorData);
      setShowNuevoConductorModal(true);
    };

    const handleCloseNuevoConductor = () => {
      setShowNuevoConductorModal(false);
      setConductorEditData(null);
    };

    const handleOpenReporteAgrupado = () => {
      if (hasPermission('Articulos', 'Reporte Agrupado', 'acceso')) {
        setShowReporteAgrupadoModal(true);
      } else {
        mostrarMensajePermisoDenegado('Reporte Agrupado');
      }
    };

    const handleCloseReporteAgrupado = () => {
      setShowReporteAgrupadoModal(false);
    };

    const handleOpenReporteBoletas = () => {
      if (hasPermission('Boletas', 'Reportes', 'acceso')) {
        setShowReporteBoletasModal(true);
      } else {
        mostrarMensajePermisoDenegado('Reportes');
      }
    };

    const handleCloseReporteBoletas = () => {
      setShowReporteBoletasModal(false);
    };

    const handleOpenConfiguracionEmail = () => {
      if (hasPermission('Configuración', 'Configuración de Emails', 'acceso')) {
        setShowConfiguracionEmailModal(true);
      } else {
        mostrarMensajePermisoDenegado('Configuración de Emails');
      }
    };

    const handleCloseConfiguracionEmail = () => {
      setShowConfiguracionEmailModal(false);
    };

    const handleOpenConfiguracionDashboard = () => {
      if (hasPermission('Configuración', 'Wallpaper', 'acceso')) {
        setShowConfiguracionDashboardModal(true);
      } else {
        mostrarMensajePermisoDenegado('Wallpaper');
      }
    };

    const handleCloseConfiguracionDashboard = () => {
      setShowConfiguracionDashboardModal(false);
    };

    const handleOpenConfiguracionGeneral = () => {
      if (hasPermission('Configuración', 'Configuración General', 'acceso')) {
        setShowConfiguracionGeneralModal(true);
      } else {
        mostrarMensajePermisoDenegado('Configuración General');
      }
    };

    const handleCloseConfiguracionGeneral = () => {
      setShowConfiguracionGeneralModal(false);
    };

    const handleOpenEnviarEmail = () => {
      if (hasPermission('Configuración', 'Configuración de Emails', 'acceso')) {
        setShowEnviarEmailModal(true);
      } else {
        mostrarMensajePermisoDenegado('Configuración de Emails');
      }
    };

    const handleCloseEnviarEmail = () => {
      setShowEnviarEmailModal(false);
    };

    const handleOpenHistorialEmails = () => {
      if (hasPermission('Configuración', 'Configuración de Emails', 'acceso')) {
        setShowHistorialEmailsModal(true);
      } else {
        mostrarMensajePermisoDenegado('Configuración de Emails');
      }
    };

    const handleCloseHistorialEmails = () => {
      setShowHistorialEmailsModal(false);
    };

    const handleOpenTransportesDocu = () => {
      if (hasPermission('Transportes', 'Documentación', 'acceso')) {
        setShowTransportesDocuModal(true);
      } else {
        mostrarMensajePermisoDenegado('Documentación');
      }
    };

    const handleCloseTransportesDocu = () => {
      setShowTransportesDocuModal(false);
    };

    const handleOpenNuevoDocumento = () => {
      if (hasPermission('Transportes', 'Documentación', 'acceso')) {
        setDocumentoEditMode(false);
        setDocumentoEditData(null);
        setShowNuevoDocumentoTransportes(true);
      } else {
        mostrarMensajePermisoDenegado('Documentación');
      }
    };

    const handleCloseNuevoDocumento = () => {
      setShowNuevoDocumentoTransportes(false);
      setDocumentoEditMode(false);
      setDocumentoEditData(null);
    };

    const handleDocumentoCreated = () => {
      // Refrescar lista si es necesario
    };

    const handleOpenGestionUsuarios = () => {
      if (hasPermission('Configuración', 'Usuarios', 'acceso')) {
        setShowGestionUsuariosModal(true);
      } else {
        mostrarMensajePermisoDenegado('Usuarios');
      }
    };

    const handleCloseGestionUsuarios = () => {
      setShowGestionUsuariosModal(false);
    };

    // Mostrar loading mientras verifica autenticación
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a2e',
          color: 'white',
          fontSize: '18px'
        }}>
          🔄 Verificando autenticación...
        </div>
      );
    }

    // Contenido de la aplicación cuando está autenticado
    return (
      <>
        {/* Barra de título */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: 'white',
          padding: '15px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '25px',
            fontWeight: 'bold',
            color: '#4ade80' // Verde claro
          }}>
            Sistema de Gestión - MSE
          </div>
          <div style={{
            fontSize: '16px',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#94a3b8' }}>Usuario activo:</span>
            <span style={{ fontWeight: '500' }}>
              {user?.nombre_completo || 'Usuario'}
            </span>
          </div>
        </div>

        <MenuHorizontal
          onOpenListaArticulos={handleOpenListaArticulos}
          onOpenListaVehiculos={handleOpenListaVehiculos}
          onOpenListaConductores={handleOpenListaConductores}
          onOpenListaBoletas={handleOpenListaBoletas}
          onOpenListaClientes={handleOpenListaClientes}
          onOpenTrazabilidad={handleOpenTrazabilidad}
          onOpenClientePorArticulos={handleOpenClientePorArticulos}
          onOpenListaManifiestos={handleOpenListaManifiestos}
          onOpenFamilias={handleOpenFamilias}
          onOpenReporteAgrupado={handleOpenReporteAgrupado}
          onOpenReporteBoletas={handleOpenReporteBoletas}
          onOpenConfiguracionEmail={handleOpenConfiguracionEmail}
          onOpenConfiguracionDashboard={handleOpenConfiguracionDashboard}
          onOpenConfiguracionGeneral={handleOpenConfiguracionGeneral}
          onOpenEnviarEmail={handleOpenEnviarEmail}
          onOpenHistorialEmails={handleOpenHistorialEmails}
          onOpenTransportesDocu={handleOpenTransportesDocu}
          onOpenNuevoDocumento={handleOpenNuevoDocumento}
          onOpenGestionUsuarios={handleOpenGestionUsuarios}
          onLogout={handleLogout}
        />
        <Dashboard
          onOpenListaArticulos={handleOpenListaArticulos}
          onOpenListaVehiculos={handleOpenListaVehiculos}
          onOpenListaConductores={handleOpenListaConductores}
          onOpenListaBoletas={handleOpenListaBoletas}
          onOpenListaClientes={handleOpenListaClientes}
          onOpenTrazabilidad={handleOpenTrazabilidad}
          onOpenClientePorArticulos={handleOpenClientePorArticulos}
          onOpenListaManifiestos={handleOpenListaManifiestos}
          onOpenFamilias={handleOpenFamilias}
          onOpenReporteAgrupado={handleOpenReporteAgrupado}
          onOpenReporteBoletas={handleOpenReporteBoletas}
          onOpenConfiguracionEmail={handleOpenConfiguracionEmail}
          onOpenConfiguracionDashboard={handleOpenConfiguracionDashboard}
          onOpenConfiguracionGeneral={handleOpenConfiguracionGeneral}
          onOpenEnviarEmail={handleOpenEnviarEmail}
          onOpenHistorialEmails={handleOpenHistorialEmails}
          onOpenTransportesDocu={handleOpenTransportesDocu}
          onOpenNuevoDocumento={handleOpenNuevoDocumento}
          onOpenGestionUsuarios={handleOpenGestionUsuarios}
        />

        {/* Login Modal - se muestra cuando no está autenticado */}
        <LoginModal
          isOpen={showLoginModal}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Modales */}
        <ListaArticulosModal
          isOpen={showListaArticulosModal}
          onClose={handleCloseListaArticulos}
        />
        <ListaVehiculosModal
          isOpen={showListaVehiculosModal}
          onClose={handleCloseListaVehiculos}
        />
        <ListaConductoresModal
          isOpen={showListaConductoresModal}
          onClose={handleCloseListaConductores}
          onOpenNuevoConductor={handleOpenNuevoConductor}
        />
        <ListaBoletasModal
          isOpen={showListaBoletasModal}
          onClose={handleCloseListaBoletas}
        />
        <ListaClientesModal
          isOpen={showListaClientesModal}
          onClose={handleCloseListaClientes}
        />
        <TrazabilidadModal
          isOpen={showTrazabilidadModal}
          onClose={handleCloseTrazabilidad}
        />
        <ClientePorArticulosModal
          isOpen={showClientePorArticulosModal}
          onClose={handleCloseClientePorArticulos}
        />
        <ListaManifiestosModal
          isOpen={showListaManifiestosModal}
          onClose={handleCloseListaManifiestos}
        />
        <FamiliasModal
          isOpen={showFamiliasModal}
          onClose={handleCloseFamilias}
        />
        <NuevoConductorModal
          isOpen={showNuevoConductorModal}
          onClose={handleCloseNuevoConductor}
          editData={conductorEditData}
        />
        <ReporteAgrupadoModal
          isOpen={showReporteAgrupadoModal}
          onClose={handleCloseReporteAgrupado}
        />
        <ReporteBoletasModal
          isOpen={showReporteBoletasModal}
          onClose={handleCloseReporteBoletas}
        />
        <ConfiguracionEmailModal
          isOpen={showConfiguracionEmailModal}
          onClose={handleCloseConfiguracionEmail}
        />
        <ConfiguracionDashboardModal
          isOpen={showConfiguracionDashboardModal}
          onClose={handleCloseConfiguracionDashboard}
        />
        <ConfiguracionGeneralModal
          isOpen={showConfiguracionGeneralModal}
          onClose={handleCloseConfiguracionGeneral}
        />
        <EnviarEmailModal
          isOpen={showEnviarEmailModal}
          onClose={handleCloseEnviarEmail}
        />
        <HistorialEmailsModal
          isOpen={showHistorialEmailsModal}
          onClose={handleCloseHistorialEmails}
        />
        <TransportesDocuModal
          isOpen={showTransportesDocuModal}
          onClose={handleCloseTransportesDocu}
        />
        <NuevoDocumentoTransportes
          isOpen={showNuevoDocumentoTransportes}
          onClose={handleCloseNuevoDocumento}
          onSuccess={handleDocumentoCreated}
          isEdit={documentoEditMode}
          editData={documentoEditData}
        />
        <GestionUsuariosModal
          isOpen={showGestionUsuariosModal}
          onClose={handleCloseGestionUsuarios}
        />

        <NuevoVehiculoModal
          isOpen={showNuevoVehiculoModal}
          onClose={() => setShowNuevoVehiculoModal(false)}
        />

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
          <p>No dispone de permisos para acceder al módulo: <strong>{permisoDenegadoMensaje.modulo}</strong></p>
        </MensajeModal>

        {/* Modal de confirmación de logout */}
        <MensajeModal
          isOpen={showLogoutConfirmModal}
          title="Confirmar Cierre de Sistema"
          onClose={handleCancelLogout}
          buttons={[
            {
              label: 'No',
              onClick: handleCancelLogout,
              className: 'btn-secondary'
            },
            {
              label: 'Si',
              onClick: handleConfirmLogout,
              className: 'btn-danger'
            }
          ]}
        >
          <p>¿Desea cerrar el Sistema?</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Se cerrará la sesión actual y regresará a la pantalla de login.
          </p>
        </MensajeModal>
      </>
    );
  };

  // Función principal que envuelve con AuthProvider
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
