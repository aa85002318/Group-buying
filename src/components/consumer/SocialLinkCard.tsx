import { ExternalLink } from "lucide-react";
import type { SocialChannel } from "@/lib/consumer-hub";

export function SocialLinkCard({ channel }: { channel: SocialChannel }) {
  const className =
    "card-surface flex items-center justify-between gap-3 p-4 transition hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  if (channel.external) {
    return (
      <a
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={`${channel.label}（外部連結）`}
      >
        <span>
          <span className="block font-bold text-foreground">{channel.label}</span>
          <span className="mt-0.5 block text-xs text-foreground-secondary">
            {channel.description}
          </span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </a>
    );
  }

  return (
    <a href={channel.href} className={className}>
      <span>
        <span className="block font-bold text-foreground">{channel.label}</span>
        <span className="mt-0.5 block text-xs text-foreground-secondary">
          {channel.description}
        </span>
      </span>
    </a>
  );
}
