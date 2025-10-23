import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true, // 포트가 사용 중이면 오류 표시
    open: true // 자동으로 브라우저 열기
  },
  preview: {
    port: 5173,
    strictPort: true
  }
})
