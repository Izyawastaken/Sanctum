import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(() => {
  return {
    plugins: [react()],
    base: '/Sanctum/', // Ensure this is always used for build and preview
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: false
      }
    },
    preview: {
      port: 5174
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            supabase: ['@supabase/supabase-js']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      cssCodeSplit: true,
      assetsInlineLimit: 4096
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
      exclude: []
    },
    css: {
      devSourcemap: false
    }
  }
})
