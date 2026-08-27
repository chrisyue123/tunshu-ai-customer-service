import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '囤鼠迷你仓 - AI 智能客服系统',
  description: '囤鼠迷你仓企业微信 AI 智能客服管理后台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

import { ClientLayout } from '@/components/client-layout';
