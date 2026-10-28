# Estructura y rutas

| Carpeta | Responsabilidad |
|---|---|
| src/views | Pantallas |
| src/components | Componentes de cuenta, tienda, auth, administración, contacto y layout |
| src/services | Peticiones HTTP por función |
| src/stores | Sesión y cesta con Pinia |
| src/composables | Lógica reutilizable, como useCheckout |
| src/router | Rutas, scroll y controles previos |
| src/utils y src/data | Utilidades y datos locales |
| src/assets y public | Recursos visuales |
| e2e | Playwright y helpers de datos ficticios |

## Rutas

| Acceso | Rutas |
|---|---|
| Público | /, /about, /tailoring, /contact, /privacy, /returns |
| Acceso/recuperación | /login, /register, /forgot-password, /reset-password |
| Tienda y cesta | /shop, /shop/:id, /cart |
| Con sesión | /account, /account/addresses, /checkout, /orders/:id |
| ADMIN | /admin/products, /admin/orders, /admin/returns, /admin/popups |

Privacidad, devoluciones y recuperación tienen importación diferida. El router consulta la sesión en rutas protegidas; sin sesión redirige al login y un cliente sin rol ADMIN vuelve a Mi cuenta. La API vuelve a comprobar los permisos.

## Persistencia de cesta

cartStore usa equisibe-cart:v1:ID en localStorage. setOwner cambia propietario y líneas de forma conjunta; una suscripción síncrona guarda las modificaciones. Valida los datos leídos y descarta entradas corruptas o de versión desconocida. Si el almacenamiento está bloqueado, sigue funcionando en memoria.

Logout vacía la cesta visible, conservando la copia de esa cuenta. Al volver se restaura; otra cuenta no la ve. No almacena credenciales, y sus importes no son una fuente fiable para cobrar. [Diagramas](09-Diagramas.md).
