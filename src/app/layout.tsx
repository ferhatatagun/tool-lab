import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://tool-lab-bice.vercel.app";
const TITLE = "tool-lab — an interactive Claude tool-use sandbox";
const DESCRIPTION =
  "An interactive Claude tool-use sandbox: define tools, send a user message, mock the tool responses, and watch the agent loop play out live. Bring your own key, no backend.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · tool-lab",
  },
  description: DESCRIPTION,
  applicationName: "tool-lab",
  keywords: [
    "Claude tool use",
    "AI agent design",
    "Anthropic tools",
    "agent loop",
    "tool calling",
    "Claude API",
    "Anthropic",
    "developer tool",
    "agent sandbox",
    "JSON schema tools",
    "BYOK",
    "Ferhat Atagun",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  publisher: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "tool-lab",
    title: TITLE,
    description:
      "Define tools, send a message, mock responses — watch the agent loop play out live.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ferhatatagun",
    creator: "@ferhatatagun",
    title: TITLE,
    description: "Define tools, mock responses, watch the agent loop live. BYOK.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "developer tools",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://ferhatatagun.com/#person",
      name: "Ferhat Atagün",
      url: "https://ferhatatagun.com",
      jobTitle: "Frontend Team Lead",
      worksFor: { "@type": "Organization", name: "HangiKredi", url: "https://www.hangikredi.com" },
      sameAs: [
        "https://github.com/ferhatatagun",
        "https://www.linkedin.com/in/ferhatatagun/",
        "https://twitter.com/ferhatatagun",
        "https://medium.com/@ferhatatagun",
        "https://stackoverflow.com/users/20566734/",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "tool-lab",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      description: DESCRIPTION,
      url: SITE,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": "https://ferhatatagun.com/#person" },
      creator: { "@id": "https://ferhatatagun.com/#person" },
      isPartOf: {
        "@type": "CollectionPage",
        "@id": "https://ferhatatagun.com/tools#suite",
        name: "Open-source Claude dev-tools",
        url: "https://ferhatatagun.com/tools",
      },
      softwareHelp: { "@type": "WebPage", url: "https://ferhatatagun.com/blog/build-the-sandbox-first" },
      keywords: "Claude tool use, agent design, AI sandbox, JSON schema",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="author" href="https://ferhatatagun.com" />
        <link rel="me" href="https://ferhatatagun.com" />
        <link rel="me" href="https://github.com/ferhatatagun" />
      </head>
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
