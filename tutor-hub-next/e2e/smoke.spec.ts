import { test, expect } from '@playwright/test'

// Mở app ở chế độ mock (standalone) và đăng nhập demo theo vai trò.
async function mockLogin(page: import('@playwright/test').Page, email: string) {
  await page.goto('/tutor-hub-app.html')
  await expect(page.locator('#loginScreen')).toBeVisible()
  // quickLogin là hàm global của app (đăng nhập demo, không cần Supabase)
  await page.waitForFunction(() => typeof (window as any).quickLogin === 'function')
  await page.evaluate((e) => (window as any).quickLogin(e), email)
  await expect(page.locator('#main')).toBeVisible()
}

test.describe('Tutor Hub — smoke (mock mode)', () => {
  test('màn đăng nhập hiện + đăng nhập demo GV vào được app', async ({ page }) => {
    await mockLogin(page, 'teacher@tutorhub.com')
    await expect(page.locator('#sidebarRole')).toHaveText(/Teacher/i)
  })

  test('điều hướng sang Học sinh → bảng có dữ liệu', async ({ page }) => {
    await mockLogin(page, 'teacher@tutorhub.com')
    await page.evaluate(() => (window as any).showSection('students'))
    await expect(page.locator('#section-students')).toBeVisible()
    const rows = await page.locator('#studentTableBody tr').count()
    expect(rows).toBeGreaterThan(0)
  })

  test('thêm học sinh → xuất hiện trong bảng', async ({ page }) => {
    await mockLogin(page, 'teacher@tutorhub.com')
    await page.evaluate(() => (window as any).showSection('students'))
    const before = await page.evaluate(() => (window as any).students.length)
    // Bật Edit Mode để có nút, rồi mở modal + lưu bằng hàm global
    await page.evaluate(() => (window as any).openStudentModal())
    await page.fill('#mStudentName', 'E2E Test Student')
    await page.evaluate(() => (window as any).saveStudent(null))
    const after = await page.evaluate(() => (window as any).students.length)
    expect(after).toBe(before + 1)
    await expect(page.locator('#studentTableBody')).toContainText('E2E Test Student')
  })

  test('Pomodoro: đồng hồ 25:00, bắt đầu thì chạy', async ({ page }) => {
    await mockLogin(page, 'student@tutorhub.com')
    await page.evaluate(() => (window as any).showSection('pomodoro'))
    await expect(page.locator('#pomoClock')).toHaveText('25:00')
    await page.evaluate(() => (window as any).startPomo())
    const running = await page.evaluate(() => (window as any)._pomoState().isRunning)
    expect(running).toBe(true)
    await page.evaluate(() => (window as any).pausePomo())
  })

  test('phân quyền: Học sinh KHÔNG thấy mục Quản lý người dùng', async ({ page }) => {
    await mockLogin(page, 'student@tutorhub.com')
    const nav = (await page.locator('#navItems').innerText()).toLowerCase()
    expect(nav).not.toContain('quản lý')
    expect(nav).not.toContain('user management')
    // nhưng có cổng học sinh + pomodoro
    expect(nav).toMatch(/cổng học sinh|student portal/)
  })
})

test.describe('Trang công khai', () => {
  test('trang /login render nút đăng nhập', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /Đăng nhập|Sign In/i }).first()).toBeVisible()
  })
})
