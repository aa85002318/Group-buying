/**
 * Supabase/PostgREST often caps a single response at ~1000 rows.
 * Page through with `.range()` until all matching rows are loaded.
 */
export async function fetchAllSupabaseRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) return { data: all, error };
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
    // Safety guard against runaway loops
    if (from > 100_000) break;
  }

  return { data: all, error: null };
}
