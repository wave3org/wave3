# Configuración de Variables de Entorno en Render

## ⚠️ IMPORTANTE: Variables NEXT_PUBLIC_* en Docker

Las variables de entorno que comienzan con `NEXT_PUBLIC_*` en Next.js se **incrustan en el bundle del cliente durante el build**. Esto significa que:

1. Deben estar disponibles en **tiempo de build**, no solo en runtime
2. En Docker, necesitas usar `ARG` para pasarlas al build
3. En Render, debes configurarlas como **Build-time environment variables**

## 📋 Variables Requeridas

En tu servicio de Render para **nextjs**, configura:

### Build-time Environment Variables

En la sección "Build & Deploy" → "Docker" de Render, agrega:

```bash
NEXT_PUBLIC_ML_URL=https://ml-3l8u.onrender.com
NEXT_PUBLIC_STORAGE_URL=https://storage-xxxx.onrender.com
NEXT_PUBLIC_PONDER_URL=https://ponder-xxxx.onrender.com
```

### Cómo Configurar en Render

1. Ve a tu servicio **nextjs** en Render
2. Click en **"Environment"** en el menú lateral
3. En la sección **"Build-time Environment Variables"**, agrega:
   - Key: `NEXT_PUBLIC_ML_URL`
   - Value: `https://ml-3l8u.onrender.com`
   
4. Repite para las otras variables
5. **Importante**: También agrégalas en **"Environment Variables"** (runtime) por si acaso

### Build Args en Dockerfile

El Dockerfile ya está configurado para recibir estas variables:

```dockerfile
ARG NEXT_PUBLIC_ML_URL
ARG NEXT_PUBLIC_STORAGE_URL
ARG NEXT_PUBLIC_PONDER_URL

ENV NEXT_PUBLIC_ML_URL=${NEXT_PUBLIC_ML_URL}
ENV NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}
ENV NEXT_PUBLIC_PONDER_URL=${NEXT_PUBLIC_PONDER_URL}
```

## 🔍 Debug

El Dockerfile ahora imprime las variables durante el build. Revisa los logs del build en Render para verificar que las variables tienen los valores correctos:

```
========================================
🔍 VARIABLES DE ENTORNO EN BUILD TIME:
========================================
NEXT_PUBLIC_ML_URL=https://ml-3l8u.onrender.com
...
```

Si ves valores vacíos o localhost, significa que las variables no se están pasando correctamente desde Render.

## 🐛 Solución de Problemas

### Si las variables siguen siendo localhost:

1. Verifica que las variables están en **"Build-time Environment Variables"** (no solo en runtime)
2. Haz un **Manual Deploy** para forzar un nuevo build
3. Revisa los logs del build completo

### Alternativa: Docker Build Args

En Render, también puedes especificar build args en la configuración del servicio si tienes acceso a configuración avanzada de Docker.

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Render Docker Deployment](https://render.com/docs/docker)
