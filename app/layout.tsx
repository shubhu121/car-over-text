import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Car Over Text — Drive Cars, Bikes & Cycles on Words',
  description: 'Drive a vintage car, sport motorbike and cycles over text along a loop-the-loop track. Scroll, drag or use arrow keys to ride.',
  authors: [
    {name: 'shubhu121', url: 'https://github.com/shubhu121'},
    {name: 'positronx_', url: 'https://x.com/positronx_'},
  ],
  creator: 'shubhu121',
  openGraph: {
    title: 'Car Over Text — Drive Cars, Bikes & Cycles on Words',
    description: 'Drive a vintage car, sport motorbike and cycles over text along a loop-the-loop track. Scroll, drag or use arrow keys to ride.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Over Text — Drive Cars, Bikes & Cycles on Words',
    description: 'Drive a vintage car, sport motorbike and cycles over text along a loop-the-loop track. Scroll, drag or use arrow keys to ride.',
    creator: '@positronx_',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
