"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsClient({ initial, userId }: { userId: string; initial: { nickname: string; status: string | null; avatar_url: string | null } }) {
  const [nickname, setNickname] = useState(initial.nickname); const [status, setStatus] = useState(initial.status || ""); const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState("");
  async function save(e: React.FormEvent) { e.preventDefault(); const supabase = createClient(); let avatarUrl = initial.avatar_url;
    if (file) { const extension = file.name.split(".").pop() || "jpg"; const path = `${userId}/avatar.${extension}`; const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true }); if (uploadError) { setMessage(uploadError.message); return; } avatarUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`; }
    const { error } = await supabase.rpc("update_own_profile", { new_nickname: nickname, new_status: status || null, new_avatar_url: avatarUrl }); setMessage(error ? error.message : "הפרופיל נשמר."); }
  async function signOut() { const supabase = createClient(); await supabase.auth.signOut(); location.href = "/"; }
  return <form className="submit-form" onSubmit={save}><label>כינוי<input value={nickname} onChange={(e) => setNickname(e.target.value)} minLength={2} maxLength={30} required /></label><label>משפט סטטוס <em>עד 120 תווים</em><textarea value={status} onChange={(e) => setStatus(e.target.value)} maxLength={120} /></label><label>תמונת פרופיל <em>PNG, JPG או WebP עד 5MB</em><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><button className="primary">שמירת שינויים</button><button type="button" className="outline logout" onClick={signOut}>התנתקות</button>{message && <p className="notice">{message}</p>}</form>;
}
