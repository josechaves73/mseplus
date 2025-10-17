import { useState, useCallback } from 'react';

export const useClienteArticulos = () => {
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState('');

  const [articulosAsignados, setArticulosAsignados] = useState([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);

  const [articulosParaAsignar, setArticulosParaAsignar] = useState([]);
  const [loadingArticulosParaAsignar, setLoadingArticulosParaAsignar] = useState(false);

  // Cargar clientes
  const fetchClientes = useCallback(async () => {
    console.log('🔍 Cargando clientes...');
    setLoadingClientes(true);
    setErrorClientes('');
    try {
      const response = await fetch('/api/clientes-basico');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('✅ Clientes cargados:', data?.length || 0);
      setClientes(data || []);
    } catch (err) {
      console.error('❌ Error cargando clientes:', err);
      setErrorClientes(err.message);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  // Verificar artículos asignados a un cliente
  const checkClienteArticulos = useCallback(async (codigoCliente, onComplete) => {
    if (!codigoCliente) return;

    console.log('🔍 Verificando artículos del cliente:', codigoCliente);
    setLoadingArticulos(true);
    try {
      const response = await fetch(`/api/articulos-x-cliente/${codigoCliente}`);
      if (response.ok) {
        const data = await response.json();
        const articulosOrdenados = data.sort((a, b) => a.descri.localeCompare(b.descri));
        console.log('✅ Artículos asignados cargados:', articulosOrdenados.length);
        setArticulosAsignados(articulosOrdenados);

        // Llamar callback si se proporciona
        if (onComplete) {
          onComplete(articulosOrdenados.length > 0);
        }
      } else {
        console.log('ℹ️ Cliente sin artículos asignados');
        setArticulosAsignados([]);
        if (onComplete) {
          onComplete(false);
        }
      }
    } catch (error) {
      console.error('❌ Error verificando artículos del cliente:', error);
      setArticulosAsignados([]);
      if (onComplete) {
        onComplete(false);
      }
    } finally {
      setLoadingArticulos(false);
    }
  }, []);

  // Cargar artículos disponibles para asignación
  const loadArticulosParaAsignar = useCallback(async () => {
    console.log('🔍 Cargando artículos para asignación...');
    setLoadingArticulosParaAsignar(true);
    try {
      const response = await fetch('/api/articulos-para-asignacion');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Artículos para asignación cargados:', data?.length || 0);
        setArticulosParaAsignar(data || []);
      } else {
        console.error('❌ Error cargando artículos para asignación');
        setArticulosParaAsignar([]);
      }
    } catch (error) {
      console.error('❌ Error cargando artículos para asignación:', error);
      setArticulosParaAsignar([]);
    } finally {
      setLoadingArticulosParaAsignar(false);
    }
  }, []);

  // Asignar artículo a cliente
  const asignarArticulo = useCallback(async (articulo, cliente, ciiu = '', simarde = '') => {
    console.log('🔗 Asignando artículo:', articulo.codigo, 'al cliente:', cliente.codigo);

    const asignacionData = {
      codigo: articulo.codigo,
      descri: articulo.descri,
      code_cli: cliente.codigo,
      ciiu: ciiu || '',
      simarde: simarde || '',
      tipo_cert: articulo.tipo_cert,
      tipo_res: articulo.tipo_res
    };

    const response = await fetch('/api/asignar-articulo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asignacionData)
    });

    const result = await response.json();

    if (response.status === 409 && result.duplicate) {
      return { success: false, duplicate: true, error: 'Artículo ya asignado' };
    } else if (result.success) {
      console.log('✅ Artículo asignado exitosamente');
      // Recargar artículos del cliente
      await checkClienteArticulos(cliente.codigo);
      return { success: true };
    } else {
      console.error('❌ Error asignando artículo:', result.error);
      return { success: false, error: result.error || 'Error al asignar el artículo' };
    }
  }, [checkClienteArticulos]);

  // Eliminar artículo asignado
  const eliminarArticulo = useCallback(async (clienteCodigo, articuloCodigo) => {
    console.log('🗑️ Eliminando artículo:', articuloCodigo, 'del cliente:', clienteCodigo);

    const response = await fetch(`/api/articulos-x-cliente/${clienteCodigo}/${articuloCodigo}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log('✅ Artículo eliminado exitosamente');
      // Actualizar lista local
      setArticulosAsignados(prev => prev.filter(art => art.codigo !== articuloCodigo));
      return { success: true };
    } else {
      console.error('❌ Error eliminando artículo');
      return { success: false, error: 'Error al eliminar artículo' };
    }
  }, []);

  return {
    // Estados
    clientes,
    loadingClientes,
    errorClientes,
    articulosAsignados,
    loadingArticulos,
    articulosParaAsignar,
    loadingArticulosParaAsignar,

    // Acciones
    fetchClientes,
    checkClienteArticulos,
    loadArticulosParaAsignar,
    asignarArticulo,
    eliminarArticulo,

    // Utilidades
    setArticulosAsignados
  };
};
