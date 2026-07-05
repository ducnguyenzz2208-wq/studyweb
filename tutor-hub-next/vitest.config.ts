import { defineConfig } from 'vitest/config'

// Test thuần Node cho helper thuần + luồng auth (không cần trình duyệt).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
})
