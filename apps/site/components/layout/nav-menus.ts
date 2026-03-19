export type NavMenuItem = {
  href: string;
  label: string;
};

export const NAV_MENUS: NavMenuItem[] = [
  { href: "/agent", label: "Agent" },
  { href: "/blog", label: "Blog" },
  { href: "/space", label: "Space" },
];
