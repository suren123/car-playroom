import type { Metadata } from "next";
import "./globals.css";
import './playroom.css';

export const metadata: Metadata = {
  title: "汽车小任务 · 和你一起，慢慢来",
  description: "汽车分类、找不同、图片数独。大图、少文字，每局随机出题的汽车小游戏。",
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
