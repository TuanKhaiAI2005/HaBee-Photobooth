import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HaBee Photobooth",
  description: "Ứng dụng quản lý hàng đợi cute pastel cho HaBee Photobooth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
