import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const reports = [
  {
    title: "訂單報表",
    description: "匯出所有訂單明細（Excel）",
    href: "/api/admin/orders/export?format=xlsx",
    filename: "orders.xlsx",
  },
  {
    title: "分潤報表",
    description: "匯出分潤紀錄明細（Excel）",
    href: "/api/admin/commission-records/export?format=xlsx",
    filename: "commission-records.xlsx",
  },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="報表中心" description="下載營運與分潤 Excel 報表" />

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardContent className="p-4">
              <h2 className="font-medium text-coffee">{r.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              <a
                href={r.href}
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                下載 Excel →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
