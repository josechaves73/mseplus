import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Calendario from './Calendario';
import './CalendarioButton.css';

const CalendarioButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="calendario-btn-container">
        <button 
          className="calendario-btn" 
          onClick={handleToggle}
          title="Abrir calendario"
        >
          <span className="cal-btn-icon">📅</span>
          <span className="cal-btn-text">Calendario</span>
        </button>
      </div>

      {isOpen && ReactDOM.createPortal(
        <Calendario onClose={handleClose} />,
        document.body
      )}
    </>
  );
};

export default CalendarioButton;
