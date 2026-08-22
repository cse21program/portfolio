import { BrandMark } from "@/components/brand/BrandMark";
import { site } from "@/config/site";

type SiteLogoProps = {
  compact?: boolean;
  className?: string;
  markClassName?: string;
};

export function SiteLogo({ compact = false, className = "", markClassName }: SiteLogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`.trim()}>
      <BrandMark className={markClassName ?? (compact ? "h-8 w-8" : "h-9 w-9")} />
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[0.95rem] font-medium tracking-tight text-ink sm:text-[1rem]">
          {site.name}
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-[11px] leading-4 text-muted">
          {site.lockup}
        </span>
      </span>
    </span>
  );
}
