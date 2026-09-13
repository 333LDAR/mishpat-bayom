"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SubmitClient({ loggedIn }: { loggedIn: boolean }) {
  const [text, setText] = useState(""); const [name, setName] = useState(""); const [rights, setRights] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!loggedIn) { setMessage("צריך להתחבר לפני ששולחים משפט."); return; }
    const supabase = createClient(); const { error } = await supabase.rpc("submit_quote", { quote_text: text, display_name: name });
    if (error) { setMessage(error.message); return; } setMessage("תודה. המשפט שלך מחכה לאישור אישי."); setText(""); setName(""); setRights(false);
  }
  return <form className="submit-form" onSubmit={submit}><label>המשפט שלכם<textarea value={text} onChange={(e) => setText(e.target.value)} minLength={2} maxLength={600} placeholder="משפט אחד יכול לשנות יום שלם." required /></label><label>כינוי להצגה <em>אופציונלי</em><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="למשל: יובל" /></label><label className="check"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} required /><span>אני מאשר/ת שיש לי זכות לשתף את המשפט הזה.</span></label><button className="primary">שלחו לאישור</button>{message && <p className="notice">{message}</p>}</form>;
}
