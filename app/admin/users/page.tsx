import type { Metadata } from "next";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { Badge, Button, Notice, Select } from "@/components/ui";
import { setUserRole } from "@/app/admin/actions";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };
const ROLES = [["super_admin", "Super administrator"], ["admin", "Administrator"], ["editor", "Editor"], ["partner", "Business partner"], ["visitor", "Registered visitor"]];

export default async function Users({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaff();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id,full_name,email,created_at").order("created_at", { ascending: false }).limit(200);
  const { data: roles } = await supabase.from("user_roles").select("user_id,role");
  const roleOf = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role as string]));
  const canEdit = me.role === "super_admin";

  return (
    <>
      <AdminHeader title="Users" intro="Roles control what each person can do. Only super administrators can change roles." />
      <Flash sp={sp} />
      {!canEdit && <div className="mb-4"><Notice tone="info">You can view users but only a super administrator can change roles.</Notice></div>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Email</th><th scope="col" className="px-4 py-3">Joined</th><th scope="col" className="px-4 py-3">Role</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.full_name || "(no name)"}{p.id === me.id && <Badge tone="blue" className="ml-2">You</Badge>}</td>
                <td className="px-4 py-3">{p.email}</td><td className="px-4 py-3">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  {canEdit && p.id !== me.id ? (
                    <form action={setUserRole.bind(null, p.id)} className="flex gap-2">
                      <label className="sr-only" htmlFor={`role-${p.id}`}>Role for {p.full_name || p.email}</label>
                      <Select id={`role-${p.id}`} name="role" defaultValue={roleOf[p.id] ?? "visitor"} className="h-9 w-48">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                      <Button size="sm" variant="outline">Save</Button>
                    </form>
                  ) : <Badge tone="green">{(roleOf[p.id] ?? "visitor").replace("_", " ")}</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
