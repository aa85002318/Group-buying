import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { plainTextSnippet } from "@/lib/cms/safeHtml";

type SearchHit = {
  type: "product" | "article" | "course" | "livestream" | "faq" | "brand";
  id: string;
  title: string;
  href: string;
  snippet?: string | null;
  imageUrl?: string | null;
  price?: number | null;
};

function productImageUrl(row: {
  image_url?: string | null;
  images?: unknown;
}): string | null {
  const main = typeof row.image_url === "string" ? row.image_url.trim() : "";
  if (main) return main;
  if (!Array.isArray(row.images)) return null;
  const first = row.images.find((item) => typeof item === "string" && item.trim());
  return typeof first === "string" ? first.trim() : null;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], query: q });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ results: [], query: q });
  }

  const pattern = `%${q}%`;
  const supabase = await createClient();
  const admin = createAdminClient();
  const results: SearchHit[] = [];

  const [products, articles, courses, livestreams, faqs, brands] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, short_description, image_url, images, price, sale_price")
      .eq("is_active", true)
      .or(`name.ilike.${pattern},description.ilike.${pattern},sku.ilike.${pattern}`)
      .limit(8),
    supabase
      .from("articles")
      .select("id, title, slug, content")
      .eq("status", "published")
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
    admin
      .from("baking_courses")
      .select("id, title, description")
      .eq("is_active", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("livestreams")
      .select("id, title, description")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("faqs")
      .select("id, question, answer")
      .eq("is_active", true)
      .or(`question.ilike.${pattern},answer.ilike.${pattern}`)
      .limit(5),
    admin
      .from("brands")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("name", pattern)
      .limit(5),
  ]);

  for (const p of products.data ?? []) {
    const sale = Number(p.sale_price);
    const price = Number(p.price);
    results.push({
      type: "product",
      id: p.id,
      title: p.name,
      href: `/shop/products/${p.id}`,
      snippet: plainTextSnippet(p.short_description) ?? plainTextSnippet(p.description),
      imageUrl: productImageUrl(p),
      price: Number.isFinite(sale) && sale > 0 ? sale : Number.isFinite(price) ? price : null,
    });
  }
  for (const a of articles.data ?? []) {
    results.push({
      type: "article",
      id: a.id,
      title: a.title,
      href: `/articles/${a.slug}`,
      snippet: plainTextSnippet(a.content),
    });
  }
  for (const c of courses.data ?? []) {
    results.push({
      type: "course",
      id: c.id,
      title: c.title,
      href: `/courses/${c.id}`,
      snippet: plainTextSnippet(c.description),
    });
  }
  for (const l of livestreams.data ?? []) {
    results.push({
      type: "livestream",
      id: l.id,
      title: l.title,
      href: `/live/${l.id}`,
      snippet: plainTextSnippet(l.description),
    });
  }
  for (const f of faqs.data ?? []) {
    results.push({
      type: "faq",
      id: f.id,
      title: f.question,
      href: `/faq`,
      snippet: plainTextSnippet(f.answer),
    });
  }
  for (const b of brands.data ?? []) {
    results.push({
      type: "brand",
      id: b.id,
      title: b.name,
      href: `/products?brand=${b.slug ?? b.id}`,
      snippet: null,
    });
  }

  return NextResponse.json({ results, query: q });
}
