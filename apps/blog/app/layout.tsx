import type { Metadata } from "next";
import { Anta, Geist, Geist_Mono as GeistMono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Providers from "./providers";
import { BlogHeader } from "@/components/layout/blog-header";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const anta = Anta({
  variable: "--font-anta",
  subsets: ["latin"],
  weight: "400",
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
    default: "BLOGIT",
    template: "%s - BLOGIT",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "BLOGIT",
    title: "BLOGIT",
  },
  twitter: {
    card: "summary_large_image"
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
        className={`${geist.variable} ${anta.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background">
          <BlogHeader />
          <main className="mx-auto w-full max-w-[766px] px-4 py-8">
            <Providers>{children}</Providers>
          </main>
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </body>
    </html>
  );
}
