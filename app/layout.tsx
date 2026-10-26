import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "汽车小任务 · 和你一起，慢慢来",
  description: "修好一辆小车，搭起一座小桥。给孩子和家长的汽车小游戏。",
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
