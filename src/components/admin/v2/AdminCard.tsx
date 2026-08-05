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
        "admin-surface-card admin-lift overflow-hidden rounded-[24px] border border-[var(--admin-border,#ECECEC)] bg-white shadow-[0_10px_35px_rgba(0,0,0,.05)]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[var(--admin-hover,#FFF7CC)]"
        aria-expanded={open}
      >
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF5C7] text-[var(--admin-title,#153E73)]">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-[var(--admin-title,#153E73)]">{title}</span>
          {description && (
            <span className="mt-0.5 block text-xs text-[var(--admin-muted,#8A94A6)]">{description}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[var(--admin-muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--admin-border)] px-5 py-5">{children}</div>
      )}
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
      <span className="text-xs font-semibold text-[var(--admin-muted,#8A94A6)]">
        {label}
        {required && <span className="ml-0.5 text-[#F35B5B]">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--admin-muted)]">{hint}</span>}
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
        "h-12 w-full rounded-[16px] border border-[var(--admin-border,#ECECEC)] bg-white px-3 text-sm text-[var(--admin-title,#153E73)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35",
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
        "h-12 w-full rounded-[16px] border border-[var(--admin-border,#ECECEC)] bg-white px-3 text-sm text-[var(--admin-title,#153E73)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35",
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
        "min-h-[100px] w-full rounded-[16px] border border-[var(--admin-border,#ECECEC)] bg-white px-3 py-2.5 text-sm text-[var(--admin-title,#153E73)] outline-none transition focus:border-[#FFE149] focus:ring-2 focus:ring-[#FFE149]/35",
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
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-xl border border-divider bg-background px-3 py-2.5 text-sm font-medium text-[#334155] ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
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
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-white text-foreground-secondary hover:border-primary/40"
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
              value === opt.value ? "border-primary bg-primary" : "border-border"
            )}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
