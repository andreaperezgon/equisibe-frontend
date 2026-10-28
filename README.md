# Equisibé · Frontend

Interfaz Vue del taller y tienda: información, catálogo, cuenta, cesta por usuario, checkout, devoluciones y administración.

**Vue 3 · Vite · Pinia · Vue Router · Tailwind CSS · Axios**

## Documentación

[Índice completo](docs/Home.md) · [Arranque](docs/02-Instalacion-y-arranque.md) · [Manual](docs/05-Manual-de-uso.md) · [Pruebas](docs/06-Pruebas.md) · [Diagramas Mermaid](docs/09-Diagramas.md)

[Wiki del frontend](https://github.com/andreaperezgon/equisibe-frontend/wiki) · [Backend](https://github.com/andreaperezgon/equisibe-backend)

## Arranque

Desde la carpeta con package.json, con Node compatible (utilizado: 24.16.0):

```bash
npm ci
npm run dev
```

http://localhost:5173; backend separado en http://localhost:8080.

```bash
npm run build
npm test -- --pool=threads --maxWorkers=1
```

## Calidad documentada

- Suite completa comunicada el 27/10/2026: **546/546 pruebas, 54 archivos, 100 % pasadas**.
- Cobertura guardada del 27/10: **96,64 % líneas, 84,04 % ramas, 95,44 % funciones y 93,09 % sentencias**. Precede a los últimos cambios.
- Comprobación posterior: **49/49 pruebas de cesta y sesión**, más ampliaciones dirigidas; build correcto.
- **22/22 E2E verificadas entre ejecuciones sucesivas** sobre frontend/backend conectados, sin cobros reales.

[Detalle, límites y comandos reproducibles](docs/06-Pruebas.md). No se confunde cobertura con porcentaje de casos correctos.

Revisión del 28/10/2026 sobre la rama local de desarrollo. La actualización de docs no implica publicación ni integración en main.
