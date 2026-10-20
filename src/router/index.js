import AdminPopupsView from '../views/AdminPopupsView.vue'
import AdminOrdersView from '../views/AdminOrdersView.vue'
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
import OrderView from '../views/OrderView.vue'
import AdminProductsView from '../views/AdminProductsView.vue'

const routes = [
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
  },
  {
    path: '/admin/popups',
    name: 'admin-popups',
    component: AdminPopupsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'admin-orders',
    component: AdminOrdersView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/products',
    name: 'admin-products',
    component: AdminProductsView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/orders/:id',
    name: 'order',
    component: OrderView,
    meta: { requiresAuth: true },
  },
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

  if (to.meta.requiresAdmin && authStore.user?.role !== 'ADMIN') {
    return { name: 'account' }
  }

  return true
})

export default router
