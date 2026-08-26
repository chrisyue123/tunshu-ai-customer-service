import { NextResponse } from 'next/server';
import { getAccessToken, getKfAccountList } from '@/lib/wecom';

export async function POST() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ success: false, error: '无法获取 access_token' });
    }

    const accounts = await getKfAccountList();

    return NextResponse.json({
      success: true,
      message: '连接成功',
      kfAccounts: accounts,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '连接失败',
    });
  }
}
