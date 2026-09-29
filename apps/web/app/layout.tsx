import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Law Firm ERP | Quản trị nghiệp vụ luật',
  description: 'Nền tảng quản trị tập trung cho tổ chức hành nghề luật.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#f5f7fb] text-slate-900 antialiased">
        <ReactQueryProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
