import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ReuseFlow — Smart Refurbishment Decision Engine',
  description:
    'Turn donated electronics into transparent, human-approved refurbishment decisions and measurable operational outcomes. Styled with Genesis (designmd.ai/chef/genesis).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* General Sans display font loaded from Fontshare per Genesis DESIGN.md */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@600,700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] antialiased">
        {children}
      </body>
    </html>
  );
}
