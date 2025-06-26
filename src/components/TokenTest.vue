<template>
  <div class="token-test">
    <h2>Token 测试页面</h2>
    
    <div class="auth-status">
      <h3>认证状态</h3>
      <p><strong>是否已登录:</strong> {{ authStatus.isLoggedIn ? '是' : '否' }}</p>
      <p><strong>Token:</strong> {{ authStatus.token ? authStatus.token.substring(0, 20) + '...' : '无' }}</p>
      <p><strong>Refresh Token:</strong> {{ authStatus.refreshToken ? authStatus.refreshToken.substring(0, 20) + '...' : '无' }}</p>
      <p><strong>用户信息:</strong> {{ authStatus.user ? JSON.stringify(authStatus.user) : '无' }}</p>
    </div>
    
    <div class="actions">
      <h3>操作</h3>
      <el-button @click="refreshStatus">刷新状态</el-button>
      <el-button @click="clearAuth" type="danger">清除认证信息</el-button>
      <el-button @click="goToLogin">跳转到登录页</el-button>
    </div>
    
    <div class="api-test">
      <h3>API 测试</h3>
      <el-button @click="testGetUserInfo">测试获取用户信息</el-button>
      <div v-if="apiResult">
        <h4>API 结果:</h4>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAuthStatus, clearAuth } from '../utils/auth.js'
import { userAPI } from '../api/index.js'

export default {
  name: 'TokenTest',
  setup() {
    const router = useRouter()
    const authStatus = reactive(getAuthStatus())
    const apiResult = ref(null)
    
    const refreshStatus = () => {
      Object.assign(authStatus, getAuthStatus())
      ElMessage.success('状态已刷新')
    }
    
    const clearAuthData = () => {
      clearAuth()
      Object.assign(authStatus, getAuthStatus())
      ElMessage.success('认证信息已清除')
    }
    
    const goToLogin = () => {
      router.push('/login')
    }
    
    const testGetUserInfo = async () => {
      try {
        const user = authStatus.user
        if (!user || !user.id) {
          ElMessage.warning('请先登录并确保用户信息包含ID')
          return
        }
        
        const result = await userAPI.getUserInfo(user.id)
        apiResult.value = result
        ElMessage.success('API调用成功')
      } catch (error) {
        console.error('API test failed:', error)
        apiResult.value = { error: error.message }
        ElMessage.error('API调用失败: ' + error.message)
      }
    }
    
    onMounted(() => {
      console.log('TokenTest component mounted')
      console.log('Current auth status:', authStatus)
    })
    
    return {
      authStatus,
      apiResult,
      refreshStatus,
      clearAuth: clearAuthData,
      goToLogin,
      testGetUserInfo
    }
  }
}
</script>

<style scoped>
.token-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.auth-status, .actions, .api-test {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #f9f9f9;
}

.auth-status p {
  margin: 8px 0;
  font-family: monospace;
}

.actions .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.api-test pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style> 