import type { Metadata } from "next";
import { Geist,Geist_Mono as GeistMono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Providers from "./providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || ""
  ),
  title: {
    default: "HEXI SPACE",
    template: "%s - HEXI SPACE",
  },
  description:
    "Explore the latest product updates, industry insights, and technical articles from HEXI SPACE.",
  keywords: ["HEXI SPACE", "blogs", "technology", "insights", "updates"],
  authors: [{ name: "Hexi1997" }],
  creator: "@Hexi1997",
  publisher: "Hexi1997",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "HEXI SPACE",
    title: "HEXI SPACE",
    description:
      "Explore the latest product updates, industry insights, and technical articles from HEXI SPACE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEXI SPACE",
    description:
      "Explore the latest product updates, industry insights, and technical articles from HEXI SPACE.",
    creator: "@Hexi1997",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icons/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <main>
            <Providers>{children}</Providers>
          </main>
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </body>
    </html>
  );
}
