"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Camera, Check } from "lucide-react";
import { updateProfileAction, uploadAvatarAction } from "@/lib/actions/profile";
import { compressToWebP } from "@/lib/image";

interface Props {
  user: {
    id: string;
    full_name: string;
    bio: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function ProfileEditForm({ user }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) setError(result.error);
      else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    let compressed: File;
    try {
      compressed = await compressToWebP(file);
    } catch {
      setError("Could not process image.");
      return;
    }

    const formData = new FormData();
    formData.set("avatar", compressed);
    startUpload(async () => {
      const result = await uploadAvatarAction(formData);
      if (result?.error) setError(result.error);
      else if (result?.avatarUrl) setAvatarUrl(result.avatarUrl + `?t=${Date.now()}`);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
              <span className="text-2xl font-bold text-primary">{user.full_name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isUploading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-white" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tap the camera to change photo</p>
        </div>
      </div>

      {/* Full name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="full_name">Full Name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={user.full_name}
          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="bio">
          Bio <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={user.bio ?? ""}
          placeholder="Say something about yourself…"
          className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          : saved
          ? <><Check className="w-4 h-4" /> Saved!</>
          : "Save Changes"}
      </button>
    </form>
  );
}
