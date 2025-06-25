import router from './index'

/**
 * 路由导航工具类
 */
export class RouterUtils {
  /**
   * 安全导航到指定路径
   * @param {string|object} to - 目标路径或路由对象
   * @param {boolean} replace - 是否使用replace模式
   */
  static async navigateTo(to, replace = false) {
    try {
      if (replace) {
        await router.replace(to)
      } else {
        await router.push(to)
      }
      return true
    } catch (error) {
      console.error('Navigation failed:', error)
      return false
    }
  }

  /**
   * 登录后跳转
   * @param {string} fallbackPath - 默认跳转路径
   */
  static async navigateAfterLogin(fallbackPath = '/video') {
    try {
      // 获取重定向路径
      const redirectPath = router.currentRoute.value.query.redirect || fallbackPath
      console.log('Navigating after login to:', redirectPath)
      
      await router.push(redirectPath)
      return true
    } catch (error) {
      console.error('Post-login navigation failed:', error)
      // 尝试跳转到默认页面
      try {
        await router.push(fallbackPath)
        return true
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError)
        return false
      }
    }
  }

  /**
   * 登出并跳转到登录页
   */
  static async logout() {
    try {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // 跳转到登录页
      await router.replace('/login')
      return true
    } catch (error) {
      console.error('Logout navigation failed:', error)
      // 强制刷新页面
      window.location.href = '/login'
      return false
    }
  }

  /**
   * 检查当前路由是否需要认证
   */
  static requiresAuth() {
    return router.currentRoute.value.meta.requiresAuth || false
  }

  /**
   * 获取当前路由名称
   */
  static getCurrentRouteName() {
    return router.currentRoute.value.name
  }

  /**
   * 获取当前路由路径
   */
  static getCurrentPath() {
    return router.currentRoute.value.path
  }

  /**
   * 返回上一页
   */
  static goBack() {
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      // 如果没有历史记录，跳转到默认页面
      this.navigateTo('/dashboard')
    }
  }

  /**
   * 跳转到视频页面
   * @param {string|number} videoId - 视频ID（可选）
   */
  static goToVideo(videoId = null) {
    if (videoId) {
      return this.navigateTo(`/video/${videoId}`)
    } else {
      return this.navigateTo('/video')
    }
  }

  /**
   * 跳转到个人资料页面
   */
  static goToProfile() {
    return this.navigateTo('/profile')
  }

  /**
   * 跳转到仪表板
   */
  static goToDashboard() {
    return this.navigateTo('/dashboard')
  }
}

/**
 * 导航守卫工具
 */
export class NavigationGuards {
  /**
   * 检查用户是否已认证
   */
  static isAuthenticated() {
    return !!localStorage.getItem('token')
  }

  /**
   * 获取用户信息
   */
  static getUserInfo() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Failed to parse user info:', error)
      return null
    }
  }

  /**
   * 检查用户权限
   * @param {string} permission - 权限名称
   */
  static hasPermission(permission) {
    const user = this.getUserInfo()
    return user && user.permissions && user.permissions.includes(permission)
  }
}

export default RouterUtils