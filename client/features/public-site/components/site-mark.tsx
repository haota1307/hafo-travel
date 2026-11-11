export function SiteMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 12V52M49 12V52M15 35C25 24 39 24 49 35"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
      />
      <path
        d="M15 45H49"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}
