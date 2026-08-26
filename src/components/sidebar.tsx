'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageSquareText,
  Monitor,
  ArrowRightLeft,
  History,
  Warehouse,
  Plug,
} from 'lucide-react';

const navigation = [
  { name: '工作台', href: '/', icon: LayoutDashboard },
  { name: 'AI Agent 配置', href: '/agent', icon: Bot },
  { name: '知识库管理', href: '/knowledge', icon: BookOpen },
  { name: '对话测试', href: '/chat-test', icon: MessageSquareText },
  { name: '对话监控', href: '/monitor', icon: Monitor },
  { name: '转人工设置', href: '/transfer', icon: ArrowRightLeft },
  { name: '历史记录', href: '/history', icon: History },
  { name: '企业微信对接', href: '/wecom', icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-60 flex-col bg-gray-900">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
        <Warehouse className="h-6 w-6 text-orange-400" />
        <span className="text-base font-semibold text-white">囤鼠迷你仓</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-gray-500">系统运行中</span>
        </div>
      </div>
    </div>
  );
}
