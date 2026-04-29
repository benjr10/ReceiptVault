import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(request.nextUrl.pathname);
  const isPublicPage = ['/', '/splash', '/onboarding'].includes(request.nextUrl.pathname) || isAuthPage;

  if (!user) {
    if (!isPublicPage && !request.nextUrl.pathname.startsWith('/auth')) {
      console.log('MIDDLEWARE: Unauthenticated guest blocked from', request.nextUrl.pathname);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    const emailConfirmed = user.email_confirmed_at;
    const isUnverified = !emailConfirmed;

    if (isUnverified && !isAuthPage) {
      console.log('MIDDLEWARE: Unverified user blocked from', request.nextUrl.pathname);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isUnverified && isPublicPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|icons/).*)",
  ],
};