import { NextResponse, type NextRequest } from 'next/server';

// Edge-safe middleware: avoid Node-only Supabase client here.
// Do minimal auth check; defer detailed access checks to server components/routes.
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = [
    '/',
    '/polarion',
    '/api/email/notify-new-unapproved',
  ];
  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/signup') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$/);

  if (isPublic) {
    return NextResponse.next({ request });
  }

  const hasUserCookie = Boolean(request.cookies.get('user_id')?.value);
  if (!hasUserCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
