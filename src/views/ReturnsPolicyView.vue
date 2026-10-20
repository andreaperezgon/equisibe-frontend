<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="returns-policy">
    <p class="eyebrow">Equisibé · Información de compra</p>
    <h1>Política de devoluciones</h1>
    <p class="updated">Última actualización: 20 de octubre de 2026.</p>

    <section>
      <h2>1. Plazo para comunicar la devolución</h2>
      <p>
        Para las prendas no personalizadas compradas online, ofrecemos
        15 días naturales desde su recepción para comunicar que quieres
        devolverlas, sin necesidad de justificar el motivo.
        Este plazo amplía el mínimo legal de 14 días.
      </p>
      <p>
        Si un mismo pedido se entrega por separado, el plazo se cuenta
        desde la recepción del último bien cuando así corresponda legalmente.
      </p>
    </section>

    <section>
      <h2>2. Cómo solicitarla</h2>
      <p>
        Entra en «Mi cuenta», abre tu pedido y pulsa «Solicitar devolución».
        Selecciona las prendas y cantidades y confirma el envío.
        El comentario es opcional. Podrás consultar el número, fecha,
        estado y respuesta del taller en el mismo pedido.
      </p>
      <RouterLink to="/account" class="policy-button">Ir a mis pedidos →</RouterLink>
      <p>
        También puedes comunicar tu decisión a
        <a href="mailto:equisibe@gmail.com">equisibe@gmail.com</a>,
        indicando tu nombre, número de pedido y las prendas que devuelves.
        La comunicación no depende de una aprobación previa del taller.
      </p>
    </section>

    <section>
      <h2>3. Envío y estado de las prendas</h2>
      <p>
        Debes enviar o entregar las prendas, como máximo, en los 14 días
        naturales siguientes a la comunicación de tu decisión.
        En las devoluciones voluntarias, los costes directos del envío
        de vuelta corren a cargo del cliente.
      </p>
      <p>
        Puedes probar las prendas como lo harías en una tienda.
        Solo responderás de una pérdida de valor causada por una manipulación
        mayor de la necesaria para comprobar su naturaleza y características.
        Embálalas de forma que estén protegidas durante el transporte.
      </p>
      <address>
        Equisibé — Pablo Álvarez<br>
        Plaza de la Constitución, 3, 3.º<br>
        33009 Oviedo, Asturias, España
      </address>
    </section>

    <section>
      <h2>4. Reembolso</h2>
      <p>
        El reembolso se realizará sin demora indebida y, como máximo,
        en los 14 días naturales siguientes a recibir tu comunicación,
        utilizando el mismo medio de pago salvo acuerdo expreso distinto
        y sin gastos para ti.
      </p>
      <p>
        Podemos retenerlo hasta recibir las prendas o una prueba de su envío,
        lo que ocurra primero, salvo que nos hayamos ofrecido a recogerlas.
        Si devuelves todo el pedido, se incluyen los gastos de entrega
        ordinaria; no los suplementos por una entrega más cara elegida por ti.
        En devoluciones parciales se calculará el importe correspondiente.
      </p>
      <p>
        No se sustituirá obligatoriamente el reembolso por un vale
        o por otra prenda.
      </p>
    </section>

    <section>
      <h2>5. Prendas a medida o personalizadas</h2>
      <p>
        El derecho de desistimiento no se aplica a prendas confeccionadas
        según tus especificaciones o claramente personalizadas.
        Que una prenda sea artesanal o se fabrique después de comprarla
        no basta, por sí solo, para aplicar esta excepción.
        Esta excepción no limita tus derechos ante defectos o errores.
      </p>
    </section>

    <section>
      <h2>6. Prendas defectuosas o equivocadas</h2>
      <p>
        Escríbenos a
        <a href="mailto:equisibe@gmail.com">equisibe@gmail.com</a>
        con el número de pedido, una descripción y, si es posible,
        fotografías. Te indicaremos cómo tramitar la incidencia.
        Los costes necesarios para resolver una falta de conformidad
        no se cargarán al cliente.
      </p>
      <p>
        Se aplicarán las soluciones y garantías legales correspondientes.
        El plazo de devolución voluntaria de esta página no limita
        esos derechos.
      </p>
    </section>

    <section>
      <h2>7. Modelo opcional de comunicación</h2>
      <p>Puedes copiar este texto y enviarlo por correo:</p>
      <blockquote>
        A la atención de Equisibé:<br>
        Comunico mi decisión de desistir de la compra de las siguientes prendas:<br>
        Pedido y prendas: [indicar].<br>
        Fecha de recepción: [indicar].<br>
        Nombre y dirección del cliente: [indicar].<br>
        Fecha de comunicación: [indicar].
      </blockquote>
      <p>
        Este modelo no es obligatorio: basta con comunicar claramente
        tu decisión dentro del plazo.
      </p>
    </section>
  </main>
</template>

<style scoped>
.returns-policy {
  max-width: 900px;
  margin: 44px auto;
  padding: 38px;
  border: 1px solid #d8dddf;
  border-radius: 8px;
  background: #f8f7f4;
}
.eyebrow {
  color: #53616a;
  font-size: 12px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
h1 {
  margin-top: 14px;
  font-size: clamp(27px, 4vw, 35px);
  font-weight: 500;
  line-height: 1.5;
}
.updated {
  margin-top: 14px;
  color: #53616a;
  font-size: 13px;
}
section {
  margin-top: 32px;
}
h2 {
  margin-bottom: 14px;
  font-size: 21px;
  font-weight: 500;
  line-height: 1.6;
}
p, address, blockquote {
  font-size: 15px;
  line-height: 1.95;
}
p + p {
  margin-top: 14px;
}
a {
  color: #425963;
  text-decoration: underline;
  text-underline-offset: 4px;
  overflow-wrap: anywhere;
}
address, blockquote {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #d8dddf;
  border-radius: 5px;
  background: #fcfcfa;
  font-style: normal;
}
.policy-button {
  display: inline-block;
  margin: 20px 0;
  padding: 12px 18px;
  border: 1px solid #c3d2d8;
  border-radius: 4px;
  background: #e2eaed;
  text-decoration: none;
}
a:focus-visible {
  outline: 2px solid #738b96;
  outline-offset: 4px;
}
@media (max-width: 600px) {
  .returns-policy {
    margin: 24px 16px;
    padding: 26px 20px;
  }
  h2 {
    font-size: 19px;
  }
}
</style>
