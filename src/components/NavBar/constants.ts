type NavItem = {
  title: string;
  href: string;
};

export const primaryNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Transactions", href: "/transactions" },
  { title: "Budget", href: "/budget" },
];

export const secondaryNavItems: NavItem[] = [
  { title: "Accounts", href: "/accounts" },
  { title: "Categories", href: "/categories" },
];

export const navItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems];
