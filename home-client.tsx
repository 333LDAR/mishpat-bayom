"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Draw, Profile, Quote } from "@/lib/types";

type Props = { configured: boolean; initialProfile: Profile | null; initialDraw: Draw | null };

function makeShareImage(quote: Quote) {
  const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
  const words = quote.text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => { if (`${line} ${word}`.trim().length > 20) { lines.push(line); line = word; } else line = `${line} ${word}`.trim(); });
  if (line) lines.push(line);
  const text = lines.slice(0, 5).map((line, index) => `<text x="540" y="${730 + index * 94}" text-anchor="middle" class="quote">${escape(line)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><style>.quote{font-family:Arial,sans-serif;font-size:64px;font-weight:700;fill:#FFEBB8}.brand{font-family:Georgia,serif;font-size:54px;fill:#EA9D9D}</style><rect width="1080" height="1350" fill="#601D49"/><circle cx="180" cy="190" r="260" fill="#BD5579" opacity=".2"/><circle cx="930" cy="1180" r="340" fill="#EA9D9D" opacity=".12"/><path d="M370 470h340" stroke="#EA9D9D" stroke-width="3" opacity=".8"/><text x="540" y="250" text-anchor="middle" class="brand">משפט ביום.</text><text x="540" y="420" text-anchor="middle" fill="#BD5579" font-size="140">״</text>${text}<text x="540" y="1200" text-anchor="middle" fill="#EA9D9D" font-family="Arial" font-size="29">mishpat-bayom.com</text></svg>`;
  return new File([svg], "mishpat-bayom.png", { type: "image/svg+xml" });
}

export default function HomeClient({ configured, initialProfile, initialDraw }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [draw, setDraw] = useState(initialDraw);
  const [isRevealing, setIsRevealing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const canDraw = configured && Boolean(profile) && !draw;
  const quote = draw?.quote;

  const scrambled = useMemo(() => quote?.text.split("").map((char, i) => <span style={{ animationDelay: `${i * 25}ms` }} key={`${char}-${i}`}>{char === " " ? " " : char}</span>), [quote]);

  async function loginGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
  }
  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setNotice(error ? error.message : "שלחנו לך קישור כניסה למייל.");
  }
  async function reveal() {
    if (!canDraw) { setLoginOpen(true); return; }
    setIsRevealing(true);
    const response = await fetch("/api/draw", { method: "POST" });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error); setIsRevealing(false); return; }
    window.setTimeout(() => { setDraw(result); setIsRevealing(false); }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 2450);
  }
  async function share() {
    if (!quote) return;
    const publicUrl = `${location.origin}/q/${quote.id}`;
    const text = `״${quote.text}״ — משפט ביום.`;
    const file = makeShareImage(quote);
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try { await navigator.share({ title: "משפט ביום.", text, url: publicUrl, files: [file] }); return; } catch (error) { if ((error as Error).name !== "AbortError") setShareOpen(true); return; }
    }
    setShareOpen(true);
  }
  function downloadCard() {
    if (!quote) return;
    const file = makeShareImage(quote); const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = "mishpat-bayom.svg"; link.click(); URL.revokeObjectURL(url);
  }
  async function copyLink() { if (quote) { await navigator.clipboard.writeText(`${location.origin}/q/${quote.id}`); setNotice("הקישור הועתק."); setShareOpen(false); } }

  return <main className="page-shell">
    <nav className="topbar" aria-label="ניווט ראשי">
      <Link href="/" className="brand small">משפט ביום<span>.</span></Link>
      <div className="nav-actions">
        {profile ? <><Link href="/submit" className="quiet-link">הציעו משפט</Link><Link href="/me" className="profile-chip">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <b>{profile.nickname.slice(0, 1)}</b>}<span>{profile.nickname}</span></Link></> : <button onClick={() => setLoginOpen(true)} className="quiet-link">כניסה</button>}
      </div>
    </nav>
    <section className="hero" aria-live="polite">
      <p className="eyebrow">משפט אחד. רגע אחד. כל יום מחדש.</p>
      <h1 className="brand">משפט ביום<span>.</span></h1>
      {!quote && !isRevealing && <><p className="intro">לחיצה אחת, ומשפט אחד בדיוק בשבילך.</p><button className="draw-button" onClick={reveal}>{profile ? "הגרל לי משפט" : "נכנסים ומגרילים"}<i>↙</i></button>{!configured && <p className="setup-note">מצב תצוגה: חברו Supabase כדי להפעיל הגרלה וחשבונות.</p>}</>}
      {isRevealing && <div className="reveal-stage" aria-label="המשפט מתגלה"><div className="shimmer-lines"/><p>מחפשים לך משהו טוב…</p><div className="cipher">א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת</div></div>}
      {quote && !isRevealing && <article className="quote-card"><div className="quote-mark">״</div><blockquote>{scrambled}</blockquote>{quote.author_name && <cite>— {quote.author_name}</cite>}<div className="quote-actions"><button onClick={share} className="share-button">↗ שיתוף</button><Link href={`/quote/${quote.id}`} className="discussion-button">לשיח סביב המשפט</Link></div></article>}
      {draw && <p className="tomorrow">נפגש שוב אחרי חצות למשפט הבא.</p>}
    </section>
    <footer><Link href="/submit">יש לכם משפט לשתף?</Link><span>·</span><span>נבנה למחשבות טובות</span></footer>
    {loginOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="כניסה"><div className="modal"><button className="close" onClick={() => setLoginOpen(false)}>×</button><p className="eyebrow">ברוכים הבאים</p><h2>נכנסים לרגע היומי שלכם</h2><button className="google" onClick={loginGoogle} disabled={!configured}><span>G</span> ממשיכים עם Google</button><div className="or">או</div><form onSubmit={sendMagicLink}><label>כתובת אימייל<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required /></label><button className="primary" disabled={!configured}>שלחו לי קישור כניסה</button></form>{notice && <p className="notice">{notice}</p>}</div></div>}
    {shareOpen && quote && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="שיתוף"><div className="modal share-modal"><button className="close" onClick={() => setShareOpen(false)}>×</button><p className="eyebrow">המשפט שלך, בעולם</p><h2>איך תרצו לשתף?</h2><button className="primary" onClick={downloadCard}>הורדת כרטיס מעוצב</button><button className="outline" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`״${quote.text}״ — ${location.origin}/q/${quote.id}`)}`, "_blank"); }}>WhatsApp</button><button className="outline" onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${location.origin}/q/${quote.id}`)}`, "_blank"); }}>Facebook</button><button className="outline" onClick={copyLink}>העתקת קישור</button></div></div>}
  </main>;
}
