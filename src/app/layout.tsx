import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ระบบประเมิน SDQ ออนไลน์',
  description: 'ระบบประเมินสุขภาพจิตนักเรียนด้วย SDQ สำหรับโรงเรียนประถมศึกษา',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
