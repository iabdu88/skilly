"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { changeUserRoleAction, toggleUserActiveAction } from "@/lib/actions/admin-users";
import type { UserRole } from "@/types/database";

interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  company: { name: string } | null;
}

interface Props {
  users: ManagedUser[];
}

const ROLE_OPTIONS: UserRole[] = ["trainer", "manager", "employee"];

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-500/10 text-purple-400",
  trainer:     "bg-primary/10 text-primary",
  manager:     "bg-blue-500/10 text-blue-400",
  employee:    "bg-green-500/10 text-green-400",
};

export function UserManagement({ users: initial }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  function handleRoleChange(userId: string, newRole: UserRole) {
    setLoadingId(userId);
    start(async () => {
      const res = await changeUserRoleAction(userId, newRole);
      if (!("error" in res)) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        router.refresh();
      }
      setLoadingId(null);
    });
  }

  function handleToggleActive(userId: string, makeActive: boolean) {
    setLoadingId(userId);
    start(async () => {
      const res = await toggleUserActiveAction(userId, makeActive);
      if (!("error" in res)) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: makeActive } : u));
        router.refresh();
      }
      setLoadingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {users.length} users</p>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="hidden md:table-cell px-4 py-3 text-xs font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No users match your filters.</td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className={`border-b border-border/50 last:border-0 ${!u.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[180px]">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "super_admin" ? (
                      <span className={`capitalize text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>Super Admin</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={loadingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`capitalize text-xs px-2 py-0.5 rounded-full border-0 focus:ring-1 focus:ring-primary bg-transparent cursor-pointer ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r} className="bg-card text-foreground capitalize">{r.replace("_", " ")}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground">
                    {u.company?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${u.is_active ? "text-green-400" : "text-red-400"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "super_admin" && (
                      <button
                        disabled={loadingId === u.id}
                        onClick={() => handleToggleActive(u.id, !u.is_active)}
                        title={u.is_active ? "Deactivate user" : "Reactivate user"}
                        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          u.is_active
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        } disabled:opacity-40`}
                      >
                        {loadingId === u.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : u.is_active
                          ? <><ShieldOff className="w-3 h-3" /> Deactivate</>
                          : <><ShieldCheck className="w-3 h-3" /> Reactivate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
