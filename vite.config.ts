import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const apiPort = process.env.PORT ?? '5116'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': `http://localhost:${apiPort}` },
  },
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
})
