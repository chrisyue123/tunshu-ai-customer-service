import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import {
  getAccessToken,
  sendKfMessage,
  sendAppMessage,
  resolveKfId,
  syncKfMessages,
} from '@/lib/wecom';

/**
 * 企业微信回调接口
 *
 * GET: 企业微信验证回调 URL 有效性
 * POST: 接收企业微信推送的消息事件
 */

// 消息同步游标（生产环境应持久化到数据库）
let syncCursor = '';

// GET: 验证回调 URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const echostr = searchParams.get('echostr');

  // 简化验证：实际部署时需要用 Token + EncodingAESKey 解密
  // 参考: https://developer.work.weixin.qq.com/document/path/90968
  if (echostr) {
    return new NextResponse(echostr);
  }

  return new NextResponse('ok');
}

// POST: 接收消息事件
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 企业微信推送消息后，我们通过 sync_msg API 主动拉取消息
    const token = await getAccessToken();
    const openKfId = await resolveKfId();

    // 拉取新消息
    const syncResult = await syncKfMessages(syncCursor, token, 1000);
    syncCursor = syncResult.next_cursor;

    // 处理每条消息
    for (const msg of syncResult.messages) {
      // 只处理客户发送的文本消息 (origin=3)
      if (msg.origin !== 3 || msg.msgtype !== 'text' || !msg.text?.content) {
        continue;
      }

      const customerContent = msg.text.content;
      const customerId = msg.external_userid;

      // 查找或创建对话
      let { data: conversation } = await client
        .from('conversations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!conversation) {
        const { data: newConv } = await client
          .from('conversations')
          .insert({
            customer_id: customerId,
            customer_name: customerId,
            status: 'active',
          })
          .select()
          .maybeSingle();
        conversation = newConv;
      }

      if (!conversation) continue;

      // 保存客户消息
      await client.from('messages').insert({
        conversation_id: conversation.id,
        role: 'user',
        content: customerContent,
        is_manual: false,
      });

      // 检查是否触发转人工
      const { data: rules } = await client
        .from('transfer_rules')
        .select('keyword')
        .eq('is_active', true);

      const shouldTransfer = rules?.some((rule: { keyword: string }) =>
        customerContent.includes(rule.keyword)
      );

      if (shouldTransfer) {
        // 标记转人工
        await client
          .from('conversations')
          .update({ is_transferred: true, status: 'transferred', updated_at: new Date().toISOString() })
          .eq('id', conversation.id);

        // 回复客户
        await sendKfMessage(openKfId, customerId, '正在为您转接人工客服，请稍候...');

        // 通知相关人员
        const { data: targets } = await client
          .from('notification_targets')
          .select('*')
          .eq('is_active', true);

        if (targets && targets.length > 0) {
          const notifyContent = `【转人工通知】\n客户 ${customerId} 请求人工服务。\n请尽快登录客服系统处理。`;
          for (const target of targets) {
            await sendAppMessage(target.wecom_userid, notifyContent);
          }
        }

        continue;
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
        { role: 'user', content: customerContent },
      ];

      const response = await llmClient.invoke(messages, { temperature: 0.7 });

      // 保存 AI 回复
      await client.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: response.content,
        is_manual: false,
      });

      // 通过企业微信 API 回复客户
      await sendKfMessage(openKfId, customerId, response.content);
    }

    return new NextResponse('success');
  } catch (error) {
    console.error('WeChat callback error:', error);
    return new NextResponse('success');
  }
}
