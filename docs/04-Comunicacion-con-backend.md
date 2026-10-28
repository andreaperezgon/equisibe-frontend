# Comunicación con el backend

La API utiliza http://localhost:8080/api. Axios envía la cookie de sesión con withCredentials. No se utiliza JWT en el navegador.

GET /api/auth/csrf devuelve token y nombre de cabecera para modificar datos. Login renueva sesión y CSRF. Logout invalida JSESSIONID. GET /api/auth/me proporciona la cuenta y su rol; authStore comunica la identidad a cartStore.

| Servicios | Función |
|---|---|
| authService / passwordResetService | Acceso, sesión y recuperación |
| productService / cartService | Catálogo y validación |
| favoriteService / shippingAddressService | Datos privados |
| checkoutService / orderService | Compra, pedidos y Stripe |
| returnService / adminReturnService | Solicitudes y respuestas |
| adminProductService / adminOrderService | Catálogo y gestión de pedidos |
| popupService / shopSettingsService | Anuncios, descuentos y cierre |

## Compra

```json
{
  "shippingAddressId": 1,
  "items": [{ "productId": 1, "size": "S", "quantity": 1 }],
  "promoCode": "EQUISIBE10"
}
```

El código es opcional. El servidor comprueba propiedad de dirección, productos activos, tallas, stock, precios, rebajas, descuento y envío. Comprobar compra no crea ni cobra un pedido. Cambiar dirección, líneas o código invalida la validación previa.

Un código debe estar habilitado y tener al menos un popup activo con ese mismo código. Un popup de otro código no lo habilita. Crear/editar un popup no exige que esté activo.

El pago crea el pedido y solicita una sesión de Stripe. Volver de Stripe no confirma el pago: lo confirma el webhook verificado por el servidor.

## Google, correo e imágenes

Google navega al endpoint OAuth del backend y vuelve con una sesión local. No se vincula automáticamente una cuenta local existente por coincidir el correo.

Contacto y recuperación solicitan al backend el envío del correo; nunca reciben claves SMTP. La subida de fotos usa FormData con el campo file. Dejar que el navegador complete el Content-Type multipart. productImageUrl resuelve las fotos del backend y conserva los recursos estáticos.

## Errores

401 indica sesión necesaria; 403 permisos o CSRF; 409 conflicto; 503 puede indicar cierre o servicio no disponible. Mostrar la respuesta de error y no dar éxito antes de recibir confirmación. El cierre bloquea compras nuevas también desde el servidor y conserva el acceso a Contacto.
