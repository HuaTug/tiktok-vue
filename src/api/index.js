import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',  // 保持 /api 前缀，通过Vite代理转发
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// User API functions - 修正所有API路径和参数格式
export const userAPI = {
  // Create user (register) - 修正参数名为 username 匹配后端json标签
  createUser: (userData) => {
    return api.post('/v1/user/create/', {
      username: userData.userName,  // ✅ 修正：使用 "username" 匹配后端json标签
      password: userData.password,  // ✅ 正确
      email: userData.email,        // ✅ 正确
      sex: userData.sex             // ✅ 正确
    })
  },

  // Login user - 修正参数名为 username 匹配后端json标签
  loginUser: (loginData) => {
    return api.post('/v1/user/login', {
      username: loginData.userName,  // ✅ 修正：使用 "username" 匹配后端json标签
      password: loginData.password,  // ✅ 正确
      email: loginData.email         // ✅ 正确
    })
  },

  // Get user info - 修正路径为 /v1/user/get，使用查询参数
  getUserInfo: (userId) => {
    return api.get('/v1/user/get', {
      params: { userId: userId }
    })
  },

  // Update user - 修正路径为 /v1/user/update，使用POST方法
  updateUser: (userData) => {
    return api.post('/v1/user/update', {
      user_name: userData.userName,
      userId: userData.userId,
      password: userData.password,
      data: userData.data,
      filesize: userData.filesize
    })
  },

  // Delete user - 修正路径为 /v1/user/delete，使用DELETE方法和查询参数
  deleteUser: (userId) => {
    return api.delete('/v1/user/delete', {
      params: { userId: userId }
    })
  },

  // Query user - 修正路径为 /v1/user/query/，使用POST方法
  queryUser: (params) => {
    return api.post('/v1/user/query/', {
      Keyword: params.keyword,
      page: params.page,
      page_size: params.page_size
    })
  },

  // Send verification code - 修正路径为 /v1/user/sendcode
  sendCode: (email) => {
    return api.post('/v1/user/sendcode', { 
      email: email
    })
  },

  // Verify code - 修正路径为 /v1/user/verifycode
  verifyCode: (email, code) => {
    return api.post('/v1/user/verifycode', { 
      code: code,
      email: email
    })
  },

  // Check user exists by ID - 修正路径为 /v1/user/check
  checkUserExistsById: (userId) => {
    return api.post('/v1/user/check', { 
      userId: userId
    })
  }
}

// Video API functions - 新增视频相关API
export const videoAPI = {
  // Get video feed (首页视频流)
  getFeed: (lastTime = '') => {
    return api.get('/v1/video/feed', {
      params: { last_time: lastTime }
    })
  },

  // Get user's video list (用户视频列表)
  getVideoList: (params) => {
    return api.get('/v1/video/list', {
      params: {
        author_id: params.authorId,
        page_num: params.pageNum || 1,
        page_size: params.pageSize || 10
      }
    })
  },

  // Get popular videos (热门视频)
  getPopularVideos: (params) => {
    return api.get('/v1/video/popular', {
      params: {
        page_num: params.pageNum || 1,
        page_size: params.pageSize || 10
      }
    })
  },

  // Search videos (搜索视频)
  searchVideos: (params) => {
    return api.post('/v1/video/search', {
      keyword: params.keyword,
      page_num: params.pageNum || 1,
      page_size: params.pageSize || 10,
      from_date: params.fromDate || '',
      to_date: params.toDate || ''
    })
  },

  // Delete video (删除视频)
  deleteVideo: (videoId) => {
    return api.delete('/v1/video/delete', {
      params: { video_id: videoId }
    })
  },

  // Visit video (访问视频，增加播放量)
  visitVideo: (videoId, fromId) => {
    return api.post(`/v1/visit/${videoId}`, {
      from_id: fromId
    })
  },

  // Video publish start (开始上传视频)
  publishStart: (params) => {
    return api.post('/v1/publish/start', {
      title: params.title,
      description: params.description || '',
      lab_name: params.labName || '',
      category: params.category || '',
      open: params.open || 1,
      chunk_total_number: params.chunkTotalNumber
    })
  },

  // Video publish uploading (上传视频分片)
  publishUploading: (params) => {
    const formData = new FormData()
    formData.append('uuid', params.uuid)
    formData.append('data', params.data)
    formData.append('is_m3u8', params.isM3u8 || false)
    formData.append('filename', params.filename)
    formData.append('chunk_number', params.chunkNumber)
    
    return api.post('/v1/publish/uploading', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Video publish complete (完成视频上传)
  publishComplete: (uuid) => {
    return api.post('/v1/publish/complete', {
      uuid: uuid
    })
  },

  // Video publish cancel (取消视频上传)
  publishCancel: (uuid) => {
    return api.post('/v1/publish/cancle', {
      uuid: uuid
    })
  },

  // Get recommend videos (推荐视频)
  getRecommendVideos: () => {
    return api.get('/v1/recommend/video')
  },

  // Stream video (视频流)
  streamVideo: (index) => {
    return api.post('/v1/stream', {
      index: index
    })
  }
}

// Favorite API functions - 收藏相关API
export const favoriteAPI = {
  // Create favorite folder (创建收藏夹)
  createFavorite: (params) => {
    return api.post('/v1/favorite/create', {
      name: params.name,
      description: params.description || '',
      cover_url: params.coverUrl || ''
    })
  },

  // Get favorite list (获取收藏夹列表)
  getFavoriteList: (params) => {
    return api.get('/v1/favorite/list', {
      params: {
        page_num: params.pageNum || 1,
        page_size: params.pageSize || 10
      }
    })
  },

  // Get videos in favorite (获取收藏夹中的视频)
  getFavoriteVideoList: (params) => {
    return api.get('/v1/favorite/video/list', {
      params: {
        favorite_id: params.favoriteId,
        page_num: params.pageNum || 1,
        page_size: params.pageSize || 10
      }
    })
  },

  // Get specific video from favorite (获取收藏夹中的特定视频)
  getFavoriteVideo: (params) => {
    return api.get('/v1/favorite/video', {
      params: {
        favorite_id: params.favoriteId,
        video_id: params.videoId,
        page_num: params.pageNum || 1,
        page_size: params.pageSize || 10
      }
    })
  },

  // Add video to favorite (添加视频到收藏夹)
  addVideoToFavorite: (favoriteId, videoId) => {
    return api.post('/v1/favorite/video/add', {
      favorite_id: favoriteId,
      video_id: videoId
    })
  },

  // Delete favorite folder (删除收藏夹)
  deleteFavorite: (favoriteId) => {
    return api.delete('/v1/favorite/delete', {
      params: { favorite_id: favoriteId }
    })
  },

  // Remove video from favorite (从收藏夹移除视频)
  removeVideoFromFavorite: (favoriteId, videoId) => {
    return api.delete('/v1/favorite/video/delete', {
      params: {
        favorite_id: favoriteId,
        video_id: videoId
      }
    })
  }
}

// Share API functions - 分享相关API
export const shareAPI = {
  // Share video (分享视频)
  shareVideo: (videoId, toUserId) => {
    return api.post('/v1/share/video', {
      video_id: videoId,
      to_user_id: toUserId
    })
  }
}

export default api