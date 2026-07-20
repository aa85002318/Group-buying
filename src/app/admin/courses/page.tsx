"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";

type Course = {
  id: string;
  title: string;
  teacher_name: string;
  price: number;
  capacity: number;
  enrolled_count: number;
  is_active: boolean;
  start_at: string | null;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    teacher_name: "棋美老師",
    price: "1800",
    capacity: "12",
    location: "棋美點心屋教室",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title.trim()) return alert("請填寫課程名稱");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          teacher_name: form.teacher_name,
          price: Number(form.price) || 0,
          capacity: Number(form.capacity) || 12,
          location: form.location,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm({ ...form, title: "" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="課程管理" description="場次、名額與開課資訊" />
      <div className="max-w-xl space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium">新增課程</h2>
        <Input placeholder="課程名稱" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="老師" value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="價格" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Input type="number" placeholder="名額" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <Input placeholder="地點" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Button onClick={create} disabled={saving}>{saving ? "儲存中…" : "新增課程"}</Button>
      </div>
      <AdminTable
        columns={[
          { key: "title", header: "課程", render: (c) => c.title },
          { key: "teacher", header: "老師", render: (c) => c.teacher_name },
          { key: "seats", header: "名額", render: (c) => `${c.enrolled_count}/${c.capacity}` },
          { key: "price", header: "價格", render: (c) => c.price },
          { key: "active", header: "狀態", render: (c) => (c.is_active ? "上架" : "下架") },
        ]}
        rows={courses}
        loading={loading}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}
