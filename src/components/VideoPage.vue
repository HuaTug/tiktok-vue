<template>
  <div class="video-page">
    <div class="video-page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">
          <i class="fas fa-arrow-left"></i>
          Back
        </button>
        <h1 class="page-title">Video Player</h1>
      </div>
      <div class="header-right">
        <button @click="refreshVideos" class="refresh-button" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
        <button @click="goToProfile" class="profile-button">
          <i class="fas fa-user"></i>
          Profile
        </button>
        <button @click="logout" class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && videoList.length === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading videos...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error && videoList.length === 0" class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <p>{{ error }}</p>
      <button @click="refreshVideos" class="retry-button">
        <i class="fas fa-redo"></i>
        Retry
      </button>
    </div>

    <!-- 视频内容 -->
    <div v-else-if="currentVideo.id" class="video-content">
      <VideoPlayer
        :video-url="currentVideo.url"
        :cover-url="currentVideo.cover"
        :title="currentVideo.title"
        :description="currentVideo.description"
        :visit-count="currentVideo.visitCount"
        :likes-count="currentVideo.likesCount"
        :comment-count="currentVideo.commentCount"
        :autoplay="true"
        :show-info="true"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoEnded"
      />
    </div>

    <!-- 视频列表 -->
    <div v-if="videoList.length > 0" class="video-list">
      <div class="video-list-header">
        <h3>More Videos</h3>
        <span class="video-count">{{ videoList.length }} videos</span>
      </div>
      <div class="video-grid">
        <div 
          v-for="video in videoList" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
          :class="{ active: video.id === currentVideo.id }"
        >
          <div class="video-thumbnail">
            <img :src="video.cover" :alt="video.title" @error="handleImageError" />
            <div class="play-overlay">
              <i class="fas fa-play"></i>
            </div>
            <div class="video-duration" v-if="video.duration">
              {{ formatDuration(video.duration) }}
            </div>
          </div>
          <div class="video-item-info">
            <h4>{{ video.title }}</h4>
            <p class="video-author" v-if="video.authorName">{{ video.authorName }}</p>
            <p class="video-description">{{ video.description }}</p>
            <div class="video-stats">
              <span><i class="fas fa-eye"></i> {{ formatNumber(video.visitCount) }}</span>
              <span><i class="fas fa-heart"></i> {{ formatNumber(video.likesCount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-container">
      <div class="empty-icon">
        <i class="fas fa-video"></i>
      </div>
      <p>No videos available</p>
      <button @click="refreshVideos" class="retry-button">
        <i class="fas fa-redo"></i>
        Refresh
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import VideoPlayer from './VideoPlayer.vue'
import { RouterUtils } from '../router/utils.js'
import { videoAPI } from '../api/index.js'

export default {
  name: 'VideoPage',
  components: {
    VideoPlayer
  },
  setup() {
    const router = useRouter()
    const currentVideo = ref({})
    const videoList = ref([])
    const loading = ref(false)
    const error = ref('')

    // 获取视频列表
    const fetchVideos = async () => {
      try {
        loading.value = true
        error.value = ''
        
        // 首先尝试获取推荐视频
        let response = await videoAPI.getRecommendVideos()
        console.log('Recommend videos response:', response)
        
        if (response && response.code === 0 && response.data && response.data.length > 0) {
          videoList.value = processVideoData(response.data)
        } else {
          // 如果推荐视频为空，尝试获取视频流
          response = await videoAPI.getFeed()
          console.log('Video feed response:', response)
          
          if (response && response.code === 0 && response.data && response.data.length > 0) {
            videoList.value = processVideoData(response.data)
          } else {
            // 如果都没有数据，尝试获取热门视频
            response = await videoAPI.getPopularVideos({ pageNum: 1, pageSize: 10 })
            console.log('Popular videos response:', response)
            
            if (response && response.code === 0 && response.data && response.data.length > 0) {
              videoList.value = processVideoData(response.data)
            } else {
              // 如果仍然没有数据，使用示例数据
              console.warn('No videos found from API, using sample data')
              videoList.value = getSampleVideos()
            }
          }
        }
        
        // 设置第一个视频为当前播放视频
        if (videoList.value.length > 0) {
          currentVideo.value = videoList.value[0]
        }
        
      } catch (err) {
        console.error('Error fetching videos:', err)
        error.value = 'Failed to load videos'
        ElMessage.error('Failed to load videos: ' + (err.message || 'Unknown error'))
        
        // 出错时使用示例数据
        videoList.value = getSampleVideos()
        currentVideo.value = videoList.value[0]
      } finally {
        loading.value = false
      }
    }

    // 处理后端返回的视频数据
    const processVideoData = (videos) => {
      return videos.map(video => ({
        id: video.id || video.video_id || Math.random().toString(36).substr(2, 9),
        title: video.title || video.Title || 'Untitled Video',
        description: video.description || video.Description || 'No description available',
        // MinIO视频URL处理 - 根据后端返回的URL格式进行处理
        url: processVideoUrl(video.play_url || video.PlayUrl || video.url || video.video_url),
        // 封面图URL处理
        cover: processCoverUrl(video.cover_url || video.CoverUrl || video.cover || video.thumbnail_url),
        visitCount: video.visit_count || video.VisitCount || video.view_count || 0,
        likesCount: video.favorite_count || video.FavoriteCount || video.likes_count || 0,
        commentCount: video.comment_count || video.CommentCount || 0,
        authorId: video.author_id || video.AuthorId || video.user_id,
        authorName: video.author_name || video.AuthorName || video.username || 'Unknown',
        createdAt: video.created_at || video.CreatedAt || video.publish_time
      }))
    }

    // 处理视频URL - 确保MinIO URL可以被前端访问
    const processVideoUrl = (url) => {
      if (!url) return ''
      
      // 如果URL已经是完整的HTTP URL，直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      
      // 如果是相对路径，通过后端代理访问
      if (url.startsWith('/')) {
        return `/api${url}`
      }
      
      // 如果是MinIO的bucket路径，构造完整URL
      if (url.includes('videos/') || url.includes('.mp4') || url.includes('.m3u8')) {
        return `/api/v1/stream?path=${encodeURIComponent(url)}`
      }
      
      return url
    }

    // 处理封面图URL
    const processCoverUrl = (url) => {
      if (!url) {
        // 如果没有封面图，返回默认占位图
        return `https://via.placeholder.com/320x180/ff6b6b/ffffff?text=Video`
      }
      
      // 如果URL已经是完整的HTTP URL，直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      
      // 如果是相对路径，通过后端代理访问
      if (url.startsWith('/')) {
        return `/api${url}`
      }
      
      // 如果是MinIO的bucket路径，构造完整URL
      if (url.includes('covers/') || url.includes('.jpg') || url.includes('.png')) {
        return `/api/v1/stream?path=${encodeURIComponent(url)}`
      }
      
      return url
    }

    // 获取示例视频数据（作为后备）
    const getSampleVideos = () => {
      return [
        {
          id: 'sample-1',
          title: "Sample Video 1",
          description: "This is a sample video for demonstration purposes.",
          url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
          cover: "https://via.placeholder.com/320x180/ff6b6b/ffffff?text=Video+1",
          visitCount: 12500,
          likesCount: 890,
          commentCount: 45,
          authorName: "Sample User"
        },
        {
          id: 'sample-2',
          title: "Sample Video 2",
          description: "Another sample video with different content.",
          url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
          cover: "https://via.placeholder.com/320x180/4ecdc4/ffffff?text=Video+2",
          visitCount: 8900,
          likesCount: 567,
          commentCount: 23,
          authorName: "Sample User"
        }
      ]
    }

    // 初始化数据
    onMounted(() => {
      fetchVideos()
    })

    // 播放指定视频
    const playVideo = async (video) => {
      try {
        currentVideo.value = video
        ElMessage.success(`Now playing: ${video.title}`)
        
        // 记录视频访问
        if (video.id && video.id !== 'sample-1' && video.id !== 'sample-2') {
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          const fromId = user.userId || user.UserId || 1
          
          try {
            await videoAPI.visitVideo(video.id, fromId)
            console.log('Video visit recorded')
          } catch (visitError) {
            console.warn('Failed to record video visit:', visitError)
          }
        }
      } catch (error) {
        console.error('Error playing video:', error)
        ElMessage.error('Failed to play video')
      }
    }

    // 刷新视频列表
    const refreshVideos = () => {
      fetchVideos()
    }

    // 视频播放事件
    const onVideoPlay = () => {
      console.log('Video started playing')
    }

    const onVideoPause = () => {
      console.log('Video paused')
    }

    const onVideoEnded = () => {
      console.log('Video ended')
      // 自动播放下一个视频
      const currentIndex = videoList.value.findIndex(v => v.id === currentVideo.value.id)
      if (currentIndex < videoList.value.length - 1) {
        playVideo(videoList.value[currentIndex + 1])
      }
    }

    // 导航功能
    const goBack = () => {
      router.push('/dashboard')
    }

    const goToProfile = () => {
      router.push('/profile')
    }

    const logout = async () => {
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to logout?',
          'Confirm Logout',
          {
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )
        
        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        ElMessage.success('Logged out successfully')
        router.push('/login')
      } catch {
        // 用户取消登出
      }
    }

    // 工具函数
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    // 格式化视频时长
    const formatDuration = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // 处理图片加载错误
    const handleImageError = (event) => {
      event.target.src = 'https://via.placeholder.com/320x180/cccccc/ffffff?text=No+Image'
    }

    return {
      currentVideo,
      videoList,
      loading,
      error,
      playVideo,
      refreshVideos,
      onVideoPlay,
      onVideoPause,
      onVideoEnded,
      goBack,
      goToProfile,
      logout,
      formatNumber,
      formatDuration,
      handleImageError
    }
  }
}
</script>

<style scoped>
.video-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.video-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.back-button:hover {
  background: #e0e0e0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  gap: 10px;
}

.profile-button,
.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.profile-button {
  background: #409eff;
  color: white;
}

.profile-button:hover {
  background: #337ecc;
}

.logout-button {
  background: #f56c6c;
  color: white;
}

.logout-button:hover {
  background: #e85a5a;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #5daf34;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container .error-icon,
.empty-container .empty-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.empty-container .empty-icon {
  color: #909399;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 20px;
  transition: background 0.3s ease;
}

.retry-button:hover {
  background: #337ecc;
}

.video-content {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.video-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.video-list h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.video-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.video-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.video-item.active {
  border: 2px solid #409eff;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: rgba(0,0,0,0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-item:hover .play-overlay {
  opacity: 1;
}

.video-item-info {
  padding: 15px;
}

.video-item-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.video-item-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-stats {
  display: flex;
  gap: 15px;
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.video-stats i {
  color: #ff6b6b;
}

.video-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.video-count {
  color: #666;
  font-size: 14px;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-author {
  font-size: 13px;
  color: #409eff;
  margin: 4px 0;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-left,
  .header-right {
    justify-content: center;
  }

  .page-title {
    font-size: 20px;
  }

  .video-grid {
    grid-template-columns: 1fr;
  }

  .video-content,
  .video-list {
    padding: 0 15px;
  }
}
</style>