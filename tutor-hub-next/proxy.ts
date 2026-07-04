import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, the public HTML app, and its JS modules (public/js/*)
    '/((?!_next/static|_next/image|favicon.ico|tutor-hub-app\\.html|js/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)',
  ],
}
