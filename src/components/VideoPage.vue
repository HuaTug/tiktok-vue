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

    <div class="video-content">
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

    <div class="video-list">
      <h3>More Videos</h3>
      <div class="video-grid">
        <div 
          v-for="video in videoList" 
          :key="video.id"
          class="video-item"
          @click="playVideo(video)"
          :class="{ active: video.id === currentVideo.id }"
        >
          <div class="video-thumbnail">
            <img :src="video.cover" :alt="video.title" />
            <div class="play-overlay">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <div class="video-item-info">
            <h4>{{ video.title }}</h4>
            <p>{{ video.description }}</p>
            <div class="video-stats">
              <span><i class="fas fa-eye"></i> {{ formatNumber(video.visitCount) }}</span>
              <span><i class="fas fa-heart"></i> {{ formatNumber(video.likesCount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import VideoPlayer from './VideoPlayer.vue'

export default {
  name: 'VideoPage',
  components: {
    VideoPlayer
  },
  setup() {
    const router = useRouter()
    const currentVideo = ref({})
    const videoList = ref([])

    // 示例视频数据
    const sampleVideos = [
      {
        id: 1,
        title: "Sample Video 1",
        description: "This is a sample video for demonstration purposes.",
        url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
        cover: "https://via.placeholder.com/320x180/ff6b6b/ffffff?text=Video+1",
        visitCount: 12500,
        likesCount: 890,
        commentCount: 45
      },
      {
        id: 2,
        title: "Sample Video 2",
        description: "Another sample video with different content.",
        url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
        cover: "https://via.placeholder.com/320x180/4ecdc4/ffffff?text=Video+2",
        visitCount: 8900,
        likesCount: 567,
        commentCount: 23
      },
      {
        id: 3,
        title: "Sample Video 3",
        description: "Third sample video for testing the player.",
        url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
        cover: "https://via.placeholder.com/320x180/45b7d1/ffffff?text=Video+3",
        visitCount: 15600,
        likesCount: 1200,
        commentCount: 78
      }
    ]

    // 初始化数据
    onMounted(() => {
      videoList.value = sampleVideos
      currentVideo.value = sampleVideos[0]
    })

    // 播放指定视频
    const playVideo = (video) => {
      currentVideo.value = video
      ElMessage.success(`Now playing: ${video.title}`)
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

    return {
      currentVideo,
      videoList,
      playVideo,
      onVideoPlay,
      onVideoPause,
      onVideoEnded,
      goBack,
      goToProfile,
      logout,
      formatNumber
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