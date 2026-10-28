# Instalación y arranque

## Requisitos y desarrollo

Git, Node compatible con las dependencias (entorno utilizado: 24.16.0) y backend en localhost:8080 para las funciones conectadas. Entrar en la carpeta que contiene package.json. En la instalación actual:

```bash
cd "/c/Users/usuario/Documents/EQUISIBÉ/equisibe-frontend/equisibe-frontend"
npm ci
npm run dev
```

Abrir http://localhost:5173. Mantener la terminal abierta; Ctrl+C detiene el proceso. Una copia nueva de Git puede tener una sola carpeta con ese nombre.

## Build y vista previa

```bash
npm run build
npm run preview
```

El build genera dist. La vista previa comprueba ese resultado; no arranca la API ni publica la web. El build pasó después del cambio de persistencia de cesta.

## Configuración e imágenes

Los servicios todavía contienen URL locales. No suponer que una variable VITE_API_URL cambie todas las llamadas: revisar servicios y productImageUrl al desplegar.

| Origen | Tratamiento |
|---|---|
| src/assets | Vite procesa las importaciones y las incluye en el build |
| public | Recursos copiados al build y accesibles por ruta |
| Subida de administración | Archivo del backend servido desde /api/product-images/ |

Las fotos del frontend viajan con dist. Docker mantiene MySQL en desarrollo; las fotos subidas necesitan persistencia propia en el servidor.

## Pruebas

```bash
npm test -- --pool=threads --maxWorkers=1
npm test -- --coverage --coverage.include="src/**/*.{js,vue}" --pool=threads --maxWorkers=1
```

[Resultados y E2E](06-Pruebas.md).
