import type { RecipeAccessPermission } from "@/lib/types/database";

/**
 * Conservative ACL for public recipe APIs.
 * - public: always OK
 * - member: require logged-in user
 * - everything else: treat as login-required for now (full ACL later)
 */
export function canViewRecipeByAccess(
  access: RecipeAccessPermission | string | null | undefined,
  isLoggedIn: boolean
): boolean {
  const perm = access || "public";
  if (perm === "public") return true;
  if (perm === "member") return isLoggedIn;
  // membership | purchase | code | allowlist | scheduled_access — conservative
  return isLoggedIn;
}

export function isPublicListableAccess(
  access: RecipeAccessPermission | string | null | undefined
): boolean {
  return !access || access === "public";
}
