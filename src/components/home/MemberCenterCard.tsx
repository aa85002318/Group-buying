"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  listVisibleMemberShortcuts,
  type HomeQuickServicesSettings,
} from "@/types/home-quick-service";
import { MemberShortcutItem } from "@/components/home/MemberShortcutItem";

type MemberCenterCardProps = {
  settings: HomeQuickServicesSettings;
};

const PLACEHOLDER = "/images/home/quick-services/member-avatar.svg";

export function MemberCenterCard({ settings }: MemberCenterCardProps) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(settings.memberCenterImageUrl || PLACEHOLDER);
  const shortcuts = listVisibleMemberShortcuts(settings.memberShortcuts);

  if (!settings.memberCenterEnabled) return null;

  const goMember = () => {
    router.push(settings.memberCenterHref);
  };

  const onCardKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goMember();
    }
  };

  const onCardClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("a,button")) return;
    goMember();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={settings.memberCenterTitle}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className="member-center-card flex h-[112px] cursor-pointer items-center gap-3 overflow-hidden rounded-[22px] border border-[#E9EDF2] px-3.5 shadow-[0_8px_22px_rgba(21,62,115,0.05)] transition hover:shadow-[0_10px_26px_rgba(21,62,115,0.08)] md:h-[158px] md:gap-5 md:px-6"
      style={{
        background: "linear-gradient(135deg, #EEF8FC 0%, #F8FBFF 100%)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <span className="relative inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white md:h-16 md:w-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={settings.memberCenterTitle}
            width={64}
            height={64}
            className="h-full w-full object-cover"
            onError={() => setAvatar(PLACEHOLDER)}
            decoding="async"
          />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-[#153E73] md:text-2xl">
            {settings.memberCenterTitle}
          </h3>
          <p className="mt-0.5 truncate text-xs text-[#687386] md:text-sm">
            {settings.memberCenterSubtitle}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-start gap-1 sm:gap-2 md:gap-4">
        {shortcuts.map((item) => (
          <MemberShortcutItem key={item.id} item={item} />
        ))}
      </div>

      <Link
        href={settings.memberCenterHref}
        aria-label="前往會員中心"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#153E73] shadow-[0_4px_12px_rgba(21,62,115,0.08)] transition hover:bg-[#153E73] hover:text-white md:h-10 md:w-10"
      >
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
      </Link>
    </div>
  );
}
