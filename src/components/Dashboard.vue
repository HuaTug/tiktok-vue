<template>
  <div class="dashboard-container">
    <el-container>
      <el-header class="dashboard-header">
        <div class="header-left">
          <h2>TikTok Dashboard</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :src="user.avatar_url" :size="32">
                {{ user.user_name?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ user.user_name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  Profile
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="dashboard-main">
        <div class="welcome-section">
          <el-card class="welcome-card">
            <h3>Welcome back, {{ user.user_name }}!</h3>
            <p>Here's your account overview</p>
          </el-card>
        </div>
        
        <div class="stats-section">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon size="24"><User /></el-icon>
                  </div>
                  <div class="stat-info">
                    <h4>Profile</h4>
                    <p>Manage your account</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon size="24"><Message /></el-icon>
                  </div>
                  <div class="stat-info">
                    <h4>Email</h4>
                    <p>{{ user.email }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon">
                    <el-icon size="24"><Calendar /></el-icon>
                  </div>
                  <div class="stat-info">
                    <h4>Member Since</h4>
                    <p>{{ formatDate(user.created_at) }}</p>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <div class="actions-section">
          <el-card class="actions-card">
            <template #header>
              <h4>Quick Actions</h4>
            </template>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-button type="primary" size="large" @click="goToProfile">
                  <el-icon><Edit /></el-icon>
                  Edit Profile
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-button type="info" size="large" @click="refreshUserInfo">
                  <el-icon><Refresh /></el-icon>
                  Refresh Info
                </el-button>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userAPI } from '../api/index.js'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const user = reactive({})
    
    const loadUserInfo = () => {
      const userInfo = localStorage.getItem('user')
      if (userInfo) {
        Object.assign(user, JSON.parse(userInfo))
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString()
    }
    
    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          goToProfile()
          break
        case 'logout':
          handleLogout()
          break
      }
    }
    
    const goToProfile = () => {
      router.push('/profile')
    }
    
    const refreshUserInfo = async () => {
      try {
        if (!user.user_id) return
        
        const response = await userAPI.getUserInfo(user.user_id)
        if (response.base && response.base.code === 0) {
          Object.assign(user, response.user)
          localStorage.setItem('user', JSON.stringify(response.user))
          ElMessage.success('User info refreshed!')
        }
      } catch (error) {
        console.error('Refresh error:', error)
        ElMessage.error('Failed to refresh user info')
      }
    }
    
    const handleLogout = async () => {
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to logout?',
          'Confirm Logout',
          {
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
        
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        ElMessage.success('Logged out successfully!')
        router.push('/login')
      } catch {
        // User cancelled
      }
    }
    
    onMounted(() => {
      loadUserInfo()
    })
    
    return {
      user,
      formatDate,
      handleCommand,
      goToProfile,
      refreshUserInfo
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
}

.dashboard-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left h2 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f5f5;
}

.username {
  font-weight: 500;
  color: #333;
}

.dashboard-main {
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.welcome-card h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.welcome-card p {
  margin: 0;
  opacity: 0.9;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-weight: 600;
}

.stat-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.actions-section {
  margin-bottom: 24px;
}

.actions-card h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.actions-card .el-button {
  width: 100%;
  height: 48px;
}
</style>