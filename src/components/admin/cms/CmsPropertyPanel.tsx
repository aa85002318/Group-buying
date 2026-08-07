"use client";

import { Input } from "@/components/ui/input";
import type { CmsBlock } from "@/types/cms";
import { ImageUploader } from "@/components/admin/cms/ImageUploader";
import { LinkPicker } from "@/components/admin/cms/LinkPicker";
import {
  cmsLinkFromHref,
  hrefFromCmsLink,
  type CmsLinkValue,
} from "@/components/admin/home/CmsLinkPicker";
import { CMS_IMAGE_SPECS } from "@/components/admin/home/CmsImageField";

type Props = {
  block: CmsBlock | null;
  pageId: string;
  onChange: (patch: Partial<CmsBlock>) => void;
  readOnly?: boolean;
};

export function CmsPropertyPanel({ block, pageId, onChange, readOnly }: Props) {
  if (!block) {
    return (
      <div className="flex h-full flex-col p-4">
        <p className="text-sm font-bold text-[#153E73]">屬性面板</p>
        <p className="mt-3 text-sm text-[#8A94A6]">選取畫布上的區塊以編輯設定。</p>
        <p className="mt-2 text-[11px] text-[#8A94A6]">頁面：{pageId}</p>
      </div>
    );
  }

  const imageUrl =
    (block.settings.image_url as string | undefined) ||
    (block.settings.desktop_image as string | undefined) ||
    null;
  const linkHref = (block.settings.link_href as string | undefined) || "";
  const linkValue = cmsLinkFromHref(linkHref);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#ECECEC] p-3">
        <p className="text-sm font-bold text-[#153E73]">屬性面板</p>
        <p className="truncate text-[11px] text-[#8A94A6]">
          {block.name} · {block.type}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#153E73]">顯示名稱</span>
          <Input
            value={block.name}
            disabled={readOnly}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-[#153E73]">
          <input
            type="checkbox"
            checked={block.enabled}
            disabled={readOnly}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          啟用此區塊
        </label>

        <ImageUploader
          label="區塊圖片"
          value={imageUrl}
          disabled={readOnly}
          spec={CMS_IMAGE_SPECS.campaignWide}
          onChange={(url) =>
            onChange({
              settings: {
                ...block.settings,
                image_url: url,
                desktop_image: url,
              },
            })
          }
        />

        <div>
          <p className="mb-1 text-xs font-medium text-[#153E73]">連結</p>
          <LinkPicker
            value={linkValue}
            disabled={readOnly}
            onChange={(next: CmsLinkValue) =>
              onChange({
                settings: {
                  ...block.settings,
                  link_href: hrefFromCmsLink(next),
                  link: next,
                },
              })
            }
          />
        </div>

        {block.sourceKey ? (
          <p className="rounded-[12px] bg-[#EEF8FC] px-3 py-2 text-[11px] text-[#153E73]">
            來源 key：<code>{block.sourceKey}</code>
            <br />
            正式寫入仍走既有草稿 API；畫布變更預設為本機預覽。
          </p>
        ) : null}
      </div>
    </div>
  );
}
