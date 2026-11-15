import { notFound } from "next/navigation";
import { OtherMenuPage } from "@/components/shell/OtherMenuPage";
import { OTHER_ITEMS } from "@/lib/nav";

const slugOf = (href: string) => href.replace("/menu/", "");

export function generateStaticParams() {
  return OTHER_ITEMS.map((n) => ({ slug: slugOf(n.href) }));
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const item = OTHER_ITEMS.find((n) => slugOf(n.href) === slug);
  return { title: `${item?.label ?? "Menu"} · SVP prototype` };
}

export default async function Page({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const item = OTHER_ITEMS.find((n) => slugOf(n.href) === slug);
  if (!item) notFound();
  return <OtherMenuPage label={item.label} icon={item.icon} />;
}
