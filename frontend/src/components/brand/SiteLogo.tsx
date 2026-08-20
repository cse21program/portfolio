import { BrandMark } from "@/components/brand/BrandMark";
import { site } from "@/config/site";

type SiteLogoProps = {
  compact?: boolean;
  className?: string;
  markClassName?: string;
};

export function SiteLogo({ compact = false, className = "", markClassName }: SiteLogoProps) {
  return (
    <span className={`flex items-center gap-3 ${className}`.trim()}>
      <BrandMark className={markClassName ?? (compact ? "h-8 w-8" : "h-9 w-9")} />
      <span className="min-w-0 leading-none">
        <span className="block whitespace-nowrap font-display text-[1.05rem] tracking-[-0.03em] text-ink sm:text-[1.15rem]">
          {site.name}
        </span>
        {compact ? null : (
          <span className="mt-1.5 block whitespace-nowrap text-[9px] font-semibold tracking-[0.14em] text-muted uppercase sm:text-[10px] sm:tracking-[0.2em]">
            {site.title}
          </span>
        )}
      </span>
    </span>
  );
}
