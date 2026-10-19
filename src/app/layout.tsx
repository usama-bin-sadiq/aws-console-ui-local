import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";
// Must load after Cloudscape's own stylesheet so it wins on equal specificity.
import "./design-theme.css";
import { Providers } from "@/components/Providers";
import { RootLayoutClient } from "@/components/RootLayoutClient";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StaleAssetRecovery } from "@/components/StaleAssetRecovery";

export const metadata: Metadata = {
  title: "Local AWS Emulator Console",
  description: "Cloudscape-based console for AWS-compatible local emulators.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/aws-logo.svg" />
      </head>
      <body suppressHydrationWarning>
        <StaleAssetRecovery />
        <ThemeProvider>
          <Providers>
            <NotificationProvider>
              <RootLayoutClient>{children}</RootLayoutClient>
            </NotificationProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
