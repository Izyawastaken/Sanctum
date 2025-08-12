import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // Use relative paths so the app works under any subpath (GitHub Pages repo name case-insensitive)
    base: './',
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
