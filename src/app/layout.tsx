import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals-resp.css";
import AppShell from "@/components/AppShell";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: "AWS Console Clone — Universal Adapter + Full Feature Parity",
  description: "AWS Console Web UI clone for local AWS services (Ministack / LocalStack)",
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
