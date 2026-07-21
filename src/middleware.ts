import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/config";
import {
  ADMIN_ROLES,
  isContentEditorAllowedPath,
  isCustomerServiceAllowedPath,
  isStoreStaffAllowedPath,
} from "@/lib/admin/permissions";

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ["/cart", "/checkout", "/orders", "/profile", "/commissions", "/share-rewards", "/notifications", "/payment-report"];
  const adminPaths = ["/admin"];
  const staffPaths = ["/staff"];

  const path = request.nextUrl.pathname;

  if (protectedPaths.some((p) => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (path.startsWith("/checkout") && user && !user.email_confirmed_at) {
    const cartUrl = new URL("/cart", request.url);
    cartUrl.searchParams.set("verify", "email");
    return NextResponse.redirect(cartUrl);
  }

  if (staffPaths.some((p) => path.startsWith(p))) {
    if (path === "/staff/login") {
      return response;
    }
    if (!user) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.role || !["admin", "store_staff"].includes(profile.role)) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("error", "staff_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (adminPaths.some((p) => path.startsWith(p))) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (profileError || !role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "admin_required");
      return NextResponse.redirect(loginUrl);
    }

    if (role === "store_staff" && !isStoreStaffAllowedPath(path)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "content_editor" && !isContentEditorAllowedPath(path)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "customer_service" && !isCustomerServiceAllowedPath(path)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 已登入使用者仍可開啟登入頁（切換帳號）；不再強制導回首頁

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
