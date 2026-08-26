'use client';

import { useEffect, useState } from 'react';
import { Search, MessageSquare, ArrowRightLeft, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  status: string;
  is_transferred: boolean;
  transferred_to: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai' | 'transferred'>('all');

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'ai') params.set('is_transferred', 'false');
      if (filter === 'transferred') params.set('is_transferred', 'true');
      const res = await fetch(`/api/conversations/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-gray-900">历史记录</h2>
        <p className="mt-1 text-sm text-gray-500">
          查看所有历史对话记录
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              placeholder="搜索客户名称或ID..."
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: 'all' as const, label: '全部' },
              { key: 'ai' as const, label: 'AI 处理' },
              { key: 'transferred' as const, label: '已转人工' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              暂无历史记录
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {conv.customer_name?.charAt(0) || '客'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {conv.customer_name || '未知客户'}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(conv.created_at).toLocaleString('zh-CN')}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conv.message_count || 0} 条消息
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.is_transferred ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                        <ArrowRightLeft className="h-3 w-3" />
                        已转人工
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        AI 处理
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      conv.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {conv.status === 'active' ? '进行中' : '已结束'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
