import type { SVGProps } from "react";

export type IconName =
  | "arrow"
  | "calendar"
  | "chat"
  | "check"
  | "clock"
  | "close"
  | "facebook"
  | "flower"
  | "instagram"
  | "leaf"
  | "map"
  | "menu"
  | "minus"
  | "phone"
  | "plus"
  | "search"
  | "send"
  | "spark"
  | "tag";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    calendar: (
      <>
        <path d="M7 2v3m10-3v3M3.5 9h17" />
        <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      </>
    ),
    chat: (
      <>
        <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.3-4.4A9 9 0 1 1 21 12Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    facebook: (
      <path d="M14 8h3V4.5c-.7-.1-1.8-.3-3.2-.3-3.2 0-5.3 1.9-5.3 5.5V13H5v4h3.5v7H13v-7h3.5l.6-4H13v-2.9c0-1.2.3-2.1 1-2.1Z" />
    ),
    flower: (
      <>
        <path d="M12 12c-3-1-5-3.3-4.8-5.5.2-2 2-3.5 3.8-2.2 1-2 3.3-2 4.1-.1 2-1.1 3.8.5 3.7 2.5-.1 2.3-2.7 4.4-6.8 5.3Z" />
        <path d="M12 12c-1 4-1.2 7.2-1 10m1-10c2.2 2.5 4.6 3.6 7 3.5M11 17c-2.5-1.2-4.8-1-7 .3" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C11 4 5 8.5 5 15c0 3 2 5 5 5 6.5 0 10-7 10-16Z" />
        <path d="M4 21c2.5-5.5 6.5-9 12-12" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    minus: <path d="M5 12h14" />,
    phone: <path d="M7.2 3.5 10 8 7.7 10a15 15 0 0 0 6.3 6.3l2-2.3 4.5 2.8-.7 3c-.3 1-1.2 1.7-2.2 1.7C9.2 21 3 14.8 2.5 6.4c-.1-1 .6-2 1.6-2.2l3.1-.7Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    send: <path d="m3 11 18-8-7 18-3-7-8-3Zm8 3 4-4" />,
    spark: (
      <>
        <path d="m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4L12 2Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </>
    ),
    tag: (
      <>
        <path d="M20 13 13 20 3 10V3h7l10 10Z" />
        <path d="M7.5 7.5h.01" />
      </>
    )
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={name === "facebook" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
