import { BreadcrumbGroup } from "@cloudscape-design/components";

type BreadcrumbItem = { text: string; href?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <BreadcrumbGroup items={items.map((i) => ({ text: i.text, href: i.href ?? "/" }))} />;
}
