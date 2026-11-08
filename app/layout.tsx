import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cpu-guesser.vercel.app"),
  title: "CPU Guesser",
  description:
    "Explore microscopic CPU landscapes and find your place on a schematic atlas of classic processors.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CPU Guesser",
    title: "CPU Guesser",
    description: "Know your silicon. Explore CPU dies and guess where you are.",
    images: [{
      url: "/social-preview.png",
      width: 1200,
      height: 630,
      alt: "CPU Guesser — a silicon guessing game, with a grayscale CPU die map.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CPU Guesser",
    description: "Know your silicon. Explore CPU dies and guess where you are.",
    images: ["/social-preview.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/geist-mono-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
