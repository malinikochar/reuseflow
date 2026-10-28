import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReuseFlow — Smart Refurbishment Decision Engine',
  description:
    'Turn donated electronics into transparent, human-approved refurbishment decisions and measurable operational outcomes. FUSE Society Blueprint 2026 MVP.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9f8] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
