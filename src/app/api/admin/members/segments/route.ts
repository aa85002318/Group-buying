import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProfile } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

function calcAgeGroup(birthday: string | null) {
  if (!birthday) return "未知";
  const age = Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

const GENDER_LABELS: Record<string, string> = { male: "男性", female: "女性", unknown: "未知" };

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender");
  const ageGroup = searchParams.get("ageGroup");
  const city = searchParams.get("city");
  const memberLevel = searchParams.get("memberLevel");

  if (!isSupabaseConfigured()) {
    const mockMembers = [
      { user_id: mockProfile.id, gender: "female", age_group: "25-34", city: "台北市", district: "信義區", member_level: "一般會員", total_spent: 12800, total_orders: 5 },
      { user_id: "user-2", gender: "male", age_group: "35-44", city: "新北市", district: "板橋區", member_level: "一般會員", total_spent: 32000, total_orders: 12 },
      { user_id: "user-3", gender: "female", age_group: "18-24", city: "台北市", district: "大安區", member_level: "一般會員", total_spent: 4500, total_orders: 2 },
    ];

    let filtered = mockMembers;
    if (gender) filtered = filtered.filter((m) => m.gender === gender);
    if (ageGroup) filtered = filtered.filter((m) => m.age_group === ageGroup);
    if (city) filtered = filtered.filter((m) => m.city === city);
    if (memberLevel) filtered = filtered.filter((m) => m.member_level === memberLevel);

    const genderBreakdown = [
      { label: "男性", value: mockMembers.filter((m) => m.gender === "male").length, color: "#1E3A8A" },
      { label: "女性", value: mockMembers.filter((m) => m.gender === "female").length, color: "#FF4F7B" },
      { label: "未知", value: mockMembers.filter((m) => m.gender === "unknown").length, color: "#94A3B8" },
    ];

    const ageBreakdown = ["18-24", "25-34", "35-44", "45-54", "55+"].map((group) => ({
      label: group,
      value: mockMembers.filter((m) => m.age_group === group).length,
    }));

    const cityBreakdown = ["台北市", "新北市", "台中市", "高雄市"].map((c) => ({
      label: c,
      value: mockMembers.filter((m) => m.city === c).length,
    }));

    return NextResponse.json({
      summary: {
        totalMembers: mockMembers.length,
        filteredCount: filtered.length,
        totalSpent: filtered.reduce((sum, m) => sum + m.total_spent, 0),
        avgOrderValue: filtered.length > 0 ? filtered.reduce((sum, m) => sum + m.total_spent / Math.max(m.total_orders, 1), 0) / filtered.length : 0,
      },
      filters: {
        genders: ["male", "female", "unknown"],
        ageGroups: ["18-24", "25-34", "35-44", "45-54", "55+"],
        cities: ["台北市", "新北市", "台中市", "高雄市"],
        memberLevels: ["一般會員"],
      },
      breakdowns: { gender: genderBreakdown, ageGroup: ageBreakdown, city: cityBreakdown },
      members: filtered.map((m) => ({
        user_id: m.user_id,
        gender: GENDER_LABELS[m.gender] ?? m.gender,
        age_group: m.age_group,
        city: m.city,
        district: m.district,
        member_level: m.member_level,
        total_spent: m.total_spent,
        total_orders: m.total_orders,
      })),
    });
  }

  const admin = createAdminClient();

  let statsQuery = admin.from("customer_statistics").select("*");
  if (gender) statsQuery = statsQuery.eq("gender", gender);
  if (ageGroup) statsQuery = statsQuery.eq("age_group", ageGroup);
  if (city) statsQuery = statsQuery.eq("city", city);
  if (memberLevel) statsQuery = statsQuery.eq("member_level", memberLevel);

  const { data: allStats } = await admin.from("customer_statistics").select("*");
  const { data: filteredStats, error: filterError } = await statsQuery;

  if (filterError && filterError.code !== "42P01") {
    return NextResponse.json({ error: filterError.message }, { status: 500 });
  }

  const stats = allStats ?? [];
  const filtered = filteredStats ?? stats;

  const profilesWithoutStats = stats.length === 0;
  let members: Array<{
    user_id: string;
    gender: string;
    age_group: string;
    city: string;
    district: string;
    member_level: string;
    total_spent: number;
    total_orders: number;
  }> = [];

  if (profilesWithoutStats) {
    const { data: profiles } = await admin.from("profiles").select("id, birthday").eq("role", "member");
    const { data: orders } = await admin.from("orders").select("user_id, total_amount");

    const orderMap = new Map<string, { count: number; spent: number }>();
    for (const order of orders ?? []) {
      const current = orderMap.get(order.user_id) ?? { count: 0, spent: 0 };
      current.count += 1;
      current.spent += Number(order.total_amount);
      orderMap.set(order.user_id, current);
    }

    members = (profiles ?? []).map((p) => {
      const orderStats = orderMap.get(p.id) ?? { count: 0, spent: 0 };
      const age = calcAgeGroup(p.birthday);
      return {
        user_id: p.id,
        gender: "未知",
        age_group: age,
        city: "—",
        district: "—",
        member_level: "一般會員",
        total_spent: orderStats.spent,
        total_orders: orderStats.count,
      };
    });

    if (ageGroup) members = members.filter((m) => m.age_group === ageGroup);
  } else {
    members = filtered.map((s) => ({
      user_id: s.user_id,
      gender: GENDER_LABELS[s.gender ?? "unknown"] ?? "未知",
      age_group: s.age_group ?? "未知",
      city: s.city ?? "—",
      district: s.district ?? "—",
      member_level: s.member_level ?? "一般會員",
      total_spent: Number(s.total_spent ?? 0),
      total_orders: Number(s.total_orders ?? 0),
    }));
  }

  const genderBreakdown = [
    { label: "男性", value: stats.filter((s) => s.gender === "male").length, color: "#1E3A8A" },
    { label: "女性", value: stats.filter((s) => s.gender === "female").length, color: "#FF4F7B" },
    { label: "未知", value: stats.filter((s) => !s.gender || s.gender === "unknown").length, color: "#94A3B8" },
  ];

  const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55+"];
  const ageBreakdown = ageGroups.map((group) => ({
    label: group,
    value: stats.filter((s) => s.age_group === group).length || members.filter((m) => m.age_group === group).length,
  }));

  const cities = Array.from(
    new Set([
      ...stats.map((s) => s.city).filter(Boolean),
      ...members.map((m) => m.city).filter((c) => c !== "—"),
    ])
  );
  const cityBreakdown = cities.slice(0, 10).map((c) => ({
    label: c as string,
    value: stats.filter((s) => s.city === c).length || members.filter((m) => m.city === c).length,
  }));

  const memberLevels = Array.from(new Set(stats.map((s) => s.member_level).filter(Boolean)));
  if (memberLevels.length === 0) memberLevels.push("一般會員");

  return NextResponse.json({
    summary: {
      totalMembers: stats.length || members.length,
      filteredCount: members.length,
      totalSpent: members.reduce((sum, m) => sum + m.total_spent, 0),
      avgOrderValue: members.length > 0 ? members.reduce((sum, m) => sum + (m.total_orders > 0 ? m.total_spent / m.total_orders : 0), 0) / members.length : 0,
    },
    filters: {
      genders: ["male", "female", "unknown"],
      ageGroups,
      cities: cities.length > 0 ? cities : ["台北市", "新北市", "台中市", "高雄市"],
      memberLevels,
    },
    breakdowns: { gender: genderBreakdown, ageGroup: ageBreakdown, city: cityBreakdown },
    members,
  });
}
