"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function AdminCard({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
  className,
}: AdminCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#E8EBF4] bg-white shadow-[0_4px_24px_rgba(30,58,138,0.06)]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#F7F8FC]"
        aria-expanded={open}
      >
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F5] text-[#FF4F7B]">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-[#1E293B]">{title}</span>
          {description && (
            <span className="mt-0.5 block text-xs text-[#64748B]">{description}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#94A3B8] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="border-t border-[#EEF1F8] px-5 py-5">{children}</div>}
    </section>
  );
}

type AdminFieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdminField({ label, hint, required, children, className }: AdminFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold text-[#475569]">
        {label}
        {required && <span className="ml-0.5 text-[#FF4F7B]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-[#94A3B8]">{hint}</span>}
    </label>
  );
}

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FF4F7B] focus:ring-2 focus:ring-[#FF4F7B]/20",
        className
      )}
      {...props}
    />
  );
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FF4F7B] focus:ring-2 focus:ring-[#FF4F7B]/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function AdminTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[100px] w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none transition focus:border-[#FF4F7B] focus:ring-2 focus:ring-[#FF4F7B]/20",
        className
      )}
      {...props}
    />
  );
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#EEF1F8] bg-[#F7F8FC] px-3 py-2.5 text-sm font-medium text-[#334155]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#CBD5E1] text-[#FF4F7B] focus:ring-[#FF4F7B]/30"
      />
      {label}
    </label>
  );
}

export function AdminRadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
            value === opt.value
              ? "border-[#FF4F7B] bg-[#FFF0F5] text-[#FF4F7B]"
              : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#FF4F7B]/40"
          )}
        >
          <input
            type="radio"
            className="sr-only"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span
            className={cn(
              "h-4 w-4 rounded-full border-2",
              value === opt.value ? "border-[#FF4F7B] bg-[#FF4F7B]" : "border-[#CBD5E1]"
            )}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
