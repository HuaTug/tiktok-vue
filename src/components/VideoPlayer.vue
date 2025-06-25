<template>
  <div class="video-player" :class="{ 'fullscreen': isFullscreen }">
    <div class="video-container" @click="togglePlay">
      <video
        ref="videoRef"
        :src="videoUrl"
        :poster="coverUrl"
        @loadedmetadata="onVideoLoaded"
        @timeupdate="onTimeUpdate"
        @ended="onVideoEnded"
        @play="onPlay"
        @pause="onPause"
        preload="metadata"
        playsinline
        webkit-playsinline
      ></video>
      
      <!-- 播放控制覆盖层 -->
      <div class="video-overlay" v-show="showControls">
        <!-- 播放/暂停按钮 -->
        <div class="play-button" @click.stop="togglePlay">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-container" @click.stop="seekTo">
          <div class="progress-bar">
            <div class="progress-filled" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
          </div>
        </div>
        
        <!-- 时间显示 -->
        <div class="time-display">
          <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <button @click.stop="toggleMute" class="control-btn">
            <i :class="isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up'"></i>
          </button>
          <button @click.stop="toggleFullscreen" class="control-btn">
            <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
          </button>
        </div>
      </div>
      
      <!-- 加载指示器 -->
      <div class="loading-indicator" v-show="isLoading">
        <div class="spinner"></div>
      </div>
    </div>
    
    <!-- 视频信息 -->
    <div class="video-info" v-if="showInfo">
      <h3 class="video-title">{{ title }}</h3>
      <p class="video-description">{{ description }}</p>
      <div class="video-stats">
        <span class="stat-item">
          <i class="fas fa-eye"></i>
          {{ formatNumber(visitCount) }}
        </span>
        <span class="stat-item">
          <i class="fas fa-heart"></i>
          {{ formatNumber(likesCount) }}
        </span>
        <span class="stat-item">
          <i class="fas fa-comment"></i>
          {{ formatNumber(commentCount) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'VideoPlayer',
  props: {
    videoUrl: {
      type: String,
      required: true
    },
    coverUrl: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    visitCount: {
      type: Number,
      default: 0
    },
    likesCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    showInfo: {
      type: Boolean,
      default: true
    }
  },
  emits: ['play', 'pause', 'ended', 'timeupdate'],
  setup(props, { emit }) {
    const videoRef = ref(null)
    const isPlaying = ref(false)
    const isLoading = ref(false)
    const isMuted = ref(false)
    const isFullscreen = ref(false)
    const showControls = ref(true)
    const currentTime = ref(0)
    const duration = ref(0)
    const progressPercent = ref(0)
    
    let controlsTimer = null

    // 播放/暂停切换
    const togglePlay = () => {
      if (!videoRef.value) return
      
      if (isPlaying.value) {
        videoRef.value.pause()
      } else {
        videoRef.value.play()
      }
    }

    // 静音切换
    const toggleMute = () => {
      if (!videoRef.value) return
      
      videoRef.value.muted = !videoRef.value.muted
      isMuted.value = videoRef.value.muted
    }

    // 全屏切换
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        videoRef.value.parentElement.requestFullscreen()
        isFullscreen.value = true
      } else {
        document.exitFullscreen()
        isFullscreen.value = false
      }
    }

    // 进度条点击跳转
    const seekTo = (event) => {
      if (!videoRef.value) return
      
      const rect = event.currentTarget.getBoundingClientRect()
      const percent = (event.clientX - rect.left) / rect.width
      const seekTime = percent * duration.value
      
      videoRef.value.currentTime = seekTime
    }

    // 视频事件处理
    const onVideoLoaded = () => {
      duration.value = videoRef.value.duration
      isLoading.value = false
    }

    const onTimeUpdate = () => {
      currentTime.value = videoRef.value.currentTime
      progressPercent.value = (currentTime.value / duration.value) * 100
      emit('timeupdate', currentTime.value)
    }

    const onPlay = () => {
      isPlaying.value = true
      emit('play')
    }

    const onPause = () => {
      isPlaying.value = false
      emit('pause')
    }

    const onVideoEnded = () => {
      isPlaying.value = false
      emit('ended')
    }

    // 工具函数
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
      return num.toString()
    }

    // 控制条自动隐藏
    const resetControlsTimer = () => {
      showControls.value = true
      clearTimeout(controlsTimer)
      controlsTimer = setTimeout(() => {
        if (isPlaying.value) {
          showControls.value = false
        }
      }, 3000)
    }

    // 监听视频URL变化
    watch(() => props.videoUrl, () => {
      if (videoRef.value) {
        isLoading.value = true
        videoRef.value.load()
      }
    })

    // 自动播放
    watch(() => props.autoplay, (newVal) => {
      if (newVal && videoRef.value) {
        videoRef.value.play()
      }
    })

    onMounted(() => {
      if (props.autoplay && videoRef.value) {
        videoRef.value.play()
      }
      
      // 鼠标移动显示控制条
      document.addEventListener('mousemove', resetControlsTimer)
    })

    onUnmounted(() => {
      clearTimeout(controlsTimer)
      document.removeEventListener('mousemove', resetControlsTimer)
    })

    return {
      videoRef,
      isPlaying,
      isLoading,
      isMuted,
      isFullscreen,
      showControls,
      currentTime,
      duration,
      progressPercent,
      togglePlay,
      toggleMute,
      toggleFullscreen,
      seekTo,
      onVideoLoaded,
      onTimeUpdate,
      onPlay,
      onPause,
      onVideoEnded,
      formatTime,
      formatNumber
    }
  }
}
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  border-radius: 0;
  z-index: 9999;
}

.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  cursor: pointer;
}

.fullscreen .video-container {
  height: 100vh;
  padding-bottom: 0;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent 60%, rgba(0,0,0,0.7));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  transition: opacity 0.3s ease;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translate(-50%, -50%) scale(1.1);
}

.progress-container {
  margin-bottom: 10px;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.progress-filled {
  height: 100%;
  background: #ff6b6b;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: -4px;
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progress-container:hover .progress-handle {
  opacity: 1;
}

.time-display {
  color: white;
  font-size: 14px;
  margin-bottom: 10px;
}

.control-buttons {
  display: flex;
  gap: 15px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.video-info {
  padding: 20px;
  background: white;
}

.video-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.video-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

.video-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #888;
  font-size: 14px;
}

.stat-item i {
  color: #ff6b6b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-player {
    border-radius: 0;
  }
  
  .video-overlay {
    padding: 15px;
  }
  
  .play-button {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }
  
  .video-info {
    padding: 15px;
  }
  
  .video-title {
    font-size: 16px;
  }
  
  .video-stats {
    gap: 15px;
  }
}
</style>