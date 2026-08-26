/**
 * 企业微信 API 工具库
 * 负责 access_token 管理、消息收发、客服账号管理
 */

const CORP_ID = process.env.WECOM_CORP_ID || '';
const SECRET = process.env.WECOM_SECRET || '';
const AGENT_ID = process.env.WECOM_AGENT_ID || '';
const OPEN_KFID = process.env.WECOM_OPEN_KFID || '';

// access_token 缓存
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * 获取 access_token（带缓存，有效期 7200 秒）
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${SECRET}`;
  const res = await fetch(url);
  const data = await res.json() as { errcode: number; errmsg: string; access_token: string; expires_in: number };

  if (data.errcode !== 0) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`);
  }

  cachedToken = data.access_token;
  // 提前 5 分钟过期，避免边界问题
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

/**
 * 获取客服账号列表
 */
export async function getKfAccountList(): Promise<Array<{ open_kfid: string; name: string }>> {
  const token = await getAccessToken();
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/account/list?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset: 0, limit: 100 }),
  });

  const data = await res.json() as { errcode: number; errmsg: string; account_list: Array<{ open_kfid: string; name: string }> };

  if (data.errcode !== 0) {
    throw new Error(`获取客服账号列表失败: ${data.errmsg}`);
  }

  return data.account_list || [];
}

/**
 * 获取客服账号的链接（用于生成二维码）
 */
export async function getKfAccountLink(openKfId: string): Promise<string> {
  const token = await getAccessToken();
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/add_contact_way?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ open_kfid: openKfId }),
  });

  const data = await res.json() as { errcode: number; errmsg: string; url: string };

  if (data.errcode !== 0) {
    throw new Error(`获取客服链接失败: ${data.errmsg}`);
  }

  return data.url;
}

/**
 * 发送客服消息
 */
export async function sendKfMessage(openKfId: string, userId: string, content: string): Promise<void> {
  const token = await getAccessToken();
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: userId,
      open_kfid: openKfId,
      msgid: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      msgtype: 'text',
      text: { content },
    }),
  });

  const data = await res.json() as { errcode: number; errmsg: string };

  if (data.errcode !== 0) {
    throw new Error(`发送消息失败: ${data.errmsg}`);
  }
}

/**
 * 同步消息（从企业微信拉取新消息）
 */
export async function syncKfMessages(cursor: string = '', token: string, limit: 1000): Promise<{
  next_cursor: string;
  has_more: number;
  messages: Array<{
    msgid: string;
    open_kfid: string;
    external_userid: string;
    send_time: number;
    origin: number; // 3=客户发送 4=系统推送 5=客服发送
    msgtype: string;
    text?: { content: string };
  }>;
}> {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=${token}`;

  const body: Record<string, unknown> = { cursor, limit };
  if (OPEN_KFID) {
    body.open_kfid = OPEN_KFID;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json() as {
    errcode: number;
    errmsg: string;
    next_cursor: string;
    has_more: number;
    messages: Array<{
      msgid: string;
      open_kfid: string;
      external_userid: string;
      send_time: number;
      origin: number;
      msgtype: string;
      text?: { content: string };
    }>;
  };

  if (data.errcode !== 0) {
    throw new Error(`同步消息失败: ${data.errmsg}`);
  }

  return {
    next_cursor: data.next_cursor || '',
    has_more: data.has_more || 0,
    messages: data.messages || [],
  };
}

/**
 * 发送应用消息通知（给企业内部人员发通知）
 */
export async function sendAppMessage(toUser: string, content: string): Promise<void> {
  const token = await getAccessToken();
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: toUser,
      msgtype: 'text',
      agentid: parseInt(AGENT_ID),
      text: { content },
    }),
  });

  const data = await res.json() as { errcode: number; errmsg: string };

  if (data.errcode !== 0) {
    console.error(`发送应用消息失败: ${data.errmsg}`);
  }
}

/**
 * 获取客服账号 ID（自动检测）
 */
export async function resolveKfId(): Promise<string> {
  if (OPEN_KFID) return OPEN_KFID;

  const accounts = await getKfAccountList();
  if (accounts.length === 0) {
    throw new Error('没有找到客服账号，请先在企业微信后台创建客服账号');
  }

  return accounts[0].open_kfid;
}
