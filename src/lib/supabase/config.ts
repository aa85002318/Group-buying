const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your_supabase",
  "placeholder",
  "example.supabase.co",
  "xxx",
  "changeme",
];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  const lower = `${url}${key}`.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}
