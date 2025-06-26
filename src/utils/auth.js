/**
 * 认证相关工具函数
 */

// Token 存储键名
const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'

/**
 * 保存访问token
 * @param {string} token - 访问token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    console.log('Token saved successfully')
  }
}

/**
 * 获取访问token
 * @returns {string|null} 访问token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 保存刷新token
 * @param {string} refreshToken - 刷新token
 */
export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    console.log('Refresh token saved successfully')
  }
}

/**
 * 获取刷新token
 * @returns {string|null} 刷新token
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 保存用户信息
 * @param {object} user - 用户信息对象
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    console.log('User info saved successfully')
  }
}

/**
 * 获取用户信息
 * @returns {object|null} 用户信息对象
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Failed to parse user info:', error)
    return null
  }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isLoggedIn = () => {
  return !!getToken()
}

/**
 * 清除所有认证信息
 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  console.log('All auth data cleared')
}

/**
 * 登录成功后保存认证信息
 * @param {object} authData - 认证数据对象
 * @param {string} authData.token - 访问token
 * @param {string} authData.refreshToken - 刷新token（可选）
 * @param {object} authData.user - 用户信息（可选）
 */
export const saveAuthData = (authData) => {
  const { token, refreshToken, user } = authData
  
  if (token) {
    setToken(token)
  }
  
  if (refreshToken) {
    setRefreshToken(refreshToken)
  }
  
  if (user) {
    setUser(user)
  } else if (authData.userName) {
    // 如果没有用户信息但有用户名，创建一个基本的用户对象
    setUser({
      userName: authData.userName,
      email: authData.email || ''
    })
  }
  
  console.log('Auth data saved successfully:', {
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    hasUser: !!user
  })
}

/**
 * 获取认证状态信息
 * @returns {object} 认证状态对象
 */
export const getAuthStatus = () => {
  return {
    isLoggedIn: isLoggedIn(),
    token: getToken(),
    refreshToken: getRefreshToken(),
    user: getUser()
  }
}

export default {
  setToken,
  getToken,
  setRefreshToken,
  getRefreshToken,
  setUser,
  getUser,
  isLoggedIn,
  clearAuth,
  saveAuthData,
  getAuthStatus
} 