import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGPT Ads Library",
  description:
    "The first public database of ChatGPT ads. Browse advertisers, creatives, and context hints by industry.",
  metadataBase: new URL("https://chatgptadslibrary.com"),
  openGraph: {
    title: "ChatGPT Ads Library",
    description: "See which companies are running OpenAI advertising campaigns inside ChatGPT.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("gads-theme")||(window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
