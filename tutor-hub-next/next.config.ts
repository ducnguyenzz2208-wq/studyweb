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
              // oEmbed lấy tiêu đề/ảnh: YouTube + Spotify + SoundCloud
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://www.youtube.com https://open.spotify.com https://soundcloud.com",
              // frame-src cho khung nhúng trình phát: YouTube + Spotify + SoundCloud
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com https://w.soundcloud.com",
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
