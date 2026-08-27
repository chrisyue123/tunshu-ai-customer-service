'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Copy, ExternalLink } from 'lucide-react';

interface KfLinkData {
  url: string;
  qr_code: string;
}

export default function KfQrCodePage() {
  const [kfLink, setKfLink] = useState<KfLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKfLink();
  }, []);

  const fetchKfLink = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/wecom/kf-link');
      const data = await response.json();

      if (response.ok) {
        setKfLink(data);
      } else {
        setError(data.error || '获取客服链接失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (kfLink?.url) {
      await navigator.clipboard.writeText(kfLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchKfLink}>重试</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">微信客服二维码</h1>
        <p className="text-sm text-muted-foreground mt-1">
          扫描二维码或复制链接，即可开始 AI 客服对话
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 二维码卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              扫码咨询
            </CardTitle>
            <CardDescription>
              使用企业微信扫描二维码，直接与 AI 客服对话
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {kfLink?.qr_code ? (
              <div className="border rounded-lg p-4 bg-white">
                <img
                  src={kfLink.qr_code}
                  alt="微信客服二维码"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                <QrCode className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              打开企业微信 → 扫一扫 → 扫描二维码
            </p>
          </CardContent>
        </Card>

        {/* 链接卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              分享链接
            </CardTitle>
            <CardDescription>
              复制链接发送给客户，点击即可开始对话
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm font-mono break-all text-gray-700">
                {kfLink?.url || '暂无链接'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyLink} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {copied ? '已复制' : '复制链接'}
              </Button>
              {kfLink?.url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(kfLink.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  打开链接
                </Button>
              )}
            </div>
            <Alert>
              <AlertDescription>
                客户点击链接后，会自动跳转到企业微信客服对话页面
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold text-orange-500">1.</span>
              <span>扫描二维码或复制链接，使用企业微信打开</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-orange-500">2.</span>
              <span>发送消息，AI 客服会自动回复</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-orange-500">3.</span>
              <span>在「对话监控」页面可以查看所有对话记录</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-orange-500">4.</span>
              <span>如需人工介入，可以在对话中触发转人工关键词</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
