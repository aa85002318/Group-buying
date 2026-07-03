"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { UserNotification } from "@/lib/types/database";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    fetch("/api/notifications/my")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">通知中心</h1>
      {notifications.length === 0 ? (
        <p className="text-center text-muted-foreground">尚無通知</p>
      ) : (
        notifications.map((n) => (
          <Card
            key={n.id}
            className={n.is_read ? "opacity-70" : ""}
            onClick={() => !n.is_read && markRead(n.id)}
          >
            <CardContent className="p-4">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-2 text-xs text-coffee">{formatDate(n.created_at)}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
