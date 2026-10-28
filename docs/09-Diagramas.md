# Diagramas del frontend

## Arquitectura general

```mermaid
flowchart LR
    Persona[Cliente o administrador] --> Vue[SPA Vue 3]
    Vue --> Router[Vue Router]
    Vue --> Pinia[Estado Pinia]
    Pinia --> Local[localStorage: cesta por cuenta]
    Vue --> Axios[Servicios Axios]
    Axios -->|HTTP y cookie| Security[Spring Security y CSRF]
    Security --> Controller[Controladores REST]
    Controller --> Service[Servicios de negocio]
    Service --> Repo[Repositorios JPA]
    Repo --> MySQL[(MySQL en desarrollo)]
    Repo -. pruebas .-> H2[(H2 en memoria)]
    Service --> Stripe[Stripe en modo prueba]
    Service --> Mail[Gmail SMTP]
    Security --> Google[Google OAuth2 y OIDC]
    Controller --> Images[Disco: fotos de productos]
```

El backend es una aplicación organizada por capas, no microservicios. El frontend es una SPA con componentes, vistas, servicios y stores. El servidor aplica permisos y reglas de negocio aunque el navegador ya compruebe el acceso.


## Pantallas y estado

```mermaid
flowchart TD
    App[App y layout] --> Publico[Inicio, equipo, a medida y contacto]
    App --> Auth[Login, registro y recuperación]
    App --> Shop[Tienda y ficha]
    App --> Cuenta[Mi cuenta y direcciones]
    App --> Admin[Paneles ADMIN]
    Auth --> AuthStore[authStore]
    Cuenta --> AuthStore
    AuthStore -->|setOwner| CartStore[cartStore]
    Shop --> CartStore
    CartStore --> Cart[Cesta y checkout]
    Cart --> UseCheckout[useCheckout]
    UseCheckout --> API[Servicios HTTP]
    Admin --> API
    Cuenta --> API
```

## Cesta por cuenta

```mermaid
sequenceDiagram
    actor Usuario
    participant Auth as authStore
    participant Cart as cartStore
    participant Local as localStorage
    Usuario->>Auth: Inicia sesión o recarga
    Auth->>Cart: setOwner con ID
    Cart->>Local: Lee equisibe-cart:v1:ID
    Local-->>Cart: Líneas guardadas
    Cart->>Cart: Valida y restaura
    Usuario->>Cart: Modifica cantidades
    Cart->>Local: Guarda para esa cuenta
    Usuario->>Auth: Cierra sesión
    Auth->>Cart: setOwner sin cuenta
    Cart->>Cart: Vacía solo la cesta visible
    Note over Cart,Local: Conserva la copia para el próximo acceso
```

## Rutas protegidas

```mermaid
flowchart TD
    Ruta[Entrar en ruta] --> Protegida{Requiere sesión}
    Protegida -->|No| Vista[Mostrar vista]
    Protegida -->|Sí| Me[Consultar API de cuenta]
    Me --> Sesion{Sesión válida}
    Sesion -->|No| Login[Login]
    Sesion -->|Sí| Admin{Requiere ADMIN}
    Admin -->|No| Vista
    Admin -->|Sí| Rol{Cuenta ADMIN}
    Rol -->|Sí| Vista
    Rol -->|No| Cuenta[Mi cuenta]
```

La autorización de la API se aplica independientemente de estas comprobaciones del navegador.
