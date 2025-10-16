import React from 'react';

const TestModal = ({ isOpen, onClose }) => {
  console.log('🧪 TestModal - isOpen:', isOpen);
  
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={() => console.log('🔴 TEST OVERLAY CLICKED!')}
    >
      <div
        style={{
          backgroundColor: 'white',
          width: '500px',
          height: '400px',
          padding: '20px',
          borderRadius: '10px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('🟡 TEST MODAL CLICKED!');
        }}
      >
        <h1 style={{color: 'black', fontSize: '24px', textAlign: 'center'}}>
          🧪 MODAL DE PRUEBA 🧪
        </h1>
        <p style={{color: 'black', fontSize: '18px', textAlign: 'center'}}>
          Si puedes ver este texto, el sistema de modales está funcionando correctamente.
        </p>
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <button 
            onClick={onClose} 
            style={{
              fontSize: '20px', 
              padding: '15px 30px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            CERRAR MODAL DE PRUEBA
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestModal;
