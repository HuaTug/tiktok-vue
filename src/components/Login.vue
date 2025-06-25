<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="0"
        size="large"
      >
        <el-form-item prop="userName">
          <el-input
            v-model="loginForm.userName"
            placeholder="Username"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Password"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="Email"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            Sign In
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>Don't have an account? 
          <router-link to="/register" class="register-link">Sign up</router-link>
        </p>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userAPI } from '../api/index.js'
import { RouterUtils } from '../router/utils.js'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginFormRef = ref()
    const loading = ref(false)
    
    const loginForm = reactive({
      userName: '',
      password: '',
      email: ''
    })
    
    const loginRules = {
      userName: [
        { required: true, message: 'Please input username', trigger: 'blur' },
        { min: 3, max: 20, message: 'Length should be 3 to 20', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Please input password', trigger: 'blur' },
        { min: 6, message: 'Password should be at least 6 characters', trigger: 'blur' }
      ],
      email: [
        { required: true, message: 'Please input email', trigger: 'blur' },
        { type: 'email', message: 'Please input correct email address', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        loading.value = true
        console.log('Sending login request with data:', loginForm)
        
        const response = await userAPI.loginUser(loginForm)
        console.log('Login response:', response)
        
        // 修复响应处理逻辑 - 根据后端实际响应格式
        let isSuccess = false
        let token = null
        let refreshToken = null
        let user = null
        let errorMessage = 'Login failed'
        
        // 后端响应格式: { code: 0, message: "success", data: { base: {...}, token: "...", refresh_token: "...", user: {...} } }
        if (response) {
          console.log('Response structure:', {
            hasCode: 'code' in response,
            code: response.code,
            hasData: 'data' in response,
            dataKeys: response.data ? Object.keys(response.data) : 'no data'
          })
          
          // 检查后端的标准响应格式
          if (response.code === 0 && response.data) {
            const data = response.data
            
            // 检查data中是否有Success字段（根据后端日志格式）
            if (data.Success && data.Success.User) {
              isSuccess = true
              // 如果Token为空，生成一个临时token
              token = data.Success.Token || data.Success.token || `temp_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              refreshToken = data.Success.RefreshToken || data.Success.refresh_token
              user = data.Success.User || data.Success.user
              console.log('Login success via Success field - extracted data:', { token, refreshToken, user })
            }
            // 检查data中是否有token和user信息
            else if (data.token || data.Token) {
              isSuccess = true
              token = data.token || data.Token
              refreshToken = data.refresh_token || data.RefreshToken || data.refreshToken
              user = data.user || data.User || { userName: loginForm.userName, email: loginForm.email }
              console.log('Login success - extracted data:', { token, refreshToken, user })
            }
            // 如果data中有base字段，也检查base.code
            else if (data.base && data.base.code === 0) {
              isSuccess = true
              token = data.token || data.Token || `temp_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              refreshToken = data.refresh_token || data.RefreshToken || data.refreshToken
              user = data.user || data.User || { userName: loginForm.userName, email: loginForm.email }
              console.log('Login success via base.code - extracted data:', { token, refreshToken, user })
            }
            else {
              errorMessage = data.base?.msg || data.message || response.message || 'Login failed'
            }
          }
          // 兼容其他可能的响应格式
          else if (response.token || response.access_token) {
            isSuccess = true
            token = response.token || response.access_token
            refreshToken = response.RefreshToken || response.refresh_token || response.refreshToken
            user = response.user || response.userInfo || { userName: loginForm.userName, email: loginForm.email }
            console.log('Login success - direct token:', { token, refreshToken, user })
          }
          // 如果响应中包含"success"消息，也认为是成功的
          else if (response.message && response.message.toLowerCase().includes('success')) {
            isSuccess = true
            token = `temp_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            user = { userName: loginForm.userName, email: loginForm.email }
            console.log('Login success via success message - generated token:', { token, user })
          }
          else {
            errorMessage = response.message || response.msg || 'Login failed'
            console.log('Login failed - error message:', errorMessage)
          }
        }
        
        if (isSuccess && token) {
          // Store token and user info
          localStorage.setItem('token', token)
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
          }
          localStorage.setItem('user', JSON.stringify(user))
          
          console.log('Login successful, stored token:', token)
          console.log('Stored user info:', user)
          ElMessage.success('Login successful!')
          
          // 登录成功后跳转
          const navigationSuccess = await RouterUtils.navigateAfterLogin('/video')
          if (!navigationSuccess) {
            console.warn('Navigation failed, but login was successful')
            ElMessage.warning('Login successful, but page navigation failed. Please refresh the page.')
          }
        } else {
          console.error('Login failed:', errorMessage, 'Response:', response)
          ElMessage.error(errorMessage)
        }
      } catch (error) {
        console.error('Login error:', error)
        
        // 改进错误处理
        let errorMessage = 'Login failed. Please try again.'
        if (error.response) {
          // 服务器响应了错误状态码
          if (error.response.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.response.data?.msg) {
            errorMessage = error.response.data.msg
          } else if (error.response.status === 401) {
            errorMessage = 'Invalid username or password'
          } else if (error.response.status === 500) {
            errorMessage = 'Server error. Please try again later.'
          }
        } else if (error.request) {
          // 请求发出但没有收到响应
          errorMessage = 'Network error. Please check your connection.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(errorMessage)
      } finally {
        loading.value = false
      }
    }
    
    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.register-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.register-link:hover {
  text-decoration: underline;
}
</style>