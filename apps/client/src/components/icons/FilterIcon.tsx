import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function FilterIcon(props: IconProps) {
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
      <path d="M4 5h16l-6.5 7.4V19l-3 1.5v-8.1L4 5Z" />
    </svg>
  );
}
