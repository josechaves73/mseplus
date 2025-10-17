import React, { useState, useEffect } from 'react';
import './HistorialEmailsModal.css';

const HistorialEmailsModal = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Cargar historial de emails
  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/email-history');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails || []);
      } else {
        throw new Error(data.message || 'Error al cargar historial');
      }
    } catch (err) {
      console.error('Error al cargar emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar emails
  useEffect(() => {
    let filtered = emails;

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(email => 
        email.to_email?.toLowerCase().includes(search) ||
        email.subject?.toLowerCase().includes(search) ||
        email.cliente_codigo?.toLowerCase().includes(search) ||
        email.account_name?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(email => new Date(email.sent_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(email => new Date(email.sent_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(email => new Date(email.sent_at) >= filterDate);
          break;
      }
    }

    setFilteredEmails(filtered);
  }, [emails, searchTerm, statusFilter, dateFilter]);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen && emails.length === 0) {
      fetchEmails();
    }
  }, [isOpen, emails.length]);

  // Ver detalles del email
  const handleViewDetails = (email) => {
    setSelectedEmail(email);
  };

  if (!isOpen) return null;

  return (
    <div className="historial-emails-modal-overlay">
      <div className="historial-emails-modal">
        <div className="historial-emails-header">
          <h2>📧 Historial de Emails</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Filtros */}
        <div className="historial-emails-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Buscar por destinatario, asunto, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los estados</option>
              <option value="sent">Enviados</option>
              <option value="failed">Fallidos</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>

          <button onClick={fetchEmails} className="refresh-button">
            🔄 Actualizar
          </button>
        </div>

        {/* Contenido */}
        <div className="historial-emails-content">
          {loading && <div className="loading">Cargando historial...</div>}
          
          {error && (
            <div className="error-message">
              ❌ Error: {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="results-info">
                📈 {filteredEmails.length} email(s) encontrado(s) de {emails.length} total(es)
              </div>

              <div className="emails-table-container">
                <table className="emails-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Destinatario</th>
                      <th>Asunto</th>
                      <th>Estado</th>
                      <th>Cuenta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map((email, index) => (
                      <tr key={`${email.id}-${index}`} className={email.status === 'failed' ? 'failed-row' : ''}>
                        <td>{new Date(email.sent_at).toLocaleString()}</td>
                        <td>{email.cliente_codigo || 'N/A'}</td>
                        <td>{email.to_email}</td>
                        <td className="subject-cell">{email.subject}</td>
                        <td>
                          <span className={`status-badge ${email.status}`}>
                            {email.status === 'sent' ? '✅ Enviado' : 
                             email.status === 'failed' ? '❌ Fallido' : '⏳ Pendiente'}
                          </span>
                        </td>
                        <td>{email.account_name}</td>
                        <td>
                          <button 
                            onClick={() => handleViewDetails(email)}
                            className="view-button"
                          >
                            👁️ Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEmails.length === 0 && !loading && (
                  <div className="no-results">
                    📭 No se encontraron emails con los filtros aplicados
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal de detalles */}
        {selectedEmail && (
          <div className="email-details-overlay">
            <div className="email-details-modal">
              <div className="email-details-header">
                <h3>📧 Detalles del Email</h3>
                <button onClick={() => setSelectedEmail(null)}>×</button>
              </div>
              <div className="email-details-content">
                <div className="detail-row">
                  <strong>Fecha:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}
                </div>
                <div className="detail-row">
                  <strong>Cliente:</strong> {selectedEmail.cliente_codigo || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Destinatario:</strong> {selectedEmail.to_email}
                </div>
                {selectedEmail.cc_email && (
                  <div className="detail-row">
                    <strong>CC:</strong> {selectedEmail.cc_email}
                  </div>
                )}
                {selectedEmail.bcc_email && (
                  <div className="detail-row">
                    <strong>CCO:</strong> {selectedEmail.bcc_email}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Asunto:</strong> {selectedEmail.subject}
                </div>
                <div className="detail-row">
                  <strong>Estado:</strong> 
                  <span className={`status-badge ${selectedEmail.status}`}>
                    {selectedEmail.status === 'sent' ? '✅ Enviado' : 
                     selectedEmail.status === 'failed' ? '❌ Fallido' : '⏳ Pendiente'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Cuenta:</strong> {selectedEmail.account_name}
                </div>
                {selectedEmail.message_id && (
                  <div className="detail-row">
                    <strong>Message ID:</strong> {selectedEmail.message_id}
                  </div>
                )}
                {selectedEmail.error_message && (
                  <div className="detail-row error">
                    <strong>Error:</strong> {selectedEmail.error_message}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Contenido:</strong>
                  <div className="email-body">
                    {selectedEmail.body_text}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialEmailsModal;
