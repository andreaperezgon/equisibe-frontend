import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import TailoringView from '../views/TailoringView.vue'
import ContactView from '../views/ContactView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
  path: '/about',
  name: 'about',
  component: AboutView,
},
{
  path: '/tailoring',
  name: 'tailoring',
  component: TailoringView,
},
{
  path: '/contact',
  name: 'contact',
  component: ContactView,
},
{
  path: '/register',
  name: 'register',
  component: RegisterView,
},
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  
}
)


export default router