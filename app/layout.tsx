import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Face Analysis AI - Advanced Facial Analysis & Comparison',
  description: 'AI-powered facial analysis tool for detecting face shape, symmetry, proportions, and comparing facial features between two images.',
  keywords: ['face analysis', 'AI', 'facial features', 'face comparison', 'beauty score', 'symmetry'],
  authors: [{ name: 'Face Analysis AI' }],
  openGraph: {
    title: 'Face Analysis AI',
    description: 'AI-powered facial analysis and comparison tool',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-background">
            <Header />
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
