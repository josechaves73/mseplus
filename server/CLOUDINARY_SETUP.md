# Configuración de Cloudinary

## Pasos para configurar las credenciales de Cloudinary:

### 1. Obtener credenciales de Cloudinary
1. Ve a [Cloudinary Dashboard](https://cloudinary.com/console)
2. Inicia sesión en tu cuenta (la que tiene el cloud_name: `dbdcyfeew`)
3. En el Dashboard, encontrarás:
   - **Cloud Name**: `dbdcyfeew` (ya configurado)
   - **API Key**: (número de 15 dígitos)
   - **API Secret**: (cadena alfanumérica de ~40 caracteres)

### 2. Actualizar archivo .env
Abre el archivo `server/.env` y reemplaza las credenciales:

```env
# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=dbdcyfeew
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

### 3. Reiniciar el servidor
Después de actualizar las credenciales:
```bash
cd server
npm run dev
```

## Funcionalidades implementadas:

✅ **Eliminación automática de Cloudinary** - Las imágenes se eliminan tanto de la BD como de Cloudinary
✅ **Manejo de errores** - Si Cloudinary falla, la operación continúa (solo BD)
✅ **Feedback detallado** - Mensajes específicos sobre el éxito en BD y Cloudinary
✅ **Endpoint adicional** - `/api/cloudinary/:publicId` para eliminaciones manuales

## Verificación:
Una vez configurado, al eliminar una imagen verás en los logs del servidor:
```
Cloudinary deletion result: { result: 'ok' }
```

## Importante:
- Las credenciales deben mantenerse secretas
- No subir el archivo `.env` al repositorio
- Verificar que el upload_preset `mse_imagenes` esté configurado en Cloudinary
