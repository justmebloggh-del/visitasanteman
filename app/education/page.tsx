import type { Metadata } from "next";
import { DomainIndex } from "@/components/listings/DomainPages";
import { buildMetadata } from "@/components/layout/seo";
import { educationCfg as cfg } from "@/config/domains";

export const revalidate = 60;
export const metadata: Metadata = buildMetadata({ title: cfg.title, description: cfg.intro, path: "/education" });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <DomainIndex cfg={cfg} searchParams={await searchParams} />;
}
