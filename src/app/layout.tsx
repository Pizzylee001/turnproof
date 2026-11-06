import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { TurnProofProvider } from '@/context/turnproof-context';
import { AcousticShell } from '@/components/acoustic-shell';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TurnProof | AssemblyAI-TTS-1 & Universal-3.5 Pro Voice Turn Workbench',
  description:
    'Pre-flight prompt compiler, millisecond WordBoundaries barge-in context slicer, and Universal-3.5 Pro round-trip entity readback verifier for voice agents.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${robotoMono.variable}`}
    >
      <body>
        <TurnProofProvider>
          <AcousticShell>{children}</AcousticShell>
        </TurnProofProvider>
      </body>
    </html>
  );
}
