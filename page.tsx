import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!process.env.NEXT_PUBLIC_SUPABASE_URL) notFound(); const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id,nickname,status,avatar_url").eq("id", id).maybeSingle(); if (!profile) notFound();
  return <main className="inner-page"><header className="simple-header"><Link href="/" className="brand small">משפט ביום<span>.</span></Link></header><section className="public-profile"><div className="big-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.nickname.slice(0,1)}</div><p className="eyebrow">חבר/ה בקהילת משפט ביום</p><h1>{profile.nickname}</h1>{profile.status && <p>{profile.status}</p>}</section></main>;
}
