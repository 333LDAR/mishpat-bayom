import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "משפט ביום.", description: "משפט אחד בכל יום" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}
