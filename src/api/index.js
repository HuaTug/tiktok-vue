import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',  // 保持 /api 前缀，通过Vite代理转发
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

// User API functions - 修正所有API路径和参数格式
export const userAPI = {
  // Create user (register) - 修正路径为 /v1/user/create/
  createUser: (userData) => {
    return api.post('/v1/user/create/', {
      user_name: userData.userName,  // 匹配后端 thrift 定义
      password: userData.password,
      email: userData.email,
      sex: userData.sex
    })
  },

  // Login user - 修正路径为 /v1/user/login，修正参数名
  loginUser: (loginData) => {
    return api.post('/v1/user/login', {
      user_name: loginData.userName,  // 匹配后端 thrift 定义
      Password: loginData.password,   // 注意大写P，匹配后端 LoginUserResquest 结构
      Email: loginData.email          // 注意大写E，匹配后端 LoginUserResquest 结构
    })
  },

  // Get user info - 修正路径为 /v1/user/get，使用查询参数
  getUserInfo: (userId) => {
    return api.get('/v1/user/get', {
      params: { userId: userId }  // 匹配后端 GetUserInfoRequest 结构
    })
  },

  // Update user - 修正路径为 /v1/user/update，使用POST方法
  updateUser: (userData) => {
    return api.post('/v1/user/update', {
      user_name: userData.userName,  // 匹配后端 UpdateUserRequest 结构
      userId: userData.userId,
      password: userData.password,
      data: userData.data,
      filesize: userData.filesize
    })
  },

  // Delete user - 修正路径为 /v1/user/delete，使用DELETE方法和查询参数
  deleteUser: (userId) => {
    return api.delete('/v1/user/delete', {
      params: { userId: userId }  // 匹配后端 DeleteUserRequest 结构
    })
  },

  // Query user - 修正路径为 /v1/user/query/，使用POST方法
  queryUser: (params) => {
    return api.post('/v1/user/query/', {
      Keyword: params.keyword,    // 匹配后端 QueryUserRequest 结构
      page: params.page,
      page_size: params.page_size
    })
  },

  // Send verification code - 修正路径为 /v1/user/sendcode
  sendCode: (email) => {
    return api.post('/v1/user/sendcode', { 
      email: email  // 匹配后端 SendCodeRequest 结构
    })
  },

  // Verify code - 修正路径为 /v1/user/verifycode
  verifyCode: (email, code) => {
    return api.post('/v1/user/verifycode', { 
      code: code,   // 匹配后端 VerifyCodeRequest 结构
      email: email
    })
  },

  // Check user exists by ID - 修正路径为 /v1/user/check
  checkUserExistsById: (userId) => {
    return api.post('/v1/user/check', { 
      userId: userId  // 匹配后端 CheckUserExistsByIdRequst 结构
    })
  }
}

export default api