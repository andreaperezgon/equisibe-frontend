# Operación y cierre

| Síntoma | Comprobación |
|---|---|
| No se comprueba sesión/tienda | Backend en 8080, CORS y mismo origen localhost |
| Cesta vacía | Cuenta/navegador correctos y almacenamiento disponible |
| Descuento no disponible | Código habilitado y popup activo del mismo código |
| Cuenta atrás termina y sigue cerrada | Reapertura manual por ADMIN |
| Foto no visible | Archivo conservado y URL/productImageUrl correctos |
| ECONNREFUSED en E2E | Backend test,e2e iniciado en 8080 |
| Timeout E2E | Revisar traza y estabilidad; ejecución con --timeout=120000 |

## Entrega y despliegue

La entrega funcional local queda cerrada con el alcance probado. Publicar requiere configurar dominio/hosting, HTTPS, API, callbacks de Google, cookies/CORS y persistencia/copias de imágenes y datos. El backend aún redirige Google a localhost:5173 y los servicios contienen URL locales.

Stripe funciona en modo prueba. Los apartados de privacidad sobre proveedores y tratamiento deben corresponder al alojamiento finalmente contratado. Móvil/tablet se revisó manualmente según lo comunicado; no se presenta como auditoría automática completa de accesibilidad.

docs conserva documentación junto al código y se prepara una copia para la wiki. Sin commit/push no cambia la wiki pública. dist, coverage y los informes de pruebas son resultados generados.
