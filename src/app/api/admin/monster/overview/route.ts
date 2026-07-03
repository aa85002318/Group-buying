import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const profiles = Array.from(monsterMockStore.profiles.values());
    const shares = monsterMockStore.shareRecords;
    const rewards = monsterMockStore.rewards;
    return NextResponse.json({
      overview: {
        totalPlayers: profiles.length,
        totalBreadKg: profiles.reduce((s, p) => s + Number(p.bread_kg), 0),
        pendingShares: shares.filter((s) => s.status === "pending_review").length,
        pendingRewards: rewards.filter((r) => r.status === "pending_review").length,
        approvedShares: shares.filter((s) => s.status === "approved").length,
      },
      recentShares: shares.slice(-10).reverse(),
    });
  }

  const admin = createAdminClient();
  const [
    { count: totalPlayers },
    { data: profiles },
    { count: pendingShares },
    { count: approvedShares },
    { count: pendingRewards },
    { data: recentShares },
  ] = await Promise.all([
    admin.from("monster_profiles").select("*", { count: "exact", head: true }),
    admin.from("monster_profiles").select("bread_kg"),
    admin
      .from("product_share_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    admin
      .from("product_share_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    admin
      .from("monster_rewards")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    admin
      .from("product_share_records")
      .select("*, profiles(full_name, member_code)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalBreadKg = (profiles ?? []).reduce((s, p) => s + Number(p.bread_kg), 0);

  return NextResponse.json({
    overview: {
      totalPlayers: totalPlayers ?? 0,
      totalBreadKg,
      pendingShares: pendingShares ?? 0,
      pendingRewards: pendingRewards ?? 0,
      approvedShares: approvedShares ?? 0,
    },
    recentShares: recentShares ?? [],
  });
}
