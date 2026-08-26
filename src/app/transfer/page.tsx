'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X, UserPlus } from 'lucide-react';

interface TransferRule {
  id: string;
  keyword: string;
  is_active: boolean;
}

interface NotificationTarget {
  id: string;
  name: string;
  wecom_userid: string;
  is_active: boolean;
}

export default function TransferPage() {
  const [rules, setRules] = useState<TransferRule[]>([]);
  const [targets, setTargets] = useState<NotificationTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetForm, setTargetForm] = useState({ name: '', wecom_userid: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, targetsRes] = await Promise.all([
        fetch('/api/transfer-rules'),
        fetch('/api/notification-targets'),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (targetsRes.ok) setTargets(await targetsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      const res = await fetch('/api/transfer-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        setNewKeyword('');
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      const res = await fetch(`/api/transfer-rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleRule = async (rule: TransferRule) => {
    try {
      const res = await fetch('/api/transfer-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
      });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleAddTarget = async () => {
    if (!targetForm.name.trim() || !targetForm.wecom_userid.trim()) return;
    try {
      const res = await fetch('/api/notification-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetForm),
      });
      if (res.ok) {
        setTargetForm({ name: '', wecom_userid: '' });
        setShowTargetForm(false);
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to add target:', error);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      const res = await fetch(`/api/notification-targets?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">转人工设置</h2>
        <p className="mt-1 text-sm text-gray-500">
          配置触发转人工的关键词和接收通知的人员
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">转人工关键词</h3>
        <p className="text-sm text-gray-500">
          当客户发送包含以下关键词的消息时，系统将触发转人工流程
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
                rule.is_active
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <button
                onClick={() => handleToggleRule(rule)}
                className={`h-2 w-2 rounded-full ${rule.is_active ? 'bg-orange-500' : 'bg-gray-400'}`}
              />
              {rule.keyword}
              <button
                onClick={() => handleDeleteKeyword(rule.id)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddKeyword(); }}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
            placeholder="输入关键词，按回车添加"
          />
          <button
            onClick={handleAddKeyword}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">通知人员</h3>
            <p className="text-sm text-gray-500">
              当触发转人工时，系统会通知以下人员
            </p>
          </div>
          <button
            onClick={() => setShowTargetForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            添加人员
          </button>
        </div>

        {showTargetForm && (
          <div className="rounded-md border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">新增通知人员</span>
              <button onClick={() => setShowTargetForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">姓名</label>
                <input
                  type="text"
                  value={targetForm.name}
                  onChange={(e) => setTargetForm({ ...targetForm, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  placeholder="例如：张经理"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">企业微信 UserID</label>
                <input
                  type="text"
                  value={targetForm.wecom_userid}
                  onChange={(e) => setTargetForm({ ...targetForm, wecom_userid: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  placeholder="企业微信中的用户ID"
                />
              </div>
            </div>
            <button
              onClick={handleAddTarget}
              className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              确认添加
            </button>
          </div>
        )}

        <div className="space-y-2">
          {targets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无通知人员</p>
          ) : (
            targets.map((target) => (
              <div key={target.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {target.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{target.name}</p>
                    <p className="text-xs text-gray-500">UserID: {target.wecom_userid}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTarget(target.id)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
