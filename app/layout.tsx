import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { LoadingProvider } from '@/components/ui/loading-context';
import { Toaster } from '@/components/ui/sonner';
import { SystemStatus } from '@/components/system-status';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NANIVET - Clínica Veterinaria en Esmeraldas',
  description: 'Clínica Veterinaria NANIVET - Atención profesional para tu mascota en Esmeraldas, Ecuador. Consulta, cirugía, vacunación, urgencias y más.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoadingProvider>
            {children}
            <SystemStatus />
            <Toaster position="top-right" richColors closeButton />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
