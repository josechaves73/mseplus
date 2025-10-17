import { useState, useRef } from 'react';

/**
 * Hook personalizado para cargar opciones de select desde una API
 * @param {string} endpoint - URL del endpoint de la API
 * @param {string} dataKey - Clave del array en la respuesta (opcional)
 * @param {Array} fallbackData - Datos de respaldo en caso de error
 * @param {function} mapFunction - Función para mapear los datos (opcional)
 * @returns {Object} { options, completeData, loading, loaded, loadOptions, error }
 */
export const useSelectOptions = (endpoint, dataKey = null, fallbackData = [], mapFunction = null) => {
  const [options, setOptions] = useState([]);
  const [completeData, setCompleteData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);

  const loadOptions = async () => {
    if (isLoadingRef.current || loaded) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Error al cargar ${endpoint}`);
      }

      const data = await response.json();
      const optionsData = dataKey ? (data[dataKey] || []) : (Array.isArray(data) ? data : []);

      // Guardar datos completos
      setCompleteData(optionsData);

      // Aplicar función de mapeo si se proporciona
      const mappedOptions = mapFunction
        ? optionsData.map(mapFunction)
        : optionsData.map(item =>
            typeof item === 'string' ? item : (item.nombre || item.NOMBRE || item.tipo || item.TIPO || item.categoria || item.CATEGORIA || item.familia || item.FAMILIA || item.nombreu || item.unidad || item.UNIDAD || item.nombref || item.NOMBREF || 'N/A')
          );

      setOptions(mappedOptions);
      setLoaded(true);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.message);
      // Usar datos de respaldo
      setCompleteData(fallbackData);
      const fallbackOptions = mapFunction
        ? fallbackData.map(mapFunction)
        : fallbackData.map(item =>
            typeof item === 'string' ? item : (item.nombre || item.NOMBRE || item.tipo || item.TIPO || item.categoria || item.CATEGORIA || item.familia || item.FAMILIA || item.nombreu || item.unidad || item.UNIDAD || item.nombref || item.NOMBREF || 'N/A')
          );
      setOptions(fallbackOptions);
      setLoaded(true);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  return { options, completeData, loading, loaded, loadOptions, error };
};
