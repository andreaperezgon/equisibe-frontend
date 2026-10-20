<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="admin-section-nav" aria-label="Secciones de administración">
    <RouterLink to="/account" exact-active-class="selected">Mi panel</RouterLink>
    <RouterLink to="/admin/orders" active-class="selected">Pedidos</RouterLink>
    <RouterLink to="/admin/products" active-class="selected">Productos</RouterLink>
    <RouterLink to="/admin/popups" active-class="selected">Popups y tienda</RouterLink>
  </nav>
</template>

<style scoped>
.admin-section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
  padding: 8px;
  border: 1px solid #d8dddf;
  border-radius: 6px;
  background: #f8f7f4;
}
.admin-section-nav a {
  padding: 12px 17px;
  border-radius: 4px;
  color: #425963;
  font-size: 14px;
  line-height: 1.6;
}
.admin-section-nav a:hover,
.admin-section-nav a.selected {
  background: #e2eaed;
}
.admin-section-nav a:focus-visible {
  outline: 2px solid #738b96;
  outline-offset: 2px;
}
@media (max-width: 540px) {
  .admin-section-nav a {
    flex: 1 1 40%;
    padding: 11px;
    text-align: center;
  }
}
</style>
