import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';
import { SetUsernameDialog } from '@/features/auth/components/SetUsernameDialog';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeRegistry>
          <AuthProvider>
            {children}
            <SetUsernameDialog />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
