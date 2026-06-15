import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Собрались",
  description: "Сервис для красивой организации камерных встреч",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
