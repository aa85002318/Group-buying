import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 上傳／下載／移除「自製報價單檔案」。
 *
 * 系統內建的報價單（品項、折扣、運費、可列印）照舊可用。這支是給需要用自己
 * 做好的檔案回覆的情況——例如要蓋章的正式報價單、或客戶指定格式。
 *
 * 存在私有 bucket，不是公開網址：報價單上有客戶名稱與報價金額，放在公開
 * bucket 等於「知道網址就看得到」。所以 quote_file_url 欄位存的是 bucket 內
 * 的路徑，要看檔案得打這支的 GET 換一個短時效 signed URL。
 */

const BUCKET = "quotation-files";

/**
 * 4MB。Vercel serverless function 的請求上限約 4.5MB，超過的話在進到這支程式
 * 之前就被平台以 413（FUNCTION_PAYLOAD_TOO_LARGE，而且不是 JSON）擋掉，
 * 前端只會拿到一個看不懂的錯誤。設 4MB 讓訊息由我們自己給。
 */
const MAX_SIZE = 4 * 1024 * 1024;

/** signed URL 的時效。只是為了讓人按下去能開，不需要長。 */
const SIGNED_URL_TTL_SECONDS = 300;

const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/msword", "doc"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

type Ctx = { params: Promise<{ id: string }> };

/** 換一個短時效 signed URL 並直接轉過去，讓後台可以「按了就開」。 */
export async function GET(_request: Request, { params }: Ctx) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: quotation } = await admin
    .from("quotations")
    .select("quote_file_url")
    .eq("id", id)
    .maybeSingle();

  const path = quotation?.quote_file_url as string | null | undefined;
  if (!path) {
    return NextResponse.json({ error: "此報價單沒有上傳檔案" }, { status: 404 });
  }

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signError?.message ?? "無法取得檔案連結" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}

export async function POST(request: Request, { params }: Ctx) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇要上傳的檔案" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "檔案不能超過 4MB" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "只接受 PDF、Excel、Word 或圖片檔" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: quotation } = await admin
    .from("quotations")
    .select("id, quote_number, quote_file_url")
    .eq("id", id)
    .maybeSingle();
  if (!quotation) {
    return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
  }

  // 路徑由伺服器決定，不用客戶端傳來的檔名組路徑（避免路徑穿越）。
  const path = `quotations/${id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    // bucket 還沒建立（migration 沒跑）時這裡會失敗，給一個看得懂的訊息。
    const hint = /bucket|not found/i.test(uploadError.message)
      ? "報價單檔案儲存區尚未建立，請先執行 quotation-files 的 migration。"
      : uploadError.message;
    return NextResponse.json({ error: hint }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("quotations")
    .update({
      // 存路徑，不是公開網址——bucket 是私有的。
      quote_file_url: path,
      // 保留原始檔名給客戶看，實際儲存路徑另外產生。
      quote_file_name: file.name.slice(0, 200),
      quote_file_uploaded_at: new Date().toISOString(),
      quote_file_uploaded_by: auth!.profile.id,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "quotations",
    id,
    { quote_file_url: quotation.quote_file_url },
    { quote_file_url: path, quote_file_name: file.name },
    request as never
  );

  return NextResponse.json({
    name: file.name,
    uploaded_at: new Date().toISOString(),
  });
}

/** 移除已上傳的報價單檔案（改回使用系統內建的那份）。 */
export async function DELETE(request: Request, { params }: Ctx) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("quotations")
    .update({
      quote_file_url: null,
      quote_file_name: null,
      quote_file_uploaded_at: null,
      quote_file_uploaded_by: null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 儲存體的檔案刻意不刪：審計上可能還需要查得到曾經發出去的版本。
  await logAudit(auth!.profile.id, "update", "quotations", id, null, { quote_file_url: null }, request as never);
  return NextResponse.json({ ok: true });
}
