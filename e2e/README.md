# E2E de Equisibé


## E2E con Playwright

Se han validado **22/22 escenarios de Chromium (100 %) entre ejecuciones sucesivas**, no en una única ejecución final. La ejecución inicial obtuvo 18/21; se corrigieron el selector del popup y la pérdida de cesta al recargar, y se añadió la separación de cesta por cuenta. Los cuatro escenarios afectados terminaron pasando en repeticiones dirigidas.

Los errores de suspensión de red y de arranque de Chromium no se contaron como éxitos. El checkout superó el límite inicial de un minuto y pasó al repetirlo con 120 segundos.

| Área | Casos | Alcance |
|---|---:|---|
| Navegación | 6 | Inicio, privacidad/devoluciones desde footer, login/registro y rutas protegidas |
| Cliente | 10 | Registro, sesión, errores de acceso, direcciones, favoritos, tallas, cesta, checkout, permisos y cesta separada por cuenta |
| Administración | 6 | Productos, imágenes, rebajas/stock, pedidos, devoluciones, descuento por popup y dos tipos de cierre |
| Total | **22** | Frontend y backend conectados con datos ficticios |

Las E2E no realizan cobros, envíos reales de correo ni el recorrido externo de Google. Los pedidos pagados de administración son fixtures, no evidencia de un pago real. Las integraciones externas tienen pruebas de backend con dobles de prueba.

### Arranque del entorno aislado

Detener primero el backend habitual del puerto 8080. En Git Bash:

```bash
cd "/c/Users/usuario/Documents/EQUISIBÉ/equisibe-backend/equisibe-backend"
mvn spring-boot:test-run -Dspring-boot.run.profiles=test,e2e
```

Esperar a Started EquisibeBackendApplication. En otra terminal:

```bash
cd "/c/Users/usuario/Documents/EQUISIBÉ/equisibe-frontend/equisibe-frontend"
npx playwright install chromium
npm run test:e2e -- --timeout=120000
```

Playwright prepara Vite en localhost:5173 o reutiliza el servidor local. Mantener el equipo despierto. Para abrir su interfaz o informe:

```bash
npm run test:e2e:ui
npm run test:e2e:report
```

El perfil test,e2e usa jdbc:h2:mem:equisibe_e2e, sin Docker, correo ni reconciliación de Stripe. Las imágenes temporales van a target/e2e-uploads. Las fixtures y /api/admin/e2e/orders están en src/test, fuera del JAR de producción; el endpoint exige ADMIN y CSRF. El helper verifica X-Equisibe-E2E: isolated-memory antes de modificar datos.

Cuentas exclusivamente ficticias: e2e-admin@example.test y e2e-customer@example.test, contraseña E2eOnly!2026. No son cuentas reales del negocio. El resto se genera con identificadores únicos. Al terminar, Ctrl+C en el backend temporal y arrancar el habitual. Stripe CLI no es necesario.


[Documentación de calidad](../docs/06-Pruebas.md)
