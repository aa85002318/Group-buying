export type DesktopFooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type DesktopFooterSettings = {
  tagline: string;
  about: string;
  newsletter_enabled: boolean;
  newsletter_title: string;
  newsletter_placeholder: string;
  columns: DesktopFooterColumn[];
  show_social: boolean;
  social_links: Array<{ label: string; href: string }>;
};

export const DEFAULT_DESKTOP_FOOTER_SETTINGS: DesktopFooterSettings = {
  tagline: "Bake a Better Life",
  about: "烘焙生活平台 — 材料、食譜與門市服務，一次滿足。",
  newsletter_enabled: true,
  newsletter_title: "電子報",
  newsletter_placeholder: "輸入 Email 訂閱最新活動",
  show_social: true,
  social_links: [
    { label: "LINE", href: "/support" },
    { label: "Facebook", href: "/support" },
    { label: "Instagram", href: "/support" },
  ],
  columns: [
    {
      title: "購物指南",
      links: [
        { href: "/help/order-guide", label: "訂購說明" },
        { href: "/support", label: "常見問題" },
        { href: "/support/shipping", label: "配送說明" },
        { href: "/support/returns", label: "退換貨" },
      ],
    },
    {
      title: "會員服務",
      links: [
        { href: "/member", label: "會員中心" },
        { href: "/member/orders", label: "我的訂單" },
        { href: "/member/benefits", label: "會員禮遇" },
        { href: "/favorites", label: "我的收藏" },
      ],
    },
    {
      title: "關於我們",
      links: [
        { href: "/stores", label: "門市資訊" },
        { href: "/corporate", label: "企業合作" },
        { href: "/terms", label: "服務條款" },
        { href: "/privacy", label: "隱私權政策" },
      ],
    },
  ],
};

export function normalizeDesktopFooterSettings(raw: unknown): DesktopFooterSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_DESKTOP_FOOTER_SETTINGS;
  const row = raw as Record<string, unknown>;
  const base = DEFAULT_DESKTOP_FOOTER_SETTINGS;
  const columns = Array.isArray(row.columns)
    ? (row.columns as DesktopFooterColumn[]).filter(
        (c) => c && typeof c.title === "string" && Array.isArray(c.links)
      )
    : base.columns;
  const social = Array.isArray(row.social_links)
    ? (row.social_links as DesktopFooterSettings["social_links"]).filter(
        (s) => s && typeof s.label === "string" && typeof s.href === "string"
      )
    : base.social_links;

  return {
    tagline: typeof row.tagline === "string" ? row.tagline : base.tagline,
    about: typeof row.about === "string" ? row.about : base.about,
    newsletter_enabled:
      typeof row.newsletter_enabled === "boolean"
        ? row.newsletter_enabled
        : base.newsletter_enabled,
    newsletter_title:
      typeof row.newsletter_title === "string" ? row.newsletter_title : base.newsletter_title,
    newsletter_placeholder:
      typeof row.newsletter_placeholder === "string"
        ? row.newsletter_placeholder
        : base.newsletter_placeholder,
    columns: columns.length ? columns : base.columns,
    show_social: typeof row.show_social === "boolean" ? row.show_social : base.show_social,
    social_links: social.length ? social : base.social_links,
  };
}
