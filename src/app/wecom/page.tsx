'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Link2 } from 'lucide-react';

interface WecomStatus {
  corpId: string;
  agentId: string;
  hasSecret: boolean;
  hasToken: boolean;
  hasEncodingAesKey: boolean;
  tokenStatus: 'ok' | 'error' | 'unconfigured';
  kfAccounts: Array<{ open_kfid: string; name: string }>;
  errorMessage: string;
}

export default function WecomPage() {
  const [status, setStatus] = useState<WecomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wecom/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/wecom/test', { method: 'POST' });
      const data = await res.json();
      alert(data.success ? '连接测试成功！' : `连接失败: ${data.error}`);
    } catch (error) {
      alert('测试请求失败');
    } finally {
      setTesting(false);
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
        <h2 className="text-2xl font-bold text-gray-900">企业微信对接</h2>
        <p className="mt-1 text-sm text-gray-500">
          查看企业微信配置状态，测试 API 连接
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">配置状态</h3>
          <div className="flex gap-2">
            <button
              onClick={checkStatus}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </button>
            <button
              onClick={testConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <StatusRow
            label="企业 ID"
            value={status?.corpId ? `${status.corpId.slice(0, 6)}...${status.corpId.slice(-4)}` : '未配置'}
            ok={!!status?.corpId}
          />
          <StatusRow
            label="应用 AgentId"
            value={status?.agentId || '未配置'}
            ok={!!status?.agentId}
          />
          <StatusRow
            label="应用 Secret"
            value={status?.hasSecret ? '已配置' : '未配置'}
            ok={!!status?.hasSecret}
          />
          <StatusRow
            label="回调 Token"
            value={status?.hasToken ? '已配置' : '未配置（稍后配置）'}
            ok={status?.hasToken || false}
            warn={!status?.hasToken}
          />
          <StatusRow
            label="EncodingAESKey"
            value={status?.hasEncodingAesKey ? '已配置' : '未配置（稍后配置）'}
            ok={status?.hasEncodingAesKey || false}
            warn={!status?.hasEncodingAesKey}
          />
          <StatusRow
            label="API 连接"
            value={
              status?.tokenStatus === 'ok' ? '正常' :
              status?.tokenStatus === 'error' ? '连接失败' : '未测试'
            }
            ok={status?.tokenStatus === 'ok'}
            error={status?.tokenStatus === 'error'}
          />
        </div>

        {status?.errorMessage && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {status.errorMessage}
          </div>
        )}

        {status?.kfAccounts && status.kfAccounts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">客服账号</h4>
            <div className="space-y-2">
              {status.kfAccounts.map((acc) => (
                <div key={acc.open_kfid} className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">{acc.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{acc.open_kfid}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">对接指南</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <Step num={1} done={!!status?.corpId && !!status?.hasSecret}>
            企业微信后台配置凭证（企业ID、AgentId、Secret）
          </Step>
          <Step num={2} done={status?.tokenStatus === 'ok'}>
            部署系统到服务器，获取公网地址
          </Step>
          <Step num={3} done={!!status?.hasToken}>
            在企业微信「微信客服」中配置回调 URL、Token、EncodingAESKey
          </Step>
          <Step num={4} done={(status?.kfAccounts?.length || 0) > 0}>
            创建客服账号，获取客服链接/二维码
          </Step>
          <Step num={5} done={false}>
            客户扫码即可开始对话，AI 自动回复
          </Step>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok, warn, error }: {
  label: string;
  value: string;
  ok: boolean;
  warn?: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{value}</span>
        {error ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : ok ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : warn ? (
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-300" />
        )}
      </div>
    </div>
  );
}

function Step({ num, done, children }: { num: number; done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {done ? '✓' : num}
      </div>
      <span className={done ? 'text-gray-900' : 'text-gray-500'}>{children}</span>
    </div>
  );
}
