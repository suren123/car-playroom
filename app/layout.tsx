import type { Metadata } from "next";
import "./globals.css";
import './playroom.css';

export const metadata: Metadata = {
  title: "汽车小任务 · 和你一起，慢慢来",
  description: "九款亲子汽车小游戏，练习观察、轮流、守规则与接受变化。大图、少文字、可随时休息。",
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
