import type {
  MemberBenefit,
  MemberBenefitAssignment,
  MemberBenefitAssignmentStatus,
} from "@/lib/types/database";

export function resolveBenefitDisplayStatus(
  assignment: Pick<MemberBenefitAssignment, "status" | "starts_at" | "ends_at" | "used_at">,
  benefit?: Pick<MemberBenefit, "starts_at" | "ends_at" | "status"> | null,
  now = new Date()
): MemberBenefitAssignmentStatus {
  if (assignment.status === "revoked" || assignment.status === "disabled") return assignment.status;
  if (assignment.status === "used" || assignment.used_at) return "used";
  if (benefit?.status === "disabled") return "disabled";

  const start = assignment.starts_at ?? benefit?.starts_at ?? null;
  const end = assignment.ends_at ?? benefit?.ends_at ?? null;
  if (start && new Date(start) > now) return "upcoming";
  if (end && new Date(end) < now) return "expired";
  return "available";
}

export const BENEFIT_STATUS_LABEL: Record<MemberBenefitAssignmentStatus, string> = {
  available: "可使用",
  used: "已使用",
  expired: "已過期",
  upcoming: "即將開始",
  disabled: "已停用",
  revoked: "已撤銷",
};
