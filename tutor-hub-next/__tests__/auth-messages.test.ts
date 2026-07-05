import { describe, it, expect } from 'vitest'
import { viError } from '../lib/auth-messages'

// Luồng auth: viError() gói lỗi thô của Supabase thành câu tiếng Việt.
// Đây là điểm người dùng gặp lỗi khi đăng nhập/đăng ký/đổi mật khẩu.
describe('viError — thông báo lỗi luồng auth', () => {
  it('dịch lỗi đăng nhập sai thông tin', () => {
    expect(viError('Invalid login credentials')).toContain('không đúng')
  })

  it('email chưa được xác nhận', () => {
    expect(viError('Email not confirmed')).toContain('xác nhận')
  })

  it('email đã được đăng ký', () => {
    expect(viError('User already registered')).toContain('đã được đăng ký')
  })

  it('mật khẩu quá ngắn', () => {
    expect(viError('Password should be at least 6 characters')).toContain('quá ngắn')
  })

  it('mật khẩu mới phải khác cũ', () => {
    expect(viError('New password should be different from the old password')).toContain('khác')
  })

  it('giới hạn tần suất (rate limit)', () => {
    expect(
      viError('For security purposes, you can only request this after 51 seconds')
    ).toContain('quá nhanh')
  })

  it('phiên hết hạn', () => {
    expect(viError('Auth session missing!')).toContain('hết hạn')
  })

  it('lỗi mạng', () => {
    expect(viError('Failed to fetch')).toContain('kết nối mạng')
  })

  it('không phân biệt hoa/thường', () => {
    expect(viError('INVALID LOGIN CREDENTIALS')).toContain('không đúng')
  })

  it('giữ nguyên lỗi không khớp mẫu (không giấu lỗi lạ)', () => {
    expect(viError('Some unexpected backend error')).toBe('Some unexpected backend error')
  })

  it('chuỗi rỗng trả về rỗng', () => {
    expect(viError('')).toBe('')
  })
})
