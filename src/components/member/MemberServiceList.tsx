"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  FileText,
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Receipt,
  Settings,
  Shield,
  Store,
  Ticket,
  User,
  type LucideIcon,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

function ServiceLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center gap-3 px-4 py-2.5 transition hover:bg-[#FFFEFA]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF8FC] text-[#153E73]">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-[#153E73]">{label}</span>
      {badge != null && badge > 0 ? (
        <span className="rounded-full bg-[#F16458] px-2 py-0.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-[#687386]" />
    </Link>
  );
}

export function MemberServiceList({
  usableGifts = 0,
  unreadNotifications = 0,
  onLogout,
}: {
  usableGifts?: number;
  unreadNotifications?: number;
  onLogout: () => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="px-0.5 text-base font-bold text-[#153E73]">會員服務</h2>

      <div className="overflow-hidden rounded-2xl bg-white">
        <ServiceLink
          href={APP_ROUTES.memberBenefits}
          icon={Gift}
          label="門市會員禮"
          badge={usableGifts}
        />
        <ServiceLink href={APP_ROUTES.memberGiftVouchers} icon={Ticket} label="我的兌換券" />
        <ServiceLink
          href={`${APP_ROUTES.memberBenefits}?tab=history`}
          icon={Receipt}
          label="兌換／核銷紀錄"
        />
        <ServiceLink href={APP_ROUTES.memberFavorites} icon={Heart} label="我的收藏" />
        <ServiceLink href={APP_ROUTES.memberAddresses} icon={MapPin} label="地址管理" />
        <ServiceLink href={APP_ROUTES.memberCarrier} icon={Receipt} label="發票載具" />
        <ServiceLink
          href={APP_ROUTES.memberNotifications}
          icon={Bell}
          label="通知中心"
          badge={unreadNotifications}
        />
        <ServiceLink href={APP_ROUTES.memberProfile} icon={User} label="個人資料" />
        <ServiceLink href={APP_ROUTES.memberSettings} icon={Settings} label="帳號設定" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white">
        <ServiceLink href={APP_ROUTES.stores} icon={Store} label="門市資訊" />
        <ServiceLink href={APP_ROUTES.support} icon={Headphones} label="客服中心" />
        <ServiceLink href={APP_ROUTES.faq} icon={HelpCircle} label="常見問題" />
        <ServiceLink href={APP_ROUTES.terms} icon={FileText} label="使用條款" />
        <ServiceLink href={APP_ROUTES.privacy} icon={Shield} label="隱私權政策" />
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#E8E1D7] bg-white text-sm font-bold text-[#153E73]"
      >
        <LogOut className="h-4 w-4" />
        登出
      </button>
    </section>
  );
}
