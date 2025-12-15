import type { SVGProps } from "react"

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Unique geometric pattern for dashboard */}
      <circle cx="6.5" cy="6.5" r="3" />
      <circle cx="17.5" cy="6.5" r="3" />
      <path d="M4 13.5h7a1 1 0 011 1v5.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5.5a1 1 0 011-1z" />
      <path d="M13 13.5h7a1 1 0 011 1v5.5a1 1 0 01-1 1h-7a1 1 0 01-1-1v-5.5a1 1 0 011-1z" />
    </svg>
  )
}

export function PackageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Architectural box design */}
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12v9" />
      <path d="M12 12L4 7.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Minimal grid with intersecting lines */}
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6h7M6 8.5v7M15.5 18h-7M18 15.5v-7" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  )
}

export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Refined shopping bag design */}
      <path d="M6 6h12l1.5 12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18L6 6z" />
      <path d="M9 6V5a3 3 0 016 0v1" />
      <circle cx="9" cy="12" r="0.5" fill="currentColor" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Abstract human silhouettes */}
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" />
      <circle cx="16" cy="8.5" r="2.5" opacity="0.6" />
      <path d="M21 20v-1a4 4 0 00-3-3.87" opacity="0.6" />
    </svg>
  )
}

export function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Document with data visualization accent */}
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2M8 17h6" opacity="0.5" />
      <path d="M12 13v4" strokeWidth="1.5" />
    </svg>
  )
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Mechanical gear with refined details */}
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Architectural house */}
      <path d="M3 9.5l9-7 9 7V20a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5z" />
      <path d="M9 22v-8a1 1 0 011-1h4a1 1 0 011 1v8" />
      <circle cx="12" cy="7" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Smooth data visualization curve */}
      <path d="M3 20h18" />
      <path d="M3 17a8 8 0 018-8 8 8 0 018 8" opacity="0.3" />
      <path d="M3 12c2-4 5-6 9-6s7 2 9 6" strokeWidth="1.5" />
      <circle cx="3" cy="17" r="1.5" fill="currentColor" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
      <circle cx="21" cy="17" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function TrendUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7v6h-6" opacity="0.5" />
      <circle cx="21" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

export function TrendDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M21 17v-6h-6" opacity="0.5" />
      <circle cx="21" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}
