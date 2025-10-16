# Componente MensajeModal

## Descripción
El componente `MensajeModal` es un modal elegante y reutilizable diseñado para la aplicación MSEPlus. Está basado en el diseño del modal de exportación y proporciona una interfaz consistente para mostrar mensajes, confirmaciones y contenido personalizado.

## Características
- 🎨 Diseño elegante con gradientes y animaciones
- 📱 Responsive (se adapta a móviles)
- 🔧 Altamente configurable
- ♿ Accesible (manejo de teclado y foco)
- 🎯 Tres tamaños disponibles (small, medium, large)
- ⚡ Optimizado para rendimiento

## Instalación
El componente ya está incluido en el proyecto MSEPlus. Solo necesitas importarlo:

```jsx
import MensajeModal from './components/MensajeModal';
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Controla la visibilidad del modal |
| `onClose` | `function` | - | Función llamada al cerrar el modal |
| `title` | `string` | - | Título del modal (opcional) |
| `children` | `ReactNode` | - | Contenido del modal |
| `buttons` | `Array` | `[]` | Array de botones (ver estructura abajo) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Tamaño del modal |
| `showCloseButton` | `boolean` | `true` | Mostrar botón de cerrar (X) |
| `loading` | `boolean` | `false` | Estado de carga (deshabilita botones) |
| `className` | `string` | `''` | Clases CSS adicionales |

## Estructura de Botones

Cada botón en el array `buttons` debe tener esta estructura:

```jsx
{
  label: string,           // Texto del botón
  onClick: function,       // Función al hacer clic
  className?: string,      // Clase CSS ('btn-secondary', 'btn-danger')
  disabled?: boolean,      // Deshabilitar botón
  icon?: string,          // Icono emoji (opcional)
  type?: string           // Tipo HTML ('button', 'submit')
}
```

## Ejemplos de Uso

### Modal de Confirmación
```jsx
<MensajeModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirmar Acción"
  buttons={[
    {
      label: "Confirmar",
      onClick: handleConfirm
    },
    {
      label: "Cancelar",
      onClick: () => setShowConfirm(false),
      className: "btn-secondary"
    }
  ]}
>
  <p>¿Estás seguro de que deseas continuar?</p>
</MensajeModal>
```

### Modal de Éxito
```jsx
<MensajeModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="¡Operación Exitosa!"
  buttons={[
    {
      label: "Aceptar",
      onClick: () => setShowSuccess(false)
    }
  ]}
>
  <p>Los datos se han guardado correctamente.</p>
</MensajeModal>
```

### Modal de Error
```jsx
<MensajeModal
  isOpen={showError}
  onClose={() => setShowError(false)}
  title="Error"
  buttons={[
    {
      label: "Reintentar",
      onClick: handleRetry,
      className: "btn-danger"
    },
    {
      label: "Cancelar",
      onClick: () => setShowError(false),
      className: "btn-secondary"
    }
  ]}
>
  <p>Ha ocurrido un error al procesar la solicitud.</p>
</MensajeModal>
```

### Modal con Carga
```jsx
<MensajeModal
  isOpen={showLoading}
  onClose={() => !loading && setShowLoading(false)}
  title="Procesando"
  loading={loading}
  buttons={[
    {
      label: loading ? "Procesando..." : "Iniciar",
      onClick: handleProcess,
      disabled: loading
    }
  ]}
>
  <p>Por favor espera mientras se procesa la información.</p>
</MensajeModal>
```

## Estilos CSS

El componente incluye estilos CSS completos en `MensajeModal.css`. Las clases principales son:

- `.mensaje-modal-overlay`: Fondo con blur
- `.mensaje-modal`: Contenedor principal
- `.mensaje-modal-header`: Cabecera con título
- `.mensaje-modal-body`: Cuerpo del contenido
- `.mensaje-modal-footer`: Pie con botones
- `.mensaje-modal-btn`: Estilos base de botones

### Variantes de Botón
- `.btn-secondary`: Botón secundario (gris)
- `.btn-danger`: Botón de peligro (rojo)
- Por defecto: Botón primario (verde)

### Tamaños
- `.mensaje-modal-small`: Modal pequeño (max 380px)
- `.mensaje-modal-medium`: Modal mediano (max 465px)
- `.mensaje-modal-large`: Modal grande (max 600px)

## Responsive

El modal es completamente responsive:
- **Desktop**: Tamaños fijos según la prop `size`
- **Móvil**: Se adapta al ancho de pantalla (90% con márgenes)

## Accesibilidad

- Soporte completo de teclado (Tab, Enter, Escape)
- Manejo correcto del foco
- Roles ARIA apropiados
- Contraste de colores adecuado

## Integración en MSEPlus

El componente ya está integrado en:
- `ListaBoletasModal`: Modal de exportación
- Puede usarse en cualquier modal del proyecto

Para usar en otros componentes, simplemente importa y configura las props según necesites.

## Consideraciones de Desarrollo

1. **Importación**: Asegúrate de importar tanto el componente como sus estilos CSS
2. **Estado**: Controla la visibilidad con `isOpen` y `onClose`
3. **Botones**: Define claramente las acciones para cada botón
4. **Contenido**: Usa `children` para contenido personalizado
5. **Loading**: Deshabilita interacciones durante procesos asíncronos

## Archivos Relacionados

- `MensajeModal.jsx`: Componente principal
- `MensajeModal.css`: Estilos CSS
- `MensajeModal-examples.jsx`: Ejemplos de uso
- `ListaBoletasModal.jsx`: Ejemplo de integración