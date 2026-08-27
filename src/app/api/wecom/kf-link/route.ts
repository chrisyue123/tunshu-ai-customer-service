import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/wecom';

/**
 * 获取微信客服二维码链接
 * 参考: https://developer.work.weixin.qq.com/document/path/95145
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    const openKfId = process.env.WECOM_KF_ACCOUNT_ID;

    if (!openKfId) {
      return NextResponse.json(
        { error: 'WECOM_KF_ACCOUNT_ID is not set' },
        { status: 500 }
      );
    }

    // 调用企业微信 API 获取客服账号链接
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/kf/account/get_link?access_token=${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          open_kfid: openKfId,
          scene: 'default',
        }),
      }
    );

    const data = await response.json();

    if (data.errcode !== 0) {
      console.error('[WeCom] Failed to get KF link:', data);
      return NextResponse.json(
        { error: data.errmsg || 'Failed to get KF link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.url,
      qr_code: data.qr_code,
    });
  } catch (error) {
    console.error('[WeCom] Get KF link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
