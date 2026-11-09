import type { Metadata } from "next";
import { DomainIndex } from "@/components/listings/DomainPages";
import { buildMetadata } from "@/components/layout/seo";
import { sportsCfg as cfg } from "@/config/domains";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: cfg.title, description: cfg.intro, path: "/sports" });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <DomainIndex cfg={cfg} searchParams={await searchParams} />;
}
