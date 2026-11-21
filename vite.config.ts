import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion') ? 'motion' : undefined),
      },
    },
  },
})
