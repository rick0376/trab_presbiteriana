import type { Metadata } from "next";
import "./globals.scss";
import Providers from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "Igreja Presbiteriana Renovada-MC",
  description: "Site oficial da Igreja Presbiteriana Renovada - Moreira Cesar.",

  manifest: "/manifest.json",
  themeColor: "#04121c",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "Igreja Presbiteriana Renovada-MC",
    description:
      "Site oficial da Igreja Presbiteriana Renovada - Moreira Cesar.",
    images: ["/opengraph-image.png"],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Igreja Presbiteriana Renovada-MC",
    description:
      "Site oficial da Igreja Presbiteriana Renovada - Moreira Cesar.",
    images: ["/opengraph-image.png"],
  },

  metadataBase: new URL("https://presbiteriana-mc-beta.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
