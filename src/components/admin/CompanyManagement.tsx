"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Archive, Trash2, X, Loader2, ImagePlus, ArchiveRestore, Users } from "lucide-react";
import { updateCompanyAction, archiveCompanyAction, deleteCompanyAction } from "@/lib/actions/company";
import { compressToWebP } from "@/lib/image";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  is_archived: boolean;
  created_at: string;
  employee_count?: number;
  trainer_name?: string | null;
}

interface Props {
  companies: Company[];
}

type Modal =
  | { type: "edit"; company: Company }
  | { type: "archive"; company: Company }
  | { type: "delete"; company: Company }
  | null;

export function CompanyManagement({ companies }: Props) {
  const router   = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [isPending, start] = useTransition();
  const [error, setError]  = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fileRef      = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const visible = companies.filter((c) => showArchived || !c.is_archived);

  function closeModal() { setModal(null); setError(null); setLogoFile(null); setLogoPreview(null); }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToWebP(file);
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch { setError("Could not process image."); }
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.type !== "edit") return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("id", modal.company.id);
    if (logoFile) formData.set("logo", logoFile);
    start(async () => {
      const res = await updateCompanyAction(formData);
      if ("error" in res) setError((res as { error: string }).error);
      else { closeModal(); router.refresh(); }
    });
  }

  function handleArchive() {
    if (modal?.type !== "archive") return;
    start(async () => {
      const res = await archiveCompanyAction(modal.company.id);
      if ("error" in res) setError((res as { error: string }).error);
      else { closeModal(); router.refresh(); }
    });
  }

  function handleDelete() {
    if (modal?.type !== "delete") return;
    start(async () => {
      const res = await deleteCompanyAction(modal.company.id);
      if ("error" in res) setError((res as { error: string }).error);
      else { closeModal(); router.refresh(); }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{visible.length} {showArchived ? "total" : "active"} companies</p>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs text-primary hover:underline"
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="bg-card border border-border rounded-2xl px-6 py-10 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">No companies yet</p>
            <p className="text-xs text-muted-foreground mt-1">Generate an invite code on the Dashboard to create one.</p>
          </div>
        )}
        {visible.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3 ${c.is_archived ? "border-border/50 opacity-60" : "border-border"}`}
          >
            {c.logo_url ? (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-0.5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                {c.is_archived && (
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 shrink-0">Archived</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {c.employee_count !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />{c.employee_count} employees
                  </span>
                )}
                {c.trainer_name && (
                  <span className="text-xs text-muted-foreground">Trainer: {c.trainer_name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { setLogoPreview(c.logo_url ?? null); setModal({ type: "edit", company: c }); }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setLogoFile(null); setLogoPreview(null); setModal({ type: "archive", company: c }); }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title={c.is_archived ? "Unarchive" : "Archive"}
              >
                {c.is_archived
                  ? <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                  : <Archive className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button
                onClick={() => { setLogoFile(null); setLogoPreview(null); setModal({ type: "delete", company: c }); }}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal backdrop */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">

            {/* Edit modal */}
            {modal.type === "edit" && (
              <form onSubmit={handleEdit}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Edit Company</h3>
                  <button type="button" onClick={closeModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={modal.company.name}
                      className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Logo</label>
                    <div className="flex items-center gap-3">
                      {logoPreview || modal.company.logo_url ? (
                        <div className="w-12 h-12 rounded-lg bg-white/10 border border-border flex items-center justify-center overflow-hidden">
                          <img src={logoPreview ?? modal.company.logo_url!} alt="Logo" className="w-full h-full object-contain p-0.5" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 text-sm text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        {logoFile ? "Change" : "Upload"}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="flex gap-3 px-5 py-4 border-t border-border">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Archive modal */}
            {modal.type === "archive" && (
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">{modal.company.is_archived ? "Unarchive Company?" : "Archive Company?"}</h3>
                  <button onClick={closeModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-muted-foreground">
                    {modal.company.is_archived
                      ? `Restore "${modal.company.name}" and make it active again?`
                      : `Archive "${modal.company.name}"? It will be hidden but data is preserved. You can restore it anytime.`}
                  </p>
                  {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2 mt-3">{error}</p>}
                </div>
                <div className="flex gap-3 px-5 py-4 border-t border-border">
                  <button onClick={closeModal} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={handleArchive} disabled={isPending} className="flex-1 rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal.company.is_archived ? "Restore" : "Archive"}
                  </button>
                </div>
              </div>
            )}

            {/* Delete modal */}
            {modal.type === "delete" && (
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-destructive">Delete Company Permanently?</h3>
                  <button onClick={closeModal}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete <span className="font-semibold text-foreground">{modal.company.name}</span> and ALL related data — users, courses, certificates, sales, and chat messages.
                  </p>
                  <p className="text-sm font-semibold text-destructive">This cannot be undone.</p>
                  {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="flex gap-3 px-5 py-4 border-t border-border">
                  <button onClick={closeModal} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={handleDelete} disabled={isPending} className="flex-1 rounded-lg bg-destructive text-white py-2.5 text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete Forever
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
