'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, User, Bot, ArrowRightLeft, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  status: string;
  is_transferred: boolean;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  is_manual: boolean;
  created_at: string;
}

export default function MonitorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      const interval = setInterval(() => fetchMessages(selectedConv.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations?status=active');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleReply = async () => {
    if (!replyInput.trim() || !selectedConv) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          role: 'assistant',
          content: replyInput.trim(),
          is_manual: true,
        }),
      });
      if (res.ok) {
        setReplyInput('');
        await fetchMessages(selectedConv.id);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handleTransfer = async (conv: Conversation) => {
    try {
      const res = await fetch(`/api/conversations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conv.id, is_transferred: true, status: 'transferred' }),
      });
      if (res.ok) {
        await fetchConversations();
        if (selectedConv?.id === conv.id) {
          setSelectedConv({ ...conv, is_transferred: true, status: 'transferred' });
        }
      }
    } catch (error) {
      console.error('Failed to transfer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-140px)]">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">对话监控</h2>
        <p className="mt-1 text-sm text-gray-500">
          实时查看客户对话，必要时人工接管回复
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-80px)]">
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              活跃对话 ({conversations.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                暂无活跃对话
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                          {new Date(conv.created_at).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    {conv.is_transferred ? (
                      <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
          {selectedConv ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">
                      {selectedConv.customer_name?.charAt(0) || '客'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedConv.customer_name || '未知客户'}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedConv.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConv.is_transferred ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      <ArrowRightLeft className="h-3 w-3" />
                      人工处理中
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTransfer(selectedConv)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-yellow-300 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50 transition-colors"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      转人工
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'assistant' && (
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'assistant'
                        ? msg.is_manual
                          ? 'bg-blue-500 text-white'
                          : 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && msg.is_manual && (
                        <div className="mt-1 text-xs opacity-75">[人工回复]</div>
                      )}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="输入人工回复..."
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    回复
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">选择一个对话查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
