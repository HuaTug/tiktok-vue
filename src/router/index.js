import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/auth.js'

// 导入组件
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import Profile from '../components/Profile.vue'
import Dashboard from '../components/Dashboard.vue'
import VideoPage from '../components/VideoPage.vue'
import TokenTest from '../components/TokenTest.vue'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: 'Register',
      requiresAuth: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile',
      requiresAuth: true
    }
  },
  {
    path: '/video',
    name: 'VideoPage',
    component: VideoPage,
    meta: {
      title: 'Video Player',
      requiresAuth: true
    }
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: VideoPage,
    props: true,
    meta: {
      title: 'Video Player',
      requiresAuth: true
    }
  },
  {
    path: '/token-test',
    name: 'TokenTest',
    component: TokenTest,
    meta: {
      title: 'Token Test',
      requiresAuth: false
    }
  },
  {
    // 404 页面
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/login'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 页面跳转时滚动到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = isLoggedIn()
  
  console.log('Route Guard:', {
    to: to.path,
    from: from.path,
    isAuthenticated,
    requiresAuth: to.meta.requiresAuth
  })

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Video Platform`
  }

  // 如果要访问需要认证的页面但用户未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login: not authenticated')
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 保存原始路径，登录后可以跳转回来
    })
    return
  }

  // 如果用户已登录但访问登录/注册页面，重定向到视频页面
  if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    console.log('Redirecting to video: already authenticated')
    next('/video')
    return
  }

  // 其他情况正常导航
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
})

export default router