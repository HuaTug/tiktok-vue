import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Profile from './components/Profile.vue'
import Dashboard from './components/Dashboard.vue'

// Router configuration
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  console.log('Route guard - navigating to:', to.path, 'token exists:', !!token)
  
  if (to.meta.requiresAuth && !token) {
    console.log('Route guard - redirecting to login (no token)')
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    console.log('Route guard - redirecting to dashboard (already logged in)')
    next('/dashboard')
  } else {
    console.log('Route guard - allowing navigation')
    next()
  }
})

const app = createApp(App)

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')