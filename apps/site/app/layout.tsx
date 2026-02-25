import type { Metadata } from "next";
import { Wix_Madefor_Text, Wix_Madefor_Display, Onest } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ToastContainer } from "react-toastify";
import Providers from "./providers";

const wixText = Wix_Madefor_Text({
  variable: "--font-wix-text",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const wixDisplay = Wix_Madefor_Display({
  variable: "--font-wix-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || ""
  ),
  title: {
    default: "Blog - WORLD3",
    template: "%s - WORLD3",
  },
  description:
    "Explore the latest product updates, industry insights, and technical articles from WORLD3.",
  keywords: ["WORLD3", "blogs", "technology", "insights", "updates"],
  authors: [{ name: "WORLD3" }],
  creator: "WORLD3",
  publisher: "WORLD3",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "Blog | WORLD3",
    title: "Blog - WORLD3",
    description:
      "Explore the latest product updates, industry insights, and technical articles from WORLD3.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - WORLD3",
    description:
      "Explore the latest product updates, industry insights, and technical articles from WORLD3.",
    creator: "@world3",
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
    icon: "/favicon.ico",
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
        className={`${wixText.variable} ${wixDisplay.variable} ${onest.variable} antialiased`}
      >
        <div className="min-h-screen bg-[#080808] flex flex-col">
          <Header />
          <main className="py-12 md:py-[144px]">
            <Providers>{children}</Providers>
          </main>
          <Footer />
        </div>
        <ToastContainer position="top-center" autoClose={3000} theme="dark" />
      </body>
    </html>
  );
}
