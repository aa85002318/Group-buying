/**
 * Extract curated faces from Google Fonts zip and upload to Supabase `brand-fonts`.
 *
 * Usage:
 *   node --env-file=.env.local scripts/upload-brand-fonts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const ZIP =
  process.env.BRAND_FONTS_ZIP ||
  "/Users/rachel/Downloads/字型/Cactus_Classical_Serif,Chiron_GoRound_TC,Chiron_Hei_HK,Chiron_Sung_HK,Chocolate_Classical_Sans,etc.zip";

const FILES = [
  "Noto_Sans_TC/NotoSansTC-VariableFont_wght.ttf",
  "Noto_Sans_HK/NotoSansHK-VariableFont_wght.ttf",
  "Noto_Serif_TC/NotoSerifTC-VariableFont_wght.ttf",
  "Noto_Serif_HK/NotoSerifHK-VariableFont_wght.ttf",
  "Chiron_GoRound_TC/ChironGoRoundTC-VariableFont_wght.ttf",
  "Chiron_Hei_HK/ChironHeiHK-VariableFont_wght.ttf",
  "Chiron_Sung_HK/ChironSungHK-VariableFont_wght.ttf",
  "Chocolate_Classical_Sans/ChocolateClassicalSans-Regular.ttf",
  "Cactus_Classical_Serif/CactusClassicalSerif-Regular.ttf",
  "LXGW_WenKai_TC/LXGWWenKaiTC-Regular.ttf",
  "LXGW_WenKai_Mono_TC/LXGWWenKaiMonoTC-Regular.ttf",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!existsSync(ZIP)) {
  console.error("Zip not found:", ZIP);
  process.exit(1);
}

console.log("Target:", url);

const outDir = join(process.cwd(), "tmp", "brand-fonts-extract");
mkdirSync(outDir, { recursive: true });

console.log("Extracting curated fonts…");
execFileSync("unzip", ["-o", ZIP, ...FILES, "-d", outDir], { stdio: "inherit" });

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Ensure bucket exists (migration may already have created it)
await supabase.storage.createBucket("brand-fonts", {
  public: true,
  fileSizeLimit: 67108864,
  allowedMimeTypes: [
    "font/ttf",
    "font/otf",
    "application/font-sfnt",
    "application/octet-stream",
  ],
}).catch(() => {});

for (const rel of FILES) {
  const local = join(outDir, rel);
  if (!existsSync(local)) {
    console.warn("Missing extract:", rel);
    continue;
  }
  const name = basename(rel);
  const buf = readFileSync(local);
  const mb = (statSync(local).size / 1024 / 1024).toFixed(1);
  console.log(`Uploading ${name} (${mb} MB)…`);
  const { error } = await supabase.storage.from("brand-fonts").upload(name, buf, {
    contentType: "font/ttf",
    upsert: true,
  });
  if (error) {
    console.error("Upload failed:", name, error.message);
  } else {
    const { data } = supabase.storage.from("brand-fonts").getPublicUrl(name);
    console.log("OK", data.publicUrl);
  }
}

console.log("Done. Objects in bucket:");
const { data: list } = await supabase.storage.from("brand-fonts").list();
for (const f of list ?? []) console.log("-", f.name, f.metadata?.size);
