/*
 * EJEMPLOS DE USO DEL COMPONENTE MENSAJE-MODAL
 * ============================================
 *
 * Este archivo muestra diferentes formas de usar el componente MensajeModal
 * en la aplicación MSEPlus. El componente es reutilizable y flexible.
 */

import React, { useState } from 'react';
import MensajeModal from './MensajeModal';

// Ejemplo 1: Modal de confirmación simple
const EjemploConfirmacion = () => {
  const [showModal, setShowModal] = useState(false);

  const handleConfirmar = () => {
    console.log('Acción confirmada');
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Mostrar Confirmación
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirmar Acción"
        buttons={[
          {
            label: "Confirmar",
            onClick: handleConfirmar
          },
          {
            label: "Cancelar",
            onClick: () => setShowModal(false),
            className: "btn-secondary"
          }
        ]}
      >
        <p>¿Estás seguro de que deseas realizar esta acción?</p>
      </MensajeModal>
    </>
  );
};

// Ejemplo 2: Modal de éxito con un solo botón
const EjemploExito = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Mostrar Éxito
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="¡Operación Exitosa!"
        buttons={[
          {
            label: "Aceptar",
            onClick: () => setShowModal(false)
          }
        ]}
      >
        <p>La operación se ha completado correctamente.</p>
      </MensajeModal>
    </>
  );
};

// Ejemplo 3: Modal de error con botón de peligro
const EjemploError = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Mostrar Error
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Error en la Operación"
        buttons={[
          {
            label: "Reintentar",
            onClick: () => {
              console.log('Reintentando...');
              setShowModal(false);
            },
            className: "btn-danger"
          },
          {
            label: "Cancelar",
            onClick: () => setShowModal(false),
            className: "btn-secondary"
          }
        ]}
      >
        <p>Ha ocurrido un error al procesar la solicitud.</p>
        <p><strong>Por favor, inténtalo de nuevo.</strong></p>
      </MensajeModal>
    </>
  );
};

// Ejemplo 4: Modal de información sin botones (solo cerrar)
const EjemploInformacion = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Mostrar Información
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Información Importante"
        showCloseButton={true}
        buttons={[]} // Sin botones, solo se cierra con X
      >
        <p>Esta es una información importante que el usuario debe conocer.</p>
        <p>Puede cerrar este modal haciendo clic en la X.</p>
      </MensajeModal>
    </>
  );
};

// Ejemplo 5: Modal de carga (con estado loading)
const EjemploCarga = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProcesar = async () => {
    setLoading(true);
    // Simular proceso asíncrono
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Procesar Datos
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => !loading && setShowModal(false)}
        title="Procesando Datos"
        loading={loading}
        buttons={[
          {
            label: loading ? "Procesando..." : "Iniciar Proceso",
            onClick: handleProcesar,
            disabled: loading
          },
          {
            label: "Cancelar",
            onClick: () => setShowModal(false),
            className: "btn-secondary",
            disabled: loading
          }
        ]}
      >
        <p>Se están procesando los datos. Esta operación puede tardar unos momentos.</p>
        {loading && <p><strong>No cierres esta ventana...</strong></p>}
      </MensajeModal>
    </>
  );
};

// Ejemplo 6: Modal con diferentes tamaños
const EjemploTamanos = () => {
  const [showSmall, setShowSmall] = useState(false);
  const [showMedium, setShowMedium] = useState(false);
  const [showLarge, setShowLarge] = useState(false);

  return (
    <>
      <button onClick={() => setShowSmall(true)}>Modal Pequeño</button>
      <button onClick={() => setShowMedium(true)}>Modal Mediano</button>
      <button onClick={() => setShowLarge(true)}>Modal Grande</button>

      <MensajeModal
        isOpen={showSmall}
        onClose={() => setShowSmall(false)}
        title="Modal Pequeño"
        size="small"
        buttons={[{ label: "OK", onClick: () => setShowSmall(false) }]}
      >
        <p>Este es un modal pequeño.</p>
      </MensajeModal>

      <MensajeModal
        isOpen={showMedium}
        onClose={() => setShowMedium(false)}
        title="Modal Mediano"
        size="medium"
        buttons={[{ label: "OK", onClick: () => setShowMedium(false) }]}
      >
        <p>Este es un modal mediano con más contenido.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </MensajeModal>

      <MensajeModal
        isOpen={showLarge}
        onClose={() => setShowLarge(false)}
        title="Modal Grande"
        size="large"
        buttons={[{ label: "OK", onClick: () => setShowLarge(false) }]}
      >
        <p>Este es un modal grande con mucho contenido.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      </MensajeModal>
    </>
  );
};

// Ejemplo 7: Modal con contenido personalizado (JSX)
const EjemploContenidoPersonalizado = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Mostrar Contenido Personalizado
      </button>

      <MensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detalles del Usuario"
        buttons={[
          { label: "Editar", onClick: () => console.log('Editar') },
          { label: "Cerrar", onClick: () => setShowModal(false), className: "btn-secondary" }
        ]}
      >
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Información Personal</h4>
          <p><strong>Nombre:</strong> Juan Pérez</p>
          <p><strong>Email:</strong> juan.perez@example.com</p>
          <p><strong>Rol:</strong> Administrador</p>

          <h4 style={{ margin: '20px 0 10px 0', color: '#1e40af' }}>Estadísticas</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Boletas creadas: 150</li>
            <li>Manifiestos procesados: 25</li>
            <li>Última actividad: Hoy</li>
          </ul>
        </div>
      </MensajeModal>
    </>
  );
};

export {
  EjemploConfirmacion,
  EjemploExito,
  EjemploError,
  EjemploInformacion,
  EjemploCarga,
  EjemploTamanos,
  EjemploContenidoPersonalizado
};
