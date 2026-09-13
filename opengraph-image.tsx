import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let text = "משפט אחד. רגע אחד. כל יום מחדש.";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) { const supabase = await createClient(); const { data } = await supabase.from("quotes").select("text").eq("id", id).eq("status", "approved").maybeSingle(); if (data) text = data.text; }
  return new ImageResponse(<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", background: "#601D49", color: "#FFEBB8", padding: "70px", direction: "rtl" }}><div style={{ fontSize: 42, color: "#EA9D9D" }}>משפט ביום.</div><div style={{ fontSize: 64, textAlign: "center", lineHeight: 1.35, maxWidth: 980 }}>״{text}״</div><div style={{ height: 4, width: 220, background: "#BD5579" }} /></div>, size);
}
