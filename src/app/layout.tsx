import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals-resp.css";
import AppShell from "@/components/AppShell";
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
        <NotificationProvider>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
