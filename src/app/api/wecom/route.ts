import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 企业微信回调接口
 * 
 * 用于接收企业微信「微信客服」推送的消息事件。
 * 
 * GET: 企业微信验证回调 URL 有效性
 * POST: 接收企业微信推送的消息事件
 */

// 企业微信回调验证（GET 请求）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const msgSignature = searchParams.get('msg_signature');
  const timestamp = searchParams.get('timestamp');
  const nonce = searchParams.get('echostr');

  // TODO: 实现企业微信回调 URL 验证逻辑
  // 需要使用 Token 和 EncodingAESKey 解密 echostr
  // 参考: https://developer.work.weixin.qq.com/document/path/90968

  if (!msgSignature || !timestamp || !nonce) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // 暂时直接返回 echostr（实际部署时需要解密）
  return new NextResponse(nonce);
}

// 接收企业微信消息（POST 请求）
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const client = getSupabaseClient();

    // TODO: 实现企业微信消息解密逻辑
    // 需要使用 Token 和 EncodingAESKey 解密消息体
    // 解密后获取消息内容

    // 临时解析逻辑（实际部署时需要先解密 XML）
    // 这里假设已经解密得到了消息内容
    const parsedBody = parseXml(body);

    if (!parsedBody) {
      return new NextResponse('success');
    }

    const {
      MsgType,
      Content,
      ExternalUserID,
      ServicerUserID,
    } = parsedBody;

    // 只处理文本消息
    if (MsgType !== 'text' || !Content || !ExternalUserID) {
      return new NextResponse('success');
    }

    // 查找或创建对话
    let { data: conversation } = await client
      .from('conversations')
      .select('*')
      .eq('customer_id', ExternalUserID)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv } = await client
        .from('conversations')
        .insert({
          customer_id: ExternalUserID,
          customer_name: ExternalUserID,
          status: 'active',
        })
        .select()
        .maybeSingle();
      conversation = newConv;
    }

    if (!conversation) {
      return new NextResponse('success');
    }

    // 保存客户消息
    await client.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: Content,
      is_manual: false,
    });

    // 检查是否触发转人工
    const { data: rules } = await client
      .from('transfer_rules')
      .select('keyword')
      .eq('is_active', true);

    const shouldTransfer = rules?.some((rule: { keyword: string }) =>
      Content.includes(rule.keyword)
    );

    if (shouldTransfer) {
      // 转人工
      await client
        .from('conversations')
        .update({ is_transferred: true, status: 'transferred', updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      // 通知相关人员
      const { data: targets } = await client
        .from('notification_targets')
        .select('*')
        .eq('is_active', true);

      if (targets && targets.length > 0) {
        // TODO: 调用企业微信发送消息 API 通知相关人员
        console.log('Transfer notification needed for:', targets);
      }

      return new NextResponse('success');
    }

    // AI 生成回复
    const { data: agentData } = await client
      .from('agent_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: knowledgeData } = await client
      .from('knowledge_base')
      .select('question, answer')
      .eq('is_active', true);

    let systemPrompt = agentData?.system_prompt || '你是囤鼠迷你仓的AI客服助手。';

    if (knowledgeData && knowledgeData.length > 0) {
      const knowledgeText = knowledgeData
        .map((item: { question: string; answer: string }) => `Q: ${item.question}\nA: ${item.answer}`)
        .join('\n\n');
      systemPrompt += `\n\n## 知识库参考\n${knowledgeText}`;
    }

    const config = new Config();
    const llmClient = new LLMClient(config);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: Content },
    ];

    const response = await llmClient.invoke(messages, { temperature: 0.7 });

    // 保存 AI 回复
    await client.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: response.content,
      is_manual: false,
    });

    // TODO: 调用企业微信发送消息 API 回复客户
    // 使用 response_url 或主动发送消息 API
    console.log('AI reply:', response.content);

    return new NextResponse('success');
  } catch (error) {
    console.error('WeChat callback error:', error);
    return new NextResponse('success');
  }
}

// 简单的 XML 解析（实际部署时建议使用 xml2js 等库）
function parseXml(xml: string): Record<string, string> | null {
  try {
    const result: Record<string, string> = {};
    const regex = /<(\w+)><!\[CDATA\[([\s\S]*?)\]\]><\/\1>|<(\w+)>([\s\S]*?)<\/\3>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const key = match[1] || match[3];
      const value = match[2] || match[4];
      if (key && value !== undefined) {
        result[key] = value;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}
