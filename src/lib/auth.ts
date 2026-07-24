import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockProfile, mockAdminProfile, MOCK_USER_ID } from "@/lib/mock-data";

export type UserRole =
  | "member"
  | "admin"
  | "store_staff"
  | "content_editor"
  | "customer_service"
  | "group_leader"
  | "promoter"
  | "livestream_host";

function getMockAuth() {
  return {
    user: { id: MOCK_USER_ID, email: mockProfile.email },
    profile: mockProfile,
  };
}

function getMockAdminAuth() {
  return {
    user: { id: mockAdminProfile.id, email: mockAdminProfile.email },
    profile: mockAdminProfile,
  };
}

export async function getAuthUser() {
  if (!isSupabaseConfigured()) return getMockAuth();

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  if (profile.is_active === false) {
    await supabase.auth.signOut();
    return null;
  }

  return { user, profile };
}

export function isEmailVerified(user: unknown): boolean {
  if (!isSupabaseConfigured()) return true;
  if (!user || typeof user !== "object") return false;
  return Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
}

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth) {
    return { error: NextResponse.json({ error: "未登入" }, { status: 401 }), auth: null };
  }
  return { error: null, auth };
}

/** Requires login and confirmed email (for checkout, orders, etc.). */
export async function requireVerifiedAuth() {
  const result = await requireAuth();
  if (result.error) return result;

  if (!isEmailVerified(result.auth!.user)) {
    return {
      error: NextResponse.json(
        { error: "請先完成 Email 驗證後再下單", code: "email_not_confirmed" },
        { status: 403 }
      ),
      auth: null,
    };
  }

  return result;
}

export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: null, auth: getMockAdminAuth() };
  }
  const result = await requireAuth();
  if (result.error) return result;
  if (result.auth!.profile.role !== "admin") {
    return { error: NextResponse.json({ error: "權限不足" }, { status: 403 }), auth: null };
  }
  return result;
}

/** Admin or content editor — recipes / news / banners / FAQ / home CMS */
export async function requireContentAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: null, auth: getMockAdminAuth() };
  }
  return requireRole(["admin", "content_editor"]);
}

/** Admin, customer service, or store staff — App orders / members view */
export async function requireOpsAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: null, auth: getMockAdminAuth() };
  }
  return requireRole(["admin", "customer_service", "store_staff"]);
}

export async function requireStaffOrAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: null, auth: getMockAdminAuth() };
  }
  return requireRole(["admin", "store_staff", "customer_service"]);
}

/** Store ops module — admin or store_staff only (no customer_service writes). */
export async function requireStoreOps() {
  if (!isSupabaseConfigured()) {
    return { error: null, auth: getMockAdminAuth() };
  }
  return requireRole(["admin", "store_staff"]);
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const result = await requireAuth();
  if (result.error) return result;
  if (!allowed.includes(result.auth!.profile.role as UserRole)) {
    return { error: NextResponse.json({ error: "權限不足" }, { status: 403 }), auth: null };
  }
  return result;
}

export async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldData?: unknown,
  newData?: unknown,
  request?: NextRequest
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData ?? null,
      new_data: newData ?? null,
      ip_address: request?.headers.get("x-forwarded-for") ?? null,
      user_agent: request?.headers.get("user-agent") ?? null,
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
