'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Users,
  ArrowRightLeft,
  CheckCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface Stats {
  todayConversations: number;
  aiResolved: number;
  transferredToHuman: number;
  activeConversations: number;
  recentConversations: Array<{
    id: string;
    customer_name: string;
    status: string;
    is_transferred: boolean;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayConversations: 0,
    aiResolved: 0,
    transferredToHuman: 0,
    activeConversations: 0,
    recentConversations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: '今日咨询',
      value: stats.todayConversations,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'AI 已解决',
      value: stats.aiResolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: '转人工',
      value: stats.transferredToHuman,
      icon: ArrowRightLeft,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: '进行中',
      value: stats.activeConversations,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">工作台</h2>
        <p className="mt-1 text-sm text-gray-500">
          欢迎回来，这是今天的客服数据概览
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md ${card.bgColor} p-3`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            最近对话
          </h3>
          {stats.recentConversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">暂无对话记录</p>
          ) : (
            <div className="space-y-3">
              {stats.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-orange-600">
                        {conv.customer_name?.charAt(0) || '客'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {conv.customer_name || '未知客户'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conv.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.is_transferred ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                        已转人工
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        AI 处理
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            系统状态
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">AI Agent 状态</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                运行中
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">企业微信连接</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                待配置
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">知识库条目</span>
              <span className="text-sm font-medium text-gray-900">待添加</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">转人工关键词</span>
              <span className="text-sm font-medium text-gray-900">待配置</span>
            </div>
          </div>
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              提示：请先完成 AI Agent 配置和知识库设置，然后对接企业微信即可开始使用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
