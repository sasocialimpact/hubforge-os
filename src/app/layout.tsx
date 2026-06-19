import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HubForge OS - Social Impact",
  description: "Build expert-grade program strategies, theories of change, and logframes in minutes. For NGOs and social impact organizations.",
  keywords: ["HubForge OS", "NGO", "social impact", "theory of change", "logframe", "M&E", "monitoring evaluation"],
  authors: [{ name: "HubForge OS" }],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "HubForge OS" },
  openGraph: { title: "HubForge OS - Social Impact", description: "Build expert-grade program strategies in minutes.", siteName: "HubForge OS", type: "website" },
  twitter: { card: "summary_large_image", title: "HubForge OS - Social Impact", description: "Build expert-grade program strategies in minutes." },
};

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').then(function(){},function(e){console.warn('[PWA] SW failed:',e)})})}` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
