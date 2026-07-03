import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;
  const userId = auth!.profile.id;

  const body = await request.json();
  const { productId, shareRecordId, eventType, rawPayload } = body as {
    productId?: string;
    shareRecordId?: string;
    eventType?: string;
    rawPayload?: Record<string, unknown>;
  };

  if (!eventType) {
    return NextResponse.json({ error: "缺少事件類型" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const event = {
      id: `lse-${Date.now()}`,
      user_id: userId,
      product_id: productId ?? null,
      share_record_id: shareRecordId ?? null,
      event_type: eventType,
      raw_payload: rawPayload ?? {},
      created_at: new Date().toISOString(),
    };
    monsterMockStore.lineEvents.push(event);
    return NextResponse.json({ event });
  }

  const supabase = await createClient();
  const { data, error: insertError } = await supabase
    .from("line_share_events")
    .insert({
      user_id: userId,
      product_id: productId ?? null,
      share_record_id: shareRecordId ?? null,
      event_type: eventType,
      raw_payload: rawPayload ?? {},
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
