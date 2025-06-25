<template>
  <div class="video-upload">
    <div class="upload-container">
      <h2>上传视频</h2>
      
      <!-- 文件选择区域 -->
      <div class="file-drop-zone" 
           :class="{ 'drag-over': isDragOver }"
           @drop="handleDrop"
           @dragover="handleDragOver"
           @dragleave="handleDragLeave"
           @click="selectFile">
        <input 
          ref="fileInput" 
          type="file" 
          accept="video/*" 
          @change="handleFileSelect"
          style="display: none"
        >
        
        <div v-if="!selectedFile" class="drop-zone-content">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>点击选择视频文件或拖拽到此处</p>
          <p class="file-hint">支持 MP4, AVI, MOV 等格式，最大 500MB</p>
        </div>
        
        <div v-else class="file-preview">
          <video 
            ref="previewVideo"
            :src="previewUrl"
            controls
            class="preview-video"
          ></video>
          <div class="file-info">
            <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
            <p><strong>大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
            <p><strong>类型:</strong> {{ selectedFile.type }}</p>
          </div>
          <button @click="clearFile" class="clear-btn">
            <i class="fas fa-times"></i> 重新选择
          </button>
        </div>
      </div>
      
      <!-- 视频信息表单 -->
      <div v-if="selectedFile" class="video-form">
        <div class="form-group">
          <label for="title">视频标题 *</label>
          <input 
            id="title"
            v-model="videoInfo.title" 
            type="text" 
            placeholder="请输入视频标题"
            maxlength="100"
            required
          >
          <span class="char-count">{{ videoInfo.title.length }}/100</span>
        </div>
        
        <div class="form-group">
          <label for="description">视频描述</label>
          <textarea 
            id="description"
            v-model="videoInfo.description" 
            placeholder="请输入视频描述"
            maxlength="500"
            rows="4"
          ></textarea>
          <span class="char-count">{{ videoInfo.description.length }}/500</span>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">分类</label>
            <select id="category" v-model="videoInfo.category">
              <option value="">请选择分类</option>
              <option value="entertainment">娱乐</option>
              <option value="education">教育</option>
              <option value="music">音乐</option>
              <option value="sports">体育</option>
              <option value="technology">科技</option>
              <option value="lifestyle">生活</option>
              <option value="gaming">游戏</option>
              <option value="news">新闻</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="privacy">隐私设置</label>
            <select id="privacy" v-model="videoInfo.open">
              <option :value="1">公开</option>
              <option :value="0">私密</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="tags">标签</label>
          <input 
            id="tags"
            v-model="videoInfo.labName" 
            type="text" 
            placeholder="请输入标签，用逗号分隔"
          >
        </div>
      </div>
      
      <!-- 上传进度 -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-header">
          <span>上传进度</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <div class="upload-status">
          <p v-if="currentChunk > 0">
            正在上传第 {{ currentChunk }} / {{ totalChunks }} 个分片
          </p>
          <p v-if="uploadStatus">{{ uploadStatus }}</p>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          @click="startUpload" 
          :disabled="!canUpload || isUploading"
          class="upload-btn"
        >
          <i class="fas fa-upload"></i>
          {{ isUploading ? '上传中...' : '开始上传' }}
        </button>
        
        <button 
          v-if="isUploading" 
          @click="cancelUpload"
          class="cancel-btn"
        >
          <i class="fas fa-times"></i>
          取消上传
        </button>
        
        <button 
          @click="resetForm"
          :disabled="isUploading"
          class="reset-btn"
        >
          <i class="fas fa-redo"></i>
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { videoAPI } from '@/api'

