import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Character Folio | AD&D 2nd Edition',
  description:
    'A fully editable character record with abilities, combat, weapons, skills and notes.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
