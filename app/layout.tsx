import type { Metadata } from "next";
import "./globals.css";
import './playroom.css';
import './illustrations.css';

export const metadata: Metadata = {
  title: "汽车小任务 · 和你一起，慢慢来",
  description: "汽车快递站和亲子汽车小游戏，一起观察、送货、轮流和探索。大图、少文字、可随时休息。",
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: '汽车小任务', statusBarStyle: 'default' },
  icons: {
    icon: "/favicon.svg",
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
