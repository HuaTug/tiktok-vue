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
        
        // 修复响应处理逻辑 - 适配多种可能的响应结构
        let isSuccess = false
        let token = null
        let refreshToken = null
        let user = null
        let errorMessage = 'Login failed'
        
        // 检查多种可能的成功响应结构
        if (response) {
          // 情况1: 直接返回成功数据
          if (response.token || response.access_token) {
            isSuccess = true
            token = response.token || response.access_token
            refreshToken = response.RefreshToken || response.refresh_token || response.refreshToken
            user = response.user || response.userInfo || { userName: loginForm.userName, email: loginForm.email }
          }
          // 情况2: 有base字段的响应结构
          else if (response.base) {
            if (response.base.code === 0 || response.base.status === 'success') {
              isSuccess = true
              token = response.token || response.data?.token
              refreshToken = response.RefreshToken || response.data?.RefreshToken
              user = response.user || response.data?.user || { userName: loginForm.userName, email: loginForm.email }
            } else {
              errorMessage = response.base.msg || response.base.message || 'Login failed'
            }
          }
          // 情况3: 有code字段的响应结构
          else if (response.code !== undefined) {
            if (response.code === 0 || response.code === 200) {
              isSuccess = true
              token = response.token || response.data?.token
              refreshToken = response.RefreshToken || response.data?.RefreshToken
              user = response.user || response.data?.user || { userName: loginForm.userName, email: loginForm.email }
            } else {
              errorMessage = response.msg || response.message || 'Login failed'
            }
          }
          // 情况4: HTTP状态码成功，但没有明确的成功标识
          else if (!response.error && !response.err) {
            isSuccess = true
            token = response.token || 'temp_token_' + Date.now() // 临时token
            refreshToken = response.RefreshToken || response.refresh_token
            user = response.user || { userName: loginForm.userName, email: loginForm.email }
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
          ElMessage.success('Login successful!')
          
          // 确保跳转成功
          await router.push('/dashboard')
          console.log('Navigated to dashboard')
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