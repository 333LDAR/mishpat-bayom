import type { Metadata } from "next";
import "./globals.css";
import "./extra.css";
import "./fonts.css";

export const metadata: Metadata = {
  title: "משפט ביום.",
  description: "משפט אחד. רגע אחד. כל יום מחדש.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet" /></head><body>{children}</body></html>;
}
