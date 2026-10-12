import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import TailoringView from '../views/TailoringView.vue'
import ContactView from '../views/ContactView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import AccountView from '../views/AccountView.vue'
import ShopView from '../views/ShopView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import CartView from '../views/CartView.vue'
import ShippingAddressesView from '../views/ShippingAddressesView.vue'
import CheckoutView from '../views/CheckoutView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: AboutView },
  { path: '/tailoring', name: 'tailoring', component: TailoringView },
  { path: '/contact', name: 'contact', component: ContactView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/shop', name: 'shop', component: ShopView },
  {
    path: '/shop/:id',
    name: 'product-detail',
    component: ProductDetailView,
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
    meta: { requiresAuth: true },
  },
  {
    path: '/account',
    name: 'account',
    component: AccountView,
    meta: { requiresAuth: true },
  },
  {
    path: '/account/addresses',
    name: 'shipping-addresses',
    component: ShippingAddressesView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()

  try {
    await authStore.fetchCurrentUser()
  } catch {
    return { name: 'login' }
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  return true
})

export default router