export default {
  name: 'VideoUpload',
  emits: ['upload-success', 'upload-error'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const previewVideo = ref(null)
    const selectedFile = ref(null)
    const previewUrl = ref('')
    const isDragOver = ref(false)
    const isUploading = ref(false)
    const uploadProgress = ref(0)
    const currentChunk = ref(0)
    const totalChunks = ref(0)
    const uploadStatus = ref('')
    const uploadUuid = ref('')
    
    const videoInfo = ref({
      title: '',
      description: '',
      category: '',
      labName: '',
      open: 1
    })

    // 计算属性
    const canUpload = computed(() => {
      return selectedFile.value && videoInfo.value.title.trim().length > 0
    })

    // 文件选择
    const selectFile = () => {
      fileInput.value?.click()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        processFile(file)
      }
    }

    // 拖拽处理
    const handleDragOver = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }

    const handleDragLeave = () => {
      isDragOver.value = false
    }

    const handleDrop = (event) => {
      event.preventDefault()
      isDragOver.value = false
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    }

    // 处理文件
    const processFile = (file) => {
      // 验证文件类型
      if (!file.type.startsWith('video/')) {
        alert('请选择视频文件')
        return
      }
      
      // 验证文件大小 (500MB)
      const maxSize = 500 * 1024 * 1024
      if (file.size > maxSize) {
        alert('文件大小不能超过 500MB')
        return
      }
      
      selectedFile.value = file
      previewUrl.value = URL.createObjectURL(file)
      
      // 自动填充标题（去掉扩展名）
      if (!videoInfo.value.title) {
        videoInfo.value.title = file.name.replace(/\.[^/.]+$/, '')
      }
    }

    // 清除文件
    const clearFile = () => {
      selectedFile.value = null
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = ''
      }
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 开始上传
    const startUpload = async () => {
      if (!canUpload.value) return
      
      try {
        isUploading.value = true
        uploadStatus.value = '准备上传...'
        
        // 计算分片数量 (每片 2MB)
        const chunkSize = 2 * 1024 * 1024
        totalChunks.value = Math.ceil(selectedFile.value.size / chunkSize)
        
        // 开始上传流程
        const startResponse = await videoAPI.publishStart({
          title: videoInfo.value.title,
          description: videoInfo.value.description,
          labName: videoInfo.value.labName,
          category: videoInfo.value.category,
          open: videoInfo.value.open,
          chunkTotalNumber: totalChunks.value
        })
        
        if (startResponse.code !== 0) {
          throw new Error(startResponse.message || '开始上传失败')
        }
        
        uploadUuid.value = startResponse.data.uuid
        uploadStatus.value = '开始上传分片...'
        
        // 上传分片
        for (let i = 0; i < totalChunks.value; i++) {
          if (!isUploading.value) break // 检查是否被取消
          
          currentChunk.value = i + 1
          const start = i * chunkSize
          const end = Math.min(start + chunkSize, selectedFile.value.size)
          const chunk = selectedFile.value.slice(start, end)
          
          uploadStatus.value = `上传第 ${currentChunk.value} 个分片...`
          
          await videoAPI.publishUploading({
            uuid: uploadUuid.value,
            data: chunk,
            isM3u8: false,
            filename: selectedFile.value.name,
            chunkNumber: i + 1
          })
          
          // 更新进度
          uploadProgress.value = Math.round(((i + 1) / totalChunks.value) * 100)
        }
        
        if (isUploading.value) {
          // 完成上传
          uploadStatus.value = '正在处理视频...'
          
          const completeResponse = await videoAPI.publishComplete(uploadUuid.value)
          
          if (completeResponse.code !== 0) {
            throw new Error(completeResponse.message || '完成上传失败')
          }
          
          uploadStatus.value = '上传成功！'
          emit('upload-success', {
            uuid: uploadUuid.value,
            videoInfo: videoInfo.value
          })
          
          // 延迟重置表单
          setTimeout(() => {
            resetForm()
          }, 2000)
        }
        
      } catch (error) {
        console.error('Upload error:', error)
        uploadStatus.value = '上传失败: ' + error.message
        emit('upload-error', error)
        
        // 取消上传
        if (uploadUuid.value) {
          try {
            await videoAPI.publishCancel(uploadUuid.value)
          } catch (cancelError) {
            console.error('Cancel upload error:', cancelError)
          }
        }
      } finally {
        isUploading.value = false
      }
    }

    // 取消上传
    const cancelUpload = async () => {
      isUploading.value = false
      uploadStatus.value = '正在取消上传...'
      
      if (uploadUuid.value) {
        try {
          await videoAPI.publishCancel(uploadUuid.value)
          uploadStatus.value = '上传已取消'
        } catch (error) {
          console.error('Cancel upload error:', error)
          uploadStatus.value = '取消上传失败'
        }
      }
      
      setTimeout(() => {
        uploadProgress.value = 0
        currentChunk.value = 0
        totalChunks.value = 0
        uploadStatus.value = ''
        uploadUuid.value = ''
      }, 1000)
    }

    // 重置表单
    const resetForm = () => {
      clearFile()
      videoInfo.value = {
        title: '',
        description: '',
        category: '',
        labName: '',
        open: 1
      }
      uploadProgress.value = 0
      currentChunk.value = 0
      totalChunks.value = 0
      uploadStatus.value = ''
      uploadUuid.value = ''
      isUploading.value = false
    }

    // 清理资源
    onUnmounted(() => {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
      }
    })

    return {
      fileInput,
      previewVideo,
      selectedFile,
      previewUrl,
      isDragOver,
      isUploading,
      uploadProgress,
      currentChunk,
      totalChunks,
      uploadStatus,
      videoInfo,
      canUpload,
      selectFile,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      clearFile,
      formatFileSize,
      startUpload,
      cancelUpload,
      resetForm
    }
  }
}
</script>

<style scoped>
.video-upload {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.upload-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.file-drop-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 30px;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #ff6b6b;
  background-color: #fff5f5;
}

.drop-zone-content i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 15px;
}

.drop-zone-content p {
  margin: 10px 0;
  color: #666;
}

.file-hint {
  font-size: 14px;
  color: #999;
}

.file-preview {
  text-align: left;
}

.preview-video {
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.file-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.file-info p {
  margin: 5px 0;
  color: #666;
}

.clear-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background: #c82333;
}

.video-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff6b6b;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: #999;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.upload-progress {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  transition: width 0.3s ease;
}

.upload-status p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-buttons button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn {
  background: #ff6b6b;
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background: #ff5252;
  transform: translateY(-1px);
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background: #c82333;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: #5a6268;
}

.reset-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-upload {
    padding: 10px;
  }
  
  .upload-container {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons button {
    width: 100%;
    justify-content: center;
  }
}
</style>