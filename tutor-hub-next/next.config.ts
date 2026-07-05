import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow the iframe to run Supabase CDN scripts
  async headers() {
    return [
      {
        source: '/tutor-hub-app.html',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Thêm youtube.com + s.ytimg.com cho YouTube IFrame API (mục Pomodoro → Nhạc học tập)
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.supabase.com https://www.youtube.com https://s.ytimg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https:",
              // youtube.com cho oEmbed (lấy tiêu đề) + IFrame API
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://www.youtube.com",
              // frame-src cho khung nhúng trình phát YouTube
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
