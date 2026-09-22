import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals-resp.css";
import { Providers } from "@/components/Providers";
import { RootLayoutClient } from "@/components/RootLayoutClient";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: "Local AWS Emulator Console",
  description: "Cloudscape-based console for AWS-compatible local emulators.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="aws-console">
      <body>
        <Providers>
          <NotificationProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
