import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
export const metadata: Metadata = {
  title: "Circuit & Co. — Helpful tech, thoughtfully picked.",
  description:
    "Shop considered tech essentials with Scout, your personal shopping companion.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#213b55",
              colorBackground: "#ffffff",
              colorForeground: "#243b4c",
              colorMutedForeground: "#68736e",
              colorNeutral: "#243b4c",
              colorInput: "#faf8f0",
              colorInputForeground: "#243b4c",
              borderRadius: "0.75rem",
              fontFamily: '"DM Sans", "Avenir Next", Arial, sans-serif',
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
