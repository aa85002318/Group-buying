import { NextResponse } from "next/server";
import { requireRole, type UserRole } from "@/lib/auth";

/**
 * 門市會員禮角色對照：
 * - admin → 總管理員（全權，含沖銷／調庫存）
 * - content_editor → 行銷人員（建編活動／品項／報表，不可核銷）
 * - store_manager → 門市主管（核銷、申請本店沖銷、看券／紀錄）
 * - store_staff → 門市人員（掃描核銷、看券／紀錄）
 * - customer_service → 稽核人員（只讀儀表板／券／紀錄／報表）
 */

export const GIFT_ROLE_LABEL: Record<string, string> = {
  admin: "總管理員",
  content_editor: "行銷人員",
  store_manager: "門市主管",
  store_staff: "門市人員",
  customer_service: "稽核人員",
};

const STAFF_ROLES: UserRole[] = ["admin", "store_staff", "store_manager"];
const READ: UserRole[] = [
  "admin",
  "content_editor",
  "store_staff",
  "store_manager",
  "customer_service",
];
const MARKETING_WRITE: UserRole[] = ["admin", "content_editor"];
const REDEEM: UserRole[] = STAFF_ROLES;
const AUDIT_READ: UserRole[] = READ;
const REVERSE: UserRole[] = ["admin", "store_manager"];
const REVERSE_EXECUTE: UserRole[] = ["admin"];

export async function requireGiftRead() {
  return requireRole(READ);
}

export async function requireGiftMarketing() {
  return requireRole(MARKETING_WRITE);
}

export async function requireGiftRedeem() {
  return requireRole(REDEEM);
}

export async function requireGiftAuditRead() {
  return requireRole(AUDIT_READ);
}

/** 申請沖銷：總管或門市主管 */
export async function requireGiftReverse() {
  return requireRole(REVERSE);
}

/** 直接執行沖銷／核准申請：僅總管理員 */
export async function requireGiftReverseExecute() {
  return requireRole(REVERSE_EXECUTE);
}

export function giftForbidden(message = "權限不足"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}
