import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' so the build works on GitHub Pages, IPFS, or any static host
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
