import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatbox Demo",
  description: "A compact AI-native chat demo with memory and structured place output."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
