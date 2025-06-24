<template>
  <div class="profile-container">
    <el-container>
      <el-header class="profile-header">
        <div class="header-left">
          <el-button type="text" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            Back to Dashboard
          </el-button>
        </div>
        <div class="header-center">
          <h2>Profile Settings</h2>
        </div>
        <div class="header-right"></div>
      </el-header>
      
      <el-main class="profile-main">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-card class="avatar-card">
              <div class="avatar-section">
                <el-avatar :src="user.avatar_url" :size="120">
                  {{ user.user_name?.charAt(0).toUpperCase() }}
                </el-avatar>
                <h3>{{ user.user_name }}</h3>
                <p>{{ user.email }}</p>
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-change="handleAvatarChange"
                  accept="image/*"
                >
                  <el-button type="primary" size="small">
                    <el-icon><Upload /></el-icon>
                    Change Avatar
                  </el-button>
                </el-upload>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="16">
            <el-card class="profile-form-card">
              <template #header>
                <h4>Personal Information</h4>
              </template>
              
              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="120px"
                size="large"
              >
                <el-form-item label="Username" prop="userName">
                  <el-input
                    v-model="profileForm.userName"
                    placeholder="Enter username"
                    clearable
                  />
                </el-form-item>
                
                <el-form-item label="Email" prop="email">
                  <el-input
                    v-model="profileForm.email"
                    placeholder="Enter email"
                    clearable
                    disabled
                  />
                  <div class="form-tip">Email cannot be changed</div>
                </el-form-item>
                
                <el-form-item label="Gender" prop="sex">
                  <el-radio-group v-model="profileForm.sex">
                    <el-radio :label="1">Male</el-radio>
                    <el-radio :label="2">Female</el-radio>
                    <el-radio :label="0">Other</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="New Password" prop="password">
                  <el-input
                    v-model="profileForm.password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    show-password
                    clearable
                  />
                </el-form-item>
                
                <el-form-item label="Confirm Password" prop="confirmPassword">
                  <el-input
                    v-model="profileForm.confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    show-password
                    clearable
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="handleUpdateProfile"
                  >
                    Update Profile
                  </el-button>
                  <el-button @click="resetForm">
                    Reset
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row style="margin-top: 24px;">
          <el-col :span="24">
            <el-card class="danger-zone-card">
              <template #header>
                <h4 style="color: #f56c6c;">Danger Zone</h4>
              </template>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              <el-button type="danger" @click="handleDeleteAccount">
                Delete Account
              </el-button>
            </el-card>
          </el-col>
        </el-row>
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
  name: 'Profile',
  setup() {
    const router = useRouter()
    const profileFormRef = ref()
    const loading = ref(false)
    const user = reactive({})
    
    const profileForm = reactive({
      userName: '',
      email: '',
      sex: 0,
      password: '',
      confirmPassword: ''
    })
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (profileForm.password && value !== profileForm.password) {
        callback(new Error('Passwords do not match'))
      } else {
        callback()
      }
    }
    
    const profileRules = {
      userName: [
        { required: true, message: 'Please input username', trigger: 'blur' },
        { min: 3, max: 20, message: 'Length should be 3 to 20', trigger: 'blur' }
      ],
      password: [
        { min: 6, message: 'Password should be at least 6 characters', trigger: 'blur' }
      ],
      confirmPassword: [
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    }
    
    const loadUserInfo = () => {
      const userInfo = localStorage.getItem('user')
      if (userInfo) {
        const userData = JSON.parse(userInfo)
        Object.assign(user, userData)
        
        // Fill form with current user data
        profileForm.userName = userData.user_name || ''
        profileForm.email = userData.email || ''
        profileForm.sex = userData.sex || 0
      }
    }
    
    const goBack = () => {
      router.push('/dashboard')
    }
    
    const beforeAvatarUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2
      
      if (!isImage) {
        ElMessage.error('Avatar must be an image!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('Avatar size must be less than 2MB!')
        return false
      }
      return true
    }
    
    const handleAvatarChange = (file) => {
      // Convert file to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        user.avatar_url = e.target.result
      }
      reader.readAsDataURL(file.raw)
    }
    
    const handleUpdateProfile = async () => {
      try {
        const valid = await profileFormRef.value.validate()
        if (!valid) return
        
        loading.value = true
        
        // Prepare update data
        const updateData = {
          userName: profileForm.userName,
          userId: user.user_id,
          password: profileForm.password || undefined
        }
        
        // If avatar was changed, include it
        if (user.avatar_url && user.avatar_url.startsWith('data:')) {
          // Convert base64 to binary data
          const base64Data = user.avatar_url.split(',')[1]
          updateData.data = base64Data
          updateData.filesize = base64Data.length
        }
        
        const response = await userAPI.updateUser(updateData)
        
        if (response.base && response.base.code === 0) {
          // Update local storage
          const updatedUser = { ...user, user_name: profileForm.userName }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          Object.assign(user, updatedUser)
          
          ElMessage.success('Profile updated successfully!')
          
          // Clear password fields
          profileForm.password = ''
          profileForm.confirmPassword = ''
        } else {
          ElMessage.error(response.base?.msg || 'Update failed')
        }
      } catch (error) {
        console.error('Update error:', error)
        ElMessage.error('Failed to update profile')
      } finally {
        loading.value = false
      }
    }
    
    const resetForm = () => {
      loadUserInfo()
      profileForm.password = ''
      profileForm.confirmPassword = ''
    }
    
    const handleDeleteAccount = async () => {
      try {
        await ElMessageBox.confirm(
          'This action cannot be undone. All your data will be permanently deleted.',
          'Delete Account',
          {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'error',
            confirmButtonClass: 'el-button--danger'
          }
        )
        
        const response = await userAPI.deleteUser(user.user_id)
        
        if (response.base && response.base.code === 0) {
          ElMessage.success('Account deleted successfully')
          
          // Clear local storage and redirect
          localStorage.clear()
          router.push('/login')
        } else {
          ElMessage.error(response.base?.msg || 'Delete failed')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Delete error:', error)
          ElMessage.error('Failed to delete account')
        }
      }
    }
    
    onMounted(() => {
      loadUserInfo()
    })
    
    return {
      profileFormRef,
      user,
      profileForm,
      profileRules,
      loading,
      goBack,
      beforeAvatarUpload,
      handleAvatarChange,
      handleUpdateProfile,
      resetForm,
      handleDeleteAccount
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.1);
}

.profile-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-center h2 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.profile-main {
  padding: 24px;
}

.avatar-card {
  height: fit-content;
}

.avatar-section {
  text-align: center;
  padding: 20px 0;
}

.avatar-section h3 {
  margin: 16px 0 8px 0;
  color: #333;
  font-weight: 600;
}

.avatar-section p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.profile-form-card h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.danger-zone-card {
  border: 1px solid #f56c6c;
}

.danger-zone-card p {
  color: #666;
  margin-bottom: 16px;
}
</style>