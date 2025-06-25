import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// User API functions
export const userAPI = {
  // Create user (register)
  createUser: (userData) => {
    return api.post('/v1/user/create', {
      user_name: userData.userName,
      password: userData.password,
      email: userData.email,
      sex: userData.sex
    })
  },
  // 其他 API 函数保持不变


  // Login user
  loginUser: (loginData) => {
    return api.post('/v1/user/login', {
      user_name: loginData.userName,
      Password: loginData.password,
      Email: loginData.email
    })
  },

  // Get user info
  getUserInfo: (userId) => {
    return api.get(`/user/info/${userId}`)
  },

  // Update user
  updateUser: (userData) => {
    return api.put('/user/update', {
      user_name: userData.userName,
      userId: userData.userId,
      password: userData.password,
      data: userData.data,
      filesize: userData.filesize
    })
  },

  // Delete user
  deleteUser: (userId) => {
    return api.delete(`/user/delete/${userId}`)
  },

  // Query user
  queryUser: (params) => {
    return api.get('/user/query', { params })
  },

  // Send verification code
  sendCode: (email) => {
    return api.post('/user/send-code', { email })
  },

  // Verify code
  verifyCode: (email, code) => {
    return api.post('/user/verify-code', { email, code })
  }
}

export default api