import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ImportIcon(props: IconProps) {
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
      <path d="M12 14V3" />
      <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
      <path d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" />
    </svg>
  );
}
