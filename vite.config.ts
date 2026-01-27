import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disable strict type checking during build for Netlify compatibility
      typescript: {
        tsconfigPath: './tsconfig.json',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Ensure build completes even with type warnings
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress TypeScript warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      },
    },
  },
})

