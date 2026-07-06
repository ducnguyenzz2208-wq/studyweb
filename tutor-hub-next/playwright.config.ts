import { defineConfig, devices } from '@playwright/test'

// E2E smoke test chạy trên CHẾ ĐỘ MOCK của app (tutor-hub-app.html mở trực tiếp
// → hiện màn đăng nhập demo, quickLogin() dùng dữ liệu demo, KHÔNG cần Supabase).
// Bao phủ: đăng nhập, điều hướng theo vai trò, thêm học sinh, Pomodoro.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/tutor-hub-app.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
