"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CommentForm({ quoteId, existing }: { quoteId: string; existing?: string }) {
  const [body, setBody] = useState(existing || ""); const [message, setMessage] = useState("");
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  async function save(e: React.FormEvent) { e.preventDefault(); const supabase = createClient();
    const query = existing ? supabase.from("comments").update({ body }).eq("quote_id", quoteId) : supabase.from("comments").insert({ quote_id: quoteId, body });
    const { error } = await query; setMessage(error ? error.message : "המחשבה שלך נשמרה.");
  }
  return <form className="comment-form" onSubmit={save}><label>מה תפס אתכם במשפט הזה?<textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} required placeholder="אפשר לכתוב עד 100 מילים…" /></label><div><small>{words}/100 מילים</small><button className="primary" disabled={words > 100}>{existing ? "עדכון תגובה" : "פרסום תגובה"}</button></div>{message && <p className="notice">{message}</p>}</form>;
}
