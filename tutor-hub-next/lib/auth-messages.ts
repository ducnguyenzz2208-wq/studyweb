// Gói các thông báo lỗi thô của Supabase Auth thành câu tiếng Việt dễ hiểu.
// Nếu không khớp mẫu nào thì trả lại nguyên văn để không giấu lỗi lạ.
export function viError(raw: string): string {
  const msg = (raw || '').toLowerCase()

  if (msg.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.'
  if (msg.includes('email not confirmed')) return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư (cả mục Spam) và bấm liên kết xác nhận.'
  if (msg.includes('user already registered') || msg.includes('already been registered')) return 'Email này đã được đăng ký. Bạn hãy đăng nhập hoặc dùng "Quên mật khẩu".'
  if (msg.includes('password should be at least')) return 'Mật khẩu quá ngắn (tối thiểu 6 ký tự).'
  if (msg.includes('new password should be different')) return 'Mật khẩu mới phải khác mật khẩu cũ.'
  if (msg.includes('unable to validate email')) return 'Địa chỉ email không hợp lệ.'
  if (msg.includes('for security purposes') || msg.includes('rate limit') || msg.includes('too many requests'))
    return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.'
  if (msg.includes('auth session missing')) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Lỗi kết nối mạng. Vui lòng kiểm tra Internet và thử lại.'

  return raw
}
