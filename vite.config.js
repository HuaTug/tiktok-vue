import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // 修改为你的后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1') // 修改路径前缀
      }
    }
  }
})