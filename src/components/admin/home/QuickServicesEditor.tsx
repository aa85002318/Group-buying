"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { ColorSwatchPicker } from "@/components/admin/home/ColorSwatchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_QUICK_SERVICES_SETTINGS,
  type HomeQuickServicesSettings,
  type MemberShortcutItem,
  type QuickServiceItem,
} from "@/types/home-quick-service";

export function QuickServicesEditor({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: HomeQuickServicesSettings;
  onChange: (next: HomeQuickServicesSettings) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const settings = value ?? DEFAULT_QUICK_SERVICES_SETTINGS;

  const updateItem = (index: number, patch: Partial<QuickServiceItem>) => {
    const items = [...settings.items];
    items[index] = { ...items[index], ...patch };
    onChange({ ...settings, items });
  };

  const updateMember = (index: number, patch: Partial<MemberShortcutItem>) => {
    const memberShortcuts = [...settings.memberShortcuts];
    memberShortcuts[index] = { ...memberShortcuts[index], ...patch };
    onChange({ ...settings, memberShortcuts });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        常用服務：上傳素材、指定連結、色卡更換底色。會員中心可改文案與圖片。
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">區塊標題</label>
          <Input
            value={settings.title}
            onChange={(e) => onChange({ ...settings, title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">副標</label>
          <Input
            value={settings.subtitle}
            onChange={(e) => onChange({ ...settings, subtitle: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">全部服務文字</label>
          <Input
            value={settings.allServicesLabel}
            onChange={(e) => onChange({ ...settings, allServicesLabel: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">全部服務連結</label>
          <Input
            value={settings.allServicesHref}
            onChange={(e) => onChange({ ...settings, allServicesHref: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-coffee">服務項目</p>
        {settings.items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-border/70 p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">項目 {index + 1}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...settings,
                    items: settings.items.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
            <Input
              value={item.title}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder="標題"
            />
            <Input
              value={item.href}
              onChange={(e) => updateItem(index, { href: e.target.value })}
              placeholder="連結"
            />
            <AdminImageUpload
              label="素材圖（建議 256×256 透明底）"
              images={item.imageUrl ? [item.imageUrl] : []}
              onChange={(imgs) => updateItem(index, { imageUrl: imgs[0] ?? "" })}
              uploadFolder="home/quick-services"
              maxImages={1}
              multiple={false}
            />
            <ColorSwatchPicker
              value={item.backgroundColor}
              onChange={(c) => updateItem(index, { backgroundColor: c })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.enabled !== false}
                onChange={(e) => updateItem(index, { enabled: e.target.checked })}
              />
              啟用
            </label>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...settings,
              items: [
                ...settings.items,
                {
                  id: `qs-${Date.now()}`,
                  title: "新服務",
                  imageUrl: "",
                  href: "/",
                  backgroundColor: "#FFF5CC",
                  enabled: true,
                  sortOrder: (settings.items.length + 1) * 10,
                },
              ],
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          新增服務
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-semibold text-coffee">會員中心</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.memberCenterEnabled !== false}
            onChange={(e) =>
              onChange({ ...settings, memberCenterEnabled: e.target.checked })
            }
          />
          顯示會員中心
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={settings.memberCenterTitle}
            onChange={(e) =>
              onChange({ ...settings, memberCenterTitle: e.target.value })
            }
            placeholder="會員中心標題"
          />
          <Input
            value={settings.memberCenterSubtitle}
            onChange={(e) =>
              onChange({ ...settings, memberCenterSubtitle: e.target.value })
            }
            placeholder="副標"
          />
          <Input
            className="sm:col-span-2"
            value={settings.memberCenterHref}
            onChange={(e) =>
              onChange({ ...settings, memberCenterHref: e.target.value })
            }
            placeholder="主連結"
          />
        </div>
        <AdminImageUpload
          label="會員中心主圖"
          images={
            settings.memberCenterImageUrl ? [settings.memberCenterImageUrl] : []
          }
          onChange={(imgs) =>
            onChange({ ...settings, memberCenterImageUrl: imgs[0] ?? "" })
          }
          uploadFolder="home/member-center"
          maxImages={1}
          multiple={false}
        />

        {settings.memberShortcuts.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-border/70 p-2">
            <div className="flex justify-between">
              <p className="text-xs">快捷 {index + 1}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...settings,
                    memberShortcuts: settings.memberShortcuts.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
            <Input
              value={item.title}
              onChange={(e) => updateMember(index, { title: e.target.value })}
              placeholder="標題"
            />
            <Input
              value={item.href}
              onChange={(e) => updateMember(index, { href: e.target.value })}
              placeholder="連結"
            />
            <AdminImageUpload
              label="圖示"
              images={item.imageUrl ? [item.imageUrl] : []}
              onChange={(imgs) => updateMember(index, { imageUrl: imgs[0] ?? "" })}
              uploadFolder="home/member-shortcuts"
              maxImages={1}
              multiple={false}
            />
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...settings,
              memberShortcuts: [
                ...settings.memberShortcuts,
                {
                  id: `ms-${Date.now()}`,
                  title: "新快捷",
                  imageUrl: "",
                  href: "/member",
                  enabled: true,
                  sortOrder: (settings.memberShortcuts.length + 1) * 10,
                },
              ],
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          新增會員快捷
        </Button>
      </div>

      <Button type="button" size="sm" disabled={saving} onClick={onSave}>
        儲存常用服務／會員中心
      </Button>
    </div>
  );
}
