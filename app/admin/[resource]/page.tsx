import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminHeader, Flash, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/layout/blocks";
import { FilterBar } from "@/components/layout/FilterBar";
import { Button, ButtonLink } from "@/components/ui";
import { resourceMap, statusOptionList } from "@/config/admin-resources";
import { deleteResource, setStatus } from "@/app/admin/actions";
import { canApprove, isAdmin, requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const PER = 20;

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { resource } = await params;
  const def = resourceMap[resource];
  if (!def) notFound();
  const user = await requireStaff();
  if (def.approverOnly && !canApprove(user.role)) redirect("/admin?error=forbidden");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let q = supabase.from(def.table).select("*", { count: "exact" }).order(def.orderBy.column, { ascending: def.orderBy.ascending });
  if (def.softDelete) q = q.is("deleted_at", null);
  if (def.typeFilter) q = q.in(def.typeFilter.column, def.typeFilter.values);
  if (sp.status && def.hasStatus) q = q.eq("status", sp.status);
  if (sp.q) q = q.ilike(def.titleField, `%${sp.q.replace(/[%,()*\\]/g, " ").slice(0, 80)}%`);
  const { data, count, error } = await q.range((page - 1) * PER, page * PER - 1);
  const rows = (data ?? []) as Record<string, unknown>[];
  const pk = def.slugField ?? "id";

  const cell = (name: string, v: unknown) => {
    if (name === "status") return <StatusBadge value={String(v)} />;
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (name.endsWith("_at") && typeof v === "string") return formatDate(v, true);
    return v == null || v === "" ? <span className="text-muted">-</span> : String(v).replace(/_/g, " ");
  };

  return (
    <>
      <AdminHeader title={def.label} actions={def.key !== "pages" && <ButtonLink href={`/admin/${def.key}/new`}><Plus className="size-4" aria-hidden />New {def.singular}</ButtonLink>} />
      <Flash sp={sp} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load this list: {error.message}</p>}
      <FilterBar action={`/admin/${def.key}`} q={sp.q} qLabel="Search title" values={{ status: sp.status }}
        filters={def.hasStatus ? [{ name: "status", label: "Status", options: statusOptionList }] : []} />
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted">
            <tr>{def.listColumns.map((c) => <th key={c.name} scope="col" className="px-4 py-3">{c.label}</th>)}<th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={def.listColumns.length + 1} className="px-4 py-10 text-center text-muted">Nothing here yet.{def.key !== "pages" && " Use “New” to add the first one."}</td></tr>}
            {rows.map((r) => {
              const id = String(r[pk]);
              return (
                <tr key={id} className="align-middle">
                  {def.listColumns.map((c, i) => (
                    <td key={c.name} className="px-4 py-3">{i === 0 ? <Link href={`/admin/${def.key}/${id}`} className="font-medium text-forest hover:underline">{String(r[c.name] ?? "(untitled)")}</Link> : cell(c.name, r[c.name])}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <ButtonLink href={`/admin/${def.key}/${id}`} variant="outline" size="sm">Edit</ButtonLink>
                      {def.hasStatus && r.status === "draft" && <form action={setStatus.bind(null, def.key, id, "pending_review")}><Button size="sm" variant="outline">Send for review</Button></form>}
                      {def.hasStatus && canApprove(user.role) && r.status === "pending_review" && <form action={setStatus.bind(null, def.key, id, "approved")}><Button size="sm" variant="outline">Approve</Button></form>}
                      {def.hasStatus && canApprove(user.role) && r.status !== "published" && <form action={setStatus.bind(null, def.key, id, "published")}><Button size="sm" variant="primary">Publish</Button></form>}
                      {def.hasStatus && canApprove(user.role) && r.status === "published" && <form action={setStatus.bind(null, def.key, id, "draft")}><Button size="sm" variant="ghost">Unpublish</Button></form>}
                      {isAdmin(user.role) && def.key !== "pages" && <form action={deleteResource.bind(null, def.key, id)}><Button size="sm" variant="danger" aria-label={`Delete ${String(r[def.titleField] ?? "item")}`}>Delete</Button></form>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{count ?? 0} total. Deleted items are archived (soft-deleted) and can be recovered from the database.</p>
      <Pagination page={page} pageCount={Math.max(1, Math.ceil((count ?? 0) / PER))} basePath={`/admin/${def.key}`} params={{ q: sp.q, status: sp.status }} />
    </>
  );
}
