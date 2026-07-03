"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMMISSION_STATUS_LABELS } from "@/lib/utils";

export default function AdminStubPage({ title, apiPath, fields }: { title: string; apiPath?: string; fields?: string[] }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (apiPath) fetch(apiPath).then((r) => r.json()).then((d) => {
      const key = Object.keys(d).find((k) => Array.isArray(d[k]));
      if (key) setItems(d[key]);
    });
  }, [apiPath]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {items.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">尚無資料，請執行種子資料或透過 API 新增。</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id as string}>
            <CardContent className="p-4">
              {(fields ?? ["name", "title", "status"]).map((f) => item[f] ? (
                <p key={f} className="text-sm"><span className="text-muted-foreground">{f}:</span> {String(item[f])}</p>
              ) : null)}
              {item.status ? <Badge className="mt-2">{COMMISSION_STATUS_LABELS[item.status as string] ?? String(item.status)}</Badge> : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
