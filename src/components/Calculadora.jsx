import React, { useState, useEffect } from 'react';
import './Calculadora.css';

const Calculadora = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [numeroAnterior, setNumeroAnterior] = useState(null);
  const [operacion, setOperacion] = useState(null);
  const [nuevoNumero, setNuevoNumero] = useState(true);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('mseplus-calculadora');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setDisplay(state.display || '0');
        setNumeroAnterior(state.numeroAnterior || null);
        setOperacion(state.operacion || null);
        setNuevoNumero(state.nuevoNumero !== false);
      } catch (error) {
        console.error('Error al cargar calculadora:', error);
      }
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const state = {
      display,
      numeroAnterior,
      operacion,
      nuevoNumero,
      timestamp: Date.now()
    };
    localStorage.setItem('mseplus-calculadora', JSON.stringify(state));
  }, [display, numeroAnterior, operacion, nuevoNumero]);

  const handleNumber = (num) => {
    if (nuevoNumero) {
      setDisplay(num);
      setNuevoNumero(false);
    } else {
      if (display === '0' && num !== '.') {
        setDisplay(num);
      } else {
        // Evitar múltiples puntos decimales
        if (num === '.' && display.includes('.')) return;
        setDisplay(display + num);
      }
    }
  };

  const handleOperator = (op) => {
    const current = parseFloat(display);

    if (numeroAnterior === null) {
      setNumeroAnterior(current);
    } else if (operacion) {
      const resultado = calcular();
      setDisplay(String(resultado));
      setNumeroAnterior(resultado);
    }

    setNuevoNumero(true);
    setOperacion(op);
  };

  const calcular = () => {
    const anterior = parseFloat(numeroAnterior);
    const actual = parseFloat(display);

    if (isNaN(anterior) || isNaN(actual)) return actual;

    switch (operacion) {
      case '+':
        return anterior + actual;
      case '-':
        return anterior - actual;
      case '×':
        return anterior * actual;
      case '÷':
        return actual !== 0 ? anterior / actual : 0;
      case '%':
        return anterior % actual;
      default:
        return actual;
    }
  };

  const handleEquals = () => {
    if (operacion && numeroAnterior !== null) {
      const resultado = calcular();
      setDisplay(String(resultado));
      setNumeroAnterior(null);
      setOperacion(null);
      setNuevoNumero(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setNumeroAnterior(null);
    setOperacion(null);
    setNuevoNumero(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNuevoNumero(true);
    }
  };

  const handlePorcentaje = () => {
    const valor = parseFloat(display);
    setDisplay(String(valor / 100));
    setNuevoNumero(true);
  };

  const handleToggleSigno = () => {
    const valor = parseFloat(display);
    setDisplay(String(valor * -1));
  };

  // Formatear display para mostrar con comas
  const formatDisplay = (value) => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Soporte para teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Números
      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
        e.preventDefault();
      }
      // Punto decimal
      else if (e.key === '.' || e.key === ',') {
        handleNumber('.');
        e.preventDefault();
      }
      // Operadores
      else if (e.key === '+') {
        handleOperator('+');
        e.preventDefault();
      }
      else if (e.key === '-') {
        handleOperator('-');
        e.preventDefault();
      }
      else if (e.key === '*') {
        handleOperator('×');
        e.preventDefault();
      }
      else if (e.key === '/') {
        handleOperator('÷');
        e.preventDefault();
      }
      // Enter o = para calcular
      else if (e.key === 'Enter' || e.key === '=') {
        handleEquals();
        e.preventDefault();
      }
      // Backspace
      else if (e.key === 'Backspace') {
        handleBackspace();
        e.preventDefault();
      }
      // Escape para limpiar
      else if (e.key === 'Escape') {
        handleClear();
        e.preventDefault();
      }
      // % para porcentaje
      else if (e.key === '%') {
        handlePorcentaje();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, numeroAnterior, operacion, nuevoNumero]);

  return (
    <>
      <div className="calculadora-overlay"></div>
      <div className="calculadora-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="calc-header">
          <div className="calc-header-left">
            <span className="calc-icon">🔢</span>
            <h3 className="calc-title">Calculadora</h3>
          </div>
          <button className="calc-close-btn" onClick={onClose} title="Cerrar calculadora">
            ✕
          </button>
        </div>

        {/* Display */}
        <div className="calc-display-container">
          {operacion && (
            <div className="calc-operation">
              {formatDisplay(String(numeroAnterior))} {operacion}
            </div>
          )}
          <div className="calc-display">
            {formatDisplay(display)}
          </div>
        </div>

        {/* Botones */}
        <div className="calc-buttons">
          {/* Fila 1 */}
          <button className="calc-button function" onClick={handleClear}>C</button>
          <button className="calc-button function" onClick={handleBackspace}>←</button>
          <button className="calc-button function" onClick={handlePorcentaje}>%</button>
          <button className="calc-button operator" onClick={() => handleOperator('÷')}>÷</button>

          {/* Fila 2 */}
          <button className="calc-button number" onClick={() => handleNumber('7')}>7</button>
          <button className="calc-button number" onClick={() => handleNumber('8')}>8</button>
          <button className="calc-button number" onClick={() => handleNumber('9')}>9</button>
          <button className="calc-button operator" onClick={() => handleOperator('×')}>×</button>

          {/* Fila 3 */}
          <button className="calc-button number" onClick={() => handleNumber('4')}>4</button>
          <button className="calc-button number" onClick={() => handleNumber('5')}>5</button>
          <button className="calc-button number" onClick={() => handleNumber('6')}>6</button>
          <button className="calc-button operator" onClick={() => handleOperator('-')}>−</button>

          {/* Fila 4 */}
          <button className="calc-button number" onClick={() => handleNumber('1')}>1</button>
          <button className="calc-button number" onClick={() => handleNumber('2')}>2</button>
          <button className="calc-button number" onClick={() => handleNumber('3')}>3</button>
          <button className="calc-button operator" onClick={() => handleOperator('+')}>+</button>

          {/* Fila 5 */}
          <button className="calc-button number" onClick={handleToggleSigno}>±</button>
          <button className="calc-button number" onClick={() => handleNumber('0')}>0</button>
          <button className="calc-button number" onClick={() => handleNumber('.')}>.</button>
          <button className="calc-button equals" onClick={handleEquals}>=</button>
        </div>
      </div>
    </>
  );
};

export default Calculadora;
