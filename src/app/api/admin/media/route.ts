import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMediaFolder, type MediaAsset } from "@/lib/admin/media-library";

export const dynamic = "force-dynamic";

const MISSING_TABLE_RE = /media_assets|does not exist|schema cache/i;

function mapRow(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id),
    uploaded_by: (row.uploaded_by as string | null) ?? null,
    file_name: String(row.file_name ?? ""),
    file_url: String(row.file_url ?? ""),
    mime_type: (row.mime_type as string | null) ?? null,
    file_size: row.file_size != null ? Number(row.file_size) : null,
    folder: String(row.folder ?? "cms/general"),
    alt_text: (row.alt_text as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

/** GET /api/admin/media?folder=&q=&limit= */
export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], folders: [] });
  }

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder");
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 80) || 80));

  const admin = createAdminClient();
  let query = admin
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (folder && folder !== "all") {
    query = query.eq("folder", normalizeMediaFolder(folder));
  }
  if (q) {
    const safe = q.replace(/[%_,.()]/g, " ").trim();
    if (safe) {
      query = query.or(`file_name.ilike.%${safe}%,alt_text.ilike.%${safe}%`);
    }
  }

  const { data, error: fetchError } = await query;
  if (fetchError) {
    if (MISSING_TABLE_RE.test(fetchError.message)) {
      return NextResponse.json({
        items: [],
        folders: [],
        warning: "media_assets 尚未就緒，請套用 migration 後再試",
      });
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const folderRes = await admin.from("media_assets").select("folder").limit(500);
  const folderSet = new Set<string>();
  for (const row of folderRes.data ?? []) {
    if (row.folder) folderSet.add(String(row.folder));
  }

  return NextResponse.json({
    items: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
    folders: Array.from(folderSet).sort(),
  });
}

/** POST — register an already-uploaded URL into the library (or after upload helper). */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const fileUrl = String(body.file_url ?? body.url ?? "").trim();
  const fileName = String(body.file_name ?? body.name ?? "").trim() || "image";
  if (!fileUrl) {
    return NextResponse.json({ error: "缺少 file_url" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      item: {
        id: `tmp-${Date.now()}`,
        file_url: fileUrl,
        file_name: fileName,
        folder: normalizeMediaFolder(body.folder),
      },
    });
  }

  const admin = createAdminClient();
  const payload = {
    uploaded_by: auth!.profile.id,
    file_name: fileName.slice(0, 200),
    file_url: fileUrl,
    mime_type: typeof body.mime_type === "string" ? body.mime_type : null,
    file_size: body.file_size != null ? Number(body.file_size) : null,
    folder: normalizeMediaFolder(body.folder),
    alt_text: typeof body.alt_text === "string" ? body.alt_text.trim() || null : null,
  };

  const { data, error } = await admin.from("media_assets").insert(payload).select("*").single();
  if (error) {
    if (MISSING_TABLE_RE.test(error.message)) {
      return NextResponse.json(
        { error: "media_assets 尚未就緒", item: { ...payload, id: null, file_url: fileUrl } },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(
    auth!.profile.id,
    "create",
    "media_assets",
    data.id,
    null,
    { folder: payload.folder, file_name: payload.file_name },
    request as never
  );

  return NextResponse.json({ item: mapRow(data as Record<string, unknown>) }, { status: 201 });
}

/** PATCH — update alt_text / folder */
export async function PATCH(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, ...body } });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.alt_text === "string") patch.alt_text = body.alt_text.trim() || null;
  if (body.folder != null) patch.folder = normalizeMediaFolder(body.folder);

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "沒有可更新欄位" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("media_assets").select("*").eq("id", id).maybeSingle();
  const { data, error } = await admin
    .from("media_assets")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "media_assets", id, old, data, request as never);
  return NextResponse.json({ item: mapRow(data as Record<string, unknown>) });
}

/** DELETE ?id= */
export async function DELETE(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("media_assets").select("*").eq("id", id).maybeSingle();
  const { error } = await admin.from("media_assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete", "media_assets", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
