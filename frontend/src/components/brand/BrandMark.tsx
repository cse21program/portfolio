type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "h-9 w-9" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="40" cy="40" r="40" fill="#1a1612" />
      <circle cx="40" cy="40" r="36.2" fill="none" stroke="#f3eee4" strokeWidth="1.7" />
      <circle cx="40" cy="40" r="32.6" fill="none" stroke="#f3eee4" strokeWidth="0.85" />
      <path fill="#f3eee4" d="M23.2 20.4h12.8v2.5h-3.4v34.2h3.4v2.5H23.2v-2.5h3.2V22.9h-3.2z" />
      <path
        fill="#f3eee4"
        fillRule="evenodd"
        d="M31.8 22.9h7.2c5.4 0 8.2 3.5 8.2 8.6 0 4.9-3.1 8.4-8.2 8.7H31.8V22.9zm5.4 4.8v7.7h2.2c2.9 0 4.4-1.7 4.4-3.85 0-2.2-1.5-3.85-4.4-3.85h-2.2z"
      />
      <path fill="#f3eee4" d="M31.8 40.2h16.4v4.6H31.8z" />
      <path fill="#f3eee4" d="M38.8 40.8h8.2L57.4 21.8h7.2L49.6 40.8z" />
      <path fill="#f3eee4" d="M31.8 40.2h10.2L61.2 58.8h-7.6L39.4 46.4v13.2h-7.6z" />
    </svg>
  );
}
