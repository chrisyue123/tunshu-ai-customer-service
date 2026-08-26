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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
