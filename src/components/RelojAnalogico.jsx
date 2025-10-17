import React, { useState, useEffect } from 'react';
import './RelojAnalogico.css';

const RelojAnalogico = ({ color = '#ffffff', intensidadBlur = 20 }) => {
  const [time, setTime] = useState(new Date());
  const [dateString, setDateString] = useState('');

  // Convertir porcentaje (0-100) a píxeles de blur (0-20)
  // 0% = 0px blur (sin desenfoque), 100% = 20px blur (máximo desenfoque)
  const blurPx = Math.round(intensidadBlur * 20 / 100);

  // Función para convertir hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '255, 255, 255';
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now);
      
      // Formatear fecha en español
      const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
      };
      const formattedDate = now.toLocaleDateString('es-ES', options);
      setDateString(formattedDate);
    };

    // Actualizar inmediatamente
    updateDateTime();
    
    // Actualizar cada segundo
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  // Calcular ángulos para las manecillas
  const secondAngle = (seconds * 6) - 90; // 6 grados por segundo
  const minuteAngle = (minutes * 6) + (seconds * 0.1) - 90; // 6 grados por minuto + movimiento suave
  const hourAngle = (hours * 30) + (minutes * 0.5) - 90; // 30 grados por hora + movimiento suave

  // Generar números del 1 al 12
  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) - 90; // 30 grados entre cada número
    const x = 50 + 35 * Math.cos(angle * Math.PI / 180);
    const y = 50 + 35 * Math.sin(angle * Math.PI / 180);
    numbers.push(
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="clock-number"
      >
        {i}
      </text>
    );
  }

  // Generar marcas de minutos
  const minuteMarks = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 !== 0) { // Solo marcas que no coinciden con números
      const angle = (i * 6) - 90;
      const x1 = 50 + 40 * Math.cos(angle * Math.PI / 180);
      const y1 = 50 + 40 * Math.sin(angle * Math.PI / 180);
      const x2 = 50 + 42 * Math.cos(angle * Math.PI / 180);
      const y2 = 50 + 42 * Math.sin(angle * Math.PI / 180);
      minuteMarks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="clock-minute-mark"
        />
      );
    }
  }

  return (
    <div className="reloj-analogico-container">
      <div 
        className="reloj-analogico"
        style={{
          background: `rgba(${hexToRgb(color)}, 0.085)`,
          border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
          '--clock-color': color
        }}
      >
        <svg viewBox="0 0 100 100" className="clock-face">
          {/* Círculo exterior */}
          <circle cx="50" cy="50" r="45" className="clock-circle" />

          {/* Marcas de minutos */}
          {minuteMarks}

          {/* Marcas de horas */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) - 90;
            const x1 = 50 + 38 * Math.cos(angle * Math.PI / 180);
            const y1 = 50 + 38 * Math.sin(angle * Math.PI / 180);
            const x2 = 50 + 42 * Math.cos(angle * Math.PI / 180);
            const y2 = 50 + 42 * Math.sin(angle * Math.PI / 180);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="clock-hour-mark"
              />
            );
          })}

          {/* Números */}
          {numbers}

          {/* Centro del reloj */}
          <circle cx="50" cy="50" r="2" className="clock-center" />

          {/* Manecilla de horas */}
          <line
            x1="50"
            y1="50"
            x2={50 + 20 * Math.cos(hourAngle * Math.PI / 180)}
            y2={50 + 20 * Math.sin(hourAngle * Math.PI / 180)}
            className="clock-hand clock-hour-hand"
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Manecilla de minutos */}
          <line
            x1="50"
            y1="50"
            x2={50 + 30 * Math.cos(minuteAngle * Math.PI / 180)}
            y2={50 + 30 * Math.sin(minuteAngle * Math.PI / 180)}
            className="clock-hand clock-minute-hand"
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* Manecilla de segundos */}
          <line
            x1="50"
            y1="50"
            x2={50 + 35 * Math.cos(secondAngle * Math.PI / 180)}
            y2={50 + 35 * Math.sin(secondAngle * Math.PI / 180)}
            className="clock-hand clock-second-hand"
            style={{ transformOrigin: '50px 50px' }}
          />
        </svg>
      </div>
      <div className="reloj-fecha">
        {dateString}
      </div>
    </div>
  );
};

export default RelojAnalogico;
