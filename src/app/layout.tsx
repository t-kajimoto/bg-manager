import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: "HARIDICE Next",
  description: "Board game management app built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
