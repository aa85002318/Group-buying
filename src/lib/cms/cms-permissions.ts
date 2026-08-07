import type { AdminRole } from "@/lib/admin/permissions";

/** Who can open the unified frontend CMS hub / canvas editor. */
export function canAccessFrontendCms(role: AdminRole | string | null | undefined): boolean {
  return role === "admin" || role === "content_editor";
}

/** Who can publish layout drafts to live. */
export function canPublishFrontendCms(role: AdminRole | string | null | undefined): boolean {
  return role === "admin" || role === "content_editor";
}

/** Group-buy page CMS historically admin-only. */
export function canEditGroupBuyCms(role: AdminRole | string | null | undefined): boolean {
  return role === "admin";
}
