import React, { useState, useEffect, useRef } from 'react';
import './MenuHorizontal.css';

const menuData = [
  {
    label: 'Artículos',
    icon: '📦', 
    color: '#2563eb',
    sub: [
      { label: 'Lista de Artículos', icon: '📋', color: '#3b82f6' },
      { label: 'Artículos por Cliente', icon: '👥', color: '#60a5fa' },
      { label: 'Familias', icon: '🏷️', color: '#818cf8' },
      { label: 'Reporte Agrupado', icon: '📊', color: '#a78bfa' },
    ]
  },
  {
    label: 'Boletas',
    icon: '📄', 
    color: '#22c55e',
    sub: [
      { label: 'Lista de Boletas', icon: '📋', color: '#4ade80' },
      { label: 'Trazabilidad', icon: '🔍', color: '#86efac' },
      { label: 'Reportes', icon: '📊', color: '#bbf7d0' },
    ]
  },
  { 
    label: 'Clientes', 
    icon: '👤', 
    color: '#f59e42', 
    sub: [
      { label: 'Lista de Clientes', icon: '📋', color: '#ffb366' }
    ] 
  },
  { 
    label: 'Transportes', 
    icon: '🚛', 
    color: '#f472b6', 
    sub: [
      { label: 'Lista de Vehículos', icon: '🚗', color: '#fb7185' },
      { label: 'Lista de Conductores', icon: '🧑‍✈️', color: '#fda4af' },
      { label: 'Documentación', icon: '📄', color: '#f87171' },
      // 'Reportes' sub-option removed as requested
    ] 
  },
  {
    label: 'Manifiestos',
    icon: '📑',
    color: '#facc15',
    sub: [
      { label: 'Lista de Manifiestos', icon: '📋', color: '#7c3aed' }
    ]
  },
  { 
    label: 'Utilidades', 
    icon: '🔧', 
    color: '#06b6d4',
    sub: [
      { label: 'Enviar Email', icon: '📬', color: '#0891b2' },
      { label: 'Historial de Emails', icon: '📧', color: '#0e7490' }
    ]
  },
  { 
    label: 'Configuración', 
    icon: '⚙️', 
    color: '#a78bfa',
    sub: [
      { label: 'Configuración General', icon: '🔧', color: '#d4af37' },
      { label: 'Wallpaper', icon: '🎨', color: '#06b6d4' },
      { label: 'Configuración de Emails', icon: '⚙️', color: '#c084fc' },
      { label: 'Usuarios', icon: '👥', color: '#10b981' }
    ]
  },
  { 
    label: 'Salir', 
    icon: '🚪', 
    color: '#ef4444' 
  },
];

const MenuHorizontal = ({ onOpenListaArticulos, onOpenListaVehiculos, onOpenListaConductores, onOpenListaBoletas, onOpenFamilias, onOpenReporteBoletas, onOpenListaClientes, onOpenClientePorArticulos, onOpenListaManifiestos, onOpenTrazabilidad, onOpenReporteAgrupado, onOpenConfiguracionEmail, onOpenConfiguracionDashboard, onOpenConfiguracionGeneral, onOpenEnviarEmail, onOpenHistorialEmails, onOpenTransportesDocu, onOpenGestionUsuarios, onLogout }) => {
  const [open, setOpen] = useState(null);
  const menuRef = useRef(null);

  const handleClick = idx => {
    setOpen(open === idx ? null : idx);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="menu-horizontal" ref={menuRef}>
      {menuData.map((item, idx) => (
        <div key={item.label} className="menu-item-group">
          <button
            className="menu-item"
            style={{ color: item.color }}
            onClick={() => {
              if (item.sub) {
                handleClick(idx);
              } else if (item.label === 'Salir' && onLogout) {
                onLogout();
              } else {
                setOpen(null);
              }
            }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            {item.sub && <span className={`menu-arrow ${open === idx ? 'open' : ''}`}>▼</span>}
          </button>
          {item.sub && open === idx && (
            <div className="submenu">
                {item.sub.map(sub => (
                <button key={sub.label} className="submenu-item" style={{ color: sub.color }} onClick={() => {
                  setOpen(null);
                  if (sub.label === 'Lista de Artículos' && onOpenListaArticulos) {
                    onOpenListaArticulos();
                  } else if (sub.label === 'Lista de Vehículos' && onOpenListaVehiculos) {
                    onOpenListaVehiculos();
                  } else if (sub.label === 'Lista de Conductores' && onOpenListaConductores) {
                    onOpenListaConductores();
                  } else if (sub.label === 'Documentación' && onOpenTransportesDocu) {
                    console.log('📄 MenuHorizontal - Clic en Documentación');
                    onOpenTransportesDocu();
                  } else if (sub.label === 'Lista de Boletas' && onOpenListaBoletas) {
                    onOpenListaBoletas();
                  } else if (sub.label === 'Trazabilidad' && onOpenTrazabilidad) {
                    onOpenTrazabilidad();
                  } else if (sub.label === 'Familias' && onOpenFamilias) {
                    onOpenFamilias();
                  } else if (sub.label === 'Reportes' && onOpenReporteBoletas) {
                    onOpenReporteBoletas();
                  } else if (sub.label === 'Lista de Clientes' && onOpenListaClientes) {
                    onOpenListaClientes();
                  } else if (sub.label === 'Lista de Manifiestos' && onOpenListaManifiestos) {
                    onOpenListaManifiestos();
                  } else if (sub.label === 'Artículos por Cliente' && onOpenClientePorArticulos) {
                    onOpenClientePorArticulos();
                  } else if (sub.label === 'Reporte Agrupado' && onOpenReporteAgrupado) {
                    onOpenReporteAgrupado();
                  } else if (sub.label === 'Configuración General' && onOpenConfiguracionGeneral) {
                    console.log('🔧 MenuHorizontal - Clic en Configuración General');
                    onOpenConfiguracionGeneral();
                  } else if (sub.label === 'Wallpaper' && onOpenConfiguracionDashboard) {
                    console.log('🎨 MenuHorizontal - Clic en Configuración de Wallpaper');
                    onOpenConfiguracionDashboard();
                  } else if (sub.label === 'Configuración de Emails' && onOpenConfiguracionEmail) {
                    console.log('🔧 MenuHorizontal - Clic en Configuración de Emails');
                    onOpenConfiguracionEmail();
                  } else if (sub.label === 'Usuarios' && onOpenGestionUsuarios) {
                    console.log('👥 MenuHorizontal - Clic en Gestión de Usuarios');
                    onOpenGestionUsuarios();
                  } else if (sub.label === 'Enviar Email' && onOpenEnviarEmail) {
                    console.log('📬 MenuHorizontal - Clic en Enviar Email');
                    onOpenEnviarEmail();
                  } else if (sub.label === 'Historial de Emails' && onOpenHistorialEmails) {
                    console.log('📧 MenuHorizontal - Clic en Historial de Emails');
                    onOpenHistorialEmails();
                  }
                }}>
                  <span className="submenu-icon">{sub.icon}</span>
                  <span className="submenu-label">{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default MenuHorizontal;
