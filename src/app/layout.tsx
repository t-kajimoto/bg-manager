import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: "HARIDICE",
  description: "Board game management app",
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
