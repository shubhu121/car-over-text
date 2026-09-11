import type {Metadata} from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Car Over Text Animation',
  description: 'Exact animation of a car driving over custom text tracks including the ribbon loop, valley dip, and storefront scenes from the videos.',
  openGraph: {
    title: 'Car Over Text Animation',
    description: 'Exact animation of a car driving over custom text tracks including the ribbon loop, valley dip, and storefront scenes from the videos.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Over Text Animation',
    description: 'Exact animation of a car driving over custom text tracks including the ribbon loop, valley dip, and storefront scenes from the videos.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={playfair.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
