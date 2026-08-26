'use client';

import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  system_prompt: string;
  tone: string;
  is_active: boolean;
}

const DEFAULT_PROMPT = `你是囤鼠迷你仓的 AI 客服助手，名叫"小鼠"。你的职责是为客户提供关于迷你仓租赁的咨询服务。

## 你的职责
- 回答客户关于迷你仓的问题（位置、价格、租期、尺寸等）
- 帮助客户了解我们的服务和优势
- 引导客户完成租赁流程
- 在无法解答时，礼貌地引导客户联系人工客服

## 回复要求
- 语气亲切友好，像朋友一样交流
- 回复简洁明了，避免过于冗长
- 对于价格等敏感信息，如果知识库中没有，请引导客户联系人工获取最新报价
- 不确定的信息不要瞎编，诚实告知客户并建议联系人工确认

## 注意事项
- 如果客户发送"人工"、"转接"等关键词，请告知客户正在为您转接人工客服
- 如果客户的问题超出你的知识范围，请礼貌地说明并建议联系人工客服`;

export default function AgentConfigPage() {
  const [config, setConfig] = useState<AgentConfig>({
    id: '',
    name: '囤鼠迷你仓客服',
    system_prompt: DEFAULT_PROMPT,
    tone: '亲切',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/agent');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMessage('保存成功');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？当前配置将被覆盖。')) {
      setConfig({
        ...config,
        system_prompt: DEFAULT_PROMPT,
        tone: '亲切',
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agent 配置</h2>
          <p className="mt-1 text-sm text-gray-500">
            配置 AI 客服的角色、提示词和回复风格
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">启用 AI 客服</span>
          </label>
        </div>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message === '保存成功' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Agent 名称
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
            placeholder="例如：囤鼠迷你仓客服"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            回复语气
          </label>
          <select
            value={config.tone}
            onChange={(e) => setConfig({ ...config, tone: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          >
            <option value="亲切">亲切友好</option>
            <option value="专业">专业严谨</option>
            <option value="活泼">活泼有趣</option>
            <option value="简洁">简洁高效</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            系统提示词（System Prompt）
          </label>
          <p className="text-xs text-gray-500 mb-2">
            定义 AI 客服的角色、职责和回复规则。修改后实时生效。
          </p>
          <textarea
            value={config.system_prompt}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
            rows={20}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono leading-relaxed focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-y"
            placeholder="输入系统提示词..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </button>
        </div>
      </div>
    </div>
  );
}
