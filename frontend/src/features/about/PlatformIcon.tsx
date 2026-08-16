import type { SVGProps } from "react";

function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlatformIcon({ id, className = "h-5 w-5" }: { id: string; className?: string }) {
  switch (id) {
    case "github":
      return (
        <Svg className={className}>
          <path d="M9 19c-4.3 1.4-4.3-2.1-6-2.5M16 22v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.6A5 5 0 0 0 20 5.3 4.6 4.6 0 0 0 19.9 2S18.7 1.7 16 3.5a15.4 15.4 0 0 0-8 0C5.3 1.7 4.1 2 4.1 2A4.6 4.6 0 0 0 4 5.3 5 5 0 0 0 2.8 8.9c0 5.1 3.1 6.3 6.1 6.6a3.4 3.4 0 0 0-.9 2.6V22" />
        </Svg>
      );
    case "linkedin":
      return (
        <Svg className={className}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 10v7M8 7h.01M12 17v-4.5a2 2 0 1 1 4 0V17" />
        </Svg>
      );
    case "youtube":
      return (
        <Svg className={className}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="m10 9 6 3-6 3V9Z" fill="currentColor" stroke="none" />
        </Svg>
      );
    case "facebook":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M13 8h2V5h-2a3 3 0 0 0-3 3v2H8v3h2v6h3v-6h2.2l.8-3H13V8Z" />
        </Svg>
      );
    case "x":
      return (
        <Svg className={className}>
          <path d="M5 5 19 19M15.5 5 5 19M19 5 10 12" />
        </Svg>
      );
    case "stackoverflow":
      return (
        <Svg className={className}>
          <path d="M6 14v6h12v-6M8 17h8M8.5 13.5 16 15M9.5 10 16.2 13M11.2 6.8 17 11.2M13.5 4 18 9.5" />
        </Svg>
      );
    case "medium":
      return (
        <Svg className={className}>
          <circle cx="7" cy="12" r="4" />
          <ellipse cx="15" cy="12" rx="2.2" ry="4" />
          <ellipse cx="20" cy="12" rx="1.2" ry="4" />
        </Svg>
      );
    case "email":
      return (
        <Svg className={className}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="m4 8 8 6 8-6" />
        </Svg>
      );
    default:
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </Svg>
      );
  }
}
