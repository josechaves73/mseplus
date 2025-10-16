import React, { useState, useEffect } from 'react';
import './Calendario.css';

const Calendario = ({ onClose }) => {
  const [fechaActual] = useState(new Date());
  const [mesVista, setMesVista] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

  // Días festivos y celebraciones de Costa Rica
  const diasFestivos = {
    '1-1': { nombre: 'Año Nuevo', tipo: 'festivo' },
    '4-11': { nombre: 'Día de Juan Santamaría', tipo: 'festivo' },
    '5-1': { nombre: 'Día del Trabajador', tipo: 'festivo' },
    '7-25': { nombre: 'Anexión de Guanacaste', tipo: 'festivo' },
    '8-2': { nombre: 'Virgen de los Ángeles', tipo: 'festivo' },
    '8-15': { nombre: 'Día de la Madre', tipo: 'celebracion' },
    '9-15': { nombre: 'Día de la Independencia', tipo: 'festivo' },
    '10-12': { nombre: 'Día de las Culturas', tipo: 'festivo' },
    '12-25': { nombre: 'Navidad', tipo: 'festivo' },
    '12-24': { nombre: 'Nochebuena', tipo: 'celebracion' },
    '12-31': { nombre: 'Fin de Año', tipo: 'celebracion' },
    '2-14': { nombre: 'Día del Amor', tipo: 'celebracion' },
    '6-23': { nombre: 'Día del Padre', tipo: 'celebracion' },
    '9-9': { nombre: 'Día del Niño', tipo: 'celebracion' },
  };

  // Semana Santa (fechas variables - 2025)
  const semanaSanta2025 = ['4-13', '4-14', '4-15', '4-16', '4-17', '4-18'];

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];

    // Días del mes anterior (para llenar la primera semana)
    const mesAnterior = new Date(año, mes, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      dias.push({
        numero: diasMesAnterior - i,
        mesActual: false,
        fecha: new Date(año, mes - 1, diasMesAnterior - i)
      });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push({
        numero: dia,
        mesActual: true,
        fecha: new Date(año, mes, dia)
      });
    }

    // Días del mes siguiente (para completar la última semana)
    const diasRestantes = 42 - dias.length; // 6 semanas × 7 días
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push({
        numero: dia,
        mesActual: false,
        fecha: new Date(año, mes + 1, dia)
      });
    }

    return dias;
  };

  const esFestivo = (fecha) => {
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    const clave = `${mes}-${dia}`;
    
    if (diasFestivos[clave]) return diasFestivos[clave];
    if (semanaSanta2025.includes(clave) && fecha.getFullYear() === 2025) {
      return { nombre: 'Semana Santa', tipo: 'festivo' };
    }
    return null;
  };

  const esHoy = (fecha) => {
    return fecha.toDateString() === fechaActual.toDateString();
  };

  const mesSiguiente = () => {
    setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setMesVista(new Date(mesVista.getFullYear(), mesVista.getMonth() - 1, 1));
  };

  const irHoy = () => {
    setMesVista(new Date());
  };

  const handleMouseEnter = (index) => {
    setHoveredDay(index);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const dias = obtenerDiasDelMes(mesVista);

  // Soporte para teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        mesSiguiente();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        mesAnterior();
        e.preventDefault();
      } else if (e.key === 'Home') {
        irHoy();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesVista]);

  return (
    <>
      <div className="calendario-overlay" onClick={onClose}></div>
      <div className="calendario-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cal-header">
          <div className="cal-header-left">
            <span className="cal-icon">📅</span>
            <h3 className="cal-title">Calendario</h3>
          </div>
          <button className="cal-close-btn" onClick={onClose} title="Cerrar calendario">
            ✕
          </button>
        </div>

        {/* Controles de navegación */}
        <div className="cal-navigation">
          <button className="cal-nav-btn" onClick={mesAnterior} title="Mes anterior">
            ◀
          </button>
          <div className="cal-month-year">
            <span className="cal-month">{meses[mesVista.getMonth()]}</span>
            <span className="cal-year">{mesVista.getFullYear()}</span>
          </div>
          <button className="cal-nav-btn" onClick={mesSiguiente} title="Mes siguiente">
            ▶
          </button>
        </div>

        <button className="cal-today-btn" onClick={irHoy}>
          📍 Hoy
        </button>

        {/* Días de la semana */}
        <div className="cal-weekdays">
          {diasSemana.map((dia, index) => (
            <div 
              key={dia} 
              className={`cal-weekday ${index === 0 || index === 6 ? 'weekend' : ''}`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="cal-days">
          {dias.map((dia, index) => {
            const festivo = dia.mesActual ? esFestivo(dia.fecha) : null;
            const hoy = esHoy(dia.fecha);
            const esDomingo = dia.fecha.getDay() === 0;
            const esSabado = dia.fecha.getDay() === 6;

            return (
              <div
                key={index}
                className={`cal-day 
                  ${!dia.mesActual ? 'other-month' : ''} 
                  ${hoy ? 'today' : ''} 
                  ${festivo ? `festivo-${festivo.tipo}` : ''}
                  ${esDomingo || esSabado ? 'weekend-day' : ''}
                `}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <span className="cal-day-number">{dia.numero}</span>
                {festivo && dia.mesActual && (
                  <>
                    <div className="cal-festivo-indicator">
                      {festivo.tipo === 'festivo' ? '🎉' : '🎈'}
                    </div>
                    {hoveredDay === index && (
                      <div className="cal-tooltip">
                        {festivo.nombre}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <span className="legend-color today-legend"></span>
            <span>Hoy</span>
          </div>
          <div className="cal-legend-item">
            <span className="legend-emoji">🎉</span>
            <span>Feriado</span>
          </div>
          <div className="cal-legend-item">
            <span className="legend-emoji">🎈</span>
            <span>Celebración</span>
          </div>
        </div>

        {/* Atajos de teclado */}
        <div className="cal-shortcuts">
          <span>◀ ▶ : Navegar meses</span>
          <span>Home: Hoy</span>
          <span>Esc: Cerrar</span>
        </div>
      </div>
    </>
  );
};

export default Calendario;
