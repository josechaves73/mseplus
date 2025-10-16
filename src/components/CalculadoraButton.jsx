import React, { useState } from 'react';
import Calculadora from './Calculadora';
import './CalculadoraButton.css';

const CalculadoraButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="calculadora-btn-container">
      <button 
        className="calculadora-btn" 
        onClick={handleToggle}
        title="Abrir calculadora"
      >
        <span className="calc-btn-icon">🔢</span>
        <span className="calc-btn-text">Calculadora</span>
      </button>

      {isOpen && <Calculadora onClose={handleClose} />}
    </div>
  );
};

export default CalculadoraButton;
