import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Yelp burst logo (simplified monochrome) */
export function YelpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.14 2C10.34 2 7.56 3.74 6.26 5.5c-.56.76-.28 1.6.08 1.94l4.12 3.78c.24.22.58.2.78-.04l1.14-1.36c.22-.26.18-.64-.06-.86L8.88 5.84c-.14-.12-.1-.34.08-.42C9.82 5 11.06 4.5 12.14 4.5c.54 0 .94.04.94.04.38.02.68-.28.68-.66V2.66c0-.38-.3-.68-.68-.66h.06zm-5.8 9.36l-4.2 1.62c-.36.14-.52.54-.36.9l.86 2.02c.14.36.52.54.9.4l4.14-1.52c.28-.1.4-.42.28-.68l-1.02-2.38c-.14-.3-.34-.44-.6-.36zm11.14.1l-1.06 2.36c-.12.28.02.58.3.68l4.14 1.52c.36.14.76-.04.9-.4l.86-2.02c.16-.36 0-.76-.36-.9l-4.2-1.62c-.26-.08-.46.06-.58.38zm-5.06 3.36l-2.46 3.58c-.2.3-.1.7.22.88l1.94 1.12c.32.18.72.06.88-.26l2.36-3.64c.16-.24.06-.56-.2-.7l-2.06-1.2c-.24-.14-.52-.06-.68.22zm-.84-1.12c.28-.1.32-.48.08-.7L7.6 9.66c-.26-.22-.62-.16-.8.12L5.4 12.2c-.18.3-.04.68.28.8l3.08 1.14c.28.1.58-.02.7-.3l.32-.74-.1.6zm5.3-2.34L13.2 14.9c-.16.24-.06.56.2.7l2.06 1.2c.24.14.52.06.68-.22l2.46-3.58c.2-.3.1-.7-.22-.88l-1.94-1.12c-.32-.18-.72-.06-.88.26z" />
    </svg>
  );
}

/** Google Maps pin icon */
export function GoogleMapsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

/** Uber Eats plate/utensil icon */
export function UberEatsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17 8V2h2v6h3l-4 4-4-4h3zM1 12c0 3.87 3.13 7 7 7h1v2H8c-4.97 0-9-4.03-9-9s4.03-9 9-9h1v2H8c-3.87 0-7 3.13-7 7zm14 0c0-2.76-2.24-5-5-5v-2c3.87 0 7 3.13 7 7s-3.13 7-7 7v-2c2.76 0 5-2.24 5-5z" />
    </svg>
  );
}

/** DoorDash door icon */
export function DoorDashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h14V5H5zm4 3h6a1 1 0 0 1 1 1v7H8V9a1 1 0 0 1 1-1zm1 2v5h4v-5h-4zm3 2.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" />
    </svg>
  );
}

/** GrubHub fork icon */
export function GrubHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
    </svg>
  );
}

/** Myanmar flag (yellow/green/red horizontal stripes with white star) */
export function MyanmarFlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 16" {...props}>
      <rect width="24" height="5.33" fill="#FECB00" />
      <rect y="5.33" width="24" height="5.34" fill="#34B233" />
      <rect y="10.67" width="24" height="5.33" fill="#EA2839" />
      <path
        d="M12 3.5l1.76 3.57 3.94.57-2.85 2.78.67 3.93L12 12.47l-3.52 1.88.67-3.93L6.3 7.64l3.94-.57L12 3.5z"
        fill="white"
      />
    </svg>
  );
}

/** California Republic flag (bear + star + red stripe) */
export function CaliforniaFlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 16" {...props}>
      <rect width="24" height="16" fill="#FAFAF5" />
      <rect y="12.5" width="24" height="3.5" fill="#BC2D2F" />
      {/* Red star */}
      <path
        d="M4.5 2.5l.58 1.2 1.32.19-.96.93.23 1.31L4.5 5.5l-1.17.63.23-1.31-.96-.93 1.32-.19L4.5 2.5z"
        fill="#BC2D2F"
      />
      {/* Simplified bear silhouette */}
      <path
        d="M8 5.5c-.5-.8-1.2-1-1.8-.9-.4.1-.6.4-.6.7 0 .3.2.5.4.6.3.1.5.4.5.8v1c0 .4.1.7.3.9l.2.2v1.2c0 .3.2.5.5.5h.3v.5h1v-.5h3.4v.5h1v-.5h.3c.3 0 .5-.2.5-.5v-1.2l.2-.2c.2-.2.3-.5.3-.9v-1c0-.4.2-.7.5-.8.2-.1.4-.3.4-.6 0-.3-.2-.6-.6-.7-.6-.1-1.3.1-1.8.9H8z"
        fill="#8B6914"
      />
      {/* CALIFORNIA REPUBLIC text approximation */}
      <text
        x="12"
        y="12"
        textAnchor="middle"
        fill="#4a4a4a"
        fontSize="1.8"
        fontWeight="bold"
        fontFamily="serif"
      >
        CALIFORNIA REPUBLIC
      </text>
    </svg>
  );
}
