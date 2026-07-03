export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  const placeholders = [
    "your-project",
    "placeholder",
    "xxx.supabase.co",
    "example.supabase.co",
    "changeme",
  ];
  return !placeholders.some((p) => url.toLowerCase().includes(p.toLowerCase()));
}
