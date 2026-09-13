"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
type Submission = { id: string; text: string; author_name: string | null; created_at: string; profiles: { nickname: string } | { nickname: string }[] | null };
export default function AdminClient({ initial }: { initial: Submission[] }) {
  const [items, setItems] = useState(initial); const [query, setQuery] = useState(""); const shown = useMemo(() => items.filter((item) => item.text.includes(query) || item.author_name?.includes(query)), [items, query]);
  async function review(id: string, status: "approved" | "rejected") { const supabase = createClient(); const { error } = await supabase.from("quotes").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id); if (!error) setItems((current) => current.filter((item) => item.id !== id)); }
  return <><input className="admin-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש בהגשות" />{shown.map((item) => { const submitter = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles; return <article className="admin-card" key={item.id}><p>״{item.text}״</p><small>נשלח על ידי {submitter?.nickname || "משתמש"}{item.author_name ? ` · קרדיט: ${item.author_name}` : ""}</small><div><button className="primary" onClick={() => review(item.id, "approved")}>אישור למאגר</button><button className="reject" onClick={() => review(item.id, "rejected")}>דחייה</button></div></article>; })}{!shown.length && <p className="empty">אין הגשות שמחכות כרגע.</p>}</>;
}
