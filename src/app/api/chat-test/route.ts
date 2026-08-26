import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const client = getSupabaseClient();

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
    systemPrompt += `\n\n## 知识库参考\n以下是你可以参考的知识库内容，请基于这些内容回答客户问题：\n\n${knowledgeText}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...body.messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const config = new Config();
  const llmClient = new LLMClient(config, customHeaders);
  const stream = llmClient.stream(messages, { temperature: 0.7 });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.content) {
            controller.enqueue(encoder.encode(chunk.content.toString()));
          }
        }
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
