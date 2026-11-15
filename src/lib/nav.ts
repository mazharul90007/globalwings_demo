export type NavItem = { label: string; icon: string; href: string; isNew?: boolean };

/** Builds the link for a sidebar item that is not part of this prototype. */
const other = (label: string, icon: string): NavItem => ({
  label,
  icon,
  href: `/menu/${label.toLowerCase().replace(/\s+/g, "-")}`,
});

// Same items, icons and order as the SVP sidebar (titles and icons from SVP's menu
// icon map). Only "Schedule" is new. Every other item opens a shared notice page.
export const NAV: NavItem[] = [
  other("Dashboard", "ri-dashboard-2-line"),
  other("Leads", "ri-user-search-line"),
  other("Search Courses", "ri-search-2-line"),
  other("Students", "ri-group-line"),
  other("Applications", "ri-file-list-3-line"),
  other("My Students", "ri-user-heart-line"),
  other("My Tasks", "ri-task-line"),
  { label: "Schedule", icon: "ri-calendar-event-line", href: "/schedule", isNew: true },
  other("Reports", "ri-bar-chart-box-line"),
  other("Commission", "ri-money-dollar-circle-line"),
  other("Offer", "ri-price-tag-3-line"),
  other("Support", "ri-lifebuoy-line"),
  other("Settings", "ri-settings-3-line"),
];

/** Sidebar items that only show the shared notice page. */
export const OTHER_ITEMS = NAV.filter((n) => n.href.startsWith("/menu/"));

export const MAIN_SITE_URL = "https://frontend.applyglobalwings.com/";
