import { NextResponse } from 'next/server';
import { getAccessToken, getKfAccountList } from '@/lib/wecom';

export async function GET() {
  const corpId = process.env.WECOM_CORP_ID || '';
  const agentId = process.env.WECOM_AGENT_ID || '';
  const secret = process.env.WECOM_SECRET || '';
  const token = process.env.WECOM_TOKEN || '';
  const encodingAesKey = process.env.WECOM_ENCODING_AES_KEY || '';

  let tokenStatus: 'ok' | 'error' | 'unconfigured' = 'unconfigured';
  let kfAccounts: Array<{ open_kfid: string; name: string }> = [];
  let errorMessage = '';

  if (corpId && secret) {
    try {
      await getAccessToken();
      tokenStatus = 'ok';

      try {
        kfAccounts = await getKfAccountList();
      } catch {
        // 客服账号获取失败不影响整体状态
      }
    } catch (error) {
      tokenStatus = 'error';
      errorMessage = error instanceof Error ? error.message : '连接失败';
    }
  }

  return NextResponse.json({
    corpId,
    agentId,
    hasSecret: !!secret,
    hasToken: !!token,
    hasEncodingAesKey: !!encodingAesKey,
    tokenStatus,
    kfAccounts,
    errorMessage,
  });
}
