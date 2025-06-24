<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>Create Account</h2>
          <p>Join us today</p>
        </div>
      </template>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="0"
        size="large"
      >
        <el-form-item prop="userName">
          <el-input
            v-model="registerForm.userName"
            placeholder="Username"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="Email"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="Password"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="Confirm Password"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="sex">
          <el-select
            v-model="registerForm.sex"
            placeholder="Select Gender"
            style="width: 100%"
          >
            <el-option label="Male" :value="1" />
            <el-option label="Female" :value="2" />
            <el-option label="Other" :value="0" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            Create Account
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <p>Already have an account? 
          <router-link to="/login" class="login-link">Sign in</router-link>
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
  name: 'Register',
  setup() {
    const router = useRouter()
    const registerFormRef = ref()
    const loading = ref(false)
    
    const registerForm = reactive({
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      sex: 0
    })
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error('Passwords do not match'))
      } else {
        callback()
      }
    }
    
    const registerRules = {
      userName: [
        { required: true, message: 'Please input username', trigger: 'blur' },
        { min: 3, max: 20, message: 'Length should be 3 to 20', trigger: 'blur' }
      ],
      email: [
        { required: true, message: 'Please input email', trigger: 'blur' },
        { type: 'email', message: 'Please input correct email address', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Please input password', trigger: 'blur' },
        { min: 6, message: 'Password should be at least 6 characters', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: 'Please confirm password', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      sex: [
        { required: true, message: 'Please select gender', trigger: 'change' }
      ]
    }
    
    const handleRegister = async () => {
      try {
        const valid = await registerFormRef.value.validate()
        if (!valid) return
        
        loading.value = true
        const response = await userAPI.createUser({
          userName: registerForm.userName,
          password: registerForm.password,
          email: registerForm.email,
          sex: registerForm.sex
        })
        
        ElMessage.success('Registration successful! Please login.')
        router.push('/login')
      } catch (error) {
        console.error('Registration error:', error)
        ElMessage.error('Registration failed. Please try again.')
      } finally {
        loading.value = false
      }
    }
    
    return {
      registerFormRef,
      registerForm,
      registerRules,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.register-card {
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

.register-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.register-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}
</style>