import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Partial<ResponseCookie>;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              supabaseResponse.cookies.set(name, value, options);
              return;
            }
            supabaseResponse.cookies.set(name, value);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isResetPassword = pathname === "/login/reset";
  const isForgotPassword = pathname === "/login/forgot";

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = !!factors?.totp?.some(
      (f) => f.status === "verified"
    );

    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const isEnrollMfa = pathname === "/login/enroll-mfa";
    const isVerifyMfa = pathname === "/login/verify-mfa";

    if (!hasVerifiedTotp) {
      if (!isEnrollMfa) {
        const url = request.nextUrl.clone();
        url.pathname = "/login/enroll-mfa";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const needsMfaStep =
      aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";

    if (needsMfaStep) {
      if (!isVerifyMfa && pathname !== "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/login/verify-mfa";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (isAuthRoute) {
      if (isResetPassword || isForgotPassword) {
        return supabaseResponse;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
