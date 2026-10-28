# Descripción y tecnologías

Revisión del **28 de octubre de 2026** sobre el código local de las ramas de desarrollo. No se afirma que los cambios estén integrados en main o publicados en GitHub.

Equisibé combina la web de un taller de confección con tienda y panel de gestión. El diseño conserva Comfortaa, fondo azul suave, superficies claras y controles redondeados.

| Tecnología | Versión declarada | Función |
|---|---|---|
| Vue | ^3.5.42 | Componentes y Composition API |
| Vue Router | ^5.3.1 | Rutas y controles de acceso |
| Pinia | ^4.0.3 | Estado de autenticación y cesta |
| Vite | ^8.3.0 | Desarrollo y build |
| Tailwind CSS | ^4.3.3 | Estilos junto con CSS propio |
| Axios | ^1.20.0 | Peticiones HTTP |
| Vitest / Vue Test Utils / jsdom | ^5.0.2 / ^2.5.1 / ^30.1.1 | Pruebas de lógica y componentes |
| Playwright | ^1.64.1 | E2E en navegador |

package-lock.json fija las versiones instaladas; npm ci reproduce ese árbol. El entorno utilizado tiene Node 24.16.0.

## Funciones

- Inicio con carrusel de fotos recortadas uniformemente, bordes redondeados y ampliación al pasar el cursor; Quiénes somos y A medida.
- Contacto conectado al correo del taller; privacidad y devoluciones accesibles desde el footer.
- Registro, sesión, Google, cierre de sesión y recuperación de contraseña.
- Perfil, direcciones, favoritos, pedidos y solicitudes de devolución.
- Catálogo, categoría, talla, stock, rebajas, cesta y validación de compra.
- Administración de productos/imágenes, existencias, pedidos, devoluciones, popups y cierre/apertura de tienda.

La cesta se conserva por cuenta en el mismo navegador. No sincroniza dispositivos. Precios y existencias se recalculan en el servidor.
