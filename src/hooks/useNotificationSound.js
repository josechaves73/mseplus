import { useCallback, useRef } from 'react';

export const useNotificationSound = () => {
  const audioContextRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Crear un contexto de audio si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Crear un oscilador para generar un beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Conectar el oscilador al gain node y luego a la salida
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar el sonido (frecuencia y duración)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // Bajada de tono

      // Configurar el volumen
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      // Configurar el tipo de onda
      oscillator.type = 'sine';

      // Reproducir el sonido
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('No se pudo reproducir el sonido de notificación:', error);
    }
  }, []);

  return { playNotificationSound };
};