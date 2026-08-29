export interface BreadcrumbItem {
  text: string;
  href: string;
}

export interface NavigationItem {
  type: string;
  text?: string;
  href?: string;
  items?: NavigationItem[];
}
