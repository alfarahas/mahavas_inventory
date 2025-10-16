// vite.config.js
export default {
  build: {
    outDir: 'dist', // This should match what server.js expects
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}