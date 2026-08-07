"use client";

import {
  CmsImageField,
  CMS_IMAGE_SPECS,
  type CmsImageSpec,
} from "@/components/admin/home/CmsImageField";

/** Unified image uploader wrapper for canvas CMS (Phase 3). */
export function ImageUploader({
  value,
  onChange,
  label = "圖片",
  spec = CMS_IMAGE_SPECS.heroDesktop,
  disabled,
  uploadFolder = "cms/canvas",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  spec?: CmsImageSpec;
  disabled?: boolean;
  uploadFolder?: string;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <p className="mb-1 text-xs font-medium text-[#153E73]">{label}</p>
      <CmsImageField
        value={value}
        onChange={onChange}
        spec={spec}
        uploadFolder={uploadFolder}
      />
    </div>
  );
}

export { CMS_IMAGE_SPECS };
