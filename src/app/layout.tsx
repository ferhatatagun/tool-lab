import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://tool-lab-bice.vercel.app";
const DESCRIPTION =
  "An interactive Claude tool-use sandbox: define tools, send a user message, mock the tool responses, and watch the agent loop play out live. Bring your own key, no backend.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "tool-lab — an interactive Claude tool-use sandbox",
    template: "%s · tool-lab",
  },
  description: DESCRIPTION,
  applicationName: "tool-lab",
  keywords: [
    "Claude tool use",
    "AI agent",
    "Anthropic tools",
    "agent loop",
    "tool calling",
    "Claude API",
    "Anthropic",
    "developer tool",
    "agent sandbox",
    "BYOK",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "tool-lab",
    title: "tool-lab — an interactive Claude tool-use sandbox",
    description:
      "Define tools, send a message, mock responses — watch the agent loop play out live.",
  },
  twitter: {
    card: "summary_large_image",
    title: "tool-lab — an interactive Claude tool-use sandbox",
    description: "Define tools, mock responses, watch the agent loop live. BYOK.",
    creator: "@ferhatatagun",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "tool-lab",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  description: DESCRIPTION,
  url: SITE,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Ferhat Atagün", url: "https://ferhatatagun.com" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
